const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const User = require('../models/User');
const Session = require('../models/Session');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Timetable = require('../models/Timetable');
const AttendanceAuditLog = require('../models/AttendanceAuditLog');

const notificationService = require('../services/notificationService');
const reportInternalError = require('../utils/httpError');
const { authenticate, requireRole } = require('../middleware/auth');
const { trackJob } = require('../utils/jobTracker');

// ─── Teacher Dashboard ─────────────────────────────────────────────────────
// Returns a live overview for the signed-in teacher: active sessions, today's
// check-ins across their classes, students monitored, and pending leave reviews.
router.get('/dashboard', authenticate, requireRole('teacher'), async (req, res) => {
  try {
    const teacherEmail = req.userEmail;

    const teacher = await User.findOne({ email: teacherEmail }, 'full_name department specialization email').lean();
    if (!teacher) return res.status(404).json({ detail: 'Teacher profile not found.' });

    const teacherSessions = await Session.find({ teacher_id: teacherEmail }).select('_id').lean();
    const sessionIds = teacherSessions.map((session) => session._id);
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [activeSessions, totalSessions, attendanceToday, monitoredStudents] = await Promise.all([
      Session.countDocuments({ teacher_id: teacherEmail, is_active: true }),
      Session.countDocuments({ teacher_id: teacherEmail }),
      sessionIds.length
        ? Attendance.countDocuments({ session_id: { $in: sessionIds }, timestamp: { $gte: startOfDay } })
        : Promise.resolve(0),
      sessionIds.length
        ? Attendance.distinct('student_email', { session_id: { $in: sessionIds } })
        : Promise.resolve([])
    ]);

    // Pending leave reviews from students who attend this teacher's classes.
    const pendingLeaves = monitoredStudents.length
      ? await Leave.countDocuments({
          status: { $in: ['Pending', 'Under Review'] },
          user_id: { $in: monitoredStudents }
        })
      : 0;

    res.json({
      teacher_name: teacher.full_name,
      department: teacher.department || null,
      active_sessions: activeSessions,
      total_sessions: totalSessions,
      attendance_today: attendanceToday,
      students_monitored: monitoredStudents.length,
      pending_leaves: pendingLeaves
    });
  } catch (error) {
    reportInternalError(res, error, 'Teacher');
  }
});

// ─── GET /teacher/sessions ──────────────────────────────────────────────
// Teacher-scoped session list with per-session attendance tallies.
router.get('/sessions', authenticate, requireRole('teacher'), async (req, res) => {
  try {
    const teacherEmail = req.userEmail;
    const sessions = await Session.find({ teacher_id: teacherEmail })
      .sort({ start_time: -1 })
      .lean();

    const result = await Promise.all(
      sessions.map(async (session) => {
        const [presentCount, distinctStudents] = await Promise.all([
          Attendance.countDocuments({ session_id: session._id, status: 'Present' }),
          Attendance.distinct('student_email', { session_id: session._id })
        ]);

        return {
          id: session._id.toString(),
          subject: session.subject,
          room: session.room || null,
          duration: session.duration,
          start_time: session.start_time,
          is_active: session.is_active,
          students_checked_in: presentCount,
          total_enrolled_seen: distinctStudents.length,
          attendance_rate: distinctStudents.length
            ? Math.round((presentCount / distinctStudents.length) * 100)
            : 0
        };
      })
    );

    res.json(result);
  } catch (error) {
    reportInternalError(res, error, 'Teacher');
  }
});

