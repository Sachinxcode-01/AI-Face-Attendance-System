const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Groq = require('groq-sdk');

const User = require('../models/User');
const Session = require('../models/Session');
const Attendance = require('../models/Attendance');
const SecurityLog = require('../models/SecurityLog');
const Leave = require('../models/Leave');
const AttendanceDispute = require('../models/AttendanceDispute');
const NexaConversation = require('../models/NexaConversation');
const { authenticate, requireRole } = require('../middleware/auth');
const reportInternalError = require('../utils/httpError');
const { getStudentAttendanceSummary } = require('../services/studentAttendanceService');
const { calculateTargetMetrics } = require('../services/attendanceCalculator');
const teacherService = require('../services/teacherService');

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const MODEL_NAME = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const GROQ_MODEL_FALLBACKS = [...new Set([MODEL_NAME, "llama-3.3-70b-versatile", "llama-3.1-8b-instant"])];

let groqClient = null;
if (GROQ_API_KEY) {
  groqClient = new Groq({ apiKey: GROQ_API_KEY, timeout: 10000, maxRetries: 1 });
}

async function runGroqCompletion(messages, { stream = false, maxTokens = 400 } = {}) {
  if (!groqClient) return null;
  let lastError = null;
  for (const model of GROQ_MODEL_FALLBACKS) {
    try {
      return await groqClient.chat.completions.create({
        messages,
        model,
        temperature: 0.3,
        max_tokens: maxTokens,
        stream,
      });
    } catch (err) {
      lastError = err;
      const msg = String(err?.message || '');
      if (msg.includes('model_not_found') || err?.status === 404) {
        continue;
      }
      throw err;
    }
  }
  throw lastError;
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

// Helper: Get student attendance details from real DB via deterministic engine
const getStudentAttendanceStats = async (email) => {
  const cleanEmail = (email || '').trim().toLowerCase();
  const summary = await getStudentAttendanceSummary(cleanEmail).catch(() => null);
  if (!summary) {
    return {
      has_data: false,
      source: 'none',
      overall_percentage: 0,
      standing: null,
      rank: null,
      attended_sessions: 0,
      conducted_sessions: 0,
      subjects: [],
      streak: 0,
      summary: null,
    };
  }
  const hasData = summary.total_conducted > 0;
  return {
    has_data: hasData,
    source: hasData ? 'records' : 'none',
    overall_percentage: hasData ? Number(((summary.overall_attendance || 0) / 100).toFixed(4)) : 0,
    standing: summary.standing,
    rank: null,
    attended_sessions: summary.total_present,
    conducted_sessions: summary.total_conducted,
    subjects: summary.subjects.map((s) => ({
      subject: s.subject,
      present: s.attended,
      total: s.conducted,
      percentage: s.conducted > 0 ? Number((s.percentage / 100).toFixed(4)) : 0,
      classes_needed: s.classes_needed,
      allowable_absences: s.allowable_absences,
    })),
    streak: summary.streak,
    summary,
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
    answer: "To mark QR attendance: Go to Classroom Check-in, switch to QR Mode, scan or enter the teacher's live rolling QR code token, and submit. Your verification logs in real-time with a receipt ID.",
    actions: [
      { type: "navigate", label: "Open Check-in", route: "/student/checkin", roles: ["student"] }
    ]
  },
  {
    keywords: ["face", "facial", "recognition", "face attendance", "camera"],
    answer: "To use Face Verification: Open Classroom Check-in in Face Mode, align your face inside the frame in good lighting, and click Verify Face. Never use photos or screens.",
    actions: [
      { type: "navigate", label: "Open Face Check-in", route: "/student/checkin", roles: ["student"] }
    ]
  },
  {
    keywords: ["timetable", "schedule", "classes today", "class schedule"],
    answer: "You can check your daily schedule, time slots, live class status, cancelled/rescheduled updates, and export ICS calendars on the Timetable screen.",
    actions: [
      { type: "navigate", label: "Open Timetable", route: "/student/timetable", roles: ["student"] }
    ]
  },
  {
    keywords: ["leave", "apply leave", "sick leave", "absent request"],
    answer: "To apply for leave: Go to Apply Leave, pick your leave type and dates, attach supporting documents if needed, and submit for faculty review.",
    actions: [
      { type: "navigate", label: "Apply for Leave", route: "/student/leave/apply", roles: ["student"] },
      { type: "navigate", label: "Review Leave Requests", route: "/teacher/leave-approvals", roles: ["teacher", "admin"] }
    ]
  },
  {
    keywords: ["report", "analytics", "percentage", "subject attendance", "download report"],
    answer: "You can view subject-wise attendance breakdowns, deterministic forecasts, and download CSV/Excel/PDF-ready reports in Attendance & Analytics.",
    actions: [
      { type: "navigate", label: "View Analytics", route: "/student/analytics", roles: ["student"] },
      { type: "navigate", label: "View Attendance & Reports", route: "/student/attendance", roles: ["student"] },
      { type: "navigate", label: "View Analytics", route: "/teacher/reports", roles: ["teacher", "admin"] }
    ]
  },
  {
    keywords: ["start session", "generate qr", "teacher qr", "faculty portal"],
    answer: "Teachers can launch an attendance session from Session Management, project a rotating anti-proxy QR code in QR Projector, or run Kiosk Mode for biometric verification.",
    actions: [
      { type: "navigate", label: "QR Projector", route: "/teacher/qr-projector", roles: ["teacher"] },
      { type: "navigate", label: "Sessions", route: "/teacher/sessions", roles: ["teacher"] }
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
    "/student", "/student/checkin", "/student/attendance", "/student/timetable",
    "/student/leave", "/student/leave/apply", "/student/analytics", "/student/ai-chat",
    "/student/notifications", "/student/profile",
    "/student/dashboard", "/student/qr-attendance", "/student/face-attendance",
    "/student/history", "/student/reports", "/student/leave-apply", "/student/leave-hub",
    "/notifications/nexus", "/settings"
  ],
  teacher: [
    "/teacher", "/teacher/sessions", "/teacher/sessions/create", "/teacher/qr-projector",
    "/teacher/kiosk", "/teacher/roster", "/teacher/leave-approvals", "/teacher/disputes",
    "/teacher/analytics", "/teacher/timetable", "/teacher/notifications", "/teacher/reports",
    "/teacher/ai-chat", "/teacher/profile", "/settings"
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
    const localTeacherDetails = [];

    if (userRole === 'student') {
      const summary = await getStudentAttendanceSummary(userEmail).catch(() => null);
      if (summary) {
        const pct = summary.overall_attendance;
        const target = summary.policy?.minPercentage ?? 75;
        const targetMatch = msgLower.match(/(\d{1,3})\s*%/);
        const parsedTarget = targetMatch ? parseInt(targetMatch[1], 10) : NaN;
        const requestedTarget = (Number.isInteger(parsedTarget) && parsedTarget >= 1 && parsedTarget <= 100)
          ? parsedTarget
          : target;
        const targetForecast = calculateTargetMetrics({
          attended: summary.total_present,
          conducted: summary.total_conducted,
          target: requestedTarget,
          remainingClasses: summary.forecast?.remainingClasses ?? null,
        });

        const lowestSub = [...(summary.subjects || [])]
          .filter((s) => s.conducted > 0)
          .sort((a, b) => a.percentage - b.percentage)[0];
        const nextCls = (summary.upcoming_classes || [])[0];
        const leaves = mongoose.connection.readyState === 1
          ? await Leave.find({ user_id: userEmail.toLowerCase() }).sort({ created_at: -1 }).limit(3).lean()
          : [];
        const disputes = mongoose.connection.readyState === 1
          ? await AttendanceDispute.find({ student_email: userEmail.toLowerCase() }).sort({ created_at: -1 }).limit(3).lean()
          : [];

        const parts = [];
        if (summary.total_conducted === 0) {
          parts.push(`Attendance: 0 conducted classes recorded yet (Policy minimum: ${target}%).`);
        } else {
          parts.push(
            `Attendance: ${pct}% (${summary.total_present}/${summary.total_conducted} conducted, ${summary.total_missed} missed, ${summary.streak}-day streak, Risk: ${summary.risk?.riskLevel}).`
          );
          if (targetForecast.classesNeeded === null) {
            parts.push(`Target ${requestedTarget}%: mathematically impossible after an absence.`);
          } else if (targetForecast.classesNeeded > 0) {
            parts.push(`Target ${requestedTarget}%: need ${targetForecast.classesNeeded} consecutive class(es) (Status: ${targetForecast.statusNote}).`);
          } else {
            parts.push(`Target ${requestedTarget}%: eligible (${targetForecast.allowableAbsences} safe absence(s) remaining).`);
          }
        }
        if (lowestSub) {
          parts.push(`Lowest subject: ${lowestSub.subject} at ${lowestSub.percentage}% (${lowestSub.attended}/${lowestSub.conducted}, needs ${lowestSub.classes_needed ?? 0} to reach ${target}%).`);
        }
        if (nextCls) {
          parts.push(`Next class today: ${nextCls.subject} at ${nextCls.time} in ${nextCls.room} (${nextCls.status}).`);
        } else if (summary.today_classes?.length) {
          parts.push(`Today's classes (${summary.today_classes.length}): ${summary.today_classes.map((c) => `${c.subject} @ ${c.time} [${c.status}]`).join('; ')}.`);
        } else {
          parts.push('No classes scheduled for today in timetable.');
        }
        if (leaves.length) {
          parts.push(`Recent leaves: ${leaves.map((l) => `${l.category || 'Leave'} (${l.start_date}..${l.end_date}): ${l.status}`).join('; ')}.`);
        }
        if (disputes.length) {
          parts.push(`Correction requests: ${disputes.map((d) => `${d.subject || d.session_id}: ${d.status}`).join('; ')}.`);
        }
        parts.push(
          `Policy: min ${target}%, approved leave counts as present=${Boolean(summary.policy?.approvedLeaveCountsAsPresent)}, dispute window=${summary.policy?.disputeDeadlineDays ?? 14} days.`
        );
        realDataAddendum = ` [${parts.join(' ')}]`;
      } else {
        realDataAddendum = ' [Student attendance profile unavailable right now.]';
      }
    } else if (userRole === 'teacher') {
            if (mongoose.connection.readyState === 1) {
              const thresholdMatch = msgLower.match(/(\d{1,3})\s*%/);
              const parsedThreshold = thresholdMatch ? parseInt(thresholdMatch[1], 10) : NaN;
              const explicitTarget = (Number.isInteger(parsedThreshold) && parsedThreshold >= 1 && parsedThreshold <= 100)
                ? parsedThreshold
                : null;
              const [dash, analyticsData] = await Promise.all([
                teacherService.getTeacherDashboard(userEmail).catch(() => null),
                teacherService.getTeacherAnalyticsAndRisk(
                  userEmail,
                  explicitTarget ? { targetPercentage: explicitTarget } : {}
                ).catch(() => null),
              ]);
              if (dash) {
                const targetThreshold = explicitTarget ?? (dash.academic_info?.min_percentage ?? 75);

                const parts = [];
                parts.push(
                  `Faculty Overview (${dash.department || 'Department'} | ${dash.academic_info?.semester || 'Current Semester'}): ` +
                  `${dash.active_sessions} active session(s), ${dash.total_sessions} total sessions, ` +
                  `${dash.total_assigned_students} assigned students, overall attendance ${dash.overall_attendance_rate}% (policy min ${dash.academic_info?.min_percentage ?? 75}%).`
                );
                parts.push(
                  `Today: ${dash.attendance_today} check-ins recorded, ${dash.completed_lectures_today} completed / ${dash.upcoming_lectures_today} upcoming / ${dash.cancelled_lectures_today} cancelled lecture(s).`
                );
                const nextLecture = (dash.today_schedule || []).find((s) => s.status === 'live' || s.status === 'upcoming');
                if (nextLecture) {
                  parts.push(`Next/Current lecture: ${nextLecture.subject} at ${nextLecture.time} in ${nextLecture.room} (${nextLecture.status}).`);
                }
                parts.push(`Pending inbox: ${dash.pending_leaves} leave request(s), ${dash.pending_disputes} attendance dispute(s), ${dash.unread_notifications} unread notification(s).`);

                if (dash.subject_wise_attendance?.length) {
                  const sortedSubs = [...dash.subject_wise_attendance].sort((a, b) => a.attendance_rate - b.attendance_rate);
                  const lowest = sortedSubs[0];
                  parts.push(
                    `Subjects (${sortedSubs.length}): ${sortedSubs.map((s) => `${s.subject} ${s.attendance_rate}% (${s.present_count}/${s.conducted_marks})`).join('; ')}. Lowest subject: ${lowest.subject} (${lowest.attendance_rate}%).`
                  );
                }

                if (analyticsData) {
                  const cmp = analyticsData.month_comparison;
                  parts.push(`Monthly comparison: current month ${cmp.current_month}% vs previous month ${cmp.previous_month}% (delta ${cmp.delta >= 0 ? '+' : ''}${cmp.delta}%).`);

                  const belowTarget = (analyticsData.risk_students || []).filter((s) => s.conducted > 0 && s.attendance_rate < targetThreshold);
                  if (belowTarget.length > 0) {
                    parts.push(`Aggregate count below ${targetThreshold}%: ${belowTarget.length} student(s) currently below target across your sessions.`);
                    const sample = belowTarget.slice(0, 8).map((s) => {
                      const targetCalc = calculateTargetMetrics({
                        attended: s.attended,
                        conducted: s.conducted,
                        target: targetThreshold,
                      });
                      const needed = explicitTarget ? targetCalc.classesNeeded : s.classes_needed;
                      return `${s.full_name} (${s.student_id || 'ID N/A'}): ${s.attendance_rate}% [${s.attended}/${s.conducted}, needs ${needed ?? 'N/A'} classes for ${targetThreshold}%, ${s.risk_level}]`;
                    });
                    localTeacherDetails.push(`Students below ${targetThreshold}% (${belowTarget.length}): ${sample.join('; ')}.`);
                  } else {
                    parts.push(`0 students currently below ${targetThreshold}% across your sessions.`);
                  }

                  const consecutive = (analyticsData.risk_students || []).filter((s) => s.consecutive_absences >= 3);
                  if (consecutive.length > 0) {
                    parts.push(`Consecutive absences (>=3): ${consecutive.length} student(s).`);
                    localTeacherDetails.push(
                      `Consecutive absences (>=3): ${consecutive.slice(0, 6).map((s) => `${s.full_name} (${s.consecutive_absences} consecutive)`).join(', ')}.`
                    );
                  }
                }

                realDataAddendum = ` [${parts.join(' ')}]`;
              } else {
                realDataAddendum = ' [Teacher profile or classroom telemetry unavailable right now.]';
              }
            } else {
              realDataAddendum = ' [Live classroom telemetry is unavailable.]';
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
          // Match query against knowledge base (prioritizing role-specific & longest keyword matches)
          let matchedKnowledge = null;
          let bestScore = -1;
          for (const item of KNOWLEDGE_BASE) {
            const matchedKeywords = item.keywords.filter((kw) => msgLower.includes(kw));
            if (matchedKeywords.length === 0) continue;
            const roleActions = filterActionsForRole(item.actions, userRole);
            const hasRoleMatch = roleActions.length > 0 ? 1 : 0;
            const maxKwLen = Math.max(...matchedKeywords.map((kw) => kw.length));
            const score = hasRoleMatch * 1000 + maxKwLen;
            if (score > bestScore) {
              bestScore = score;
              matchedKnowledge = item;
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

          // Construct system context prompt (PII-minimized: never send email/phone/IDs to external AI)
          let systemContext = `You are Nexa Attendance Assistant, an expert AI helper for the Smart Attendance AI application.
You are assisting an authenticated ${userRole.toUpperCase()} user (${userName.split(' ')[0]}).
Current Screen Route: ${currentRoute || 'Dashboard'}.
Language Requirement: ${langDirective}
Core Instruction: Use ONLY the deterministic verified figures in brackets below. NEVER invent attendance records, timetable slots, or policies, and NEVER compute percentages or class counts in your head when deterministic numbers are provided.
Never reveal secrets, API keys, passwords, JWT tokens, biometric embeddings, or another user's data.
Never claim an action succeeded unless confirmed by an authorized API response.
Keep responses concise, structured, and actionable(2 - 4 short paragraphs or bullet points).`;

          if (realDataAddendum) {
            systemContext += realDataAddendum;
          }

          const persistMessages = async (convId, userText, assistantText, actionsList) => {
            if (mongoose.connection.readyState !== 1) return;
            try {
              const userMsg = { id: `msg_u_${Date.now()} `, role: 'user', content: userText, createdAt: new Date() };
              const aiMsg = { id: `msg_a_${Date.now() + 1} `, role: 'assistant', content: assistantText, suggestedActions: actionsList || [], createdAt: new Date() };
              const title = userText.slice(0, 60);
              await NexaConversation.findOneAndUpdate(
                { _id: mongoose.Types.ObjectId.isValid(convId) ? convId : new mongoose.Types.ObjectId(), user_email: userEmail.toLowerCase() },
                {
                  $setOnInsert: { user_email: userEmail.toLowerCase(), college_id: req.userCollege || undefined, title, created_at: new Date() },
                  $set: { updated_at: new Date() },
                  $push: { messages: { $each: [userMsg, aiMsg], $slice: -60 } }
                },
                { upsert: true, new: true }
              );
            } catch (_) { }
          };

          // Helper to write SSE payload when /stream endpoint is requested
          const wantsStream = req.path.endsWith('/stream');
          const sendChatResult = async (replyText, actionsList) => {
            const localSuffix = (userRole === 'teacher' && localTeacherDetails.length > 0)
              ? `\n\n${localTeacherDetails.join('\n')}`
              : '';
            const fullReplyText = `${replyText}${localSuffix}`;
            const msgId = `msg_${Date.now()}`;
            await persistMessages(conversationId, cleanMessage, fullReplyText, actionsList);
            const payload = {
              success: true,
              conversationId,
              reply: fullReplyText,
              message: {
                id: msgId,
                role: 'assistant',
                content: fullReplyText,
                createdAt: new Date().toISOString(),
              },
              suggestedActions: actionsList,
            };
            if (!wantsStream) {
              return res.json(payload);
            }
            if (!res.headersSent) {
              res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
              res.setHeader('Cache-Control', 'no-cache, no-transform');
              res.setHeader('Connection', 'keep-alive');
              res.flushHeaders?.();
            }
            res.write(`event: delta\ndata: ${JSON.stringify({ text: fullReplyText })}\n\n`);
            res.write(`event: done\ndata: ${JSON.stringify(payload)}\n\n`);
            return res.end();
          };

          // Try Groq LLM Provider (with SSE streaming when /stream is used)
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
              const actions = matchedKnowledge ? filterActionsForRole(matchedKnowledge.actions, userRole) : [];

              if (wantsStream) {
                const streamResp = await runGroqCompletion(messages, { stream: true, maxTokens: 400 });
                if (streamResp) {
                  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
                  res.setHeader('Cache-Control', 'no-cache, no-transform');
                  res.setHeader('Connection', 'keep-alive');
                  res.flushHeaders?.();
                  let fullReply = '';
                  for await (const chunk of streamResp) {
                    const delta = chunk?.choices?.[0]?.delta?.content || '';
                    if (delta) {
                      fullReply += delta;
                      res.write(`event: delta\ndata: ${JSON.stringify({ text: delta })}\n\n`);
                    }
                  }
                  const localSuffix = (userRole === 'teacher' && localTeacherDetails.length > 0)
                    ? `\n\n${localTeacherDetails.join('\n')}`
                    : '';
                  if (localSuffix) {
                    res.write(`event: delta\ndata: ${JSON.stringify({ text: localSuffix })}\n\n`);
                  }
                  const finalReply = (fullReply.trim() || 'No response generated.') + localSuffix;
                  const msgId = `msg_${Date.now()}`;
                  await persistMessages(conversationId, cleanMessage, finalReply, actions);
                  res.write(`event: done\ndata: ${JSON.stringify({
                    success: true,
                    conversationId,
                    reply: finalReply,
                    message: { id: msgId, role: 'assistant', content: finalReply, createdAt: new Date().toISOString() },
                    suggestedActions: actions,
                  })}\n\n`);
                  return res.end();
                }
              } else {
                const response = await runGroqCompletion(messages, { stream: false, maxTokens: 400 });
                const reply = response.choices[0].message.content.trim();
                return await sendChatResult(reply, actions);
              }
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
              fallbackReply += ` ${realDataAddendum.replace(/\[|\]/g, '')} `;
            }
            actions = filterActionsForRole(matchedKnowledge.actions, userRole);
          } else if (realDataAddendum) {
            if (language === 'kn') {
              fallbackReply = `ಇಲ್ಲಿದೆ ನಿಮ್ಮ ಖಾತೆಯ ನೈಜ ಡೇಟಾ: ${realDataAddendum.replace(/\[|\]/g, '')}.`;
            } else if (language === 'hi') {
              fallbackReply = `यहाँ आपका सत्यापित खाता डेटा है: ${realDataAddendum.replace(/\[|\]/g, '')}।`;
            } else {
              fallbackReply = `Here is your verified academic attendance summary: ${realDataAddendum.replace(/\[|\]/g, '')} `;
            }
          } else {
            if (language === 'kn') {
              fallbackReply = `ನಮಸ್ಕಾರ ${userName} !ನಾನು ನಿಮ್ಮ ${userRole} ಡ್ಯಾಶ್‌ಬೋರ್ಡ್, QR ಸ್ಕ್ಯಾನಿಂಗ್, ಮುಖ ಹಾಜರಾತಿ, ವೇಳಾಪಟ್ಟಿ ಮತ್ತು ವರದಿಗಳಲ್ಲಿ ಸಹಾಯ ಮಾಡಬಲ್ಲೆ.`;
            } else if (language === 'hi') {
              fallbackReply = `नमस्ते ${userName} !मैं आपकी ${userRole} डैशबोर्ड, क्यूआर स्कैनिंग, फेस उपस्थिति और रिपोर्ट में मदद कर सकता हूँ।`;
            } else {
              fallbackReply = `Hello ${userName} !I can help you with your ${userRole} dashboard, QR scanning, face attendance, timetable, leave applications, and reports.What would you like to do? `;
            }

            if (userRole === 'student') {
              actions = [
                { type: "navigate", label: "Open Face/QR Check-in", route: "/student/checkin" },
                { type: "navigate", label: "View Timetable", route: "/student/timetable" }
              ];
            }
          }

          return await sendChatResult(fallbackReply, actions);
        } catch (error) {
          console.error("Nexa Chat Error:", error);
          if (!res.headersSent) {
            res.status(500).json({ detail: 'Chat service error.' });
          } else {
            res.end();
          }
        }
      };

      router.post(
        [
          '/chat',
          '/assistant/chat',
          '/api/assistant/chat',
          '/ai/chat',
          '/chat/stream',
          '/assistant/chat/stream',
          '/api/assistant/chat/stream',
          '/ai/chat/stream',
        ],
        authenticate,
        handleChatRequest
      );

      // ─── Persistent Nexa Conversation Management ─────────────────────────────
      router.get(['/ai/conversations', '/conversations'], authenticate, async (req, res) => {
        try {
          const email = req.userEmail.toLowerCase();
          const convs = await NexaConversation.find({ user_email: email })
            .sort({ updated_at: -1 })
            .limit(25)
            .lean();
          res.json({
            conversations: convs.map((c) => ({
              id: c._id.toString(),
              title: c.title,
              message_count: (c.messages || []).length,
              updated_at: c.updated_at,
              created_at: c.created_at,
              messages: c.messages || []
            }))
          });
        } catch (error) {
          reportInternalError(res, error, 'Nexa:Conversations');
        }
      });

      router.delete(['/ai/conversations/:id', '/conversations/:id'], authenticate, async (req, res) => {
        try {
          const { id } = req.params;
          if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ detail: 'Invalid conversation ID.' });
          }
          const deleted = await NexaConversation.findOneAndDelete({ _id: id, user_email: req.userEmail.toLowerCase() });
          if (!deleted) return res.status(404).json({ detail: 'Conversation not found.' });
          res.json({ success: true, message: 'Conversation deleted.' });
        } catch (error) {
          reportInternalError(res, error, 'Nexa:DeleteConversation');
        }
      });

      module.exports = router;

