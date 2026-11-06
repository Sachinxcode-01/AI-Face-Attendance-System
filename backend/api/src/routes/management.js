const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const User = require('../models/User');
const Session = require('../models/Session');
const Attendance = require('../models/Attendance');
const SecurityLog = require('../models/SecurityLog');
const Leave = require('../models/Leave');
const { authenticate, requireRole } = require('../middleware/auth');
const reportInternalError = require('../utils/httpError');

// Helper: Resolve HOD Department if not provided
const resolveDepartment = async (req) => {
  if (req.userRole && req.userRole.toLowerCase() === 'hod') {
    const user = await User.findOne({ email: req.userEmail });
    return user ? user.department : null;
  }
  return req.query.dept || null;
};

// ─── GET /management/hod/summary ──────────────────────────────────
router.get('/hod/summary', authenticate, requireRole(['hod', 'principal', 'management', 'admin', 'super_admin']), async (req, res) => {
  try {
    const departmentName = await resolveDepartment(req);
    if (!departmentName) {
      return res.status(400).json({ detail: "Department could not be resolved." });
    }

    // Dynamic CSE/ECE database aggregation:
    // Get students in this department
    const students = await User.find({ department: departmentName, role: 'student' }).select('email');
    const studentEmails = students.map(s => s.email);

    let dbAttendanceRate = 0;
    let dbAtRiskCount = 0;
    let totalAttendance = 0;
    let presentAttendance = 0;

    if (studentEmails.length > 0) {
      // Calculate attendance rate
      const attendanceAgg = await Attendance.aggregate([
        { $match: { student_email: { $in: studentEmails } } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            present: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } }
          }
        }
      ]);
      if (attendanceAgg.length > 0 && attendanceAgg[0].total > 0) {
        totalAttendance = attendanceAgg[0].total;
        presentAttendance = attendanceAgg[0].present;
        dbAttendanceRate = Math.round((attendanceAgg[0].present / attendanceAgg[0].total) * 1000) / 10;
      }

      // Count at risk
      const riskAgg = await Attendance.aggregate([
        { $match: { student_email: { $in: studentEmails } } },
        {
          $group: {
            _id: '$student_email',
            total: { $sum: 1 },
            present: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } }
          }
        },
        {
          $project: {
            rate: { $multiply: [{ $divide: ['$present', '$total'] }, 100] }
          }
        },
        { $match: { rate: { $lt: 75.0 } } },
        { $count: 'count' }
      ]);
      if (riskAgg.length > 0) {
        dbAtRiskCount = riskAgg[0].count;
      }
    }

    const teachers = await User.find({ department: departmentName, role: 'teacher' }).lean();
    const teacherEmails = teachers.map((teacher) => teacher.email);
    const [activeClasses, teacherSessionCounts] = await Promise.all([
      Session.countDocuments({ is_active: true, teacher_id: { $in: teacherEmails } }),
      Session.aggregate([
        { $match: { teacher_id: { $in: teacherEmails } } },
        { $group: { _id: '$teacher_id', conducted: { $sum: 1 } } },
      ]),
    ]);
    const sessionsByTeacher = new Map(teacherSessionCounts.map((row) => [row._id, row.conducted]));
    const facultySessions = teachers.map((teacher) => ({
      name: teacher.full_name,
      subject: teacher.specialization || null,
      scheduled: 0,
      conducted: sessionsByTeacher.get(teacher.email) || 0,
      compliance: null,
    }));

    const trendStart = new Date();
    trendStart.setUTCHours(0, 0, 0, 0);
    trendStart.setUTCDate(trendStart.getUTCDate() - 4);
    const dailyRows = await Attendance.aggregate([
      { $match: { student_email: { $in: studentEmails }, timestamp: { $gte: trendStart } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } },
        },
      },
    ]);
    const dailyByDate = new Map(dailyRows.map((row) => [row._id, row]));
    const dailyTrend = Array.from({ length: 5 }, (_, index) => {
      const day = new Date(trendStart.getTime() + index * 24 * 60 * 60 * 1000);
      const key = day.toISOString().slice(0, 10);
      const row = dailyByDate.get(key);
      return {
        day: day.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }),
        date: key,
        rate: row ? Math.round((row.present / row.total) * 1000) / 10 : 0,
        total: row?.total || 0,
        present: row?.present || 0,
      };
    });

    res.json({
      department: departmentName,
      attendance_rate: dbAttendanceRate,
      active_classes: activeClasses,
      faculty_sessions: facultySessions,
      daily_trend: dailyTrend,
      at_risk_count: dbAtRiskCount,
      attendance_total: totalAttendance,
      attendance_present: presentAttendance,
      weekly_streak: 0,
    });

  } catch (error) {
    reportInternalError(res, error, 'Management');
  }
});