// ─── GET /teacher/students ──────────────────────────────────────────────
// Students who have attended at least one of this teacher's sessions, with
// a lightweight attendance summary. Supports ?search= and ?sort=rate|name.
router.get('/students', authenticate, requireRole('teacher'), async (req, res) => {
  try {
    const teacherEmail = req.userEmail;
    const search = typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase() : '';
    const sort = typeof req.query.sort === 'string' ? req.query.sort : 'name';

    const teacherSessions = await Session.find({ teacher_id: teacherEmail }).select('_id').lean();
    const sessionIds = teacherSessions.map((session) => session._id);

    if (sessionIds.length === 0) {
      return res.json([]);
    }

    // Aggregate per-student attendance for these sessions only.
    const aggregated = await Attendance.aggregate([
      { $match: { session_id: { $in: sessionIds } } },
      {
        $group: {
          _id: '$student_email',
          present_count: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } },
          total_count: { $sum: 1 },
          last_seen: { $max: '$timestamp' }
        }
      }
    ]);

    const summaryByEmail = new Map(
      aggregated.map((row) => [String(row._id).toLowerCase(), row])
    );

    const students = await User.find(
      {
        role: 'student',
        email: { $in: aggregated.map((row) => row._id) },
        ...(search
          ? { $or: [
              { full_name: { $regex: search, $options: 'i' } },
              { email: { $regex: search, $options: 'i' } },
              { student_id: { $regex: search, $options: 'i' } }
            ] }
          : {})
      },
      'email full_name student_id roll_number department semester avatar_url profilePhotoUrl'
    ).lean();

    const rows = students.map((student) => {
      const summary = summaryByEmail.get(String(student.email).toLowerCase());
      const present = summary ? summary.present_count : 0;
      const total = summary ? summary.total_count : 0;
      return {
        id: student._id.toString(),
        email: student.email,
        full_name: student.full_name,
        student_id: student.student_id || student.roll_number || null,
        department: student.department || null,
        semester: student.semester || null,
        avatar_url: student.profilePhotoUrl || student.avatar_url || null,
        present_count: present,
        total_count: total,
        attendance_rate: total ? Math.round((present / total) * 100) : 0,
        last_seen: summary && summary.last_seen ? summary.last_seen.toISOString() : null
      };
    });

    if (sort === 'rate') {
      rows.sort((a, b) => b.attendance_rate - a.attendance_rate);
    } else {
      rows.sort((a, b) => a.full_name.localeCompare(b.full_name));
    }

    res.json(rows);
  } catch (error) {
    reportInternalError(res, error, 'Teacher');
  }
});

// ─── GET /teacher/analytics ─────────────────────────────────────────────
// Aggregate attendance analytics across this teacher's sessions, plus a
// recent 8-week trend for charts.
router.get('/analytics', authenticate, requireRole('teacher'), async (req, res) => {
  try {
    const teacherEmail = req.userEmail;
    const teacherSessions = await Session.find({ teacher_id: teacherEmail }).select('_id').lean();
    const sessionIds = teacherSessions.map((session) => session._id);

    if (sessionIds.length === 0) {
      return res.json({
        total_sessions: 0,
        present_marks: 0,
        face_scans: 0,
        qr_scans: 0,
        avg_confidence: null,
        attendance_rate: 0,
        weekly_trends: []
      });
    }

    const [totals] = await Attendance.aggregate([
      { $match: { session_id: { $in: sessionIds } } },
      {
        $group: {
          _id: null,
          total_marks: { $sum: 1 },
          present_marks: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } },
          face_scans: { $sum: { $cond: [{ $eq: ['$verified_by', 'face'] }, 1, 0] } },
          qr_scans: { $sum: { $cond: [{ $eq: ['$verified_by', 'qr'] }, 1, 0] } },
          manual_scans: { $sum: { $cond: [{ $eq: ['$verified_by', 'manual'] }, 1, 0] } },
          avg_confidence: { $avg: '$confidence' }
        }
      }
    ]);

    const now = new Date();
    const weeklyRows = await Attendance.aggregate([
      {
        $match: {
          session_id: { $in: sessionIds },
          timestamp: { $gte: new Date(now.getTime() - 8 * 7 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: { week: { $week: '$timestamp' }, year: { $year: '$timestamp' } },
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } }
        }
      },
      { $sort: { '_id.year': 1, '_id.week': 1 } }
    ]);

    res.json({
      total_sessions: sessionIds.length,
      present_marks: totals ? totals.present_marks : 0,
      face_scans: totals ? totals.face_scans : 0,
      qr_scans: totals ? totals.qr_scans : 0,
      manual_scans: totals ? totals.manual_scans : 0,
      avg_confidence: totals && totals.avg_confidence != null
        ? Math.round(totals.avg_confidence * 1000) / 10
        : null,
      attendance_rate: totals && totals.total_marks
        ? Math.round((totals.present_marks / totals.total_marks) * 1000) / 10
        : 0,
      weekly_trends: weeklyRows.map((row) => ({
        year: row._id.year,
        week: row._id.week,
        present: row.present,
        total: row.total,
        rate: row.total ? Math.round((row.present / row.total) * 1000) / 10 : 0
      }))
    });
  } catch (error) {
    reportInternalError(res, error, 'Teacher');
  }
});

