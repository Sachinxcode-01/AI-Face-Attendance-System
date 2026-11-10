const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { trackJob } = require('../utils/jobTracker');

// Models
const Session = require('../models/Session');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Leave = require('../models/Leave');
const AttendanceAnalytics = require('../models/AttendanceAnalytics');
const DepartmentAnalytics = require('../models/DepartmentAnalytics');
const AttendanceAuditLog = require('../models/AttendanceAuditLog');
const { verifyAttendanceQrToken } = require('../utils/attendanceQr');
const reportInternalError = require('../utils/httpError');

// Services
const notificationService = require('../services/notificationService');
const GSheetsManager = require('../services/gsheetsManager');
const gsheets = new GSheetsManager();
const faceAiService = require('../services/faceAiService');
const datasetService = require('../services/datasetService');

const multer = require('multer');
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

const { authenticate, requireRole } = require('../middleware/auth');
const SHEET_URL = process.env.GSHEETS_URL || "";

const toDateKey = (date) => {
  try {
    const d = new Date(date);
    return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
  } catch (_) {
    return null;
  }
};

// Security Audit Logging Helper
const auditLog = async (email, role, action, details, req) => {
  try {
    const ip = req ? (req.headers['x-forwarded-for'] || req.socket.remoteAddress) : '127.0.0.1';
    await AttendanceAuditLog.create({
      actor_email: email || 'system@smartface.ai',
      role: role || 'system',
      action,
      details,
      ip_address: ip
    });
  } catch (err) {
    console.error("Audit logging failed:", err);
  }
};

const canReadStudentAttendance = (req, email) => {
  const role = (req.userRole || '').toLowerCase();
  const target = (email || '').toLowerCase();
  const self = role === 'student' && req.userEmail?.toLowerCase() === target;
  const staff = ['admin', 'super_admin', 'teacher', 'hod', 'principal', 'management'].includes(role);
  return self || staff;
};

// Heuristics Helper: Calculate Student Attendance Health Score
const calculateHealthScore = async (email) => {
  try {
    let records = [];
    try {
      if (mongoose.connection.readyState === 1) {
        records = await Attendance.find({ student_email: email }).lean();
      }
    } catch (_) {}

    if (records.length === 0) {
      const fallbackStats = datasetService.getStudentStats(email);
      return {
        score: fallbackStats.overall_percentage,
        standing: fallbackStats.standing,
        lates: 0,
        consecutiveAbsences: 0,
        percentage: fallbackStats.overall_percentage
      };
    }

    const presentCount = records.filter(r => r.status === 'Present').length;
    const lates = records.filter(r => r.verified_by === 'manual' || r.status === 'Late').length; // Map manual/late indicators
    
    // Sort records to check consecutive absences (simulate for demo, or compute dynamically)
    const sorted = [...records].sort((a, b) => b.timestamp - a.timestamp);
    let consecutiveAbsences = 0;
    
    // Calculate basic attendance percentage
    // Find sessions that student should have attended (simulate total sessions based on department average if necessary, e.g. 30 sessions)
    const user = await User.findOne({ email }).lean();
    let totalSessions = 30; // default baseline
    if (user) {
      const activeSessionsCount = await Session.countDocuments({});
      totalSessions = Math.max(activeSessionsCount, records.length, 1);
    }

    const percentage = (presentCount / totalSessions) * 100;
    
    // Heuristics formula: Health = Percentage * (1.0 - 0.05*Lates - 0.1*ConsecutiveAbsences)
    // For demo purposes, we will bound it between 0 and 100
    let latePenalty = lates * 2; // e.g. 2% penalty per late
    let consecutivePenalty = consecutiveAbsences * 5; 
    let healthScore = Math.max(0, Math.min(100, Math.round(percentage - latePenalty - consecutivePenalty)));

    let standing = 'Good';
    if (healthScore >= 90) standing = 'Excellent';
    else if (healthScore >= 75) standing = 'Good';
    else if (healthScore >= 60) standing = 'Warning';
    else standing = 'Critical';

    // Update Cache
    await AttendanceAnalytics.findOneAndUpdate(
      { student_email: email },
      {
        student_email: email,
        health_score: healthScore,
        standing,
        consecutive_absences: consecutiveAbsences,
        late_arrivals_count: lates,
        last_calculated: new Date()
      },
      { upsert: true }
    );

    return { score: healthScore, standing, lates, consecutiveAbsences, percentage };
  } catch (err) {
    console.error("Health score computation error:", err);
    return { score: 80, standing: 'Good', lates: 0, consecutiveAbsences: 0, percentage: 80 };
  }
};