// ─── GET /management/principal/summary ─────────────────────────────
router.get('/principal/summary', authenticate, requireRole(['principal', 'management', 'admin', 'super_admin']), async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalFaculty = await User.countDocuments({ role: 'teacher' });
    const activeClasses = await Session.countDocuments({ is_active: true });

    // Overall check-in rate
    let institutionAttendance = 0;
    const allAttendance = await Attendance.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } }
        }
      }
    ]);
    if (allAttendance.length > 0 && allAttendance[0].total > 0) {
      institutionAttendance = Math.round((allAttendance[0].present / allAttendance[0].total) * 1000) / 10;
    }

    const studentDepartments = await User.distinct('department', {
      role: 'student',
      department: { $exists: true, $nin: ['', null] },
    });
    const studentsByDepartment = await User.find(
      { role: 'student', department: { $in: studentDepartments } },
      'email department'
    ).lean();
    const departmentEmails = new Map();
    for (const student of studentsByDepartment) {
      const emails = departmentEmails.get(student.department) || [];
      emails.push(student.email);
      departmentEmails.set(student.department, emails);
    }
    const deptComparison = {};
    for (const [department, emails] of departmentEmails) {
      const [summary] = await Attendance.aggregate([
        { $match: { student_email: { $in: emails } } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            present: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } },
          },
        },
      ]);
      deptComparison[department] = summary?.total
        ? Math.round((summary.present / summary.total) * 1000) / 10
        : 0;
    }

    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);
    monthStart.setUTCMonth(monthStart.getUTCMonth() - 4);
    const monthlyRows = await Attendance.aggregate([
      { $match: { timestamp: { $gte: monthStart } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$timestamp' } },
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } },
        },
      },
    ]);
    const monthlyById = new Map(monthlyRows.map((row) => [row._id, row]));
    const monthlyGrowth = Array.from({ length: 5 }, (_, index) => {
      const month = new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + index, 1));
      const key = month.toISOString().slice(0, 7);
      const row = monthlyById.get(key);
      return {
        month: month.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }),
        rate: row ? Math.round((row.present / row.total) * 1000) / 10 : 0,
        total: row?.total || 0,
      };
    });

    // Critical Alerts
    const [securityLogs, pendingLeaves] = await Promise.all([
      SecurityLog.find({ status: 'Active' }).sort({ timestamp: -1 }).limit(5).lean(),
      Leave.find({ status: 'Pending' }).sort({ created_at: -1 }).limit(5).lean(),
    ]);
    const criticalAlerts = [];
    for (const log of securityLogs) {
      criticalAlerts.push({
        id: log._id.toString(),
        level: 'Critical',
        title: 'Security alert',
        detail: log.location,
        time: log.timestamp?.toISOString() || null,
      });
    }
    for (const leave of pendingLeaves) {
      criticalAlerts.push({
        id: leave._id.toString(),
        level: 'Warning',
        title: 'Pending leave request',
        detail: leave.user_id,
        time: leave.created_at?.toISOString() || null,
      });
    }

    res.json({
      total_students: totalStudents,
      total_faculty: totalFaculty,
      active_classes: activeClasses,
      institution_attendance: institutionAttendance,
      monthly_growth: monthlyGrowth,
      department_comparison: deptComparison,
      critical_alerts: criticalAlerts
    });

  } catch (error) {
    reportInternalError(res, error, 'Management');
  }
});

