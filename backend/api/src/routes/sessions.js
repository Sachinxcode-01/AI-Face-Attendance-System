const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const crypto = require('crypto');

const Session = require('../models/Session');
const User = require('../models/User');
const notificationService = require('../services/notificationService');
const { authenticate, requireRole } = require('../middleware/auth');
const { trackJob } = require('../utils/jobTracker');
const { issueAttendanceQrToken } = require('../utils/attendanceQr');
const reportInternalError = require('../utils/httpError');

router.post('/start', authenticate, requireRole(['teacher', 'admin', 'super_admin']), async (req, res) => {
  try {
    const teacherEmail = typeof req.body.teacher_email === 'string' ? req.body.teacher_email.trim().toLowerCase() : '';
    const subject = typeof req.body.subject === 'string' ? req.body.subject.trim() : '';
    if (!teacherEmail || teacherEmail.length > 254 || !subject || subject.length > 120) {
      return res.status(400).json({ detail: 'A valid teacher email and subject are required.' });
    }

    if (req.userEmail.toLowerCase() !== teacherEmail && !['admin', 'super_admin'].includes(req.userRole.toLowerCase())) {
      return res.status(403).json({ detail: "Forbidden: Cannot start session on behalf of another teacher." });
    }
    if (!await User.exists({ email: teacherEmail, role: 'teacher' })) {
      return res.status(404).json({ detail: 'Teacher account not found.' });
    }
    const sessionId = new mongoose.Types.ObjectId();
    const qrCode = crypto.randomBytes(32).toString('hex');

    const newSession = new Session({
      _id: sessionId,
      teacher_id: teacherEmail,
      subject,
      duration: "1 Hour",
      start_time: new Date(),
      is_active: true,
      qr_code: qrCode
    });

    await newSession.save();

    // Notify all students about the active session in the background
    trackJob(User.find({ role: 'student' }).then(students => {
      const promises = students.map(student => {
        if (student.email) {
          return notificationService.createNotification(
            student.email,
            "Live Session Alert",
            `New attendance session active for ${subject}`,
            "session_alert",
            "High",
            { session_id: sessionId.toString(), subject }
          );
        }
      });
      return Promise.all(promises);
    }).catch(console.error));

    res.json({
      session_id: sessionId.toString(),
      message: "Attendance session started successfully"
    });
  } catch (error) {
    reportInternalError(res, error, 'Sessions');
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
    if (!/^[a-f0-9]{64}$/i.test(session.qr_code || '')) {
      return res.status(409).json({ detail: 'Restart this session to enable secure QR codes.' });
    }

    res.setHeader('Cache-Control', 'no-store');
    res.json(issueAttendanceQrToken(session));
  } catch (error) {
    console.error('[Sessions] QR token error:', error);
    res.status(500).json({ detail: 'Unable to generate attendance QR code.' });
  }
});

// GET /sessions/active - Get currently active attendance session
router.get('/active', async (req, res) => {
  try {
    const activeSession = await Session.findOne({ is_active: true }).sort({ start_time: -1 }).lean();
    if (!activeSession) {
      return res.json({ is_active: false, message: "No active attendance session found" });
    }
    res.json({
      is_active: true,
      session_id: activeSession._id.toString(),
      teacher_id: activeSession.teacher_id,
      subject: activeSession.subject,
      start_time: activeSession.start_time,
      duration: activeSession.duration
    });
  } catch (error) {
    reportInternalError(res, error, 'Sessions');
  }
});

// POST /sessions/stop - End an active attendance session
router.post('/stop', authenticate, requireRole(['teacher', 'admin', 'super_admin']), async (req, res) => {
  try {
    const { session_id } = req.body;
    let query = { is_active: true };
    if (session_id && mongoose.Types.ObjectId.isValid(session_id)) {
      query = { _id: session_id, is_active: true };
    }

    const session = await Session.findOne(query);
    if (!session) {
      return res.status(404).json({ detail: "Active session not found" });
    }

    if (!['admin', 'super_admin'].includes(req.userRole.toLowerCase()) && req.userEmail.toLowerCase() !== session.teacher_id.toLowerCase()) {
      return res.status(403).json({ detail: "Forbidden: You can only stop sessions you created" });
    }

    session.is_active = false;
    await session.save();

    res.json({
      session_id: session._id.toString(),
      message: "Session ended successfully"
    });
  } catch (error) {
    reportInternalError(res, error, 'Sessions');
  }
});

module.exports = router;
