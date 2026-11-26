const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const crypto = require('crypto');

const Session = require('../models/Session');
const User = require('../models/User');
const College = require('../models/College');
const UserSession = require('../models/UserSession');
const AttendanceAuditLog = require('../models/AttendanceAuditLog');
const notificationService = require('../services/notificationService');
const { authenticate, requireRole } = require('../middleware/auth');
const { trackJob } = require('../utils/jobTracker');
const { issueAttendanceQrToken, isSessionAcceptingQr } = require('../utils/attendanceQr');
const { transitionSessionState, computeRemainingSeconds, getEffectiveSessionStatus } = require('../services/teacherService');
const reportInternalError = require('../utils/httpError');

const isSessionExpired = (sess, nowMs = Date.now()) => {
  if (!sess) return false;
  const durMins = Number(sess.duration_minutes || 60) + Number(sess.extended_minutes || 0);
  const expiryMs = sess.expires_at
    ? new Date(sess.expires_at).getTime()
    : (sess.start_time ? new Date(sess.start_time).getTime() + durMins * 60000 : Infinity);
  return Number.isFinite(expiryMs) && nowMs > expiryMs;
};

async function resolveCanonicalCollegeId(user) {
  if (!user) return null;
  if (user.college_id) return String(user.college_id).trim();
  if (!user.college) return null;
  const raw = String(user.college).trim();
  const escaped = raw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const college = await College.findOne(
    { $or: [{ code: raw.toUpperCase() }, { name: new RegExp(`^${escaped}$`, 'i') }] },
    '_id code'
  ).lean();
  return college ? (college.code || college._id.toString()) : null;
}

const sessionSupportsQr = (sess) => {
  const methods = Array.isArray(sess?.verification_methods) && sess.verification_methods.length > 0
    ? sess.verification_methods.map((m) => String(m).trim().toLowerCase())
    : ['qr', 'face', 'manual', 'kiosk'];
  return methods.includes('qr');
};

