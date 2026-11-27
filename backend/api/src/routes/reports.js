const express = require('express');
const router = express.Router();

const crypto = require('crypto');
const Attendance = require('../models/Attendance');
const Session = require('../models/Session');
const User = require('../models/User');
const AttendanceAnalytics = require('../models/AttendanceAnalytics');
const { authenticate, requireRole } = require('../middleware/auth');
const { resolveAdminTenant, buildTenantUserFilter, isSameTenant } = require('../utils/tenantScope');
const { getStudentAttendanceSummary, getStudentAttendanceHistory } = require('../services/studentAttendanceService');
const { authorizeWardAccess } = require('../services/guardianService');

// Escape a value for safe CSV embedding.
function csvCell(val) {
  const s = (val === null || val === undefined) ? '' : String(val);
  return '"' + s.replace(/"/g, '""') + '"';
}

function escapeHtml(val) {
  return String(val ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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

// GET /reports/student/:email - comprehensive student attendance report
router.get('/student/:email', authenticate, async (req, res) => {
  try {
    const email = req.params.email.trim().toLowerCase();
    const format = String(req.query.format || 'json').toLowerCase();
    const reportType = String(req.query.type || 'overall').toLowerCase();

    const isSelf = req.userEmail && req.userEmail.toLowerCase() === email;
    const isStaff = req.userRole && ['admin', 'teacher', 'hod', 'principal', 'management', 'super_admin'].includes(req.userRole.toLowerCase());
    let isAuthorizedParent = false;
    if (!isSelf && !isStaff && (req.userRole || '').toLowerCase() === 'parent') {
      const authz = await authorizeWardAccess(req, email, 'download_reports');
      isAuthorizedParent = authz.allowed;
    }
    if (!isSelf && !isStaff && !isAuthorizedParent) {
      return res.status(403).json({ detail: 'Forbidden: cannot access this student report.' });
    }

    const [summary, history] = await Promise.all([
      getStudentAttendanceSummary(email),
      getStudentAttendanceHistory(email, { ...req.query, limit: 200, page: 1 }),
    ]);

    if (!summary || !history) {
      return res.status(404).json({ detail: 'Student not found' });
    }

    const reportId = `RPT-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const generatedAt = new Date().toISOString();
    const disclaimer = 'Student-generated attendance report for informational tracking — not an institution-certified official transcript.';

    const rows = history.records.map((r) => [
      r.date,
      r.time,
      r.subject,
      r.subject_code || '-',
      r.faculty_name || '-',
      r.room || '-',
      r.verified_by,
      r.status,
      r.correction_status || '-',
      r.receipt_id,
    ]);

    if (format === 'html') {
      res.set('Content-Type', 'text/html; charset=utf-8');
      const subjectRowsHtml = summary.subjects.map((s) => `
        <tr>
          <td>${escapeHtml(s.subject)}</td>
          <td>${s.attended}/${s.conducted}</td>
          <td>${s.percentage}%</td>
          <td>${s.eligible ? 'Eligible' : 'Shortage'}</td>
        </tr>`).join('');
      const recordRowsHtml = rows.map((r) => `
        <tr>${r.map((c) => `<td>${escapeHtml(c)}</td>`).join('')}</tr>`).join('');
      return res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Attendance Report ${reportId}</title>
        <style>body{font-family:Arial,sans-serif;padding:24px;color:#111}h1{margin:0 0 4px}table{width:100%;border-collapse:collapse;margin:16px 0}th,td{border:1px solid #ddd;padding:6px 8px;font-size:12px;text-align:left}th{background:#f3f4f6}.meta{font-size:12px;color:#444;margin-bottom:12px}.note{font-size:11px;color:#666;border-top:1px solid #ddd;padding-top:8px;margin-top:20px}</style>
      </head><body>
        <h1>SmartFace Attendance Report (${escapeHtml(reportType.toUpperCase())})</h1>
        <div class="meta">Report Ref: ${reportId} · Generated: ${generatedAt}<br>
        Student: ${escapeHtml(summary.student.name)} (${escapeHtml(summary.student.student_id || summary.student.email)}) · Institution: ${escapeHtml(summary.student.college || 'SmartFace Campus')} · Semester: ${escapeHtml(summary.student.semester)}<br>
        Overall: ${summary.overall_attendance ?? 0}% (${summary.total_present}/${summary.total_conducted} conducted)</div>
        <h3>Subject Breakdown</h3>
        <table><thead><tr><th>Subject</th><th>Attended/Conducted</th><th>Percentage</th><th>Status</th></tr></thead><tbody>${subjectRowsHtml || '<tr><td colspan="4">No subjects</td></tr>'}</tbody></table>
        <h3>Attendance Ledger (${rows.length} records)</h3>
        <table><thead><tr><th>Date</th><th>Time</th><th>Subject</th><th>Code</th><th>Faculty</th><th>Room</th><th>Method</th><th>Status</th><th>Correction</th><th>Ref ID</th></tr></thead><tbody>${recordRowsHtml || '<tr><td colspan="10">No records</td></tr>'}</tbody></table>
        <p class="note">${escapeHtml(disclaimer)}</p>
      </body></html>`);
    }

    return sendTabular(
      res,
      format,
      `attendance_${reportType}_${summary.student.student_id || 'student'}`,
      ['Date', 'Time', 'Subject', 'Subject Code', 'Faculty', 'Room', 'Verified By', 'Status', 'Correction Status', 'Reference ID'],
      rows,
      {
        report_id: reportId,
        report_type: reportType,
        generated_at: generatedAt,
        disclaimer,
        student: summary.student,
        period: {
          start_date: req.query.start_date || 'All time',
          end_date: req.query.end_date || 'Current',
          semester: req.query.semester || summary.student.semester,
        },
        summary: {
          overall_percentage: summary.overall_attendance,
          attended: summary.total_present,
          conducted: summary.total_conducted,
          missed: summary.total_missed,
          late: summary.total_late,
          excused: summary.total_excused,
          cancelled: summary.total_cancelled,
          eligible: summary.eligible,
        },
        subjects: summary.subjects,
        records_count: rows.length,
        rows,
        records: history.records,
      }
    );
  } catch (error) {
    res.status(500).json({ detail: 'Unable to generate attendance report.' });
  }
});

// GET /reports/class/:sessionId - roster of a class session
  router.get('/class/:sessionId', authenticate, requireRole(['admin', 'super_admin', 'teacher', 'hod', 'principal', 'management']), async (req, res) => {
    try {
      const { sessionId } = req.params;
      const format = req.query.format || 'json';

      const session = await Session.findById(sessionId).select('subject teacher_id college_id').lean().catch(() => null);
      if (!session) {
        return res.status(404).json({ detail: 'Class session not found.' });
      }
      const tenant = await resolveAdminTenant(req);
      if (!isSameTenant(tenant, { college_id: session.college_id })) {
        return res.status(403).json({ detail: 'Forbidden: Cross-institution class report access denied.' });
      }
      if (String(req.userRole || '').toLowerCase() === 'teacher' && String(session.teacher_id || '').toLowerCase() !== String(req.userEmail || '').toLowerCase()) {
        return res.status(403).json({ detail: 'Forbidden: You can only export reports for your own sessions.' });
      }
      const records = await Attendance.find({ session_id: sessionId })
        .select('student_email status verified_by timestamp')
        .lean();

      const emails = [...new Set(records.map((r) => String(r.student_email || '').toLowerCase()).filter(Boolean))];
      const students = emails.length > 0
        ? await User.find({ email: { $in: emails } }, 'email full_name student_id').lean()
        : [];
      const studentMap = new Map(students.map((s) => [s.email.toLowerCase(), s]));

      const rows = records.map((rec) => {
        const student = studentMap.get(String(rec.student_email || '').toLowerCase());
        const timeStr = rec.timestamp ? new Date(rec.timestamp).toISOString().split('T')[1].substring(0, 5) : '--:--';
        return [
          student ? student.full_name : rec.student_email,
          student ? (student.student_id || '') : '',
          rec.status,
          rec.verified_by,
          timeStr,
        ];
      });

      return sendTabular(
        res,
        format,
        `class_${sessionId}`,
        ['Student', 'Student ID', 'Status', 'Verified By', 'Time'],
        rows,
        { session: session ? session.subject : sessionId, present_count: rows.length, rows }
      );
    } catch (error) {
      res.status(500).json({ detail: 'Unable to generate class report.' });
    }
  });

  // GET /reports/department/:dept - department attendance summary
    router.get('/department/:dept', authenticate, requireRole(['admin', 'super_admin', 'hod', 'principal', 'management']), async (req, res) => {
      try {
        const { dept } = req.params;
        const format = req.query.format || 'json';

        const tenant = await resolveAdminTenant(req);
        const students = await User.find(buildTenantUserFilter(tenant, { role: 'student', department: dept }))
          .select('email full_name student_id semester')
          .lean();
        const emails = students.map((s) => String(s.email || '').toLowerCase()).filter(Boolean);
        const analyticsDocs = emails.length > 0
          ? await AttendanceAnalytics.find(
            { student_email: { $in: emails } },
            'student_email health_score standing'
          ).lean()
          : [];
        const analyticsMap = new Map(analyticsDocs.map((a) => [a.student_email.toLowerCase(), a]));

        const rows = students.map((s) => {
          const analytics = analyticsMap.get(String(s.email || '').toLowerCase());
          return [
            s.full_name,
            s.student_id || '',
            s.semester || '',
            analytics ? `${analytics.health_score}%` : 'N/A',
            analytics ? analytics.standing : 'No Data',
          ];
        });

        return sendTabular(
          res,
          format,
          `department_${dept.replace(/\s+/g, '_')}`,
          ['Student', 'Student ID', 'Semester', 'Health Score', 'Standing'],
          rows,
          { department: dept, student_count: rows.length, rows }
        );
      } catch (error) {
        res.status(500).json({ detail: 'Unable to generate department report.' });
      }
    });

    module.exports = router;