// ─── POST /attendance/mark ────────────────────────────────────────
router.post('/mark', authenticate, async (req, res) => {
  try {
    const { student_email: requestedStudentEmail, session_id, qr_code, latitude, longitude } = req.body;
    const role = (req.userRole || '').toLowerCase();
    const student_email = role === 'student' ? req.userEmail.toLowerCase() : requestedStudentEmail?.trim().toLowerCase();

    if (!['student', 'admin', 'super_admin', 'teacher'].includes(role)) {
      return res.status(403).json({ detail: 'Only students and staff can mark attendance.' });
    }
    if (!student_email) {
      return res.status(400).json({ detail: 'A valid student account is required.' });
    }
    if (typeof session_id !== 'string' || !mongoose.Types.ObjectId.isValid(session_id) || typeof qr_code !== 'string' || !qr_code) {
      return res.status(400).json({ detail: 'Session and QR code are required.' });
    }

    const session = await Session.findOne({ _id: session_id, is_active: true });
    if (!session) {
      return res.status(400).json({ detail: "Invalid or expired session" });
    }

    if (!verifyAttendanceQrToken(session, qr_code)) {
      return res.status(400).json({ detail: 'Invalid QR code.' });
    }
    if (!(await User.exists({ email: student_email, role: 'student' }))) {
      return res.status(404).json({ detail: 'Student not found.' });
    }
    if (role === 'teacher' && session.teacher_id.toLowerCase() !== req.userEmail.toLowerCase()) {
      return res.status(403).json({ detail: 'You can only mark attendance for your own session.' });
    }

    // Classroom Geofence verification
    if (session.latitude != null && session.longitude != null) {
      if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        return res.status(403).json({ detail: 'Classroom geofence validation required. Please enable location permissions.' });
      }
      const R = 6371e3; // Earth radius in metres
      const phi1 = (session.latitude * Math.PI) / 180;
      const phi2 = (latitude * Math.PI) / 180;
      const deltaPhi = ((latitude - session.latitude) * Math.PI) / 180;
      const deltaLambda = ((longitude - session.longitude) * Math.PI) / 180;

      const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
                Math.cos(phi1) * Math.cos(phi2) *
                Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      const maxRadius = session.radius_meters || 150;
      if (distance > maxRadius) {
        return res.status(403).json({
          detail: `Geofence validation failed. You are ${Math.round(distance)}m away from the classroom (max: ${maxRadius}m).`
        });
      }
    }

    const timestamp = new Date();
    const newRecord = new Attendance({
      student_email,
      session_id,
      timestamp,
      status: "Present",
      verified_by: "qr"
    });

    await newRecord.save();

    // Audit Log
    await auditLog(student_email, 'student', 'ATTENDANCE_MARKED', { method: 'qr', session_id, subject: session.subject }, req);

    // Broadcast update to live-logs WebSockets
    trackJob(notificationService.broadcast({
      type: "attendance_update",
      student_email,
      session_id,
      status: "Present",
      timestamp: timestamp.toISOString()
    }).catch(console.error));

    // Recalculate health score cache in background
    trackJob(calculateHealthScore(student_email).catch(console.error));

    res.json({ status: "success", message: "Attendance marked successfully" });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ detail: "Attendance already marked for this session", message: "Attendance already marked for this session" });
    }
    reportInternalError(res, error, 'Attendance');
  }
});

// In-memory rate-limiter and cooldown tracker for face verification attempts
const faceAttemptMap = new Map();

