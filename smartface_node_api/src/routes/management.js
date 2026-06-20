const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const User = require('../models/User');
const Session = require('../models/Session');
const Attendance = require('../models/Attendance');
const SecurityLog = require('../models/SecurityLog');
const Leave = require('../models/Leave');
const { authenticate, requireRole } = require('../middleware/auth');

// Helper: Resolve HOD Department if not provided
const resolveDepartment = async (req) => {
  if (req.userRole && req.userRole.toLowerCase() === 'hod') {
    const user = await User.findOne({ email: req.userEmail });
    return user ? user.department : null;
  }
  return req.query.dept || 'CSE';
};

// ─── GET /management/hod/summary ──────────────────────────────────
router.get('/hod/summary', authenticate, requireRole(['hod', 'principal', 'management', 'admin']), async (req, res) => {
  try {
    const departmentName = await resolveDepartment(req);
    if (!departmentName) {
      return res.status(400).json({ detail: "Department could not be resolved." });
    }

    // Dynamic CSE/ECE database aggregation:
    // Get students in this department
    const students = await User.find({ department: departmentName, role: 'student' }).select('email');
    const studentEmails = students.map(s => s.email);

    let dbAttendanceRate = 92.4; // fallback
    let dbActiveClassesCount = 4;
    let dbAtRiskCount = 2;

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

    const activeClasses = await Session.countDocuments({ is_active: true });
    if (activeClasses > 0) {
      dbActiveClassesCount = activeClasses;
    }

    // Faculty session logic (conducted / scheduled)
    const teachers = await User.find({ department: departmentName, role: 'teacher' }).lean();
    const facultySessions = teachers.map(t => {
      // Mock compliance calculation
      const scheduled = Math.floor(Math.random() * 10) + 15;
      const conducted = scheduled - Math.floor(Math.random() * 3);
      const compliance = Math.round((conducted / scheduled) * 1000) / 10;
      return {
        name: t.full_name,
        subject: t.specialization || 'Academic Course',
        scheduled,
        conducted,
        compliance
      };
    });

    if (facultySessions.length === 0) {
      facultySessions.push(
        { name: "Dr. Sarah Connor", subject: "Machine Learning", scheduled: 24, conducted: 23, compliance: 95.8 },
        { name: "Prof. Alan Turing", subject: "Theory of Computation", scheduled: 20, conducted: 20, compliance: 100.0 },
        { name: "Dr. Grace Hopper", subject: "Compiler Design", scheduled: 22, conducted: 19, compliance: 86.4 }
      );
    }

    // Weekly trend
    const dailyTrend = [
      { day: "Mon", rate: Math.round(dbAttendanceRate - 1.5) },
      { day: "Tue", rate: Math.round(dbAttendanceRate + 0.8) },
      { day: "Wed", rate: Math.round(dbAttendanceRate - 0.2) },
      { day: "Thu", rate: Math.round(dbAttendanceRate + 1.6) },
      { day: "Fri", rate: Math.round(dbAttendanceRate - 0.4) }
    ];

    res.json({
      department: departmentName,
      attendance_rate: dbAttendanceRate,
      weekly_streak: 12,
      active_classes: dbActiveClassesCount,
      faculty_sessions: facultySessions,
      daily_trend: dailyTrend,
      at_risk_count: dbAtRiskCount
    });

  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// ─── GET /management/principal/summary ─────────────────────────────
router.get('/principal/summary', authenticate, requireRole(['principal', 'management', 'admin']), async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalFaculty = await User.countDocuments({ role: 'teacher' });
    const activeClasses = await Session.countDocuments({ is_active: true });

    // Overall check-in rate
    let institutionAttendance = 89.5;
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

    // Department comparisons
    const departments = ['CSE', 'ECE', 'ME', 'Civil'];
    const deptComparison = {};
    for (const dept of departments) {
      const deptStudents = await User.find({ department: dept, role: 'student' }).select('email');
      const emails = deptStudents.map(s => s.email);
      if (emails.length > 0) {
        const deptAgg = await Attendance.aggregate([
          { $match: { student_email: { $in: emails } } },
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              present: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } }
            }
          }
        ]);
        if (deptAgg.length > 0 && deptAgg[0].total > 0) {
          deptComparison[dept] = Math.round((deptAgg[0].present / deptAgg[0].total) * 1000) / 10;
          continue;
        }
      }
      // Fallback
      deptComparison[dept] = dept === 'CSE' ? 92.4 : dept === 'ECE' ? 87.8 : dept === 'ME' ? 81.2 : 84.5;
    }

    // Monthly Growth widget
    const monthlyGrowth = [
      { month: "Jan", rate: 86.2 },
      { month: "Feb", rate: 87.5 },
      { month: "Mar", rate: 88.9 },
      { month: "Apr", rate: 89.1 },
      { month: "May", rate: institutionAttendance }
    ];

    // Critical Alerts
    const securityCount = await SecurityLog.countDocuments({});
    const pendingLeaves = await Leave.countDocuments({ status: "Pending" });
    const criticalAlerts = [];
    if (securityCount > 0) {
      criticalAlerts.push({
        id: "sec-alert",
        level: "Critical",
        title: "Intruder Alert Logged",
        detail: `${securityCount} security alerts detected in the validation checkpoints.`,
        time: "1 hour ago"
      });
    }
    if (pendingLeaves > 0) {
      criticalAlerts.push({
        id: "leave-alert",
        level: "Warning",
        title: "Pending Faculty Leaves",
        detail: `There are ${pendingLeaves} pending student leaves waiting review.`,
        time: "3 hours ago"
      });
    }

    if (criticalAlerts.length === 0) {
      criticalAlerts.push(
        { id: "1", level: "Critical", title: "Severe Low Attendance", detail: "Mechanical Eng. dropped below 75% average this week.", time: "2 hours ago" },
        { id: "2", level: "Warning", title: "Biometric Retraining Needed", detail: "8 students marked with low confidence face verification.", time: "5 hours ago" }
      );
    }

    res.json({
      total_students: totalStudents || 1247,
      total_faculty: totalFaculty || 86,
      active_classes: activeClasses || 18,
      institution_attendance: institutionAttendance,
      monthly_growth: monthlyGrowth,
      department_comparison: deptComparison,
      critical_alerts: criticalAlerts
    });

  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// ─── GET /management/health-score ─────────────────────────────────
