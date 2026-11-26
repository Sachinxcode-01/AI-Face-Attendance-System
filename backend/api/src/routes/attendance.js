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
const {
  getStudentAttendanceSummary,
  getStudentAttendanceHistory,
  getInstitutionPolicy,
  toDateKey,
} = require('../services/studentAttendanceService');
const { simulateScenario } = require('../services/attendanceCalculator');
const {
  attendanceSubmissionsTotal,
  faceRecognitionDuration,
  aiInferenceDuration
} = require('../monitoring/metrics');
const crypto = require('crypto');

const multer = require('multer');
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

const { authenticate, requireRole } = require('../middleware/auth');
const SHEET_URL = process.env.GSHEETS_URL || "";

// Security Audit Logging Helper
const auditLog = async (email, role, action, details, req) => {
  try {
    const ip = req ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress) : '127.0.0.1';
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

// Heuristics Helper: Calculate Student Attendance Health Score from real DB data
const calculateHealthScore = async (email) => {
  try {
    const summary = await getStudentAttendanceSummary(email);
    if (!summary) {
      return { score: 100, standing: 'No Records', lates: 0, consecutiveAbsences: 0, percentage: 0 };
    }

    if (mongoose.connection.readyState === 1) {
      await AttendanceAnalytics.findOneAndUpdate(
        { student_email: email.toLowerCase() },
        {
          student_email: email.toLowerCase(),
          health_score: summary.health_score,
          standing: summary.standing,
          consecutive_absences: summary.risk?.consecutiveAbsences || 0,
          late_arrivals_count: summary.total_late || 0,
          last_calculated: new Date()
        },
        { upsert: true }
      ).catch(() => { });
    }

    return {
      score: summary.health_score,
      standing: summary.standing,
      lates: summary.total_late || 0,
      consecutiveAbsences: summary.risk?.consecutiveAbsences || 0,
      percentage: summary.overall_attendance ?? 0,
    };
  } catch (err) {
    console.error("Health score computation error:", err);
    return { score: 0, standing: 'Unavailable', lates: 0, consecutiveAbsences: 0, percentage: 0 };
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
          const studentUser = await User.findOne({ email: student_email, role: 'student' }, 'email college_id college semester').lean();
          if (!studentUser) {
            return res.status(404).json({ detail: 'Student not found.' });
          }
          if (session.college_id && studentUser.college_id && session.college_id !== studentUser.college_id) {
            return res.status(403).json({ detail: 'Cross-institution attendance registration is not permitted.' });
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
          const receiptId = `SF-QR-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
          const newRecord = new Attendance({
            student_email,
            session_id,
            college_id: session.college_id || studentUser.college_id || undefined,
            subject: session.subject,
            semester: studentUser.semester || undefined,
            receipt_id: receiptId,
            timestamp,
            status: "Present",
            verified_by: "qr"
          });

          await newRecord.save();

          // Instrument successful QR attendance submission
          try {
            attendanceSubmissionsTotal.inc({
              status: 'success',
              method: 'qr',
              college_id: (session && (session.college_id || session.institution_id)) || req.userCollege || 'default'
            });
          } catch (_) { }

          // Audit Log
          await auditLog(student_email, 'student', 'ATTENDANCE_MARKED', { method: 'qr', session_id, subject: session.subject, receipt_id: receiptId }, req);

          // Notify student of successful check-in
          trackJob(notificationService.createNotification(
            student_email,
            'Attendance Registered',
            `Marked Present for ${session.subject} via Dynamic QR (${receiptId}).`,
            'attendance',
            'Info',
            { session_id, subject: session.subject, receipt_id: receiptId }
          ).catch(console.error));

          // Broadcast update to admin live-logs WebSockets (never leak student PII to all students)
          trackJob(notificationService.broadcastLiveLogs({
            type: "attendance_update",
            student_email,
            session_id,
            status: "Present",
            timestamp: timestamp.toISOString()
          }).catch(console.error));

          // Recalculate health score cache in background
          trackJob(calculateHealthScore(student_email).catch(console.error));

          res.json({
            status: "success",
            message: "Attendance marked successfully",
            receipt_id: receiptId,
            attendance_id: newRecord._id.toString(),
            subject: session.subject,
            room: session.room || null,
            timestamp: timestamp.toISOString(),
          });
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

          const studentUser = await User.findOne({ email: student_email.toLowerCase() }, 'college_id semester').lean();
          if (session.college_id && studentUser?.college_id && session.college_id !== studentUser.college_id) {
            return res.status(403).json({ detail: 'Cross-institution attendance registration is not permitted.' });
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
          const faceStart = process.hrtime();
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
          const receiptId = `SF-FC-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
          const newRecord = new Attendance({
            student_email,
            session_id: activeSessionId,
            college_id: session.college_id || studentUser?.college_id || undefined,
            subject: session.subject,
            semester: studentUser?.semester || undefined,
            receipt_id: receiptId,
            timestamp,
            status: "Present",
            verified_by: "face",
            confidence: aiResult.confidence
          });

          await newRecord.save();

          // Instrument successful face verification and attendance submission
          try {
            const faceDiff = process.hrtime(faceStart);
            const faceLatencySec = (faceDiff[0] * 1e9 + faceDiff[1]) / 1e9;
            faceRecognitionDuration.observe(
              { status: 'success', model_version: 'arcface-r100', lighting: req.body.lighting || 'normal' },
              faceLatencySec
            );
            aiInferenceDuration.observe(
              { pipeline_stage: 'feature_extraction', accelerator: 'cpu' },
              faceLatencySec
            );
            attendanceSubmissionsTotal.inc({
              status: 'success',
              method: 'face',
              college_id: (session && (session.college_id || session.institution_id)) || req.userCollege || 'default'
            });
          } catch (_) { }

          // Audit Log
          await auditLog(student_email, 'student', 'ATTENDANCE_MARKED', { method: 'face', session_id: activeSessionId, confidence: aiResult.confidence, receipt_id: receiptId }, req);

          trackJob(notificationService.createNotification(
            student_email,
            'Face Attendance Registered',
            `Verified Present for ${session.subject} via ArcFace (${receiptId}).`,
            'attendance',
            'Info',
            { session_id: activeSessionId, subject: session.subject, receipt_id: receiptId }
          ).catch(console.error));

          // Broadcast update to admin live-logs WebSockets (never leak student PII globally)
          trackJob(notificationService.broadcastLiveLogs({
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
            receipt_id: receiptId,
            attendance_id: newRecord._id.toString(),
            subject: session.subject,
            room: session.room || null,
            timestamp: timestamp.toISOString(),
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
    // Central student attendance intelligence metrics (real DB-driven)
    router.get('/dashboard', authenticate, async (req, res) => {
      try {
        const email = req.userEmail;
        const summary = await getStudentAttendanceSummary(email);
        if (!summary) return res.status(404).json({ detail: 'User not found' });

        // Persist updated health score cache in background
        trackJob(AttendanceAnalytics.findOneAndUpdate(
          { student_email: email.toLowerCase() },
          {
            student_email: email.toLowerCase(),
            health_score: summary.health_score,
            standing: summary.standing,
            consecutive_absences: summary.risk?.consecutiveAbsences || 0,
            late_arrivals_count: summary.total_late || 0,
            last_calculated: new Date()
          },
          { upsert: true }
        ).catch(() => { }));

        res.json(summary);
      } catch (error) {
        reportInternalError(res, error, 'Attendance');
      }
    });

    // ─── GET /attendance/command-center ───────────────────────────────
    // Centralized command center dashboard for HODs & Admins
    router.get('/command-center', authenticate, requireRole(['admin', 'teacher']), async (req, res) => {
      try {
        // One aggregate + two counts instead of loading every analytics document.
        const [[totals], totalStudents, activeSessionsCount] = await Promise.all([
          AttendanceAnalytics.aggregate([
            {
              $group: {
                _id: null,
                avgHealth: { $avg: '$health_score' },
                criticalCount: { $sum: { $cond: [{ $lt: ['$health_score', 60] }, 1, 0] } },
                warningCount: {
                  $sum: {
                    $cond: [
                      { $and: [{ $gte: ['$health_score', 60] }, { $lt: ['$health_score', 75] }] },
                      1,
                      0
                    ]
                  }
                }
              }
            }
          ]),
          User.countDocuments({ role: 'student' }),
          Session.countDocuments({ is_active: true })
        ]);

        const criticalCount = (totals && totals.criticalCount) || 0;
        const warningCount = (totals && totals.warningCount) || 0;
        const avgHealth = totals ? Math.round(totals.avgHealth) : 85;

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

        const sessionIds = activeSessions.map((session) => session._id.toString());

        // One grouped tally + one user lookup replace three queries per session.
        const [attendanceCounts, teachers] = await Promise.all([
          Attendance.aggregate([
            { $match: { session_id: { $in: sessionIds } } },
            {
              $group: {
                _id: '$session_id',
                presentCount: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } },
                faceCount: { $sum: { $cond: [{ $eq: ['$verified_by', 'face'] }, 1, 0] } }
              }
            }
          ]),
          User.find(
            { email: { $in: activeSessions.map((session) => session.teacher_id) } },
            'email full_name'
          ).lean()
        ]);

        const countsBySession = new Map(attendanceCounts.map((row) => [row._id, row]));
        const teacherByEmail = new Map(teachers.map((teacher) => [teacher.email, teacher]));

        const sessionsTelemetry = [];
        for (const session of activeSessions) {
          const counts = countsBySession.get(session._id.toString());
          const presentCount = (counts && counts.presentCount) || 0;
          const faceCount = (counts && counts.faceCount) || 0;

          const teacher = teacherByEmail.get(session.teacher_id);

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

        const analytics = await AttendanceAnalytics.find(filter)
          .limit(500)
          .lean();

        const students = await User.find(
          { email: { $in: analytics.map((record) => record.student_email) } },
          'email full_name usn student_id department semester'
        ).lean();
        const studentByEmail = new Map(students.map((student) => [student.email, student]));

        const riskStudentsList = [];
        for (const record of analytics) {
          const student = studentByEmail.get(record.student_email);
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
        const email = req.userEmail.toLowerCase();
        const daysCount = Math.min(90, Math.max(7, parseInt(req.query.days || '30', 10)));

        const checkins = await Attendance.find({ student_email: email }).lean();
        const dateCounts = {};

        for (const c of checkins) {
          if (!c.timestamp) continue;
          const dateStr = new Date(c.timestamp).toISOString().split('T')[0];
          const st = (c.status || '').toLowerCase();
          if (st === 'cancelled' || st === 'cancelled session' || st === 'absent') {
            if (!(dateStr in dateCounts)) dateCounts[dateStr] = 0;
            continue;
          }
          dateCounts[dateStr] = (dateCounts[dateStr] || 0) + 1;
        }

        const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const now = new Date();
        const heatmap = [];
        for (let i = daysCount - 1; i >= 0; i--) {
          const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i));
          const iso = d.toISOString().split('T')[0];
          const count = dateCounts[iso] || 0;
          const intensity = count === 0 ? 0 : count === 1 ? 1 : count <= 3 ? 2 : count <= 5 ? 3 : 4;
          heatmap.push({
            day: dayLabels[d.getUTCDay()],
            date: iso,
            count,
            intensity,
          });
        }

        const totalCheckins = heatmap.reduce((s, d) => s + d.count, 0);
        const activeDays = heatmap.filter((d) => d.count > 0).length;

        res.json({
          ...dateCounts,
          heatmap,
          total_checkins: totalCheckins,
          active_days: activeDays,
        });
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
        const reportSessions = await Session.find(
          { _id: { $in: records.map((record) => record.session_id) } },
          'subject'
        ).lean();
        const reportSubjectBySessionId = new Map(
          reportSessions.map((session) => [session._id.toString(), session.subject])
        );

        if (format === 'csv') {
          res.setHeader('Content-disposition', 'attachment; filename=attendance_ledger.csv');
          res.set('Content-Type', 'text/csv');

          let csv = 'Date,Time,Subject,Verified By,Status\n';
          for (const rec of records) {
            const dateStr = rec.timestamp.toISOString().split('T')[0];
            const timeStr = rec.timestamp.toISOString().split('T')[1].substring(0, 5);
            csv += `${dateStr},${timeStr},"${reportSubjectBySessionId.get(rec.session_id) || 'Class'}",${rec.verified_by},${rec.status}\n`;
          }
          return res.send(csv);
        } else if (format === 'excel') {
          // Stream tab-separated spreadsheet which opens in Excel directly
          res.setHeader('Content-disposition', 'attachment; filename=attendance_ledger.xls');
          res.set('Content-Type', 'application/vnd.ms-excel');

          let xls = 'Date\tTime\tSubject\tVerified By\tStatus\n';
          for (const rec of records) {
            const dateStr = rec.timestamp.toISOString().split('T')[0];
            const timeStr = rec.timestamp.toISOString().split('T')[1].substring(0, 5);
            xls += `${dateStr}\t${timeStr}\t"${reportSubjectBySessionId.get(rec.session_id) || 'Class'}"\t${rec.verified_by}\t${rec.status}\n`;
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
        const history = await getStudentAttendanceHistory(email, req.query);
        if (!history) {
          return res.status(404).json({ detail: 'Student not found.' });
        }
        res.json(history);
      } catch (error) {
        reportInternalError(res, error, 'Attendance');
      }
    });

    // ─── GET /attendance/student/analytics/:email & /attendance/analytics/:email ──
    router.get(['/student/analytics/:email', '/analytics/:email'], authenticate, async (req, res) => {
      try {
        const email = req.params.email.trim().toLowerCase();
        if (!canReadStudentAttendance(req, email)) {
          return res.status(403).json({ detail: 'Forbidden: cannot access this student analytics.' });
        }
        const target = req.query.target != null ? Number(req.query.target) : undefined;
        const summary = await getStudentAttendanceSummary(email, { targetPercentage: target });
        if (!summary) {
          return res.status(404).json({ detail: 'Student not found.' });
        }

        res.json({
          overall_percentage: summary.overall_attendance ?? 0,
          has_records: summary.total_conducted > 0,
          total_present: summary.total_present,
          total_conducted: summary.total_conducted,
          total_missed: summary.total_missed,
          total_late: summary.total_late,
          total_excused: summary.total_excused,
          total_cancelled: summary.total_cancelled,
          health_score: summary.health_score,
          standing: summary.standing,
          eligible: summary.eligible,
          biometric_accuracy: summary.biometric_accuracy,
          policy: summary.policy,
          subjects: summary.subjects,
          weekly_trends: summary.weekly_trends,
          monthly_trends: summary.monthly_trends,
          streak: summary.streak,
          forecast: summary.forecast,
          risk: summary.risk,
          risk_alerts: summary.risk_alerts,
          predictions: {
            semester_projection: summary.forecast.maxPossiblePercentage ?? summary.overall_attendance ?? null,
            trend_direction: summary.risk.trendDirection,
            risk_level: summary.risk.riskLevel,
            missable_classes: summary.forecast.allowableAbsences,
            classes_needed: summary.forecast.classesNeeded,
          },
          personal_insights: summary.risk.recommendations.map((text) => ({ text, type: 'info' })),
          last_synced_at: summary.last_synced_at,
        });
      } catch (error) {
        reportInternalError(res, error, 'Attendance');
      }
    });

    // ─── POST /attendance/forecast/simulate ───────────────────────────
    router.post('/forecast/simulate', authenticate, async (req, res) => {
      try {
        const email = req.userEmail.toLowerCase();
        const summary = await getStudentAttendanceSummary(email);
        if (!summary) return res.status(404).json({ detail: 'Student not found.' });

        const target = req.body?.target != null ? Number(req.body.target) : summary.policy.minPercentage;
        const attendUpcoming = Math.max(0, Math.min(500, parseInt(req.body?.attend_upcoming ?? '0', 10) || 0));
        const missUpcoming = Math.max(0, Math.min(500, parseInt(req.body?.miss_upcoming ?? '0', 10) || 0));
        const subjectName = typeof req.body?.subject === 'string' && req.body.subject.trim() ? req.body.subject.trim() : null;

        let baseAttended = summary.total_present;
        let baseConducted = summary.total_conducted;
        if (subjectName && subjectName !== 'all') {
          const sub = summary.subjects.find((s) => s.subject.toLowerCase() === subjectName.toLowerCase());
          if (sub) {
            baseAttended = sub.attended;
            baseConducted = sub.conducted;
          } else {
            baseAttended = 0;
            baseConducted = 0;
          }
        }

        const simulation = simulateScenario({
          attended: baseAttended,
          conducted: baseConducted,
          attendUpcoming,
          missUpcoming,
          target,
        });

        res.json({
          success: true,
          scope: subjectName || 'overall',
          current: { attended: baseAttended, conducted: baseConducted },
          simulation,
        });
      } catch (error) {
        reportInternalError(res, error, 'Attendance');
      }
    });

    const AttendanceDispute = require('../models/AttendanceDispute');

    // ─── POST /attendance/disputes ────────────────────────────────────
    router.post('/disputes', authenticate, requireRole(['student', 'parent']), async (req, res) => {
      try {
        const { session_id, reason, reason_category, requested_status, subject, attendance_id, evidence_url, evidence_name } = req.body;
        if (!session_id || !reason || String(reason).trim().length < 5) {
          return res.status(400).json({ detail: 'session_id and a detailed reason (min 5 chars) are required.' });
        }
        const studentEmail = (req.userRole === 'parent' && req.body.student_email)
          ? String(req.body.student_email).trim().toLowerCase()
          : req.userEmail.toLowerCase();

        const user = await User.findOne({ email: studentEmail }, 'college_id college').lean();
        const policy = await getInstitutionPolicy(user);

        // Check institutional submission deadline if session exists
        if (mongoose.Types.ObjectId.isValid(session_id)) {
          const sess = await Session.findById(session_id, 'start_time subject').lean();
          if (sess?.start_time && policy.disputeDeadlineDays > 0) {
            const ageDays = (Date.now() - new Date(sess.start_time).getTime()) / 86400000;
            if (ageDays > policy.disputeDeadlineDays) {
              return res.status(400).json({
                detail: `Correction requests must be submitted within ${policy.disputeDeadlineDays} days of the class session.`
              });
            }
          }
        }

        const existing = await AttendanceDispute.findOne({
          student_email: studentEmail,
          session_id: String(session_id),
          status: { $in: ['Pending', 'Under Review'] }
        });
        if (existing) {
          return res.status(409).json({ detail: 'A pending correction request already exists for this session.' });
        }

        const validCategories = new Set([
          'facial_recognition_failure', 'qr_scanning_failure', 'incorrect_absence',
          'incorrect_late_marking', 'network_failure', 'faculty_recording_error',
          'institutional_activity', 'technical_issue', 'other'
        ]);
        const category = validCategories.has(reason_category) ? reason_category : 'other';

        const dispute = await AttendanceDispute.create({
          student_email: studentEmail,
          session_id: String(session_id),
          attendance_id: attendance_id || undefined,
          college_id: user?.college_id || req.userCollege || undefined,
          subject: subject || undefined,
          reason_category: category,
          reason: String(reason).trim().slice(0, 1000),
          requested_status: ['Present', 'Excused', 'Late'].includes(requested_status) ? requested_status : 'Present',
          evidence_url: typeof evidence_url === 'string' && /^(\/static\/|https:\/\/)/i.test(evidence_url) ? evidence_url : undefined,
          evidence_name: typeof evidence_name === 'string' ? evidence_name.slice(0, 150) : undefined,
          status: 'Pending',
          audit_trail: [{
            status: 'Pending',
            actor: req.userEmail,
            role: req.userRole,
            note: 'Correction request submitted',
            timestamp: new Date()
          }]
        });

        await auditLog(req.userEmail, req.userRole, 'DISPUTE_SUBMITTED', { dispute_id: dispute._id.toString(), session_id, category }, req);
        trackJob(notificationService.createNotification(
          studentEmail,
          'Correction Request Submitted',
          `Your attendance correction request for ${subject || session_id} has been submitted for faculty review.`,
          'attendance',
          'Info',
          { dispute_id: dispute._id.toString(), session_id }
        ).catch(console.error));

        res.status(201).json({ success: true, id: dispute._id.toString(), dispute: { ...dispute.toObject(), id: dispute._id.toString() } });
      } catch (error) {
        reportInternalError(res, error, 'Attendance');
      }
    });

    // ─── GET /attendance/disputes ─────────────────────────────────────
    router.get('/disputes', authenticate, async (req, res) => {
      try {
        const role = (req.userRole || '').toLowerCase();
        const filter = role === 'student'
          ? { student_email: req.userEmail.toLowerCase() }
          : (req.userCollege && role !== 'super_admin' ? { college_id: req.userCollege } : {});

        const disputes = await AttendanceDispute.find(filter).sort({ created_at: -1 }).limit(100).lean();
        const formatted = disputes.map(d => ({ ...d, id: d._id.toString() }));
        res.json({ disputes: formatted });
      } catch (error) {
        reportInternalError(res, error, 'Attendance');
      }
    });

    // ─── POST /attendance/disputes/:id/resolve ────────────────────────
    router.post('/disputes/:id/resolve', authenticate, requireRole(['teacher', 'hod', 'principal', 'admin', 'super_admin']), async (req, res) => {
      try {
        const { id } = req.params;
        const { action, remarks } = req.body;
        const normalizedAction = String(action || '').toLowerCase();
        if (!['approve', 'approved', 'reject', 'rejected', 'under_review'].includes(normalizedAction)) {
          return res.status(400).json({ detail: 'Action must be approve, reject, or under_review.' });
        }
        const isApproved = normalizedAction.startsWith('approve');
        const isUnderReview = normalizedAction === 'under_review';
        const dispute = await AttendanceDispute.findById(id);
        if (!dispute) {
          return res.status(404).json({ detail: 'Dispute not found.' });
        }

        dispute.status = isUnderReview ? 'Under Review' : (isApproved ? 'Approved' : 'Rejected');
        dispute.resolved_by = req.userEmail;
        dispute.remarks = remarks ? String(remarks).trim() : '';
        dispute.updated_at = new Date();
        if (!isUnderReview) dispute.resolved_at = new Date();
        dispute.audit_trail = dispute.audit_trail || [];
        dispute.audit_trail.push({
          status: dispute.status,
          actor: req.userEmail,
          role: req.userRole,
          note: dispute.remarks || `Marked as ${dispute.status}`,
          timestamp: new Date()
        });
        await dispute.save();

        if (isApproved) {
          await Attendance.updateOne(
            { student_email: dispute.student_email, session_id: dispute.session_id },
            {
              $set: {
                status: dispute.requested_status || 'Present',
                verified_by: 'manual',
                subject: dispute.subject || undefined,
                college_id: dispute.college_id || req.userCollege || undefined,
                remarks: dispute.remarks || 'Approved via attendance correction request',
                updated_at: new Date(),
                timestamp: new Date()
              }
            },
            { upsert: true }
          );
          trackJob(calculateHealthScore(dispute.student_email).catch(console.error));
        }

        trackJob(notificationService.createNotification(
          dispute.student_email,
          `Attendance Correction ${dispute.status}`,
          `Your attendance correction request for ${dispute.subject || dispute.session_id} was marked ${dispute.status.toLowerCase()}.`,
          'attendance',
          isApproved ? 'Info' : 'High',
          { dispute_id: dispute._id.toString(), session_id: dispute.session_id }
        ).catch(console.error));

        await auditLog(req.userEmail, req.userRole, 'DISPUTE_RESOLVED', { dispute_id: id, status: dispute.status }, req);
        res.json({ success: true, status: dispute.status, dispute });
      } catch (error) {
        reportInternalError(res, error, 'Attendance');
      }
    });

    module.exports = router;