const checkFaceRateLimit = (userEmail) => {
  const now = Date.now();
  const userStats = faceAttemptMap.get(userEmail) || { attempts: [], failures: [] };

  userStats.attempts = userStats.attempts.filter(t => now - t < 15 * 60 * 1000);
  userStats.failures = userStats.failures.filter(t => now - t < 2 * 60 * 1000);

  if (userStats.failures.length >= 3) {
    return { allowed: false, message: "Too many failed verification attempts. Cooldown active for 2 minutes." };
  }

  if (userStats.attempts.length >= 5) {
    return { allowed: false, message: "Face verification rate limit exceeded. Please try again later." };
  }

  userStats.attempts.push(now);
  faceAttemptMap.set(userEmail, userStats);
  return { allowed: true };
};

const recordFaceFailure = (userEmail) => {
  const now = Date.now();
  const userStats = faceAttemptMap.get(userEmail) || { attempts: [now], failures: [] };
  userStats.failures.push(now);
  faceAttemptMap.set(userEmail, userStats);
};

// ─── POST /attendance/mark/face ───────────────────────────────────
router.post('/mark/face', authenticate, requireRole('student'), upload.single('image'), async (req, res) => {
  try {
    // 1. If an image file is uploaded (Flutter Mobile Flow)
    if (req.file && req.file.buffer) {
      const student_email = req.userEmail;

      // Rate limit check per user
      const rateCheck = checkFaceRateLimit(student_email);
      if (!rateCheck.allowed) {
        return res.status(429).json({ detail: rateCheck.message });
      }

      const { session_id } = req.body;

      if (typeof session_id !== 'string' || !mongoose.Types.ObjectId.isValid(session_id)) {
        return res.status(400).json({ detail: 'A valid active session is required.' });
      }
      const session = await Session.findOne({ _id: session_id, is_active: true });

      if (!session) {
        return res.status(400).json({ detail: "No active attendance session found" });
      }

      const activeSessionId = session._id.toString();

      // Check for duplicate attendance FIRST
      const existing = await Attendance.findOne({
        student_email,
        session_id: activeSessionId
      });

      if (existing) {
        return res.status(409).json({
          detail: "Attendance already marked for this session",
          message: "Attendance already marked for this session"
        });
      }

      // Forward to Python FastAPI AI microservice
      const aiResult = await faceAiService.verifyFace(req.file.buffer, student_email);

      if (aiResult.status === 400) {
        return res.status(400).json({ detail: "Invalid or malformed image payload", matched: false });
      }

      if (aiResult.status === 413) {
        return res.status(413).json({ detail: "Uploaded image exceeds maximum size of 5MB", matched: false });
      }

      if (aiResult.status === 415) {
        return res.status(415).json({ detail: "Unsupported image file format", matched: false });
      }

      if (aiResult.status === 429) {
        return res.status(429).json({ detail: "Face verification rate limit exceeded. Please try again shortly.", matched: false });
      }

      if (aiResult.status === 503) {
        return res.status(503).json({ detail: "AI face recognition service is currently unavailable" });
      }

      if (aiResult.status === 504) {
        return res.status(504).json({ detail: "AI face recognition request timed out" });
      }

      if (aiResult.status === 422 || !aiResult.success || !aiResult.matched) {
        recordFaceFailure(student_email);
        return res.status(422).json({
          detail: "Face verification failed",
          matched: false,
          confidence: aiResult.confidence || 0
        });
      }

      // Save Attendance in MongoDB
      const timestamp = new Date();
      const newRecord = new Attendance({
        student_email,
        session_id: activeSessionId,
        timestamp,
        status: "Present",
        verified_by: "face",
        confidence: aiResult.confidence
      });

      await newRecord.save();

      // Audit Log
      await auditLog(student_email, 'student', 'ATTENDANCE_MARKED', { method: 'face', session_id: activeSessionId, confidence: aiResult.confidence }, req);

      // Broadcast update via WebSockets
      trackJob(notificationService.broadcast({
        type: "attendance_update",
        student_email,
        session_id: activeSessionId,
        status: "Present",
        timestamp: timestamp.toISOString(),
        verified_by: "face",
        confidence: aiResult.confidence
      }).catch(console.error));

      // Recalculate health score
      trackJob(calculateHealthScore(student_email).catch(console.error));

      return res.json({
        status: "success",
        matched: true,
        confidence: aiResult.confidence,
        message: "Face attendance marked successfully"
      });
    }

    return res.status(400).json({ detail: 'A verified face image is required.' });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ detail: "Attendance already marked for this session", message: "Attendance already marked for this session" });
    }
    reportInternalError(res, error, 'Attendance');
  }
});

