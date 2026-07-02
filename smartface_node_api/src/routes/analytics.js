/*
|--------------------------------------------------------------------------
| File: analytics.js
|--------------------------------------------------------------------------
| Project: SmartFace AI v1.1
|
| Purpose:
| Advanced Analytics endpoints. All routes are read-only and require
| authentication. Admin/teacher-scoped routes enforce role checks.
|
| Endpoints:
|   GET  /analytics/trends             – Monthly attendance rate (last 6 months)
|   GET  /analytics/risk-students      – Students below 75% attendance
|   GET  /analytics/department-comparison – Avg attendance grouped by department
|   GET  /analytics/subject-wise       – Avg attendance grouped by subject
|   GET  /analytics/heatmap            – Daily check-in frequency (last 30 days)
|   GET  /analytics/export             – CSV export of analytics summary
|--------------------------------------------------------------------------
*/

'use strict';

const express = require('express');
const router = express.Router();

const Attendance  = require('../models/Attendance');
const Session     = require('../models/Session');
const User        = require('../models/User');

const { authenticate, requireRole } = require('../middleware/auth');

// ─── Utility ─────────────────────────────────────────────────────────────────

/**
 * Clamp to the start of a UTC day.
 * @param {Date} d
 * @returns {Date}
 */
const startOfDay = (d) => {
  const out = new Date(d);
  out.setUTCHours(0, 0, 0, 0);
  return out;
};

/**
 * Return a Date N calendar months before `from`.
 * @param {Date} from
 * @param {number} months
 * @returns {Date}
 */
const monthsAgo = (from, months) => {
  const d = new Date(from);
  d.setUTCMonth(d.getUTCMonth() - months);
  d.setUTCDate(1);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

// ─── GET /analytics/trends ───────────────────────────────────────────────────
/**
 * Monthly attendance rate for the last 6 months.
 * - Admin/Teacher: institution-wide.
 * - Student: own records only.
 *
 * Response:
 *   { trends: [{ month: "2025-01", rate: 0.87 }, …] }
 */
router.get('/trends', authenticate, async (req, res) => {
  try {
    const now      = new Date();
    const since    = monthsAgo(now, 6);
    const { role, userEmail } = req;

    // Match clause: students see only their own records
    const matchStage = {
      $match: {
        timestamp: { $gte: since },
        ...(role === 'student' ? { student_email: userEmail } : {}),
      },
    };

    const pipeline = [
      matchStage,
      {
        $group: {
          _id: {
            year:  { $year:  '$timestamp' },
            month: { $month: '$timestamp' },
          },
          total:   { $sum: 1 },
          present: {
            $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] },
          },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      {
        $project: {
          _id: 0,
          month: {
            $concat: [
              { $toString: '$_id.year' },
              '-',
              {
                $cond: [
                  { $lt: ['$_id.month', 10] },
                  { $concat: ['0', { $toString: '$_id.month' }] },
                  { $toString: '$_id.month' },
                ],
              },
            ],
          },
          rate: {
            $cond: [
              { $eq: ['$total', 0] },
              0,
              { $divide: ['$present', '$total'] },
            ],
          },
          total: 1,
          present: 1,
        },
      },
    ];

    const trends = await Attendance.aggregate(pipeline);
    return res.json({ trends });
  } catch (err) {
    console.error('[Analytics] /trends error:', err);
    return res.status(500).json({ detail: 'Failed to compute attendance trends.' });
  }
});

// ─── GET /analytics/risk-students ────────────────────────────────────────────
/**
 * List students whose overall attendance is below 75%.
 * Requires admin or teacher role.
 *
 * Query params:
 *   threshold  – override default 0.75 (e.g. ?threshold=0.6)
 *   department – optional filter by department name
 *
 * Response:
 *   { riskStudents: [{ email, name, department, attendanceRate }] }
 */
router.get(
  '/risk-students',
  authenticate,
  requireRole(['admin', 'teacher']),
  async (req, res) => {
    try {
      const threshold  = Math.min(
        1,
        Math.max(0, parseFloat(req.query.threshold) || 0.75)
      );
      const department = req.query.department;

      const pipeline = [
        {
          $group: {
            _id:     '$student_email',
            total:   { $sum: 1 },
            present: {
              $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] },
            },
          },
        },
        {
          $project: {
            _id: 0,
            email: '$_id',
            total: 1,
            present: 1,
            attendanceRate: {
              $cond: [
                { $eq: ['$total', 0] },
                0,
                { $divide: ['$present', '$total'] },
              ],
            },
          },
        },
        { $match: { attendanceRate: { $lt: threshold } } },
        { $sort: { attendanceRate: 1 } },
      ];

      const rawRisks = await Attendance.aggregate(pipeline);

      // Enrich with user metadata
      const emails = rawRisks.map((r) => r.email);
      const userQuery = { email: { $in: emails }, role: 'student' };
      if (department) userQuery.department = department;

      const users = await User.find(userQuery, 'email full_name department').lean();
      const userMap = {};
      for (const u of users) userMap[u.email] = u;

      const riskStudents = rawRisks
        .filter((r) => userMap[r.email]) // drop emails without a matching user doc
        .map((r) => ({
          email:          r.email,
          name:           userMap[r.email].full_name,
          department:     userMap[r.email].department || 'N/A',
          attendanceRate: parseFloat(r.attendanceRate.toFixed(4)),
        }));

      return res.json({ riskStudents, threshold });
    } catch (err) {
      console.error('[Analytics] /risk-students error:', err);
      return res.status(500).json({ detail: 'Failed to compute risk students.' });
    }
  }
);