router.get('/health-score', authenticate, requireRole(['principal', 'management', 'admin']), async (req, res) => {
  try {
    // Aggregated Health Score
    // Attendance rate (50%)
    let attScore = 89.5;
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
    const securityLogsCount = await SecurityLog.countDocuments({});
    const securityScore = Math.max(100 - (securityLogsCount * 2), 60);

    // Leave Compliance (15%) - approved vs rejected ratio or pending leave metrics
    const leavesTotal = await Leave.countDocuments({});
    const leavesPending = await Leave.countDocuments({ status: "Pending" });
    const leaveComplianceScore = leavesTotal > 0 ? ((leavesTotal - leavesPending) / leavesTotal) * 100 : 92.0;

    // Faculty Engagement (15%) - mock or based on conducted sessions
    const facultyEngagementScore = 88.5;

    const healthScore = Math.round((
      (attScore * 0.5) +
      (securityScore * 0.2) +
      (leaveComplianceScore * 0.15) +
      (facultyEngagementScore * 0.15)
    ) * 10) / 10;

    const departmentRankings = [
      { rank: 1, department: "Computer Science Eng.", rate: 92.4, change: 1.2 },
      { rank: 2, department: "Electronics & Comm. Eng.", rate: 87.8, change: -0.5 },
      { rank: 3, department: "Civil Engineering", rate: 84.5, change: 0.8 },
      { rank: 4, department: "Mechanical Engineering", rate: 81.2, change: -2.1 }
    ];

    const facultyCompliance = [
      { department: "CSE", compliance: 96.5 },
      { department: "ECE", compliance: 92.0 },
      { department: "Civil", compliance: 88.0 },
      { department: "ME", compliance: 85.2 }
    ];

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
    res.status(500).json({ detail: error.message });
  }
});

// ─── GET /management/risk/critical ──────────────────────────────────
router.get('/risk/critical', authenticate, requireRole(['hod', 'principal', 'management', 'admin']), async (req, res) => {
  try {
    const departmentName = await resolveDepartment(req);

    // Fetch department students
    const query = { role: 'student' };
    if (departmentName && req.userRole && req.userRole.toLowerCase() === 'hod') {
      query.department = departmentName;
    }

    const students = await User.find(query).lean();
    const studentEmails = students.map(s => s.email);

    const below_75 = [];
    const below_60 = [];
    const long_absences = [];

    // Fallbacks if no data in DB
    if (studentEmails.length === 0) {
      res.json({
        below_75: [
          { student_id: "STU041", name: "Rohan K", email: "rohan.k@college.edu", attendance: 72.4, absences: 8, risk: "High" },
          { student_id: "STU082", name: "Sanjay N", email: "sanjay.n@college.edu", attendance: 68.9, absences: 10, risk: "High" }
        ],
        below_60: [
          { student_id: "STU015", name: "Vikas P", email: "vikas.p@college.edu", attendance: 55.2, absences: 15, risk: "Critical" }
        ],
        long_absences: [
          { student_id: "STU099", name: "Aditi S", email: "aditi.s@college.edu", consecutive_days: 5, last_active: "2026-06-12", risk: "Critical" }
        ]
      });
      return;
    }

    // Real DB computation
    for (const student of students) {
      const totalSessions = await Attendance.countDocuments({ student_email: student.email });
      if (totalSessions === 0) continue;

      const presentSessions = await Attendance.countDocuments({ student_email: student.email, status: 'Present' });
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

      // Check long absences: find last 5 attendance marks. If last 3 consecutive are absent, flag
      const lastLogs = await Attendance.find({ student_email: student.email }).sort({ timestamp: -1 }).limit(5);
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
          last_active: lastLogs[consecutive_absences]?.timestamp ? lastLogs[consecutive_absences].timestamp.toISOString().split('T')[0] : "N/A",
          risk: "Critical"
        });
      }
    }

    // If lists are completely empty, inject standard mock profiles to keep dashboard populated for demo
    if (below_75.length === 0 && below_60.length === 0 && long_absences.length === 0) {
      below_75.push(
        { student_id: "STU041", name: "Rohan K", email: "rohan.k@college.edu", attendance: 72.4, absences: 8, risk: "High" },
        { student_id: "STU082", name: "Sanjay N", email: "sanjay.n@college.edu", attendance: 68.9, absences: 10, risk: "High" }
      );
      below_60.push(
        { student_id: "STU015", name: "Vikas P", email: "vikas.p@college.edu", attendance: 55.2, absences: 15, risk: "Critical" }
      );
      long_absences.push(
        { student_id: "STU099", name: "Aditi S", email: "aditi.s@college.edu", consecutive_days: 5, last_active: "2026-06-12", risk: "Critical" }
      );
    }

    res.json({
      below_75,
      below_60,
      long_absences
    });

  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

module.exports = router;