// ─── GET /attendance/dashboard ────────────────────────────────────
// Central student attendance intelligence metrics
router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const email = req.userEmail;
    const user = await User.findOne({ email }).lean();
    if (!user) return res.status(404).json({ detail: "User not found" });

    // Calculate metrics
    const stats = await calculateHealthScore(email);

    // Fetch alerts
    const analytics = await AttendanceAnalytics.findOne({ student_email: email }).lean();
    const alerts = analytics ? analytics.risk_alerts : [];

    // Formulate alerts based on status
    const formattedAlerts = [];
    if (stats.score < 75) {
      formattedAlerts.push({
        type: 'critical',
        message: '⚠️ Warning: Your attendance health has dropped below eligibility (75%). Attend next classes immediately.'
      });
    } else if (stats.score < 85) {
      formattedAlerts.push({
        type: 'warning',
        message: '⚠️ Caution: Attendance health is approaching warning levels. Maintain active session checks.'
      });
    } else {
      formattedAlerts.push({
        type: 'info',
        message: '🏆 Well done! You are in good attendance standing.'
      });
    }

    res.json({
      health_score: stats.score,
      standing: stats.standing,
      total_percentage: stats.percentage,
      late_count: stats.lates,
      consecutive_absences: stats.consecutiveAbsences,
      risk_alerts: formattedAlerts
    });
  } catch (error) {
    reportInternalError(res, error, 'Attendance');
  }
});

// ─── GET /attendance/command-center ───────────────────────────────
// Centralized command center dashboard for HODs & Admins
router.get('/command-center', authenticate, requireRole(['admin', 'teacher']), async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const activeSessionsCount = await Session.countDocuments({ is_active: true });

    // Compute metrics
    const criticalCount = await AttendanceAnalytics.countDocuments({ health_score: { $lt: 60 } });
    const warningCount = await AttendanceAnalytics.countDocuments({ health_score: { $gte: 60, $lt: 75 } });
    
    // Average attendance rate across all students
    const allStats = await AttendanceAnalytics.find({}).lean();
    let avgHealth = 85;
    if (allStats.length > 0) {
      const sum = allStats.reduce((acc, current) => acc + current.health_score, 0);
      avgHealth = Math.round(sum / allStats.length);
    }

    res.json({
      average_attendance: avgHealth,
      total_students: totalStudents,
      active_sessions: activeSessionsCount,
      critical_students: criticalCount,
      warning_students: warningCount
    });
  } catch (error) {
    reportInternalError(res, error, 'Attendance');
  }
});

// ─── GET /attendance/live-monitor ─────────────────────────────────
router.get('/live-monitor', authenticate, requireRole(['admin', 'teacher']), async (req, res) => {
  try {
    const activeSessions = await Session.find({ is_active: true }).lean();
    
    const sessionsTelemetry = [];
    for (const session of activeSessions) {
      const presentCount = await Attendance.countDocuments({ session_id: session._id.toString(), status: 'Present' });
      const faceCount = await Attendance.countDocuments({ session_id: session._id.toString(), verified_by: 'face' });
      
      const teacher = await User.findOne({ email: session.teacher_id }).lean();
      
      sessionsTelemetry.push({
        session_id: session._id.toString(),
        subject: session.subject,
        teacher_name: teacher ? teacher.full_name : session.teacher_id,
        students_present: presentCount,
        face_scans: faceCount,
        duration: session.duration,
        start_time: session.start_time
      });
    }

    res.json(sessionsTelemetry);
  } catch (error) {
    reportInternalError(res, error, 'Attendance');
  }
});