// ─── GET /teacher/reports/summary ───────────────────────────────────────
// Attendance summary for a teacher across an optional date range.
router.get('/reports/summary', authenticate, requireRole('teacher'), async (req, res) => {
  try {
    const teacherEmail = req.userEmail;
    const { start_date, end_date } = req.query;

    const dateFilter = {};
    if (start_date || end_date) {
      const from = start_date ? new Date(`${start_date}T00:00:00.000Z`) : null;
      const to = end_date ? new Date(`${end_date}T23:59:59.999Z`) : null;
      if (from && !isNaN(from.getTime())) dateFilter.$gte = from;
      if (to && !isNaN(to.getTime())) dateFilter.$lte = to;
    }

    const teacherSessions = await Session.find({ teacher_id: teacherEmail }).select('_id').lean();
    const sessionIds = teacherSessions.map((session) => session._id);

    if (sessionIds.length === 0) {
      return res.json({
        period: { start_date: start_date || 'All time', end_date: end_date || 'All time' },
        summary: {
          total_marks: 0,
          attendance_rate: 0,
          present_count: 0,
          absent_count: 0,
          late_count: 0,
          face_scans: 0,
          qr_scans: 0
        }
      });
    }

    const [summary] = await Attendance.aggregate([
      { $match: { session_id: { $in: sessionIds }, timestamp: dateFilter } },
      {
        $group: {
          _id: null,
          total_marks: { $sum: 1 },
          present_count: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } },
          absent_count: { $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] } },
          late_count: { $sum: { $cond: [{ $eq: ['$status', 'Late'] }, 1, 0] } },
          face_scans: { $sum: { $cond: [{ $eq: ['$verified_by', 'face'] }, 1, 0] } },
          qr_scans: { $sum: { $cond: [{ $eq: ['$verified_by', 'qr'] }, 1, 0] } }
        }
      }
    ]);

    const rate = summary && summary.total_marks
      ? Math.round((summary.present_count / summary.total_marks) * 1000) / 10
      : 0;

    res.json({
      period: {
        start_date: start_date || 'All time',
        end_date: end_date || 'All time'
      },
      summary: {
        total_marks: summary ? summary.total_marks : 0,
        attendance_rate: rate,
        present_count: summary ? summary.present_count : 0,
        absent_count: summary ? summary.absent_count : 0,
        late_count: summary ? summary.late_count : 0,
        face_scans: summary ? summary.face_scans : 0,
        qr_scans: summary ? summary.qr_scans : 0
      }
    });
  } catch (error) {
    reportInternalError(res, error, 'Teacher');
  }
});

