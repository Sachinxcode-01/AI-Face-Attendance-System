const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Groq = require('groq-sdk');

const User = require('../models/User');
const Session = require('../models/Session');
const Attendance = require('../models/Attendance');
const SecurityLog = require('../models/SecurityLog');
const Leave = require('../models/Leave');
const { authenticate, requireRole } = require('../middleware/auth');
const reportInternalError = require('../utils/httpError');
const datasetService = require('../services/datasetService');

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const MODEL_NAME = "llama-3.3-70b-versatile";

let groqClient = null;
if (GROQ_API_KEY) {
  groqClient = new Groq({ apiKey: GROQ_API_KEY });
}

// Helper: Calculate Streak
const getStreak = async (studentEmail) => {
  if (mongoose.connection.readyState !== 1) return 0;
  try {
    const logs = await Attendance.find({ student_email: studentEmail }).sort({ timestamp: -1 }).limit(100);
    if (logs.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const uniqueDates = Array.from(new Set(logs.map(log => {
      const d = new Date(log.timestamp);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    }))).sort((a, b) => b - a);

    let expectedTime = today.getTime();
    
    if (uniqueDates[0] !== expectedTime && uniqueDates[0] === expectedTime - 86400000) {
      expectedTime = expectedTime - 86400000;
    }

    for (const dateMs of uniqueDates) {
      if (dateMs === expectedTime) {
        streak++;
        expectedTime -= 86400000;
      } else if (dateMs > expectedTime) {
        continue;
      } else {
        break;
      }
    }

    return streak;
  } catch (err) {
    console.error("Streak calculation error:", err);
    return 0;
  }
};

// Helper: Get student attendance details
const getStudentAttendanceStats = async (email) => {
  const cleanEmail = (email || '').trim().toLowerCase();
  let streak = 0;
  try {
    streak = await getStreak(cleanEmail);
  } catch (_) {}

  // 1. Try real records from MongoDB
  let records = [];
  try {
    if (mongoose.connection.readyState === 1) {
      records = await Attendance.find({ student_email: cleanEmail }).lean();
    }
  } catch (_) {}

  if (records && records.length > 0) {
    const sessionIds = [...new Set(records.map(r => r.session_id))];
    const sessions = await Session.find({ _id: { $in: sessionIds } }, 'subject').lean();
    const subjectById = new Map(sessions.map(s => [s._id.toString(), s.subject]));

    const subjectMap = {};
    let presentCount = 0;
    for (const r of records) {
      const isPresent = r.status === 'Present';
      if (isPresent) presentCount++;
      const sub = subjectById.get(r.session_id?.toString()) || 'Core Lecture';
      if (!subjectMap[sub]) {
        subjectMap[sub] = { subject: sub, present: 0, total: 0 };
      }
      subjectMap[sub].total++;
      if (isPresent) subjectMap[sub].present++;
    }

    const subjects = Object.values(subjectMap).map(s => ({
      subject: s.subject,
      present: s.present,
      total: Math.max(s.total, s.present, 1),
      percentage: s.total > 0 ? parseFloat((s.present / Math.max(s.total, 1)).toFixed(2)) : 1.0,
    }));

    const totalPossible = subjects.reduce((sum, s) => sum + s.total, 0);
    const totalPresent = subjects.reduce((sum, s) => sum + s.present, 0);
    const overallPercentage = totalPossible > 0 ? parseFloat((totalPresent / totalPossible).toFixed(2)) : 0.0;

    let standing = 'Good Standing';
    if (overallPercentage >= 0.90) standing = 'Top Tier (Excellent)';
    else if (overallPercentage >= 0.75) standing = 'Good Standing';
    else if (overallPercentage >= 0.60) standing = 'Needs Improvement';
    else standing = 'Critical Risk';

    const rank = overallPercentage >= 0.90 ? 'Top 5%' : overallPercentage >= 0.80 ? 'Top 15%' : 'Top 30%';

    return {
      has_data: true,
      source: 'records',
      overall_percentage: overallPercentage,
      standing,
      rank,
      attended_sessions: presentCount,
      subjects,
      streak: streak,
    };
  }

  // 2. Fallback to datasetService if MongoDB has no records for this email
  const dsStats = datasetService.getStudentStats(cleanEmail);
  if (dsStats) {
    const rawPct = dsStats.overall_percentage;
    const overallPercentage = rawPct > 1.0 ? parseFloat((rawPct / 100.0).toFixed(2)) : parseFloat(rawPct.toFixed(2));
    const subjects = (dsStats.subjects || []).map(s => ({
      subject: s.subject,
      present: s.attended || s.present || 0,
      total: s.total || 0,
      percentage: s.percentage > 1.0 ? parseFloat((s.percentage / 100.0).toFixed(2)) : parseFloat((s.percentage || 0).toFixed(2)),
    }));

    return {
      has_data: true,
      source: 'dataset',
      overall_percentage: overallPercentage,
      standing: dsStats.standing || (overallPercentage >= 0.75 ? 'Good Standing' : 'Needs Improvement'),
      rank: dsStats.rank || null,
      attended_sessions: subjects.reduce((sum, s) => sum + s.present, 0),
      subjects,
      streak: streak,
    };
  }

  // Demo fallback only behind an explicit demo flag or environment variable
  if (process.env.ENABLE_DEMO_DATA === 'true') {
    return {
      has_data: true,
      source: 'demo',
      overall_percentage: 0.88,
      standing: 'Good Standing',
      rank: 'Top 10%',
      attended_sessions: 24,
      subjects: [
        { subject: 'Machine Learning', present: 19, total: 20, percentage: 0.95 },
        { subject: 'Cloud Architecture', present: 17, total: 20, percentage: 0.85 },
        { subject: 'Computer Networks', present: 16, total: 20, percentage: 0.80 }
      ],
      streak: streak,
    };
  }

  // 3. Fallback when no data exists: return has_data: false and zero or null values
  return {
    has_data: false,
    source: 'none',
    overall_percentage: 0,
    standing: null,
    rank: null,
    attended_sessions: 0,
    subjects: [],
    streak: streak,
  };
};

// Helper: Get attendance summary percentages
const getAttendanceSummary = async (email) => {
  const records = await Attendance.find({
    student_email: email,
    status: 'Present',
  }).select('session_id').lean();
  if (records.length === 0) return {};

  const sessionIds = [...new Set(records.map((record) => record.session_id))];
  const sessions = await Session.find({ _id: { $in: sessionIds } }, 'subject').lean();
  const subjectById = new Map(sessions.map((session) => [session._id.toString(), session.subject]));
  const summary = {};
  for (const record of records) {
    const subject = subjectById.get(record.session_id.toString());
    if (subject) summary[subject] = (summary[subject] || 0) + 1;
  }
  return Object.fromEntries(
    Object.entries(summary).map(([subject, count]) => [subject, `${count} recorded check-ins`]),
  );
};

// Helper: Get student insights from Groq
const getStudentInsights = async (studentName, attendanceSummary) => {
  if (!groqClient) {
    return "AI Analyst is currently offline. Please configure your GROQ_API_KEY.";
  }

  const keys = Object.keys(attendanceSummary);
  if (keys.length === 0) {
    return `No attendance data found for ${studentName} to analyze.`;
  }

  const summaryLines = keys.map(sub => `  - ${sub}: ${attendanceSummary[sub]}`).join('\n');

  const prompt = `Student Name: ${studentName}
Subject-wise Attendance:
${summaryLines}

Course schedule and enrollment records are unavailable, so these check-in counts cannot be converted into attendance percentages or eligibility. Do not infer a percentage, rank, or risk level.

Please summarize the recorded check-ins and give one encouraging, practical suggestion.

Keep the response concise (3-4 sentences) and professional.`;

  try {
    const response = await groqClient.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are SmartAttendance AI, an expert academic analyst. You provide concise, supportive, and actionable insights to help students improve their academic performance."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: MODEL_NAME,
      temperature: 0.6,
      max_tokens: 512
    });
    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error("[GroqAnalyst] API Error:", error);
    return `Analysis temporarily unavailable for ${studentName}. Please try again later.`;
  }
};