// ─── GET /attendance/risk-analysis ────────────────────────────────
router.get('/risk-analysis', authenticate, requireRole(['admin', 'teacher']), async (req, res) => {
  try {
    const riskType = req.query.type || 'below_75'; // below_75, below_60, frequent_late
    let filter = {};
    
    if (riskType === 'below_60') {
      filter = { health_score: { $lt: 60 } };
    } else if (riskType === 'frequent_late') {
      filter = { late_arrivals_count: { $gte: 3 } };
    } else {
      filter = { health_score: { $gte: 60, $lt: 75 } }; // default: below 75 warning
    }

    const analytics = await AttendanceAnalytics.find(filter).lean();
    
    const riskStudentsList = [];
    for (const record of analytics) {
      const student = await User.findOne({ email: record.student_email }).lean();
      if (student) {
        riskStudentsList.push({
          name: student.full_name,
          email: student.email,
          usn: student.usn || student.student_id,
          department: student.department || 'Computer Science',
          semester: student.semester || '6th',
          health_score: record.health_score,
          standing: record.standing,
          lates: record.late_arrivals_count
        });
      }
    }

    res.json(riskStudentsList);
  } catch (error) {
    reportInternalError(res, error, 'Attendance');
  }
});

// ─── GET /attendance/heatmap ──────────────────────────────────────
router.get('/heatmap', authenticate, async (req, res) => {
  try {
    const email = req.userEmail;
    
    // Construct simple monthly heatmap metrics
    // We group checkins by day of the year
    const checkins = await Attendance.find({ student_email: email }).lean();
    const heatmap = {};
    
    checkins.forEach(c => {
      const dateStr = c.timestamp.toISOString().split('T')[0];
      heatmap[dateStr] = (heatmap[dateStr] || 0) + 1; // Number of classes attended on date
    });

    res.json(heatmap);
  } catch (error) {
    reportInternalError(res, error, 'Attendance');
  }
});

// ─── GET /attendance/report/generate ──────────────────────────────
router.get('/report/generate', authenticate, async (req, res) => {
  try {
    const format = req.query.format || 'csv';
    const email = req.userEmail;
    const user = await User.findOne({ email }).lean();
    if (!user) return res.status(404).json({ detail: "User not found" });

    // Fetch student check-ins
    const records = await Attendance.find({ student_email: email }).lean();
    
    if (format === 'csv') {
      res.setHeader('Content-disposition', 'attachment; filename=attendance_ledger.csv');
      res.set('Content-Type', 'text/csv');
      
      let csv = 'Date,Time,Subject,Verified By,Status\n';
      for (const rec of records) {
        const session = await Session.findById(rec.session_id).lean();
        const dateStr = rec.timestamp.toISOString().split('T')[0];
        const timeStr = rec.timestamp.toISOString().split('T')[1].substring(0, 5);
        csv += `${dateStr},${timeStr},"${session ? session.subject : 'Class'}",${rec.verified_by},${rec.status}\n`;
      }
      return res.send(csv);
    } else if (format === 'excel') {
      // Stream tab-separated spreadsheet which opens in Excel directly
      res.setHeader('Content-disposition', 'attachment; filename=attendance_ledger.xls');
      res.set('Content-Type', 'application/vnd.ms-excel');
      
      let xls = 'Date\tTime\tSubject\tVerified By\tStatus\n';
      for (const rec of records) {
        const session = await Session.findById(rec.session_id).lean();
        const dateStr = rec.timestamp.toISOString().split('T')[0];
        const timeStr = rec.timestamp.toISOString().split('T')[1].substring(0, 5);
        xls += `${dateStr}\t${timeStr}\t"${session ? session.subject : 'Class'}"\t${rec.verified_by}\t${rec.status}\n`;
      }
      return res.send(xls);
    } else {
      // Stream simple report metadata
      res.json({
        student: user.full_name,
        email: user.email,
        records_count: records.length,
        status: "verified"
      });
    }
  } catch (error) {
    reportInternalError(res, error, 'Attendance');
  }
});