// ─── GET /teacher/reports/export ────────────────────────────────────────
// Export a teacher's attendance records as CSV, scoped to their sessions and
// an optional date range / session selection. Streams the file as an attachment.
router.get('/reports/export', authenticate, requireRole('teacher'), async (req, res) => {
  try {
    const teacherEmail = req.userEmail;
    const { start_date, end_date, session_ids } = req.query;
    const format = (req.query.format || 'csv').toLowerCase();

    const teacherSessions = await Session.find({ teacher_id: teacherEmail }).select('_id subject').lean();
    let sessionIds = teacherSessions.map((session) => session._id);
    if (typeof session_ids === 'string' && session_ids.trim()) {
      const requested = session_ids.split(',').filter((id) => mongoose.Types.ObjectId.isValid(id));
      sessionIds = sessionIds.filter((id) => requested.includes(id.toString()));
    }
    const subjectById = new Map(teacherSessions.map((session) => [session._id.toString(), session.subject]));

    if (sessionIds.length === 0) {
      return res.status(404).json({ detail: 'No sessions found for export.' });
    }

    const dateFilter = {};
    if (start_date || end_date) {
      const from = start_date ? new Date(`${start_date}T00:00:00.000Z`) : null;
      const to = end_date ? new Date(`${end_date}T23:59:59.999Z`) : null;
      if (from && !isNaN(from.getTime())) dateFilter.$gte = from;
      if (to && !isNaN(to.getTime())) dateFilter.$lte = to;
    }

    const records = await Attendance.find({
      session_id: { $in: sessionIds },
      timestamp: dateFilter
    })
      .sort({ timestamp: -1 })
      .lean();

    // Audit the export for accountability.
    try {
      await AttendanceAuditLog.create({
        actor_email: teacherEmail,
        role: req.userRole,
        action: 'ATTENDANCE_EXPORT',
        details: { records: records.length, format },
        ip_address: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
      });
    } catch (_) {}

    const csvEscape = (value) => {
      const str = value == null ? '' : String(value);
      return `"${str.replace(/"/g, '""')}"`;
    };

    const header = ['Date', 'Time', 'Student Email', 'Subject', 'Status', 'Verified By', 'Confidence'];
    const lines = [header.map(csvEscape).join(',')];
    for (const record of records) {
      const subject = subjectById.get(String(record.session_id)) || 'Class';
      lines.push([
        csvEscape(record.timestamp.toISOString().split('T')[0]),
        csvEscape(record.timestamp.toISOString().split('T')[1].slice(0, 5)),
        csvEscape(record.student_email),
        csvEscape(subject),
        csvEscape(record.status),
        csvEscape(record.verified_by),
        csvEscape(record.confidence != null ? Math.round(record.confidence * 100) + '%' : '')
      ].join(','));
    }

    const stamp = new Date().toISOString().slice(0, 10);
    const filename = `teacher_attendance_${stamp}.${format === 'xlsx' ? 'xls' : 'csv'}`;
    const contentType = format === 'xlsx'
      ? 'application/vnd.ms-excel'
      : 'text/csv';
    const content = format === 'xlsx'
      ? lines.join('\n').replace(/,/g, '\t').replace(/"/g, '')
      : lines.join('\n');

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(content);
  } catch (error) {
    reportInternalError(res, error, 'Teacher');
  }
});

// ─── POST /teacher/notifications/broadcast ───────────────────────────────
// Send a broadcast notification to students in this teacher's department.
// Falls back to all students when the teacher has no department set.
router.post('/notifications/broadcast', authenticate, requireRole('teacher'), async (req, res) => {
  try {
    const teacherEmail = req.userEmail;
    const { title, message, priority } = req.body || {};

    if (typeof message !== 'string' || !message.trim() || message.length > 1000) {
      return res.status(400).json({ detail: 'A message between 1 and 1000 characters is required.' });
    }
    if (title !== undefined && (typeof title !== 'string' || title.length > 120)) {
      return res.status(400).json({ detail: 'Title must be under 120 characters.' });
    }
    const resolvedPriority = ['Low', 'Normal', 'High', 'Critical'].includes(priority) ? priority : 'Normal';

    const teacher = await User.findOne({ email: teacherEmail }, 'department').lean();
    const audience = teacher && teacher.department
      ? await User.find({ role: 'student', department: teacher.department }, 'email').lean()
      : await User.find({ role: 'student' }, 'email').lean();

    if (audience.length === 0) {
      return res.json({ success: true, delivered: 0, message: 'No students found for this broadcast.' });
    }

    const finalTitle = (title || 'Classroom Announcement').trim();
    await Promise.all(
      audience.map((student) =>
        notificationService
          .createNotification(
            student.email,
            finalTitle,
            message.trim(),
            'announcement',
            resolvedPriority,
            { sender: teacherEmail }
          )
          .catch(() => {})
      )
    );

    try {
      await AttendanceAuditLog.create({
        actor_email: teacherEmail,
        role: req.userRole,
        action: 'BROADCAST_SENT',
        details: { recipients: audience.length, priority: resolvedPriority },
        ip_address: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
      });
    } catch (_) {}

    res.json({
      success: true,
      delivered: audience.length,
      title: finalTitle,
      priority: resolvedPriority
    });
  } catch (error) {
    reportInternalError(res, error, 'Teacher');
  }
});

// ─── Timetable CRUD (teacher-scoped) ─────────────────────────────────────
// GET /teacher/timetable — every slot taught by the signed-in teacher.
router.get('/timetable', authenticate, requireRole('teacher'), async (req, res) => {
  try {
    const slots = await Timetable.find({ teacher_email: req.userEmail })
      .sort({ day: 1, time: 1 })
      .lean();
    res.json(slots.map((slot) => {
      const obj = { ...slot, id: slot._id.toString() };
      delete obj._id;
      delete obj.__v;
      return obj;
    }));
  } catch (error) {
    reportInternalError(res, error, 'Teacher');
  }
});

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// POST /teacher/timetable — create a slot for the teacher's own timetable.
router.post('/timetable', authenticate, requireRole('teacher'), async (req, res) => {
  try {
    const { subject, day, time, room, user_id } = req.body || {};
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

    const entry = new Timetable({
      user_id: typeof user_id === 'string' && user_id.trim() ? user_id.trim().toUpperCase() : req.userEmail,
      subject: subject.trim(),
      day: day.trim(),
      time: time.trim(),
      room: typeof room === 'string' ? room.trim() : '',
      teacher_email: req.userEmail
    });
    await entry.save();

    try {
      await AttendanceAuditLog.create({
        actor_email: req.userEmail,
        role: req.userRole,
        action: 'TIMETABLE_SLOT_CREATED',
        details: { subject: entry.subject, day: entry.day, time: entry.time },
        ip_address: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
      });
    } catch (_) {}

    const obj = entry.toObject();
    obj.id = obj._id.toString();
    delete obj._id;
    delete obj.__v;
    res.status(201).json(obj);
  } catch (error) {
    reportInternalError(res, error, 'Teacher');
  }
});

// PUT /teacher/timetable/:id — update one of the teacher's own slots.
router.put('/timetable/:id', authenticate, requireRole('teacher'), async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ detail: 'Invalid timetable ID.' });
    }
    const slot = await Timetable.findOne({ _id: id, teacher_email: req.userEmail });
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

    const updated = await Timetable.findByIdAndUpdate(id, updates, { new: true }).lean();
    res.json({ success: true, slot: { ...updated, id: updated._id.toString() } });
  } catch (error) {
    reportInternalError(res, error, 'Teacher');
  }
});

// DELETE /teacher/timetable/:id — remove one of the teacher's own slots.
router.delete('/timetable/:id', authenticate, requireRole('teacher'), async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ detail: 'Invalid timetable ID.' });
    }
    const deleted = await Timetable.findOneAndDelete({ _id: id, teacher_email: req.userEmail });
    if (!deleted) {
      return res.status(404).json({ detail: 'Timetable slot not found or access denied.' });
    }

    try {
      await AttendanceAuditLog.create({
        actor_email: req.userEmail,
        role: req.userRole,
        action: 'TIMETABLE_SLOT_DELETED',
        details: { slot_id: id, subject: deleted.subject },
        ip_address: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
      });
    } catch (_) {}

    res.json({ success: true, message: 'Timetable slot deleted successfully.', deleted_id: id });
  } catch (error) {
    reportInternalError(res, error, 'Teacher');
  }
});

module.exports = router;