// ─── GET /student/stats/:email ──────────────────────────────────
router.get(['/student/stats/:email', '/ai/student/stats/:email'], authenticate, async (req, res) => {
  try {
    const { email } = req.params;
    
    const isSelf = req.userEmail && req.userEmail.toLowerCase() === email.toLowerCase();
    const isStaff = req.userRole && ['admin', 'teacher', 'hod', 'principal', 'management'].includes(req.userRole.toLowerCase());

    if (!isSelf && !isStaff) {
      return res.status(403).json({ detail: "Forbidden: You do not have permission to view these statistics." });
    }

    const stats = await getStudentAttendanceStats(email);
    res.json(stats);
  } catch (error) {
    reportInternalError(res, error, 'AI student stats');
  }
});

// ─── GET /admin/stats ───────────────────────────────────────────
router.get(['/admin/stats', '/ai/admin/stats'], authenticate, requireRole(['admin', 'super_admin', 'teacher']), async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalTeachers = await User.countDocuments({ role: 'teacher' });
    const activeSessions = await Session.countDocuments({ is_active: true });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const attendanceTodayStudents = await Attendance.distinct('student_email', {
      status: 'Present',
      timestamp: { $gte: todayStart },
    });
    const attendancePercentage = totalStudents > 0
      ? `${Math.round((attendanceTodayStudents.length / totalStudents) * 100)}%`
      : '0%';

    const intruderAlerts = await SecurityLog.countDocuments({ status: 'Active' });
    const pendingLeaves = await Leave.countDocuments({ status: "Pending" });

    res.json({
      total_students: String(totalStudents),
      total_teachers: String(totalTeachers),
      active_sessions: String(activeSessions),
      attendance_today: attendancePercentage,
      intruder_alerts: String(intruderAlerts),
      pending_leaves: String(pendingLeaves)
    });
  } catch (error) {
    reportInternalError(res, error, 'AI admin stats');
  }
});