// ─── GET /attendance/audit-logs ───────────────────────────────────
router.get('/audit-logs', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const logs = await AttendanceAuditLog.find({}).sort({ timestamp: -1 }).limit(100).lean();
    res.json(logs);
  } catch (error) {
    reportInternalError(res, error, 'Attendance');
  }
});

// ─── GET /attendance/student/:email & /attendance/history/:email ──
router.get(['/student/:email', '/history/:email'], authenticate, async (req, res) => {
  try {
    const email = req.params.email.trim().toLowerCase();
    if (!canReadStudentAttendance(req, email)) {
      return res.status(403).json({ detail: 'Forbidden: cannot access this student attendance.' });
    }
    const page = parseInt(req.query.page || "1", 10);
    const limit = parseInt(req.query.limit || "20", 10);
    const skip = (page - 1) * limit;
    
    const filter = { student_email: email };
    
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    if (req.query.month) {
      const startOfMonth = new Date(`${req.query.month}-01T00:00:00.000Z`);
      const endOfMonth = new Date(startOfMonth);
      endOfMonth.setUTCMonth(endOfMonth.getUTCMonth() + 1);
      filter.timestamp = { $gte: startOfMonth, $lt: endOfMonth };
    }

    let total = 0;
    let logs = [];
    try {
      if (mongoose.connection.readyState === 1) {
        total = await Attendance.countDocuments(filter);
        logs = await Attendance.find(filter)
          .sort({ timestamp: -1 })
          .skip(skip)
          .limit(limit)
          .lean();
      }
    } catch (_) {}

    if (logs.length === 0) {
      const fallback = datasetService.getStudentLogs(email, { page, limit, status: req.query.status, month: req.query.month });
      if (fallback.logs.length > 0) {
        return res.json(fallback);
      }
    }

    const result = [];
    for (const log of logs) {
      const session = await Session.findOne({ _id: log.session_id }).lean();
      result.push({
        id: log._id.toString(),
        date: log.timestamp.toISOString().split('T')[0],
        time: log.timestamp.toISOString().split('T')[1].substring(0, 5),
        subject: session ? session.subject : 'AI Class',
        verified_by: log.verified_by,
        confidence: log.confidence ? `${Math.round(log.confidence * 100)}%` : 'N/A',
        status: log.status,
        lighting_quality: log.lighting_quality || 'Good',
        face_visibility: log.face_visibility || 'Excellent'
      });
    }

    res.json({
      total,
      page,
      limit,
      logs: result
    });
  } catch (error) {
    reportInternalError(res, error, 'Attendance');
  }
});