router.post('/start', authenticate, requireRole(['teacher', 'admin', 'super_admin']), async (req, res) => {
  try {
    const providedTeacherEmail = typeof req.body.teacher_email === 'string' ? req.body.teacher_email.trim().toLowerCase() : '';
    const teacherEmail = providedTeacherEmail || (req.userEmail ? req.userEmail.toLowerCase() : '');
    const subject = typeof req.body.subject === 'string' ? req.body.subject.trim() : '';
    if (!teacherEmail || teacherEmail.length > 254 || !subject || subject.length > 120) {
      return res.status(400).json({ detail: 'A valid teacher email and subject are required.' });
    }

    if (providedTeacherEmail && req.userEmail.toLowerCase() !== providedTeacherEmail && !['admin', 'super_admin'].includes(req.userRole.toLowerCase())) {
      return res.status(403).json({ detail: "Forbidden: Cannot start session on behalf of another teacher." });
    }
      const teacherUser = await User.findOne(
        {
          email: { $regex: new RegExp(`^${teacherEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
          role: { $in: ['teacher', 'hod', 'principal', 'admin', 'super_admin'] }
        },
        'email role college_id college department academic_year'
      ).lean();
      if (!teacherUser) {
        return res.status(404).json({ detail: 'Teacher account not found.' });
      }

      const requestedStatus = ['scheduled', 'ready', 'active'].includes(String(req.body.status || '').toLowerCase())
        ? String(req.body.status).toLowerCase()
        : 'active';

        const now = new Date();
        if (requestedStatus === 'active') {
          const existingSession = await Session.findOne({
            teacher_id: teacherEmail,
            subject,
            is_active: true
          }).sort({ start_time: -1 });

          if (existingSession) {
            if (!isSessionExpired(existingSession, now.getTime())) {
              return res.json({
                session_id: existingSession._id.toString(),
                status: getEffectiveSessionStatus(existingSession),
                message: "Attendance session started successfully",
                already_active: true
              });
            }
            await Session.updateOne(
              { _id: existingSession._id, is_active: true },
              { $set: { is_active: false, status: 'closed', closed_at: existingSession.closed_at || now } }
            );
          }
        }

        const durationMinutes = Math.min(360, Math.max(5, parseInt(req.body.duration_minutes || '60', 10) || 60));
        const qrRotationSeconds = Math.min(120, Math.max(5, parseInt(req.body.qr_rotation_seconds || '15', 10) || 15));
        const lateThresholdMinutes = Math.min(120, Math.max(1, parseInt(req.body.late_threshold_minutes || '15', 10) || 15));
        const room = typeof req.body.room === 'string' && req.body.room.trim() ? req.body.room.trim().slice(0, 80) : 'Main Hall';
        const section = typeof req.body.section === 'string' ? req.body.section.trim().slice(0, 40) : undefined;
        const semester = typeof req.body.semester === 'string' ? req.body.semester.trim().slice(0, 40) : undefined;
        const subjectCode = typeof req.body.subject_code === 'string' ? req.body.subject_code.trim().slice(0, 40) : undefined;
        const allowedMethods = ['qr', 'face', 'manual', 'kiosk'];
        const verificationMethods = Array.isArray(req.body.verification_methods)
          ? [...new Set(req.body.verification_methods.map((m) => String(m).trim().toLowerCase()).filter((m) => allowedMethods.includes(m)))]
          : ['qr', 'face', 'manual'];

        const parsedScheduledStart = req.body.scheduled_start ? new Date(req.body.scheduled_start) : null;
        const scheduledStart = (parsedScheduledStart && !Number.isNaN(parsedScheduledStart.getTime())) ? parsedScheduledStart : undefined;
        const isActive = requestedStatus === 'active';
        const effectiveStart = isActive ? now : undefined;
        const expiresAt = isActive ? new Date(now.getTime() + durationMinutes * 60000) : undefined;
        const canonicalCollegeId = await resolveCanonicalCollegeId(teacherUser);

        const sessionId = new mongoose.Types.ObjectId();
        const qrCode = crypto.randomBytes(32).toString('hex');

        const newSession = new Session({
          _id: sessionId,
          teacher_id: teacherEmail,
          college_id: canonicalCollegeId || undefined,
          department: teacherUser.department || undefined,
          subject,
      subject_code: subjectCode,
          section,
          semester,
          academic_year: teacherUser.academic_year || undefined,
          room,
          duration: durationMinutes === 60 ? "1 Hour" : `${durationMinutes} min`,
          duration_minutes: durationMinutes,
          scheduled_start: requestedStatus !== 'active' ? (scheduledStart || now) : undefined,
          start_time: effectiveStart,
          expires_at: expiresAt,
          status: requestedStatus,
          is_active: isActive,
          qr_code: qrCode,
          qr_epoch: 1,
          qr_rotation_seconds: qrRotationSeconds,
          verification_methods: verificationMethods.length ? verificationMethods : ['qr', 'face', 'manual'],
          late_threshold_minutes: lateThresholdMinutes,
          latitude: typeof req.body.latitude === 'number' ? req.body.latitude : undefined,
          longitude: typeof req.body.longitude === 'number' ? req.body.longitude : undefined,
          radius_meters: typeof req.body.radius_meters === 'number' ? req.body.radius_meters : undefined,
        });

        try {
          await newSession.save();
        } catch (saveErr) {
            if (saveErr && saveErr.code === 11000 && isActive) {
              const concurrentSession = await Session.findOne({
                teacher_id: teacherEmail,
                subject,
                is_active: true
              }).sort({ start_time: -1 });
              if (concurrentSession) {
                if (!isSessionExpired(concurrentSession, now.getTime())) {
                  return res.json({
                    session_id: concurrentSession._id.toString(),
                    status: getEffectiveSessionStatus(concurrentSession),
                    message: "Attendance session started successfully",
                    already_active: true
                  });
                }
                await Session.updateOne(
                  { _id: concurrentSession._id, is_active: true },
                  { $set: { is_active: false, status: 'closed', closed_at: concurrentSession.closed_at || now } }
                );
                await newSession.save();
              } else {
                throw saveErr;
              }
            } else {
              throw saveErr;
            }
          }

          await AttendanceAuditLog.create({
            actor_email: req.userEmail,
            college_id: newSession.college_id,
            role: req.userRole,
            action: isActive ? 'SESSION_STARTED' : 'SESSION_CREATED',
            target_resource: `session:${sessionId.toString()}`,
            details: { subject, room, status: requestedStatus, duration_minutes: durationMinutes },
            ip_address: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
          }).catch(() => { });

          // Notify only students scoped to this canonical institution when active
          if (isActive && canonicalCollegeId) {
            const studentFilter = { role: 'student', college_id: canonicalCollegeId };
            if (newSession.department) studentFilter.department = newSession.department;
            if (section) studentFilter.section = section;
            if (semester) studentFilter.semester = semester;

            trackJob(User.find(studentFilter, 'email').lean().then(students => {
              const promises = students.map(student => {
                if (student.email) {
                  return notificationService.createNotification(
                    student.email,
                    "Live Session Alert",
                    `New attendance session active for ${subject} (${room})`,
                    "session_alert",
                    "High",
                    { session_id: sessionId.toString(), subject, room }
                  );
                }
              });
              return Promise.all(promises);
            }).catch(console.error));
          }

          res.json({
            session_id: sessionId.toString(),
            status: requestedStatus,
            is_active: isActive,
            expires_at: expiresAt ? expiresAt.toISOString() : null,
            qr_rotation_seconds: qrRotationSeconds,
            message: isActive ? "Attendance session started successfully" : `Session created in ${requestedStatus} state`
          });
        } catch (error) {
          reportInternalError(res, error, 'Sessions');
        }
      });

// POST /sessions/:sessionId/transition — full lifecycle state transitions
router.post('/:sessionId/transition', authenticate, requireRole(['teacher', 'admin', 'super_admin']), async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { action, reason, extend_minutes, auto_mark_absent } = req.body || {};
    if (!action || typeof action !== 'string') {
      return res.status(400).json({ detail: 'A valid session lifecycle action is required.' });
    }
    if (auto_mark_absent !== undefined && typeof auto_mark_absent !== 'boolean') {
      return res.status(400).json({ detail: 'auto_mark_absent must be a boolean.' });
    }
    const result = await transitionSessionState({
      sessionId,
      actorEmail: req.userEmail,
      actorRole: req.userRole,
      action,
      reason,
      extendMinutes: extend_minutes,
      autoMarkAbsent: auto_mark_absent === true,
      reqIp: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
    });
    if (result.errorStatus) {
      return res.status(result.errorStatus).json({ detail: result.detail });
    }
    return res.json(result);
  } catch (error) {
    reportInternalError(res, error, 'Sessions:Transition');
  }
});

// POST /sessions/:sessionId/qr-regenerate — invalidate prior QR epoch & issue fresh token
router.post('/:sessionId/qr-regenerate', authenticate, requireRole(['teacher', 'admin', 'super_admin']), async (req, res) => {
  try {
    const { sessionId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ detail: 'Invalid session id.' });
    }
    const session = await Session.findById(sessionId).lean();
    if (!session) return res.status(404).json({ detail: 'Session not found.' });
    if (!['admin', 'super_admin'].includes(req.userRole.toLowerCase()) && session.teacher_id.toLowerCase() !== req.userEmail.toLowerCase()) {
      return res.status(403).json({ detail: 'You can only regenerate QR codes for your own session.' });
    }
    if (!sessionSupportsQr(session)) {
      return res.status(403).json({ detail: 'QR attendance is disabled for this session.' });
    }
    if (!isSessionAcceptingQr(session)) {
      return res.status(409).json({ detail: 'Session must be active or resumed to regenerate QR tokens.' });
    }

    const observedEpoch = Number(session.qr_epoch || 1);
    const nextEpoch = observedEpoch + 1;
    const nextSecret = crypto.randomBytes(32).toString('hex');
    const setFields = { qr_epoch: nextEpoch, qr_code: nextSecret };
    if (req.body?.rotation_seconds !== undefined) {
      const rot = parseInt(req.body.rotation_seconds, 10);
      if (Number.isFinite(rot) && rot >= 5 && rot <= 120) {
        setFields.qr_rotation_seconds = rot;
      }
    }

    const updated = await Session.findOneAndUpdate(
      {
        _id: sessionId,
        is_active: true,
        ...(session.qr_epoch != null
          ? { qr_epoch: session.qr_epoch }
          : { $or: [{ qr_epoch: { $exists: false } }, { qr_epoch: null }, { qr_epoch: 1 }] }),
        $or: [
          { status: { $in: ['active', 'resumed'] } },
          { status: { $exists: false } },
          { status: null },
        ],
      },
      { $set: setFields },
      { new: true }
    ).lean();

    if (!updated) {
      return res.status(409).json({ detail: 'Concurrent QR regeneration conflict or session is no longer active. Please retry.' });
    }

    await AttendanceAuditLog.create({
      actor_email: req.userEmail,
      college_id: updated.college_id,
      role: req.userRole,
      action: 'QR_REGENERATED',
      target_resource: `session:${sessionId}`,
      details: { qr_epoch: updated.qr_epoch, rotation_seconds: updated.qr_rotation_seconds },
      ip_address: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
    }).catch(() => { });

    res.setHeader('Cache-Control', 'no-store');
    return res.json(issueAttendanceQrToken(updated));
  } catch (error) {
    reportInternalError(res, error, 'Sessions:QRRegenerate');
  }
});

router.get('/:sessionId/qr-token', authenticate, requireRole(['teacher', 'admin', 'super_admin']), async (req, res) => {
  try {
    const { sessionId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ detail: 'Invalid session id.' });
    }

    const session = await Session.findOne({ _id: sessionId, is_active: true }).lean();
    if (!session) return res.status(404).json({ detail: 'Active session not found.' });
    if (!['admin', 'super_admin'].includes(req.userRole.toLowerCase()) && session.teacher_id.toLowerCase() !== req.userEmail.toLowerCase()) {
      return res.status(403).json({ detail: 'You can only generate QR codes for your own session.' });
    }
    if (!sessionSupportsQr(session)) {
      return res.status(403).json({ detail: 'QR attendance is disabled for this session.' });
    }
    if (!isSessionAcceptingQr(session)) {
      return res.status(409).json({ detail: `QR tokens cannot be issued while session is ${getEffectiveSessionStatus(session)}.` });
    }
    if (!/^[a-f0-9]{64}$/i.test(session.qr_code || '')) {
      return res.status(409).json({ detail: 'Restart this session to enable secure QR codes.' });
    }

    res.setHeader('Cache-Control', 'no-store');
    res.json({
      ...issueAttendanceQrToken(session),
      remaining_seconds: computeRemainingSeconds(session),
      status: getEffectiveSessionStatus(session),
    });
  } catch (error) {
    console.error('[Sessions] QR token error:', error);
    res.status(500).json({ detail: 'Unable to generate attendance QR code.' });
  }
});

// GET /sessions/active - Get currently active attendance session scoped to user's institution / ownership
router.get('/active', authenticate, async (req, res) => {
  try {
    const role = (req.userRole || '').toLowerCase();
    const user = await User.findOne({ email: req.userEmail }, 'college_id college department').lean();
    const userCollege = user?.college_id || user?.college || null;

    const filter = { is_active: true };
      if (role === 'teacher') {
        filter.teacher_id = new RegExp(`^${req.userEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
      } else if (role !== 'super_admin' && userCollege) {
        filter.$or = [
          { college_id: userCollege },
          { college_id: { $exists: false } },
          { college_id: null },
          { college_id: '' }
        ];
      }

      const rawActiveSessions = await Session.find(filter).sort({ start_time: -1 }).limit(25).lean();
      const nowMs = Date.now();
      const expiredIds = [];
      const activeSessions = [];
      for (const s of rawActiveSessions) {
        if (isSessionExpired(s, nowMs)) {
          expiredIds.push(s._id);
        } else {
          activeSessions.push(s);
        }
      }
      if (expiredIds.length > 0) {
        await Session.updateMany(
          { _id: { $in: expiredIds }, is_active: true },
          { $set: { is_active: false, status: 'closed', closed_at: new Date(nowMs) } }
        ).catch(() => {});
      }

      const activeSession = activeSessions[0];
      if (!activeSession) {
        return res.json({ is_active: false, sessions: [], message: "No active attendance session found" });
      }

      const sanitizedSessions = activeSessions.slice(0, 10).map((s) => ({
        session_id: s._id.toString(),
        teacher_id: s.teacher_id,
        subject: s.subject,
        subject_code: s.subject_code || null,
        section: s.section || null,
        semester: s.semester || null,
        room: s.room || null,
        start_time: s.start_time,
        expires_at: s.expires_at || null,
        remaining_seconds: computeRemainingSeconds(s),
        status: getEffectiveSessionStatus(s),
        duration: s.duration,
        college_id: s.college_id || null,
        geofence_enabled: s.latitude != null && s.longitude != null,
      }));

      res.json({
        is_active: true,
        session_id: activeSession._id.toString(),
        teacher_id: activeSession.teacher_id,
        subject: activeSession.subject,
        room: activeSession.room || null,
        start_time: activeSession.start_time,
        expires_at: activeSession.expires_at || null,
        remaining_seconds: computeRemainingSeconds(activeSession),
        status: getEffectiveSessionStatus(activeSession),
        duration: activeSession.duration,
        college_id: activeSession.college_id || null,
        geofence_enabled: activeSession.latitude != null && activeSession.longitude != null,
        sessions: sanitizedSessions
      });
    } catch (error) {
      reportInternalError(res, error, 'Sessions');
    }
  });

// POST /sessions/stop - End an active attendance session
router.post('/stop', authenticate, requireRole(['teacher', 'admin', 'super_admin']), async (req, res) => {
  try {
    const { session_id } = req.body || {};
    let query = { is_active: true };
    if (session_id !== undefined && session_id !== null && String(session_id).trim() !== '') {
      if (typeof session_id !== 'string' || !mongoose.Types.ObjectId.isValid(session_id)) {
        return res.status(400).json({ detail: 'Invalid session_id.' });
      }
      query = { _id: session_id, is_active: true };
    } else if (req.userRole.toLowerCase() === 'teacher') {
      const escapedEmail = String(req.userEmail || '').trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query = { teacher_id: new RegExp(`^${escapedEmail}$`, 'i'), is_active: true };
    }

    const session = await Session.findOne(query).sort({ start_time: -1 });
    if (!session) {
      return res.status(404).json({ detail: "Active session not found" });
    }

      const result = await transitionSessionState({
        sessionId: session._id.toString(),
        actorEmail: req.userEmail,
        actorRole: req.userRole,
        action: 'close',
        reqIp: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
      });
      if (result.errorStatus) {
        return res.status(result.errorStatus).json({ detail: result.detail });
      }

      res.json({
        session_id: session._id.toString(),
        status: 'closed',
        message: "Session ended successfully"
      });
    } catch (error) {
      reportInternalError(res, error, 'Sessions');
    }
  });

// ─── User Device Session Tracking & Remote Revocation ─────────────────

router.get('/devices', authenticate, async (req, res) => {
  try {
    const userEmail = req.userEmail.toLowerCase();
    const activeSessions = await UserSession.find({
      userId: userEmail,
      expiry: { $gt: new Date() }
    }).sort({ lastActive: -1 }).lean();

    const currentToken = req.headers['authorization']?.split(' ')[1];
    const currentTokenHash = currentToken
      ? crypto.createHash('sha256').update(currentToken).digest('hex')
      : null;

    const devices = activeSessions.map((s) => ({
      id: s._id.toString(),
      device: s.device || 'Unknown Browser / Device',
      ip: s.ip || '127.0.0.1',
      location: s.location || 'Local Network',
      lastActive: s.lastActive || s.created_at,
      createdAt: s.created_at,
      isCurrent: s.tokenHash === currentTokenHash
    }));

    res.json({
      success: true,
      count: devices.length,
      devices
    });
  } catch (error) {
    reportInternalError(res, error, 'Sessions:Devices');
  }
});

router.delete('/devices/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, detail: 'Invalid session ID' });
    }

    const session = await UserSession.findOne({
      _id: id,
      userId: req.userEmail.toLowerCase()
    });

    if (!session) {
      return res.status(404).json({ success: false, detail: 'Active session not found' });
    }

    await UserSession.deleteOne({ _id: session._id });

    res.json({
      success: true,
      message: 'Device session successfully revoked.'
    });
  } catch (error) {
    reportInternalError(res, error, 'Sessions:DisconnectDevice');
  }
});

router.post('/logout-all', authenticate, async (req, res) => {
  try {
    const userEmail = req.userEmail.toLowerCase();
    const result = await UserSession.deleteMany({ userId: userEmail });

    res.json({
      success: true,
      message: 'All device sessions revoked successfully.',
      revokedCount: result.deletedCount
    });
  } catch (error) {
    reportInternalError(res, error, 'Sessions:LogoutAll');
  }
});

module.exports = router;