// ─── GET /analytics/department-comparison ─────────────────────────────────────
/**
 * Average attendance rate grouped by department.
 * Requires admin or teacher role.
 *
 * Response:
 *   { departments: [{ department, averageRate, studentCount }] }
 */
router.get(
  '/department-comparison',
  authenticate,
  requireRole(['admin', 'teacher']),
  async (req, res) => {
    try {
      // Aggregate per student first, then group by department
      const studentRates = await Attendance.aggregate([
        {
          $group: {
            _id:     '$student_email',
            total:   { $sum: 1 },
            present: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } },
          },
        },
        {
          $project: {
            email: '$_id',
            rate:  { $divide: ['$present', { $max: ['$total', 1] }] },
          },
        },
      ]);

      const emails  = studentRates.map((s) => s.email);
      const users   = await User.find({ email: { $in: emails }, role: 'student' }, 'email department').lean();
      const deptMap = {};
      for (const u of users) deptMap[u.email] = u.department || 'Unknown';

      // Accumulate by department
      const deptAcc = {};
      for (const s of studentRates) {
        const dept = deptMap[s.email] || 'Unknown';
        if (!deptAcc[dept]) deptAcc[dept] = { sum: 0, count: 0 };
        deptAcc[dept].sum   += s.rate;
        deptAcc[dept].count += 1;
      }

      const departments = Object.entries(deptAcc)
        .map(([department, { sum, count }]) => ({
          department,
          averageRate:  parseFloat((sum / count).toFixed(4)),
          studentCount: count,
        }))
        .sort((a, b) => b.averageRate - a.averageRate);

      return res.json({ departments });
    } catch (err) {
      console.error('[Analytics] /department-comparison error:', err);
      return res.status(500).json({ detail: 'Failed to compute department comparison.' });
    }
  }
);

// ─── GET /analytics/subject-wise ─────────────────────────────────────────────
/**
 * Average attendance rate grouped by subject (from Session.subject).
 * Requires admin or teacher role.
 *
 * Response:
 *   { subjects: [{ subject, averageRate, totalSessions, totalPresent }] }
 */