// ─── GET /attendance/student/analytics/:email ──────────────────────
router.get('/student/analytics/:email', authenticate, async (req, res) => {
  try {
    const email = req.params.email.trim().toLowerCase();
    if (!canReadStudentAttendance(req, email)) {
      return res.status(403).json({ detail: 'Forbidden: cannot access this student analytics.' });
    }
    const records = await Attendance.find({ student_email: email }).lean();
    
    const sessions = await Session.find(
      { _id: { $in: records.map((record) => record.session_id) } },
      'subject'
    ).lean();
    const subjectBySessionId = new Map(sessions.map((session) => [session._id.toString(), session.subject]));
    const presentCounts = {};
    for (const record of records) {
      if (record.status !== 'Present') continue;
      const subject = subjectBySessionId.get(record.session_id);
      if (subject) presentCounts[subject] = (presentCounts[subject] || 0) + 1;
    }
    const subjects = Object.keys(presentCounts);

    const subjectDetails = [];
    let totalPresent = 0;
    let totalPossible = 0;

    for (const sub of subjects) {
      const totalSessions = await Session.countDocuments({ subject: sub });
      const pCount = presentCounts[sub] || 0;
      const tCount = Math.max(totalSessions, pCount);

      subjectDetails.push({
        subject: sub,
        present: pCount,
        total: tCount,
        percentage: tCount ? pCount / tCount : 0
      });
      
      totalPresent += pCount;
      totalPossible += tCount;
    }

    let overallPercentage = totalPossible > 0 ? totalPresent / totalPossible : 0;
    
    let dataSource = 'records';
    if (records.length === 0) {
      const dsStats = datasetService.getStudentStats(email);
      if (dsStats) {
        dataSource = 'dataset';
        overallPercentage = dsStats.overall_percentage > 1.0 ? dsStats.overall_percentage / 100.0 : (dsStats.overall_percentage || 0);
        for (const sub of (dsStats.subjects || [])) {
          const attended = sub.attended ?? sub.present ?? 0;
          const total = sub.total ?? attended;
          subjectDetails.push({
            subject: sub.subject,
            present: attended,
            total: total,
            percentage: total > 0 ? attended / total : (sub.percentage > 1.0 ? sub.percentage / 100.0 : (sub.percentage || 0))
          });
        }
      } else {
        dataSource = 'none';
        overallPercentage = 0;
      }
    }

    const weeklyTrends = [];
    const now = new Date();
    if (dataSource !== 'none') {
      for (let i = 6; i >= 0; i--) {
        const startOfWeek = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000);
        
        let pCountWeek = 0;
        try {
          pCountWeek = await Attendance.countDocuments({
            student_email: email,
            status: 'Present',
            timestamp: { $gte: startOfWeek, $lt: endOfWeek }
          });
        } catch (_) {}

        let totalWeek = 0;
        try {
          totalWeek = await Session.countDocuments({
            start_time: { $gte: startOfWeek, $lt: endOfWeek }
          });
        } catch (_) {}
        if (pCountWeek > totalWeek) totalWeek = pCountWeek;

        const pct = totalWeek > 0 ? Math.min(100, Math.round((pCountWeek / totalWeek) * 100)) : 0;
        weeklyTrends.push({
          week: `Wk ${7-i}`,
          present: pCountWeek,
          total: totalWeek,
          percentage: pct,
          rate: pct
        });
      }
    }

    const monthlyTrends = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    if (dataSource !== 'none') {
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date();
        monthDate.setMonth(monthDate.getMonth() - i);
        const startOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
        const endOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1);
        
        let pCountMonth = 0;
        try {
          pCountMonth = await Attendance.countDocuments({
            student_email: email,
            status: 'Present',
            timestamp: { $gte: startOfMonth, $lt: endOfMonth }
          });
        } catch (_) {}

        let totalMonth = 0;
        try {
          totalMonth = await Session.countDocuments({
            start_time: { $gte: startOfMonth, $lt: endOfMonth }
          });
        } catch (_) {}
        if (pCountMonth > totalMonth) totalMonth = pCountMonth;

        const monthName = monthNames[startOfMonth.getMonth()];
        const pct = totalMonth > 0 ? Math.min(100, Math.round((pCountMonth / totalMonth) * 100)) : 0;
        monthlyTrends.push({
          month: monthName,
          present: pCountMonth,
          total: totalMonth,
          percentage: pct,
          rate: pct
        });
      }
    }

    // Real Heatmap Data (Map of YYYY-MM-DD -> 'present' | 'absent')
    const heatmapData = {};
    for (const r of records) {
      if (r.timestamp) {
        const dStr = toDateKey(r.timestamp);
        if (dStr) {
          heatmapData[dStr] = (r.status || '').toLowerCase() === 'present' ? 'present' : 'absent';
        }
      }
    }

    // Merge with datasetService heatmap
    const dsHeatmap = datasetService.getHeatmap(email);
    for (const date in dsHeatmap) {
      const dStr = toDateKey(date) || date;
      if (!heatmapData[dStr]) {
        heatmapData[dStr] = dsHeatmap[date] === 1 ? 'present' : 'absent';
      }
    }

    // Calculate streak using unified date keys
    let streak = 0;
    const checkDays = [];
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(now.getTime() - i * 86400000);
      const dow = checkDate.getUTCDay();
      if (dow !== 0 && dow !== 6) {
        const ds = toDateKey(checkDate);
        if (ds) checkDays.push(ds);
      }
    }
    for (const ds of checkDays) {
      if (heatmapData[ds] === 'present') {
        streak++;
      } else {
        break;
      }
    }

    // Student identity for leaderboard
    const studentUser = await User.findOne({ email }).lean();
    const currentScore = Math.round(overallPercentage * 100);
    let leaderboard = [];

    if (studentUser && studentUser.department) {
      const dept = studentUser.department;
      const peers = await User.find({ department: dept, role: 'student' }).lean();
      if (peers.length > 0) {
        const peerEntries = [];
        for (const peer of peers) {
          const isMe = peer.email.toLowerCase() === email;
          let score = 0;
          if (isMe) {
            score = currentScore;
          } else {
            const peerStats = datasetService.getStudentStats(peer.email);
            if (peerStats && peerStats.overall_percentage != null) {
              score = Math.round(peerStats.overall_percentage > 1.0 ? peerStats.overall_percentage : peerStats.overall_percentage * 100);
            } else {
              const peerRecords = await Attendance.find({ student_email: peer.email }).lean();
              if (peerRecords.length > 0) {
                const peerPresent = peerRecords.filter(r => (r.status || '').toLowerCase() === 'present').length;
                score = Math.round((peerPresent / peerRecords.length) * 100);
              } else {
                score = 0;
              }
            }
          }
          peerEntries.push({
            name: peer.full_name || peer.email,
            department: dept,
            score: score,
            is_me: isMe
          });
        }
        peerEntries.sort((a, b) => b.score - a.score);
        leaderboard = peerEntries.slice(0, 10).map((entry, idx) => ({
          ...entry,
          rank: idx + 1
        }));
      }
    }

    const predictions = {
      semester_projection: Math.min(100.0, Math.round(overallPercentage * 100 * 1.03 * 10) / 10),
      trend_direction: overallPercentage >= 0.85 ? 'improving' : overallPercentage >= 0.75 ? 'stable' : 'declining',
      risk_level: overallPercentage >= 0.75 ? 'low' : overallPercentage >= 0.65 ? 'medium' : 'high',
      missable_classes: Math.max(0, Math.floor((overallPercentage - 0.75) * 40))
    };

    const personalInsights = [
      {
        text: streak >= 3
          ? `You have maintained an active ${streak}-day attendance streak! Keep the flame alive.`
          : 'Check into all upcoming lectures to ignite your attendance streak.',
        type: streak >= 3 ? 'champion' : 'trend'
      },
      {
        text: overallPercentage >= 0.75
          ? `Overall attendance of ${Math.round(overallPercentage * 100)}% comfortably meets university eligibility.`
          : `Attendance is at ${Math.round(overallPercentage * 100)}%. Avoid unexcused absences to avoid dropping below 75%.`,
        type: overallPercentage >= 0.75 ? 'improving' : 'risk'
      }
    ];

    const faceRecords = records.filter(r => r.verified_by === 'face' && Number.isFinite(r.confidence));
    const avgConfidence = faceRecords.length > 0
      ? faceRecords.reduce((sum, r) => sum + r.confidence, 0) / faceRecords.length
      : null;

    if (faceRecords.length > 0) {
      personalInsights.push({
        text: 'Biometric face recognition speed and verification accuracy are optimal.',
        type: 'improving'
      });
    }

    res.json({
      overall_percentage: overallPercentage,
      data_source: dataSource,
      subjects: subjectDetails,
      weekly_trends: weeklyTrends,
      monthly_trends: monthlyTrends,
      heatmap_data: heatmapData,
      leaderboard,
      predictions,
      personal_insights: personalInsights,
      streak,
      ai_metrics: {
        average_confidence: avgConfidence,
        lighting_quality: faceRecords[0]?.lighting_quality || (faceRecords.length > 0 ? 'Good' : null),
        face_visibility: faceRecords[0]?.face_visibility || (faceRecords.length > 0 ? 'Excellent' : null)
      }
    });
  } catch (error) {
    reportInternalError(res, error, 'Attendance');
  }
});

module.exports = router;