// ─── GET /student/streak/:student_id ─────────────────────────────
router.get(['/student/streak/:student_id', '/ai/student/streak/:student_id'], authenticate, async (req, res) => {
  try {
    const { student_id } = req.params;
    
    const isSelf = req.userEmail && req.userEmail.toLowerCase() === student_id.toLowerCase();
    const isStaff = req.userRole && ['admin', 'teacher', 'hod', 'principal', 'management'].includes(req.userRole.toLowerCase());

    if (!isSelf && !isStaff) {
      return res.status(403).json({ detail: "Forbidden: You do not have permission to view this streak." });
    }

    const streak = await getStreak(student_id);
    res.json({ student_id, streak });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// ─── GET /student/ai-analysis/:student_id ────────────────────────
router.get(['/student/ai-analysis/:student_id', '/ai/student/ai-analysis/:student_id'], authenticate, async (req, res) => {
  try {
    const { student_id } = req.params;
    
    let student = await User.findOne({ email: student_id, role: 'student' });
    if (!student && mongoose.Types.ObjectId.isValid(student_id)) {
      student = await User.findOne({ _id: new mongoose.Types.ObjectId(student_id), role: 'student' });
    }

    if (!student) {
      return res.status(404).json({ detail: "Student not found" });
    }

    const isSelf = req.userEmail && req.userEmail.toLowerCase() === student.email.toLowerCase();
    const isStaff = req.userRole && ['admin', 'teacher', 'hod', 'principal', 'management'].includes(req.userRole.toLowerCase());

    if (!isSelf && !isStaff) {
      return res.status(403).json({ detail: "Forbidden: You do not have permission to view this analysis." });
    }

    const studentEmail = student.email;
    const attendanceSummary = await getAttendanceSummary(studentEmail);
    const analysis = await getStudentInsights(student.full_name, attendanceSummary);

    res.json({ analysis });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// ─── GET /admin/activity-log ────────────────────────────────────
router.get(['/admin/activity-log', '/ai/admin/activity-log'], authenticate, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const events = [];

    // Recent attendance marks
    const attendanceRecords = await Attendance.find().sort({ timestamp: -1 }).limit(50).lean();
    attendanceRecords.forEach(rec => {
      events.push({
        type: "attendance",
        icon: "check_circle",
        title: "Attendance Marked",
        detail: `${rec.student_email} marked present`,
        timestamp: rec.timestamp.toISOString(),
        color: "success"
      });
    });

    // Recent sessions
    const sessions = await Session.find().sort({ start_time: -1 }).limit(20).lean();
    sessions.forEach(s => {
      events.push({
        type: "session",
        icon: "play_circle",
        title: "Session Started",
        detail: `${s.subject} by ${s.teacher_id}`,
        timestamp: s.start_time.toISOString(),
        color: "info"
      });
    });

    // Security alerts
    const securityLogs = await SecurityLog.find().sort({ timestamp: -1 }).limit(20).lean();
    securityLogs.forEach(log => {
      events.push({
        type: "security",
        icon: "warning",
        title: "Security Alert",
        detail: `Intruder detected at ${log.location}`,
        timestamp: log.timestamp.toISOString(),
        color: "error"
      });
    });

    // Leave applications
    const leaves = await Leave.find().sort({ created_at: -1 }).limit(20).lean();
    leaves.forEach(leave => {
      events.push({
        type: "leave",
        icon: "event_busy",
        title: "Leave Request",
        detail: `${leave.user_id} — ${leave.reason} (${leave.status})`,
        timestamp: leave.created_at.toISOString(),
        color: "warning"
      });
    });

    // Sort by timestamp descending
    events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    res.json(events.slice(0, 80));
  } catch (error) {
    reportInternalError(res, error, 'AI activity log');
  }
});

// ─── POST /ai/ask ───────────────────────────────────────────────
router.post(['/ask', '/ai/ask'], authenticate, async (req, res) => {
  try {
    if (req.headers['x-groq-api-key']) {
      return res.status(400).json({ detail: 'Client-supplied AI credentials are not accepted.' });
    }
    const { email, query } = req.body;
    const targetEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (!targetEmail) return res.status(400).json({ detail: 'A student email is required.' });
    
    // Enforce data ownership check
    const role = (req.userRole || '').toLowerCase();
    const isSelf = role === 'student' && req.userEmail?.toLowerCase() === targetEmail;
    const isStaff = ['admin', 'super_admin', 'teacher', 'hod', 'principal', 'management'].includes(role);

    if (!isSelf && !isStaff) {
      return res.status(403).json({ detail: "Forbidden: You do not have permission to query this student's AI insights." });
    }

    const student = await User.findOne({ email: targetEmail, role: 'student' });
    if (!student) {
      return res.status(404).json({ detail: "Student not found." });
    }

    const attendanceSummary = await getAttendanceSummary(targetEmail);
    const analysis = await getStudentInsights(student.full_name, attendanceSummary);
    res.json({ answer: analysis, response: analysis });
  } catch (error) {
    console.error('[AI] /ask error:', error);
    res.status(503).json({ detail: 'AI service unavailable.', answer: 'AI Engine offline', response: 'AI Engine offline' });
  }
});

// Helper: Sanitize Prompts against Injection and NoSQL attacks
const sanitizePrompt = (text) => {
  if (typeof text !== 'string') return "";
  
  const injectionPatterns = [
    /ignore previous/i,
    /system prompt/i,
    /bypass restriction/i,
    /you are now/i,
    /acting as/i,
    /delete all/i,
    /drop table/i,
    /find\s*\(.*\)/i
  ];
  
  for (const pattern of injectionPatterns) {
    if (pattern.test(text)) {
      throw new Error("Potential prompt injection or security threat detected.");
    }
  }
  
  let sanitized = text.replace(/[\$\{\}]/g, "");
  return sanitized.trim();
};

// ─── FAQ & Knowledge Base for Smart Attendance AI ────────────────────────
const KNOWLEDGE_BASE = [
  {
    keywords: ["what is smart attendance", "about app", "how app works", "overview"],
    answer: "Smart Attendance AI is an enterprise academic attendance platform featuring AI face recognition, dynamic rolling QR codes, real-time analytics, leave management, and role-based portals for Students, Teachers, Parents, and Admins.",
    actions: []
  },
  {
    keywords: ["qr", "scan", "qr code", "mark qr"],
    answer: "To mark QR attendance: Go to the 'Scan' tab or QR Attendance screen, point your camera at the teacher's live rolling QR code, and hold steady. Your verification will log in real-time!",
    actions: [
      { type: "navigate", label: "Open QR Attendance", route: "/student/qr-attendance", roles: ["student"] }
    ]
  },
  {
    keywords: ["face", "facial", "recognition", "face attendance", "camera"],
    answer: "To use Face Verification: Open Face Attendance, align your face inside the circular scanner guide in a bright room, and wait for green biometric verification. Never use photos of screens.",
    actions: [
      { type: "navigate", label: "Open Face Attendance", route: "/student/face-attendance", roles: ["student"] }
    ]
  },
  {
    keywords: ["timetable", "schedule", "classes today", "class schedule"],
    answer: "You can check your daily schedule, time slots, subject names, and assigned classroom numbers on the Timetable screen.",
    actions: [
      { type: "navigate", label: "Open Timetable", route: "/student/timetable", roles: ["student"] }
    ]
  },
  {
    keywords: ["leave", "apply leave", "sick leave", "absent request"],
    answer: "To apply for leave: Go to Leave Hub, tap 'Apply Leave', pick your start and end dates, select leave category (Sick, Personal, Emergency, Academic), type your reason, and submit for faculty review.",
    actions: [
      { type: "navigate", label: "Apply for Leave", route: "/student/leave-apply", roles: ["student"] },
      { type: "navigate", label: "Review Leave Requests", route: "/teacher/leave-approvals", roles: ["teacher", "admin"] }
    ]
  },
  {
    keywords: ["report", "analytics", "percentage", "subject attendance", "download report"],
    answer: "You can view subject-wise attendance breakdown, overall percentages, monthly trends, and export CSV/PDF reports in the Reports section.",
    actions: [
      { type: "navigate", label: "View Reports", route: "/student/reports", roles: ["student"] },
      { type: "navigate", label: "View Analytics", route: "/teacher/reports", roles: ["teacher", "admin"] }
    ]
  },
  {
    keywords: ["start session", "generate qr", "teacher qr", "faculty portal"],
    answer: "Teachers can launch an attendance session by opening the Faculty Portal, choosing the target course/section, and tapping 'Generate Rolling QR' or starting 'Live Monitor'.",
    actions: [
      { type: "navigate", label: "Generate QR", route: "/teacher/qr-generator", roles: ["teacher"] },
      { type: "navigate", label: "Live Monitor", route: "/teacher/live-monitor", roles: ["teacher"] }
    ]
  },
  {
    keywords: ["ward", "child", "parent portal", "switch ward"],
    answer: "Parents can view linked ward attendance, subject performance, and leave history in the Parent Portal. Use the ward dropdown at top to switch between multiple children.",
    actions: [
      { type: "navigate", label: "Parent Portal", route: "/parent/dashboard", roles: ["parent"] }
    ]
  },
  {
    keywords: ["system health", "audit", "security", "logs", "admin portal"],
    answer: "Administrators can monitor live session telemetry, inspect security alerts and intruder logs, audit user accounts, and view institution analytics in the Command Center.",
    actions: [
      { type: "navigate", label: "System Health", route: "/admin/system-health", roles: ["admin", "hod"] },
      { type: "navigate", label: "Security Logs", route: "/admin/security-logs", roles: ["admin", "hod"] }
    ]
  },
  {
    keywords: ["photo", "profile photo", "avatar", "settings"],
    answer: "You can update your profile photo in Profile Settings. Choose a JPEG/PNG under 5 MB. Photos save permanently to server storage and update automatically across all screens.",
    actions: [
      { type: "navigate", label: "Open Profile", route: "/student/profile", roles: ["student", "teacher", "parent", "admin"] }
    ]
  }
];

// Navigation route allowlist per role
const ROUTE_ALLOWLIST = {
  student: [
    "/student/dashboard", "/student/timetable", "/student/qr-attendance",
    "/student/face-attendance", "/student/history", "/student/reports",
    "/student/leave-apply", "/student/leave-hub", "/notifications/nexus",
    "/student/profile", "/settings"
  ],
  teacher: [
    "/teacher/dashboard", "/teacher/classes", "/teacher/qr-generator",
    "/teacher/live-monitor", "/teacher/reports", "/teacher/leave-approvals",
    "/teacher/profile", "/settings"
  ],
  parent: [
    "/parent/dashboard", "/parent/reports", "/parent/alerts",
    "/parent/leave-status", "/parent/profile", "/settings"
  ],
  admin: [
    "/admin/dashboard", "/admin/users", "/admin/sessions",
    "/admin/reports", "/admin/system-health", "/admin/security-logs",
    "/admin/profile", "/settings"
  ],
  hod: [
    "/admin/dashboard", "/admin/users", "/admin/sessions",
    "/admin/reports", "/admin/system-health", "/admin/security-logs",
    "/admin/profile", "/settings"
  ]
};

// Filter suggested actions by role
const filterActionsForRole = (actions, role) => {
  if (!actions || !Array.isArray(actions)) return [];
  const normalizedRole = (role || 'student').toLowerCase();
  const allowedRoutes = ROUTE_ALLOWLIST[normalizedRole] || ROUTE_ALLOWLIST.student;

  return actions.filter(act => {
    if (act.roles && !act.roles.includes(normalizedRole)) return false;
    return allowedRoutes.some(r => act.route && act.route.startsWith(r));
  }).map(act => ({
    type: act.type || "navigate",
    label: act.label,
    route: act.route
  }));
};

// ─── POST /ai/feedback & /api/assistant/feedback ─────────────────────────────
const handleFeedbackRequest = async (req, res) => {
  try {
    const { responseId, rating, category, feedback, currentRoute } = req.body;
    const userId = req.userEmail || req.user?.email || "anonymous";
    const role = (req.userRole || 'student').toLowerCase();

    if (!rating || !['helpful', 'not_helpful'].includes(rating)) {
      return res.status(400).json({ detail: "Invalid rating. Must be 'helpful' or 'not_helpful'." });
    }

    const feedbackEntry = {
      feedbackId: `fb_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      responseId: responseId || `resp_${Date.now()}`,
      rating,
      category: category || "general",
      userId,
      role,
      currentRoute: currentRoute || "",
      feedback: typeof feedback === 'string' ? feedback.substring(0, 500) : "",
      createdAt: new Date().toISOString()
    };

    console.log("[Nexa Feedback Logged]", JSON.stringify(feedbackEntry));
    return res.json({ success: true, feedbackId: feedbackEntry.feedbackId });
  } catch (error) {
    console.error("[Nexa Feedback Error]", error);
    return res.status(500).json({ detail: "Feedback submission failed." });
  }
};

router.post(['/feedback', '/assistant/feedback', '/api/assistant/feedback', '/ai/feedback'], authenticate, handleFeedbackRequest);

// ─── POST /ai/chat & /api/assistant/chat ───────────────────────────────────────
const handleChatRequest = async (req, res) => {
  try {
    const message = req.body.message || req.body.query || "";
    const history = req.body.history || [];
    const conversationId = req.body.conversationId || `conv_${Date.now()}`;
    const currentRoute = req.body.currentRoute || req.body.screenContext || "";
    const language = (req.body.language || "en").toLowerCase(); // 'en', 'kn', 'hi'

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ detail: "Message is required." });
    }

    let cleanMessage;
    try {
      cleanMessage = sanitizePrompt(message);
    } catch (secError) {
      return res.status(400).json({ detail: secError.message });
    }

    const userRole = (req.userRole || 'student').toLowerCase();
    const userEmail = req.userEmail || req.user?.email || "user@smartface.ai";
    const userName = req.userName || req.user?.name || userEmail.split('@')[0];

    // Refuse requests for secrets, API keys, OTPs, or system prompts explicitly
    const secretsTriggers = ["api key", "groq key", "jwt secret", "system prompt", "otp", "password", "face embedding", "face vector"];
    if (secretsTriggers.some(st => cleanMessage.toLowerCase().includes(st))) {
      const refusalMsg = language === 'kn'
        ? "ನನ್ನ ಬಳಿ ಯಾವುದೇ ಸೀಕ್ರೆಟ್‌ಗಳು, ಎಪಿಐ ಕೀಗಳು ಅಥವಾ ಖಾಸಗಿ ಶ್ರೇಯಾಂಕಗಳ ಮಾಹಿತಿಯಿಲ್ಲ."
        : language === 'hi'
        ? "मेरे पास कोई गुप्त जानकारी, एपीआई कुंजी या पासवर्ड नहीं हैं।"
        : "I cannot expose secrets, API keys, OTPs, passwords, or system credentials.";
      return res.json({
        success: true,
        conversationId,
        reply: refusalMsg,
        message: {
          id: `msg_${Date.now()}`,
          role: "assistant",
          content: refusalMsg,
          createdAt: new Date().toISOString()
        },
        suggestedActions: []
      });
    }

    // Check for real data intent queries across roles
    const msgLower = cleanMessage.toLowerCase();
    let realDataAddendum = "";

    if (userRole === 'student') {
      if (msgLower.includes('my attendance') || msgLower.includes('attendance percentage') || msgLower.includes('overall attendance')) {
        const stats = await getStudentAttendanceStats(userEmail);
        realDataAddendum = (stats.has_data && stats.source !== 'none')
          ? ` [Attendance data: ${stats.attended_sessions} present check-ins recorded (source: ${stats.source}). Percentages and ranking are unavailable because course schedules and enrollment records are not configured.]`
          : ' [No recorded attendance check-ins found for your account.]';
      } else if (msgLower.includes('exam eligibility') || msgLower.includes('eligible for exam') || msgLower.includes('will i be eligible') || msgLower.includes('predictive') || msgLower.includes('velocity')) {
        realDataAddendum = ' [Exam eligibility and attendance projections are unavailable because course schedules, enrollment, and eligibility rules are not configured.]';
      } else if (msgLower.includes('classes today') || msgLower.includes('my schedule') || msgLower.includes('timetable') || msgLower.includes('missing the most')) {
        realDataAddendum = ' [No timetable data is available for this account.]';
      } else if (msgLower.includes('below eligibility') || msgLower.includes('low attendance') || msgLower.includes('critical attendance')) {
        realDataAddendum = ' [There is not enough subject-level attendance data to assess eligibility.]';
      } else if (msgLower.includes('leave status') || msgLower.includes('my leave')) {
        if (mongoose.connection.readyState === 1) {
          const leaves = await Leave.find({ user_id: userEmail }).sort({ created_at: -1 }).limit(3);
          realDataAddendum = leaves.length
            ? ` [Recent leave applications: ${leaves.map((leave) => `${leave.status}`).join(', ')}]`
            : ' [No leave applications are recorded.]';
        } else {
          realDataAddendum = ' [Leave application data is unavailable.]';
        }
      }
    } else if (userRole === 'teacher') {
      if (msgLower.includes('session active') || msgLower.includes('is my session active')) {
        if (mongoose.connection.readyState === 1) {
          const activeSession = await Session.findOne({ teacher_id: userEmail, is_active: true });
          realDataAddendum = activeSession
            ? ` [Active session: ${activeSession.subject}, started at ${activeSession.start_time.toLocaleTimeString()}.]`
            : ' [No active session is running for your account.]';
        } else {
          realDataAddendum = ' [Live session data is unavailable.]';
        }
      } else if (msgLower.includes('students present') || msgLower.includes('present count')) {
        if (mongoose.connection.readyState === 1) {
          const activeSession = await Session.findOne({ teacher_id: userEmail, is_active: true });
          if (activeSession) {
            const count = await Attendance.countDocuments({ session_id: activeSession._id });
            realDataAddendum = ` [Current session (${activeSession.subject}): ${count} students present.]`;
          } else {
            realDataAddendum = ' [No active session is running for your account.]';
          }
        } else {
          realDataAddendum = ' [Live attendance data is unavailable.]';
        }
      } else if (msgLower.includes('pending leave') || msgLower.includes('leave requests')) {
        if (mongoose.connection.readyState === 1) {
          const staff = await User.findOne({ email: userEmail }, 'department').lean();
          const departmentUsers = staff?.department
            ? await User.find({ department: staff.department }, 'email').lean()
            : [];
          const pendingCount = await Leave.countDocuments({
            user_id: { $in: departmentUsers.map((user) => user.email) },
            status: 'Pending',
          });
          realDataAddendum = ` [${pendingCount} pending leave applications are recorded in your department.]`;
        } else {
          realDataAddendum = ' [Pending leave data is unavailable.]';
        }
      }
    } else if (userRole === 'parent') {
      if (msgLower.includes('ward') || msgLower.includes('child attendance')) {
        realDataAddendum = ' [Linked student attendance data is not available for this account.]';
      } else if (msgLower.includes('alert') || msgLower.includes('absence alert')) {
        realDataAddendum = ' [Linked student alert data is not available for this account.]';
      }
    } else if (userRole === 'hod') {
      realDataAddendum = ' [Use the department overview for HOD-scoped analytics. Assistant analytics are not yet department-scoped.]';
    } else if (['admin', 'super_admin', 'principal', 'management'].includes(userRole)) {
      if (msgLower.includes('active sessions') || msgLower.includes('sessions active')) {
        if (mongoose.connection.readyState === 1) {
          const activeCount = await Session.countDocuments({ is_active: true });
          realDataAddendum = ` [There are ${activeCount} active attendance sessions.]`;
        } else {
          realDataAddendum = ' [Active session data is unavailable.]';
        }
      } else if (msgLower.includes('system health') || msgLower.includes('ai service')) {
        realDataAddendum = ` [MongoDB: ${mongoose.connection.readyState === 1 ? 'connected' : 'unavailable'}; AI provider: ${groqClient ? 'configured' : 'unavailable'}. This API does not report face recognition service health.]`;
      } else if (msgLower.includes('security') || msgLower.includes('alerts')) {
        if (mongoose.connection.readyState === 1) {
          const activeAlerts = await SecurityLog.countDocuments({ status: 'Active' });
          realDataAddendum = ` [There are ${activeAlerts} active security alerts.]`;
        } else {
          realDataAddendum = ' [Security alert data is unavailable.]';
        }
      } else if (msgLower.includes("today's attendance") || msgLower.includes('total attendance')) {
        if (mongoose.connection.readyState === 1) {
          const todayStart = new Date();
          todayStart.setHours(0, 0, 0, 0);
          const count = await Attendance.countDocuments({ timestamp: { $gte: todayStart } });
          realDataAddendum = ` [There are ${count} attendance records for today.]`;
        } else {
          realDataAddendum = ' [Today’s attendance data is unavailable.]';
        }
      }
    }
    // Match query against knowledge base
    let matchedKnowledge = null;
    for (const item of KNOWLEDGE_BASE) {
      if (item.keywords.some(kw => msgLower.includes(kw))) {
        matchedKnowledge = item;
        break;
      }
    }

    // Detect completely unrelated questions
    const unrelatedTriggers = ["weather", "president", "recipe", "movie", "football", "joke", "crypto", "stock"];
    const isUnrelated = unrelatedTriggers.some(t => msgLower.includes(t)) && !matchedKnowledge;

    if (isUnrelated) {
      const unrelatedReply = language === 'kn'
        ? "ನಾನು ಸ್ಮಾರ್ಟ್ ಅಟೆಂಡೆನ್ಸ್ AI, ಹಾಜರಾತಿ, ವೇಳಾಪಟ್ಟಿ, QR ಮತ್ತು ಮುಖ ಪರಿಶೀಲನೆಯಲ್ಲಿ ಸಹಾಯ ಮಾಡಲು ವಿನ್ಯಾಸಗೊಳಿಸಲಾಗಿದೆ."
        : language === 'hi'
        ? "मैं स्मार्ट अटेंडेंस एआई, उपस्थिति, समयसारणी, क्यूआर और फेस सत्यापन में सहायता के लिए डिज़ाइन किया गया हूँ।"
        : "I am designed to help with Smart Attendance AI, attendance workflows, schedules, reports, leave, QR attendance, face verification, and application support.";

      return res.json({
        success: true,
        conversationId,
        reply: unrelatedReply,
        message: {
          id: `msg_${Date.now()}`,
          role: "assistant",
          content: unrelatedReply,
          createdAt: new Date().toISOString()
        },
        suggestedActions: []
      });
    }

    // Language directive for prompt
    let langDirective = "Respond in English.";
    if (language === 'kn') {
      langDirective = "Respond in clear Kannada language (ಕನ್ನಡ). Technical labels like route names, IDs, or codes may remain in English.";
    } else if (language === 'hi') {
      langDirective = "Respond in clear Hindi language (हिंदी). Technical labels like route names, IDs, or codes may remain in English.";
    }

    // Construct system context prompt for Groq/Gemini LLM
    let systemContext = `You are Nexa Attendance Assistant, an expert AI helper for the Smart Attendance AI application.
You are chatting with an authenticated user: ${userName} (Role: ${userRole.toUpperCase()}, Email: ${userEmail}).
Current Screen Route: ${currentRoute || 'Dashboard'}.
Language Requirement: ${langDirective}
Core Instruction: Answer using verified application knowledge and the authenticated user's permitted role context.
Never reveal secrets, API keys, passwords, JWT tokens, or another user's data.
Never claim an action succeeded unless confirmed by an authorized API response.
For unrelated questions, politely state that you assist with Smart Attendance AI application features.
Keep responses concise, clear, professional, and helpful (max 2-4 short paragraphs).`;

    if (realDataAddendum) {
      systemContext += realDataAddendum;
    }

    // Try Groq LLM Provider
    if (groqClient) {
      try {
        const messages = [
          { role: "system", content: systemContext },
          ...(history || []).slice(-6).map(h => ({
            role: h.role === 'user' ? 'user' : 'assistant',
            content: h.content
          })),
          { role: "user", content: cleanMessage + (realDataAddendum || "") }
        ];

        const response = await groqClient.chat.completions.create({
          messages,
          model: MODEL_NAME,
          temperature: 0.5,
          max_tokens: 350
        });

        const reply = response.choices[0].message.content.trim();
        const actions = matchedKnowledge ? filterActionsForRole(matchedKnowledge.actions, userRole) : [];

        return res.json({
          success: true,
          conversationId,
          reply,
          message: {
            id: `msg_${Date.now()}`,
            role: "assistant",
            content: reply,
            createdAt: new Date().toISOString()
          },
          suggestedActions: actions
        });
      } catch (err) {
        console.error("[Nexa AI] Groq API Error:", err.message);
      }
    }

    // Fallback response using Knowledge Base or Deterministic Answer
    let fallbackReply = "";
    let actions = [];

    if (matchedKnowledge) {
      const answerObj = matchedKnowledge.answer;
      if (typeof answerObj === 'object' && answerObj !== null) {
        fallbackReply = answerObj[language] || answerObj['en'] || Object.values(answerObj)[0];
      } else {
        fallbackReply = answerObj;
      }
      if (realDataAddendum) {
        fallbackReply += ` ${realDataAddendum.replace(/\[|\]/g, '')}.`;
      }
      actions = filterActionsForRole(matchedKnowledge.actions, userRole);
    } else if (realDataAddendum) {
      if (language === 'kn') {
        fallbackReply = `ಇಲ್ಲಿದೆ ನಿಮ್ಮ ಖಾತೆಯ ನೈಜ ಡೇಟಾ: ${realDataAddendum.replace(/\[|\]/g, '')}. ಹೆಚ್ಚಿನ ಸಹಾಯಕ್ಕಾಗಿ ವೇಳಾಪಟ್ಟಿ ಅಥವಾ ವರದಿಗಳಿಗೆ ಹೋಗಿ.`;
      } else if (language === 'hi') {
        fallbackReply = `यहाँ आपका खाता डेटा है: ${realDataAddendum.replace(/\[|\]/g, '')}। यदि आपको सहायता चाहिए, तो आप रिपोर्ट देख सकते हैं।`;
      } else {
        fallbackReply = `Here is your verified account data: ${realDataAddendum.replace(/\[|\]/g, '')}. Let me know if you need help navigating to your timetable or reports!`;
      }
    } else {
      if (language === 'kn') {
        fallbackReply = `ನಮಸ್ಕಾರ ${userName}! ನಾನು ನಿಮ್ಮ ${userRole} ಡ್ಯಾಶ್‌ಬೋರ್ಡ್, QR ಸ್ಕ್ಯಾನಿಂಗ್, ಮುಖ ಹಾಜರಾತಿ, ವೇಳಾಪಟ್ಟಿ ಮತ್ತು ವರದಿಗಳಲ್ಲಿ ಸಹಾಯ ಮಾಡಬಲ್ಲೆ.`;
      } else if (language === 'hi') {
        fallbackReply = `नमस्ते ${userName}! मैं आपकी ${userRole} डैशबोर्ड, क्यूआर स्कैनिंग, फेस उपस्थिति और रिपोर्ट में मदद कर सकता हूँ।`;
      } else {
        fallbackReply = `Hello ${userName}! I can help you with your ${userRole} dashboard, QR scanning, face attendance, timetable, leave applications, and reports. What would you like to do?`;
      }

      if (userRole === 'student') {
        actions = [
          { type: "navigate", label: "Open QR Attendance", route: "/student/qr-attendance" },
          { type: "navigate", label: "View Timetable", route: "/student/timetable" }
        ];
      }
    }

    res.json({
      success: true,
      conversationId,
      reply: fallbackReply,
      message: {
        id: `msg_${Date.now()}`,
        role: "assistant",
        content: fallbackReply,
        createdAt: new Date().toISOString()
      },
      suggestedActions: actions
    });
  } catch (error) {
    console.error("Nexa Chat Error:", error);
    res.status(500).json({ detail: error.message || "Chat service error" });
  }
};

router.post(['/chat', '/assistant/chat', '/api/assistant/chat', '/ai/chat'], authenticate, handleChatRequest);

module.exports = router;