// ─── GET /management/health-score ─────────────────────────────────
router.get('/health-score', authenticate, requireRole(['principal', 'management', 'admin', 'super_admin']), async (req, res) => {
  try {
    // Aggregated Health Score
    // Attendance rate (50%)
    let attScore = 0;
    const allAttendance = await Attendance.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } }
        }
      }
    ]);
    if (allAttendance.length > 0 && allAttendance[0].total > 0) {
      attScore = (allAttendance[0].present / allAttendance[0].total) * 100;
    }

    // Security (20%) - derived from absence of security alerts (e.g. 100 - intruder count)
    const securityLogsCount = await SecurityLog.countDocuments({ status: 'Active' });
    const securityScore = Math.max(100 - (securityLogsCount * 2), 60);

    // Leave compliance counts only requests that have reached a decision.
    const leavesTotal = await Leave.countDocuments({});
    const leavesResolved = await Leave.countDocuments({ status: { $in: ['Approved', 'Rejected'] } });
    const leaveComplianceScore = leavesTotal > 0 ? (leavesResolved / leavesTotal) * 100 : 0;

    const teachers = await User.find({ role: 'teacher' }, 'email').lean();
    const teacherEmails = teachers.map((teacher) => teacher.email);
    const engagedTeachers = teacherEmails.length
      ? await Session.distinct('teacher_id', { teacher_id: { $in: teacherEmails } })
      : [];
    const facultyEngagementScore = teacherEmails.length
      ? (engagedTeachers.length / teacherEmails.length) * 100
      : 0;

    const hasHealthData = allAttendance[0]?.total > 0 || leavesTotal > 0 || teacherEmails.length > 0 || securityLogsCount > 0;
    const healthScore = hasHealthData ? Math.round((
      (attScore * 0.5) +
      (securityScore * 0.2) +
      (leaveComplianceScore * 0.15) +
      (facultyEngagementScore * 0.15)
    ) * 10) / 10 : 0;

    const departments = await User.distinct('department', {
      role: 'student',
      department: { $exists: true, $nin: ['', null] },
    });
    const students = await User.find(
      { role: 'student', department: { $in: departments } },
      'email department'
    ).lean();
    const emailsByDepartment = new Map();
    for (const student of students) {
      const emails = emailsByDepartment.get(student.department) || [];
      emails.push(student.email);
      emailsByDepartment.set(student.department, emails);
    }
    const departmentRankings = [];
    for (const [department, emails] of emailsByDepartment) {
      const [summary] = await Attendance.aggregate([
        { $match: { student_email: { $in: emails } } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            present: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } },
          },
        },
      ]);
      departmentRankings.push({
        department,
        rate: summary?.total ? Math.round((summary.present / summary.total) * 1000) / 10 : 0,
        change: null,
      });
    }
    departmentRankings.sort((a, b) => b.rate - a.rate);
    departmentRankings.forEach((department, index) => { department.rank = index + 1; });
    const facultyCompliance = [];

    res.json({
      health_score: healthScore,
      breakdown: {
        attendance: { weight: 50, score: Math.round(attScore * 10) / 10 },
        security: { weight: 20, score: Math.round(securityScore * 10) / 10 },
        leave_compliance: { weight: 15, score: Math.round(leaveComplianceScore * 10) / 10 },
        faculty_engagement: { weight: 15, score: Math.round(facultyEngagementScore * 10) / 10 }
      },
      department_rankings: departmentRankings,
      faculty_compliance: facultyCompliance
    });

  } catch (error) {
    reportInternalError(res, error, 'Management');
  }
});

