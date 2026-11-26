'use strict';

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const User = require('../models/User');
const Announcement = require('../models/Announcement');
const InterventionNote = require('../models/InterventionNote');
const BiometricProfile = require('../models/BiometricProfile');
const FaceRecognitionMetrics = require('../models/FaceRecognitionMetrics');
const AttendanceAuditLog = require('../models/AttendanceAuditLog');
const Timetable = require('../models/Timetable');

const notificationService = require('../services/notificationService');
const teacherService = require('../services/teacherService');
const { getStudentAttendanceHistory, getStudentAttendanceSummary } = require('../services/studentAttendanceService');
const reportInternalError = require('../utils/httpError');
const { authenticate, requireRole } = require('../middleware/auth');

const teacherOrStaff = ['teacher', 'hod', 'principal', 'admin', 'super_admin'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// ─── GET /teacher/dashboard ────────────────────────────────────────────────
router.get('/dashboard', authenticate, requireRole(teacherOrStaff), async (req, res) => {
  try {
    const data = await teacherService.getTeacherDashboard(req.userEmail);
    if (!data) return res.status(404).json({ detail: 'Teacher profile not found.' });
    return res.json(data);
  } catch (error) {
    reportInternalError(res, error, 'Teacher:Dashboard');
  }
});

// ─── GET /teacher/sessions ─────────────────────────────────────────────────
router.get('/sessions', authenticate, requireRole(teacherOrStaff), async (req, res) => {
  try {
    const result = await teacherService.getTeacherSessions(req.userEmail);
    return res.json(result);
  } catch (error) {
    reportInternalError(res, error, 'Teacher:Sessions');
  }
});

// ─── GET /teacher/sessions/:sessionId/roster ───────────────────────────────
// Returns live session metadata, tallies, and full authorised student roster.
// Also consumed by Flutter mobile TeacherRepository.fetchClassRosterResult().
router.get('/sessions/:sessionId/roster', authenticate, requireRole(teacherOrStaff), async (req, res) => {
  try {
    const result = await teacherService.getSessionDetailAndRoster(req.userEmail, req.userRole, req.params.sessionId);
    if (result.errorStatus) {
      return res.status(result.errorStatus).json({ detail: result.detail });
    }
    return res.json(result);
  } catch (error) {
    reportInternalError(res, error, 'Teacher:SessionRoster');
  }
});

// ─── GET /teacher/students ─────────────────────────────────────────────────
router.get('/students', authenticate, requireRole(teacherOrStaff), async (req, res) => {
  try {
    const data = await teacherService.getTeacherStudentsRoster(req.userEmail, req.query);
    if (req.query.meta === 'true') {
      return res.json(data);
    }
    // Preserve array response shape for legacy & mobile clients
    return res.json(data.students);
  } catch (error) {
    reportInternalError(res, error, 'Teacher:Students');
  }
});

// ─── GET /teacher/students/meta ────────────────────────────────────────────
// Paginated/filtered student roster with subject/section/semester filter metadata.
router.get('/students/meta', authenticate, requireRole(teacherOrStaff), async (req, res) => {
  try {
    const data = await teacherService.getTeacherStudentsRoster(req.userEmail, req.query);
    return res.json(data);
  } catch (error) {
    reportInternalError(res, error, 'Teacher:StudentsMeta');
  }
});

// ─── GET /teacher/students/:email/history ──────────────────────────────────
router.get('/students/:email/history', authenticate, requireRole(teacherOrStaff), async (req, res) => {
  try {
    const studentEmail = String(req.params.email || '').trim().toLowerCase();
    const ctx = await teacherService.resolveTeacherContext(req.userEmail);
    if (!ctx) return res.status(404).json({ detail: 'Teacher profile not found.' });

    const student = await User.findOne({ email: studentEmail, role: 'student' }, '-password').lean();
    if (!student) return res.status(404).json({ detail: 'Student not found.' });

    if (ctx.teacher.college_id && student.college_id && ctx.teacher.college_id !== student.college_id) {
      return res.status(403).json({ detail: 'Forbidden: cross-institution student access denied.' });
    }

    const [history, summary, notes] = await Promise.all([
      getStudentAttendanceHistory(studentEmail, { limit: 100 }),
      getStudentAttendanceSummary(studentEmail),
      InterventionNote.find({ teacher_email: ctx.cleanEmail, student_email: studentEmail }).sort({ created_at: -1 }).lean(),
    ]);

    return res.json({
      student: summary?.student || { email: studentEmail, name: student.full_name },
      summary: summary ? {
        overall_attendance: summary.overall_attendance,
        total_present: summary.total_present,
        total_conducted: summary.total_conducted,
        risk: summary.risk,
        forecast: summary.forecast,
      } : null,
      records: history?.records || [],
      interventions: notes.map((n) => ({ ...n, id: n._id.toString() })),
    });
  } catch (error) {
    reportInternalError(res, error, 'Teacher:StudentHistory');
  }
});

// ─── GET /teacher/analytics ────────────────────────────────────────────────
router.get('/analytics', authenticate, requireRole(teacherOrStaff), async (req, res) => {
  try {
    const data = await teacherService.getTeacherAnalyticsAndRisk(req.userEmail, req.query);
    if (!data) return res.status(404).json({ detail: 'Teacher profile not found.' });
    return res.json(data);
  } catch (error) {
    reportInternalError(res, error, 'Teacher:Analytics');
  }
});

// ─── POST /teacher/interventions ───────────────────────────────────────────
// Record an explainable attendance intervention note or escalate to coordinator.
router.post('/interventions', authenticate, requireRole(teacherOrStaff), async (req, res) => {
  try {
    const { student_email, subject, risk_level, action_taken, note, escalated_to } = req.body || {};
    const targetEmail = typeof student_email === 'string' ? student_email.trim().toLowerCase() : '';
    if (!targetEmail || typeof note !== 'string' || !note.trim()) {
      return res.status(400).json({ detail: 'student_email and note are required.' });
    }

    const ctx = await teacherService.resolveTeacherContext(req.userEmail);
    const student = await User.findOne({ email: targetEmail, role: 'student' }, 'email college_id full_name').lean();
    if (!student) return res.status(404).json({ detail: 'Student not found.' });
    if (ctx?.teacher?.college_id && student.college_id && ctx.teacher.college_id !== student.college_id) {
      return res.status(403).json({ detail: 'Forbidden: cross-institution action denied.' });
    }

    const action = ['note', 'reminder_sent', 'escalated', 'counseling_scheduled'].includes(action_taken)
      ? action_taken
      : 'note';

    const created = await InterventionNote.create({
      teacher_email: req.userEmail.toLowerCase(),
      student_email: targetEmail,
      college_id: ctx?.teacher?.college_id || student.college_id || undefined,
      subject: typeof subject === 'string' ? subject.trim().slice(0, 120) : undefined,
      risk_level: typeof risk_level === 'string' ? risk_level.trim().slice(0, 60) : undefined,
      action_taken: action,
      note: note.trim().slice(0, 1000),
      escalated_to: typeof escalated_to === 'string' ? escalated_to.trim().slice(0, 120) : undefined,
    });

    await AttendanceAuditLog.create({
      actor_email: req.userEmail,
      college_id: ctx?.teacher?.college_id,
      role: req.userRole,
      action: 'INTERVENTION_LOGGED',
      target_resource: `student:${targetEmail}`,
      details: { action_taken: action, subject: subject || null },
      ip_address: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
    }).catch(() => {});

    return res.status(201).json({ success: true, intervention: { ...created.toObject(), id: created._id.toString() } });
  } catch (error) {
    reportInternalError(res, error, 'Teacher:Interventions');
  }
});

// ─── GET /teacher/kiosk/diagnostics ────────────────────────────────────────
// Privacy-safe biometric readiness & AI service health check for Teacher Kiosk Mode.
router.get('/kiosk/diagnostics', authenticate, requireRole(teacherOrStaff), async (req, res) => {
  try {
    const ctx = await teacherService.resolveTeacherContext(req.userEmail);
    if (!ctx) return res.status(404).json({ detail: 'Teacher profile not found.' });

    const students = await teacherService.getAuthorisedStudentsForTeacher(ctx);
    const emails = students.map((s) => s.email.toLowerCase());
    const enrolledCount = emails.length
      ? await BiometricProfile.countDocuments({ user_email: { $in: emails } })
      : 0;

    const recentEvents = emails.length
      ? await FaceRecognitionMetrics.find({ user_email: { $in: emails } })
        .select('user_email recognition_result confidence_score processing_time_ms created_at')
        .sort({ created_at: -1 })
        .limit(15)
        .lean()
      : [];

    const aiUrl = (process.env.AI_SERVICE_URL || 'http://127.0.0.1:8001').replace(/\/$/, '');
    let aiServiceStatus = 'unavailable';
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2500);
      const resp = await fetch(`${aiUrl}/ready`, { signal: controller.signal });
      clearTimeout(timer);
      aiServiceStatus = resp.ok ? 'ready' : 'degraded';
    } catch {
      aiServiceStatus = 'unavailable';
    }

    const stMap = new Map(students.map((s) => [s.email.toLowerCase(), s.full_name]));

    return res.json({
      ai_service_status: aiServiceStatus,
      total_students: students.length,
      biometric_enrolled_count: enrolledCount,
      biometric_readiness_pct: students.length ? Math.round((enrolledCount / students.length) * 100) : 0,
      recent_events: recentEvents.map((e) => ({
        id: e._id.toString(),
        student_name: stMap.get(e.user_email.toLowerCase()) || e.user_email,
        student_email: e.user_email,
        result: e.recognition_result,
        confidence: e.confidence_score,
        processing_time_ms: e.processing_time_ms,
        created_at: e.created_at,
      })),
    });
  } catch (error) {
    reportInternalError(res, error, 'Teacher:KioskDiagnostics');
  }
});

