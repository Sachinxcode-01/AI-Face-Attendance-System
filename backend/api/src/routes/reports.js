const express = require('express');
const router = express.Router();

const Attendance = require('../models/Attendance');
const Session = require('../models/Session');
const User = require('../models/User');
const AttendanceAnalytics = require('../models/AttendanceAnalytics');
const { authenticate, requireRole } = require('../middleware/auth');

// Escape a value for safe CSV embedding.
function csvCell(val) {
  const s = (val === null || val === undefined) ? '' : String(val);
  return '"' + s.replace(/"/g, '""') + '"';
}

// Stream rows in the requested tabular format (csv | excel) or JSON.
function sendTabular(res, format, filename, headers, rows, jsonPayload) {
  if (format === 'csv' || format === 'excel') {
    const sep = format === 'excel' ? '\t' : ',';
    const ext = format === 'excel' ? 'xls' : 'csv';
    const mime = format === 'excel' ? 'application/vnd.ms-excel' : 'text/csv';
    res.setHeader('Content-disposition', `attachment; filename=${filename}.${ext}`);
    res.set('Content-Type', mime);
    const lines = [headers.map(csvCell).join(sep)];
    for (const row of rows) {
      lines.push(row.map(csvCell).join(sep));
    }
    return res.send(lines.join('\n'));
  }
  return res.json(jsonPayload);
}

// GET /reports/student/:email - per-student attendance ledger
router.get('/student/:email', authenticate, async (req, res) => {
  try {
    const { email } = req.params;
    const format = req.query.format || 'json';

    const isSelf = req.userEmail && req.userEmail.toLowerCase() === email.toLowerCase();
    const isStaff = req.userRole && ['admin', 'teacher', 'hod', 'principal', 'management'].includes(req.userRole.toLowerCase());
    if (!isSelf && !isStaff) {
      return res.status(403).json({ detail: 'Forbidden: cannot access this student report.' });
    }

    const user = await User.findOne({ email }).lean();
    if (!user) return res.status(404).json({ detail: 'Student not found' });

    const records = await Attendance.find({ student_email: email }).sort({ timestamp: -1 }).lean();
    const rows = [];
    for (const rec of records) {
      const session = await Session.findById(rec.session_id).lean().catch(() => null);
      const dateStr = new Date(rec.timestamp).toISOString().split('T')[0];
      const timeStr = new Date(rec.timestamp).toISOString().split('T')[1].substring(0, 5);
      rows.push([dateStr, timeStr, session ? session.subject : 'Class', rec.verified_by, rec.status]);
    }

    return sendTabular(
      res,
      format,
      `attendance_${user.student_id || 'student'}`,
      ['Date', 'Time', 'Subject', 'Verified By', 'Status'],
      rows,
      { student: user.full_name, email: user.email, records_count: records.length, rows }
    );
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// GET /reports/class/:sessionId - roster of a class session
router.get('/class/:sessionId', authenticate, requireRole(['admin', 'teacher', 'hod', 'principal', 'management']), async (req, res) => {
  try {
    const { sessionId } = req.params;
    const format = req.query.format || 'json';

    const session = await Session.findById(sessionId).lean().catch(() => null);
    const records = await Attendance.find({ session_id: sessionId }).lean();

    const rows = [];
    for (const rec of records) {
      const student = await User.findOne({ email: rec.student_email }).lean().catch(() => null);
      const timeStr = new Date(rec.timestamp).toISOString().split('T')[1].substring(0, 5);
      rows.push([
        student ? student.full_name : rec.student_email,
        student ? (student.student_id || '') : '',
        rec.status,
        rec.verified_by,
        timeStr,
      ]);
    }

    return sendTabular(
      res,
      format,
      `class_${sessionId}`,
      ['Student', 'Student ID', 'Status', 'Verified By', 'Time'],
      rows,
      { session: session ? session.subject : sessionId, present_count: rows.length, rows }
    );
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// GET /reports/department/:dept - department attendance summary
router.get('/department/:dept', authenticate, requireRole(['admin', 'hod', 'principal', 'management']), async (req, res) => {
  try {
    const { dept } = req.params;
    const format = req.query.format || 'json';

    const students = await User.find({ role: 'student', department: dept }).lean();
    const rows = [];
    for (const s of students) {
      const analytics = await AttendanceAnalytics.findOne({ student_email: s.email }).lean().catch(() => null);
      rows.push([
        s.full_name,
        s.student_id || '',
        s.semester || '',
        analytics ? `${analytics.health_score}%` : 'N/A',
        analytics ? analytics.standing : 'No Data',
      ]);
    }

    return sendTabular(
      res,
      format,
      `department_${dept.replace(/\s+/g, '_')}`,
      ['Student', 'Student ID', 'Semester', 'Health Score', 'Standing'],
      rows,
      { department: dept, student_count: rows.length, rows }
    );
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

module.exports = router;