router.get(
  '/subject-wise',
  authenticate,
  requireRole(['admin', 'teacher']),
  async (req, res) => {
    try {
      // Join Attendance → Session via session_id to get subject
      const pipeline = [
        {
          $addFields: {
            sessionObjId: { $toObjectId: '$session_id' },
          },
        },
        {
          $lookup: {
            from:         'sessions',
            localField:   'sessionObjId',
            foreignField: '_id',
            as:           'sessionDoc',
          },
        },
        { $unwind: '$sessionDoc' },
        {
          $group: {
            _id:     '$sessionDoc.subject',
            total:   { $sum: 1 },
            present: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } },
          },
        },
        {
          $project: {
            _id: 0,
            subject:       '$_id',
            totalSessions: '$total',
            totalPresent:  '$present',
            averageRate: {
              $cond: [
                { $eq: ['$total', 0] },
                0,
                { $divide: ['$present', '$total'] },
              ],
            },
          },
        },
        { $sort: { subject: 1 } },
      ];

      const subjects = await Attendance.aggregate(pipeline);
      return res.json({ subjects });
    } catch (err) {
      console.error('[Analytics] /subject-wise error:', err);
      return res.status(500).json({ detail: 'Failed to compute subject-wise analytics.' });
    }
  }
);

// ─── GET /analytics/heatmap ──────────────────────────────────────────────────
/**
 * Daily check-in frequency for the last 30 days.
 * Admin/Teacher: all students. Student: own only.
 *
 * Response:
 *   { heatmap: [{ date: "2025-01-15", count: 34 }] }
 */
router.get('/heatmap', authenticate, async (req, res) => {
  try {
    const now   = new Date();
    const since = new Date(now);
    since.setUTCDate(since.getUTCDate() - 30);
    startOfDay(since);

    const { role, userEmail } = req;

    const matchStage = {
      $match: {
        timestamp: { $gte: since },
        status:    'Present',
        ...(role === 'student' ? { student_email: userEmail } : {}),
      },
    };

    const pipeline = [
      matchStage,
      {
        $group: {
          _id: {
            year:  { $year:  '$timestamp' },
            month: { $month: '$timestamp' },
            day:   { $dayOfMonth: '$timestamp' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
      {
        $project: {
          _id: 0,
          date: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: {
                $dateFromParts: {
                  year:  '$_id.year',
                  month: '$_id.month',
                  day:   '$_id.day',
                },
              },
            },
          },
          count: 1,
        },
      },
    ];

    const heatmap = await Attendance.aggregate(pipeline);
    return res.json({ heatmap });
  } catch (err) {
    console.error('[Analytics] /heatmap error:', err);
    return res.status(500).json({ detail: 'Failed to compute heatmap data.' });
  }
});

// ─── GET /analytics/export ───────────────────────────────────────────────────
/**
 * CSV export of all-time attendance summary per student.
 * Requires admin role.
 *
 * Response: text/csv stream
 *   email,name,department,totalSessions,present,absent,attendanceRate
 */
router.get(
  '/export',
  authenticate,
  requireRole(['admin']),
  async (req, res) => {
    try {
      // Aggregate per student
      const rows = await Attendance.aggregate([
        {
          $group: {
            _id:     '$student_email',
            total:   { $sum: 1 },
            present: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } },
          },
        },
        {
          $project: {
            _id:    0,
            email:  '$_id',
            total:  1,
            present: 1,
            absent: { $subtract: ['$total', '$present'] },
            rate:   { $divide: ['$present', { $max: ['$total', 1] }] },
          },
        },
        { $sort: { email: 1 } },
      ]);

      const emails = rows.map((r) => r.email);
      const users  = await User.find(
        { email: { $in: emails } },
        'email full_name department'
      ).lean();
      const userMap = {};
      for (const u of users) userMap[u.email] = u;

      // Build CSV in-memory (analytics export — not expected to exceed a few MBs)
      const header = 'email,name,department,totalSessions,present,absent,attendanceRate\n';
      const csvRows = rows.map((r) => {
        const u = userMap[r.email] || {};
        const name = (u.full_name || '').replace(/,/g, ' ');
        const dept = (u.department || 'N/A').replace(/,/g, ' ');
        return `${r.email},${name},${dept},${r.total},${r.present},${r.absent},${r.rate.toFixed(4)}`;
      });

      const csv = header + csvRows.join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="smartface_analytics_${Date.now()}.csv"`
      );
      return res.send(csv);
    } catch (err) {
      console.error('[Analytics] /export error:', err);
      return res.status(500).json({ detail: 'Failed to export analytics CSV.' });
    }
  }
);

module.exports = router;