// ─── GET /teacher/reports/summary ──────────────────────────────────────────
router.get('/reports/summary', authenticate, requireRole(teacherOrStaff), async (req, res) => {
  try {
    const report = await teacherService.generateTeacherReport(req.userEmail, req.query);
    if (!report) return res.status(404).json({ detail: 'Teacher profile not found.' });
    return res.json(report);
  } catch (error) {
    reportInternalError(res, error, 'Teacher:ReportsSummary');
  }
});

// ─── GET /teacher/reports/export ───────────────────────────────────────────
router.get('/reports/export', authenticate, requireRole(teacherOrStaff), async (req, res) => {
  try {
    const format = String(req.query.format || 'csv').toLowerCase();
    const report = await teacherService.generateTeacherReport(req.userEmail, req.query);
    if (!report) return res.status(404).json({ detail: 'Teacher profile not found.' });

    await AttendanceAuditLog.create({
      actor_email: req.userEmail,
      role: req.userRole,
      action: 'ATTENDANCE_EXPORT',
      details: { records: report.rows.length, format, report_type: report.report_type },
      ip_address: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
    }).catch(() => {});

    const csvEscape = (value) => {
      let str = value == null ? '' : String(value);
      if (/^[=+\-@\t\r]/.test(str)) str = `'${str}`;
      return `"${str.replace(/"/g, '""')}"`;
    };
    const escapeHtml = (val) => String(val ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    const stamp = new Date().toISOString().slice(0, 10);

    if (format === 'json') {
      return res.json(report);
    }

    if (format === 'html' || format === 'pdf') {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      const rowsHtml = report.rows.map((r) => `
        <tr>
          <td>${escapeHtml(r.date)}</td>
          <td>${escapeHtml(r.time)}</td>
          <td>${escapeHtml(r.student_name)}</td>
          <td>${escapeHtml(r.student_id)}</td>
          <td>${escapeHtml(r.subject)}</td>
          <td>${escapeHtml(r.status)}</td>
          <td>${escapeHtml(r.verified_by)}</td>
          <td>${escapeHtml(r.confidence)}</td>
        </tr>`).join('');
      return res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Faculty Attendance Report</title>
        <style>body{font-family:Arial,sans-serif;padding:24px;color:#111}h1{margin:0 0 4px}table{width:100%;border-collapse:collapse;margin:16px 0}th,td{border:1px solid #ddd;padding:6px 8px;font-size:12px;text-align:left}th{background:#f3f4f6}.meta{font-size:12px;color:#444;margin-bottom:12px}.note{font-size:11px;color:#666;border-top:1px solid #ddd;padding-top:8px;margin-top:20px}</style>
      </head><body>
        <h1>SmartFace Faculty Attendance Report (${escapeHtml(report.report_type.toUpperCase())})</h1>
        <div class="meta">Institution: ${escapeHtml(report.institution.name)} · Department: ${escapeHtml(report.teacher.department || 'General')} · Semester: ${escapeHtml(report.institution.semester)}<br>
        Instructor: ${escapeHtml(report.teacher.name)} (${escapeHtml(report.teacher.email)}) · Period: ${escapeHtml(report.period.start_date)} to ${escapeHtml(report.period.end_date)} · Generated: ${escapeHtml(report.generated_at)}<br>
        Summary: ${report.summary.attendance_rate}% overall (${report.summary.present_count}/${report.summary.conducted_marks} conducted, ${report.summary.total_sessions} sessions)</div>
        <table><thead><tr><th>Date</th><th>Time</th><th>Student</th><th>Roll/ID</th><th>Subject</th><th>Status</th><th>Method</th><th>Confidence</th></tr></thead>
        <tbody>${rowsHtml || '<tr><td colspan="8">No attendance records found for this filter.</td></tr>'}</tbody></table>
        <p class="note">${escapeHtml(report.disclaimer)}</p>
      </body></html>`);
    }

    const header = ['Date', 'Time', 'Student Name', 'Student ID', 'Student Email', 'Subject', 'Room', 'Status', 'Verified By', 'Confidence', 'Reason'];
    const sep = format === 'xlsx' || format === 'excel' ? '\t' : ',';
    const ext = format === 'xlsx' || format === 'excel' ? 'xls' : 'csv';
    const mime = format === 'xlsx' || format === 'excel' ? 'application/vnd.ms-excel' : 'text/csv';
    const sanitizeTab = (v) => {
      let s = String(v == null ? '' : v).replace(/[\t\r\n]+/g, ' ').trim();
      if (/^[=+\-@]/.test(s)) s = `'${s}`;
      return s;
    };
    const esc = sep === '\t' ? sanitizeTab : csvEscape;

    const lines = [header.map(esc).join(sep)];
    for (const r of report.rows) {
      lines.push([
        r.date, r.time, r.student_name, r.student_id, r.student_email,
        r.subject, r.room, r.status, r.verified_by, r.confidence, r.reason
      ].map(esc).join(sep));
    }

    res.setHeader('Content-Type', mime);
    res.setHeader('Content-Disposition', `attachment; filename="teacher_attendance_${stamp}.${ext}"`);
    return res.send(lines.join('\n'));
  } catch (error) {
    reportInternalError(res, error, 'Teacher:Export');
  }
});

// ─── Academic Announcements & Broadcasts (Teacher-Scoped) ─────────────────
router.get('/announcements', authenticate, requireRole(teacherOrStaff), async (req, res) => {
  try {
    const items = await Announcement.find({ author_email: req.userEmail.toLowerCase() })
      .sort({ created_at: -1 })
      .limit(100)
      .lean();
    return res.json({
      announcements: items.map((a) => ({ ...a, id: a._id.toString(), _id: undefined })),
    });
  } catch (error) {
    reportInternalError(res, error, 'Teacher:AnnouncementsList');
  }
});

router.post('/announcements', authenticate, requireRole(teacherOrStaff), async (req, res) => {
  try {
    const {
      title, message, category, priority, target_scope,
      target_subject, target_section, target_semester,
      status, scheduled_for, expires_at, pinned,
    } = req.body || {};

    if (typeof title !== 'string' || !title.trim() || title.trim().length > 160) {
      return res.status(400).json({ detail: 'Title between 1 and 160 characters is required.' });
    }
    if (typeof message !== 'string' || !message.trim() || message.trim().length > 2000) {
      return res.status(400).json({ detail: 'Message between 1 and 2000 characters is required.' });
    }

    const ctx = await teacherService.resolveTeacherContext(req.userEmail);
    if (!ctx) return res.status(404).json({ detail: 'Teacher profile not found.' });

    const resolvedStatus = ['draft', 'scheduled', 'published'].includes(status) ? status : 'published';
    const resolvedScope = ['class', 'subject', 'department'].includes(target_scope) ? target_scope : 'department';
    const resolvedPriority = ['Low', 'Normal', 'High', 'Critical'].includes(priority) ? priority : 'Normal';
    const resolvedCategory = ['class', 'subject', 'attendance_reminder', 'schedule_update', 'deadline', 'exam', 'instruction'].includes(category)
      ? category
      : 'class';

    const doc = new Announcement({
      college_id: ctx.teacher.college_id || undefined,
      department: ctx.teacher.department || undefined,
      author_email: ctx.cleanEmail,
      author_name: ctx.teacher.full_name,
      title: title.trim(),
      message: message.trim(),
      category: resolvedCategory,
      priority: resolvedPriority,
      target_scope: resolvedScope,
      target_subject: typeof target_subject === 'string' ? target_subject.trim() : undefined,
      target_section: typeof target_section === 'string' ? target_section.trim() : undefined,
      target_semester: typeof target_semester === 'string' ? target_semester.trim() : undefined,
      status: resolvedStatus,
      pinned: Boolean(pinned),
      scheduled_for: scheduled_for ? new Date(scheduled_for) : undefined,
      published_at: resolvedStatus === 'published' ? new Date() : undefined,
      expires_at: expires_at ? new Date(expires_at) : undefined,
    });

    if (resolvedStatus === 'published') {
      const students = await teacherService.getAuthorisedStudentsForTeacher(ctx, {
        section: doc.target_section || undefined,
        semester: doc.target_semester || undefined,
      });
      let delivered = 0;
      const batchSize = 25;
      for (let i = 0; i < students.length; i += batchSize) {
        const batch = students.slice(i, i + batchSize);
        const outcomes = await Promise.allSettled(
          batch.map((st) => notificationService.createNotification(
            st.email,
            doc.title,
            doc.message,
            'announcement',
            resolvedPriority,
            {
              sender: ctx.cleanEmail,
              announcement_id: doc._id.toString(),
              subject: doc.target_subject || undefined,
              pinned: doc.pinned,
              expires_at: doc.expires_at ? doc.expires_at.toISOString() : undefined,
            }
          ))
        );
        delivered += outcomes.filter((o) => o.status === 'fulfilled' && o.value?.id).length;
      }
      doc.delivery_stats = {
        recipients: students.length,
        delivered,
        failed: Math.max(0, students.length - delivered),
      };
    }

    await doc.save();

    await AttendanceAuditLog.create({
      actor_email: ctx.cleanEmail,
      college_id: ctx.teacher.college_id,
      role: req.userRole,
      action: 'ANNOUNCEMENT_PUBLISHED',
      target_resource: `announcement:${doc._id.toString()}`,
      details: { status: resolvedStatus, scope: resolvedScope, recipients: doc.delivery_stats.recipients },
      ip_address: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
    }).catch(() => {});

    return res.status(201).json({
      success: true,
      announcement: { ...doc.toObject(), id: doc._id.toString() },
    });
  } catch (error) {
    reportInternalError(res, error, 'Teacher:AnnouncementsCreate');
  }
});

router.delete('/announcements/:id', authenticate, requireRole(teacherOrStaff), async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ detail: 'Invalid announcement ID.' });
    }
    const deleted = await Announcement.findOneAndDelete({ _id: id, author_email: req.userEmail.toLowerCase() });
    if (!deleted) return res.status(404).json({ detail: 'Announcement not found or access denied.' });

    await AttendanceAuditLog.create({
      actor_email: req.userEmail,
      role: req.userRole,
      action: 'ANNOUNCEMENT_DELETED',
      target_resource: `announcement:${id}`,
      ip_address: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
    }).catch(() => {});

    return res.json({ success: true, deleted_id: id });
  } catch (error) {
    reportInternalError(res, error, 'Teacher:AnnouncementsDelete');
  }
});