// ─── GET /management/risk/critical ──────────────────────────────────
router.get('/risk/critical', authenticate, requireRole(['hod', 'principal', 'management', 'admin', 'super_admin']), async (req, res) => {
  try {
    const departmentName = await resolveDepartment(req);
    if (req.userRole?.toLowerCase() === 'hod' && !departmentName) {
      return res.status(400).json({ detail: 'Department could not be resolved.' });
    }

    // Fetch department students
    const query = { role: 'student' };
    if (departmentName && req.userRole && req.userRole.toLowerCase() === 'hod') {
      query.department = departmentName;
    }

    const students = await User.find(query, 'email full_name student_id usn').lean();
    const studentEmails = students.map(s => s.email);

    const below_75 = [];
    const below_60 = [];
    const long_absences = [];
    const [attendanceData = { counts: [], recent: [] }] = studentEmails.length
      ? await Attendance.aggregate([
          { $match: { student_email: { $in: studentEmails } } },
          {
            $facet: {
              counts: [
                {
                  $group: {
                    _id: '$student_email',
                    total: { $sum: 1 },
                    present: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } },
                  },
                },
              ],
              recent: [
                {
                  $setWindowFields: {
                    partitionBy: '$student_email',
                    sortBy: { timestamp: -1 },
                    output: { position: { $documentNumber: {} } },
                  },
                },
                { $match: { position: { $lte: 5 } } },
                { $sort: { student_email: 1, timestamp: -1 } },
                {
                  $group: {
                    _id: '$student_email',
                    logs: { $push: { status: '$status', timestamp: '$timestamp' } },
                  },
                },
              ],
            },
          },
        ])
      : [];
    const countsByEmail = new Map(attendanceData.counts.map((row) => [row._id, row]));
    const recentByEmail = new Map(attendanceData.recent.map((row) => [row._id, row.logs]));

    for (const student of students) {
      const attendance = countsByEmail.get(student.email);
      const totalSessions = attendance?.total || 0;
      if (!totalSessions) continue;

      const presentSessions = attendance.present || 0;
      const rate = Math.round((presentSessions / totalSessions) * 1000) / 10;
      const absences = totalSessions - presentSessions;

      const studentItem = {
        student_id: student.student_id || student.usn || "N/A",
        name: student.full_name,
        email: student.email,
        attendance: rate,
        absences,
        risk: rate < 60 ? "Critical" : "High"
      };

      if (rate < 60) {
        below_60.push(studentItem);
      } else if (rate < 75) {
        below_75.push(studentItem);
      }

      const lastLogs = recentByEmail.get(student.email) || [];
      let consecutive_absences = 0;
      for (const log of lastLogs) {
        if (log.status !== 'Present') {
          consecutive_absences++;
        } else {
          break;
        }
      }
      if (consecutive_absences >= 3) {
        long_absences.push({
          student_id: student.student_id || student.usn || "N/A",
          name: student.full_name,
          consecutive_days: consecutive_absences,
          last_active: lastLogs[consecutive_absences]?.timestamp?.toISOString().split('T')[0] || null,
          risk: "Critical"
        });
      }
    }

    res.json({
      below_75,
      below_60,
      long_absences
    });

  } catch (error) {
    reportInternalError(res, error, 'Management');
  }
});

// ─── GET /management/users ────────────────────────────────────────
router.get('/users', authenticate, requireRole(['admin', 'super_admin', 'hod', 'management', 'principal']), async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.role) {
      if (typeof req.query.role !== 'string') {
        return res.status(400).json({ detail: 'Invalid role filter.' });
      }
      query.role = req.query.role.toLowerCase();
    }
    if (req.userRole?.toLowerCase() === 'hod') {
      const staff = await User.findOne({ email: req.userEmail }, 'department').lean();
      if (!staff?.department) {
        return res.status(403).json({ detail: 'HOD department is not configured.' });
      }
      query.department = staff.department;
    } else if (req.query.department) {
      query.department = req.query.department;
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('email full_name role department student_id usn roll_number designation created_at')
      .skip(skip)
      .limit(limit)
      .sort({ created_at: -1 })
      .lean();

    const formattedUsers = users.map((user) => ({
      id: user._id.toString(),
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      department: user.department || null,
      student_id: user.student_id || user.usn || user.roll_number || null,
      designation: user.designation || null,
      created_at: user.created_at,
    }));

    res.json({
      success: true,
      total,
      page,
      limit,
      users: formattedUsers
    });
  } catch (error) {
    reportInternalError(res, error, 'Management');
  }
});

module.exports = router;