// ─── POST /teacher/notifications/broadcast ─────────────────────────────────
// Institution- and class-scoped broadcast (supports both web title/priority and mobile subject/session_id).
router.post('/notifications/broadcast', authenticate, requireRole(teacherOrStaff), async (req, res) => {
  try {
    const teacherEmail = req.userEmail;
    const { title, message, priority, subject, section, semester, target_scope } = req.body || {};

    if (typeof message !== 'string' || !message.trim() || message.length > 1000) {
      return res.status(400).json({ detail: 'A message between 1 and 1000 characters is required.' });
    }
    if (title !== undefined && (typeof title !== 'string' || title.length > 120)) {
      return res.status(400).json({ detail: 'Title must be under 120 characters.' });
    }
    const resolvedPriority = ['Low', 'Normal', 'High', 'Critical'].includes(priority) ? priority : 'Normal';

    const ctx = await teacherService.resolveTeacherContext(teacherEmail);
    if (!ctx) return res.status(404).json({ detail: 'Teacher profile not found.' });

    const audience = await teacherService.getAuthorisedStudentsForTeacher(ctx, { section, semester });

    if (audience.length === 0) {
      return res.json({ success: true, delivered: 0, message: 'No authorised students found for this broadcast.' });
    }

    const finalTitle = (title || (subject ? `${subject}: Classroom Alert` : 'Classroom Announcement')).trim();
    const batchSize = 25;
    let deliveredCount = 0;

    const withTimeout = (promise, ms = 5000) =>
      Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Notification timed out')), ms)),
      ]);

    for (let i = 0; i < audience.length; i += batchSize) {
      const batch = audience.slice(i, i + batchSize);
      const outcomes = await Promise.allSettled(
        batch.map((student) =>
          withTimeout(
            notificationService.createNotification(
              student.email,
              finalTitle,
              message.trim(),
              'announcement',
              resolvedPriority,
              { sender: teacherEmail, subject: subject || undefined, target_scope: target_scope || 'department' }
            )
          )
        )
      );
      deliveredCount += outcomes.filter(
        (outcome) => outcome.status === 'fulfilled' && outcome.value && outcome.value.id
      ).length;
    }

    await AttendanceAuditLog.create({
      actor_email: teacherEmail,
      college_id: ctx.teacher.college_id,
      role: req.userRole,
      action: 'BROADCAST_SENT',
      details: { recipients: deliveredCount, priority: resolvedPriority, subject: subject || null },
      ip_address: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
    }).catch(() => {});

    return res.json({
      success: true,
      delivered: deliveredCount,
      title: finalTitle,
      priority: resolvedPriority
    });
  } catch (error) {
    reportInternalError(res, error, 'Teacher:Broadcast');
  }
});

// ─── Timetable CRUD (teacher-scoped, with substitution & cancellation support) ──
router.get('/timetable', authenticate, requireRole(teacherOrStaff), async (req, res) => {
  try {
    const cleanEmail = req.userEmail.toLowerCase();
    const slots = await Timetable.find({
      $or: [
        { teacher_email: cleanEmail },
        { teacher_email: new RegExp(`^${cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      ],
    })
      .sort({ day: 1, time: 1 })
      .lean();
    return res.json(slots.map((slot) => {
      const obj = { ...slot, id: slot._id.toString() };
      delete obj._id;
      delete obj.__v;
      return obj;
    }));
  } catch (error) {
    reportInternalError(res, error, 'Teacher:Timetable');
  }
});

router.post('/timetable', authenticate, requireRole(teacherOrStaff), async (req, res) => {
  try {
    const {
      subject, subject_code, day, time, room, user_id,
      session_type, semester, section, class_key, substitute_faculty,
      is_cancelled, cancellation_reason, rescheduled_to,
    } = req.body || {};

    if (typeof subject !== 'string' || !subject.trim() || subject.trim().length > 120) {
      return res.status(400).json({ detail: 'A subject between 1 and 120 characters is required.' });
    }
    if (typeof day !== 'string' || !DAYS.includes(day.trim())) {
      return res.status(400).json({ detail: `Day must be one of: ${DAYS.join(', ')}.` });
    }
    if (typeof time !== 'string' || !time.trim() || time.trim().length > 60) {
      return res.status(400).json({ detail: 'A time label between 1 and 60 characters is required.' });
    }
    if (room !== undefined && (typeof room !== 'string' || room.length > 60)) {
      return res.status(400).json({ detail: 'Room must be a string under 60 characters.' });
    }

    const teacher = await User.findOne({ email: req.userEmail.toLowerCase() }, 'full_name college_id').lean();
    const entry = new Timetable({
      user_id: typeof user_id === 'string' && user_id.trim() ? user_id.trim().toUpperCase() : req.userEmail.toLowerCase(),
      subject: subject.trim(),
      subject_code: typeof subject_code === 'string' ? subject_code.trim().slice(0, 40) : '',
      day: day.trim(),
      time: time.trim(),
      room: typeof room === 'string' ? room.trim() : '',
      college_id: teacher?.college_id || '',
      teacher_email: req.userEmail.toLowerCase(),
      faculty_name: teacher?.full_name || '',
      substitute_faculty: typeof substitute_faculty === 'string' ? substitute_faculty.trim().slice(0, 120) : '',
      session_type: ['lecture', 'lab', 'practical', 'special', 'exam'].includes(session_type) ? session_type : 'lecture',
      semester: typeof semester === 'string' ? semester.trim().slice(0, 40) : '',
      section: typeof section === 'string' ? section.trim().slice(0, 40) : '',
      class_key: typeof class_key === 'string' ? class_key.trim().slice(0, 80) : '',
      is_cancelled: Boolean(is_cancelled),
      cancellation_reason: typeof cancellation_reason === 'string' ? cancellation_reason.trim().slice(0, 300) : '',
      rescheduled_to: typeof rescheduled_to === 'string' ? rescheduled_to.trim().slice(0, 120) : '',
    });
    await entry.save();

    await AttendanceAuditLog.create({
      actor_email: req.userEmail,
      college_id: teacher?.college_id,
      role: req.userRole,
      action: 'TIMETABLE_SLOT_CREATED',
      details: { subject: entry.subject, day: entry.day, time: entry.time },
      ip_address: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
    }).catch(() => {});

    const obj = entry.toObject();
    obj.id = obj._id.toString();
    delete obj._id;
    delete obj.__v;
    return res.status(201).json(obj);
  } catch (error) {
    reportInternalError(res, error, 'Teacher:TimetableCreate');
  }
});

router.put('/timetable/:id', authenticate, requireRole(teacherOrStaff), async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ detail: 'Invalid timetable ID.' });
    }
    const cleanEmail = req.userEmail.toLowerCase();
    const slot = await Timetable.findOne({
      _id: id,
      teacher_email: new RegExp(`^${cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
    });
    if (!slot) {
      return res.status(404).json({ detail: 'Timetable slot not found or access denied.' });
    }

    const updates = {};
    if (req.body.subject !== undefined) {
      if (typeof req.body.subject !== 'string' || !req.body.subject.trim() || req.body.subject.trim().length > 120) {
        return res.status(400).json({ detail: 'Subject must be a non-empty string under 120 characters.' });
      }
      updates.subject = req.body.subject.trim();
    }
    if (req.body.subject_code !== undefined) {
      updates.subject_code = typeof req.body.subject_code === 'string' ? req.body.subject_code.trim().slice(0, 40) : '';
    }
    if (req.body.day !== undefined) {
      if (!DAYS.includes(String(req.body.day).trim())) {
        return res.status(400).json({ detail: `Day must be one of: ${DAYS.join(', ')}.` });
      }
      updates.day = String(req.body.day).trim();
    }
    if (req.body.time !== undefined) {
      if (typeof req.body.time !== 'string' || !req.body.time.trim() || req.body.time.trim().length > 60) {
        return res.status(400).json({ detail: 'Time must be a non-empty string under 60 characters.' });
      }
      updates.time = req.body.time.trim();
    }
    if (req.body.room !== undefined) {
      updates.room = typeof req.body.room === 'string' ? req.body.room.trim().slice(0, 60) : '';
    }
    if (req.body.session_type !== undefined && ['lecture', 'lab', 'practical', 'special', 'exam'].includes(req.body.session_type)) {
      updates.session_type = req.body.session_type;
    }
    if (req.body.substitute_faculty !== undefined) {
      updates.substitute_faculty = typeof req.body.substitute_faculty === 'string' ? req.body.substitute_faculty.trim().slice(0, 120) : '';
    }
    if (req.body.is_cancelled !== undefined) {
      updates.is_cancelled = Boolean(req.body.is_cancelled);
    }
    if (req.body.cancellation_reason !== undefined) {
      updates.cancellation_reason = typeof req.body.cancellation_reason === 'string' ? req.body.cancellation_reason.trim().slice(0, 300) : '';
    }
    if (req.body.rescheduled_to !== undefined) {
      updates.rescheduled_to = typeof req.body.rescheduled_to === 'string' ? req.body.rescheduled_to.trim().slice(0, 120) : '';
    }
    if (req.body.semester !== undefined) {
      updates.semester = typeof req.body.semester === 'string' ? req.body.semester.trim().slice(0, 40) : '';
    }
    if (req.body.section !== undefined) {
      updates.section = typeof req.body.section === 'string' ? req.body.section.trim().slice(0, 40) : '';
    }
    if (req.body.class_key !== undefined) {
      updates.class_key = typeof req.body.class_key === 'string' ? req.body.class_key.trim().slice(0, 80) : '';
    }

    const updated = await Timetable.findByIdAndUpdate(id, updates, { returnDocument: 'after' }).lean();

    await AttendanceAuditLog.create({
      actor_email: req.userEmail,
      college_id: slot.college_id,
      role: req.userRole,
      action: 'TIMETABLE_SLOT_UPDATED',
      target_resource: `timetable:${id}`,
      details: updates,
      ip_address: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
    }).catch(() => {});

    return res.json({ success: true, slot: { ...updated, id: updated._id.toString() } });
  } catch (error) {
    reportInternalError(res, error, 'Teacher:TimetableUpdate');
  }
});

router.delete('/timetable/:id', authenticate, requireRole(teacherOrStaff), async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ detail: 'Invalid timetable ID.' });
    }
    const cleanEmail = req.userEmail.toLowerCase();
    const deleted = await Timetable.findOneAndDelete({
      _id: id,
      teacher_email: new RegExp(`^${cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
    });
    if (!deleted) {
      return res.status(404).json({ detail: 'Timetable slot not found or access denied.' });
    }

    await AttendanceAuditLog.create({
      actor_email: req.userEmail,
      college_id: deleted.college_id,
      role: req.userRole,
      action: 'TIMETABLE_SLOT_DELETED',
      details: { slot_id: id, subject: deleted.subject },
      ip_address: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
    }).catch(() => {});

    return res.json({ success: true, message: 'Timetable slot deleted successfully.', deleted_id: id });
  } catch (error) {
    reportInternalError(res, error, 'Teacher:TimetableDelete');
  }
});

module.exports = router;
