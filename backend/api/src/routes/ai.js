'use strict';

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const User = require('../models/User');
const Session = require('../models/Session');
const Attendance = require('../models/Attendance');
const SecurityLog = require('../models/SecurityLog');
const Leave = require('../models/Leave');
const AIActionConfirmation = require('../models/AIActionConfirmation');
const { authenticate, requireRole } = require('../middleware/auth');
const reportInternalError = require('../utils/httpError');
const { getStudentAttendanceSummary } = require('../services/studentAttendanceService');
const { routeGenerate } = require('../modules/nexa/providers/provider-router');
const { ChatRequestSchema } = require('../modules/nexa/security/input-validation');
const { processNexaRequest } = require('../modules/nexa/orchestration/orchestrator');
const {
  listConversations,
  updateConversation,
  deleteConversation,
  getUserPreferences,
  upsertUserPreferences,
  recordFeedback,
} = require('../modules/nexa/memory/conversation.service');
const { getUsageSummary } = require('../modules/nexa/monitoring/ai-metrics');

// ─── Legacy Helper: Calculate Streak ────────────────────────────────────────
const getStreak = async (studentEmail) => {
  if (mongoose.connection.readyState !== 1) return 0;
  try {
    const logs = await Attendance.find({ student_email: studentEmail }).sort({ timestamp: -1 }).limit(100);
    if (logs.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const uniqueDates = Array.from(
      new Set(
        logs.map((log) => {
          const d = new Date(log.timestamp);
          d.setHours(0, 0, 0, 0);
          return d.getTime();
        })
      )
    ).sort((a, b) => b - a);

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
    console.error('Streak calculation error:', err);
    return 0;
  }
};

// ─── Legacy Helper: Get student attendance details via deterministic engine ──
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

const getAttendanceSummary = async (email) => {
  const records = await Attendance.find({
    student_email: email,
    status: 'Present',
})
    .select('session_id')
  .lean();
if (records.length === 0) return {};

const sessionIds = [...new Set(records.map((record) => record.session_id))];
const sessions = await Session.find({ _id: { $in: sessionIds } }, 'subject').lean();
const subjectById = new Map(sessions.map((session) => [session._id.toString(), session.subject]));
const summary = {};
for (const record of records) {
  const subject = subjectById.get(record.session_id.toString());
  if (subject) summary[subject] = (summary[subject] || 0) + 1;
}
return Object.fromEntries(Object.entries(summary).map(([subject, count]) => [subject, `${count} recorded check-ins`]));
};

const getStudentInsights = async (studentName, attendanceSummary) => {
  const keys = Object.keys(attendanceSummary);
  if (keys.length === 0) {
    return `No attendance data found for ${studentName} to analyze.`;
  }
  const summaryLines = keys.map((sub) => `  - ${sub}: ${attendanceSummary[sub]}`).join('\n');
  const prompt = `Student Name: ${studentName}\nSubject-wise Attendance:\n${summaryLines}\n\nCourse schedule and enrollment records are unavailable, so these check-in counts cannot be converted into attendance percentages or eligibility. Do not infer a percentage, rank, or risk level.\nPlease summarize the recorded check-ins and give one encouraging, practical suggestion.\nKeep the response concise (3-4 sentences) and professional.`;

  const res = await routeGenerate({
    messages: [
      {
        role: 'system',
        content:
          'You are SmartAttendance AI, an expert academic analyst. You provide concise, supportive, and actionable insights.',
      },
      { role: 'user', content: prompt },
    ],
    maxTokens: 400,
    temperature: 0.4,
  });

  if (res.text) return res.text;
  return `Recorded check-ins for ${studentName}: ${keys.map((k) => `${k} (${attendanceSummary[k]})`).join(', ')}.`;
};

// ─── GET /student/stats/:email ──────────────────────────────────────────────
router.get(['/student/stats/:email', '/ai/student/stats/:email'], authenticate, async (req, res) => {
  try {
    const { email } = req.params;
    const isSelf = req.userEmail && req.userEmail.toLowerCase() === email.toLowerCase();
    const isStaff = req.userRole && ['admin', 'teacher', 'hod', 'principal', 'management'].includes(req.userRole.toLowerCase());
    if (!isSelf && !isStaff) {
      return res.status(403).json({ detail: 'Forbidden: You do not have permission to view these statistics.' });
    }
    const stats = await getStudentAttendanceStats(email);
    res.json(stats);
  } catch (error) {
    reportInternalError(res, error, 'AI student stats');
  }
});

// ─── GET /admin/stats ───────────────────────────────────────────────────────
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
    const attendancePercentage =
      totalStudents > 0 ? `${Math.round((attendanceTodayStudents.length / totalStudents) * 100)}%` : '0%';

    const intruderAlerts = await SecurityLog.countDocuments({ status: 'Active' });
    const pendingLeaves = await Leave.countDocuments({ status: 'Pending' });

    res.json({
      total_students: String(totalStudents),
      total_teachers: String(totalTeachers),
      active_sessions: String(activeSessions),
      attendance_today: attendancePercentage,
      intruder_alerts: String(intruderAlerts),
      pending_leaves: String(pendingLeaves),
    });
  } catch (error) {
    reportInternalError(res, error, 'AI admin stats');
  }
});

// ─── GET /student/streak/:student_id ────────────────────────────────────────
router.get(['/student/streak/:student_id', '/ai/student/streak/:student_id'], authenticate, async (req, res) => {
  try {
    const { student_id } = req.params;
    const isSelf = req.userEmail && req.userEmail.toLowerCase() === student_id.toLowerCase();
    const isStaff = req.userRole && ['admin', 'teacher', 'hod', 'principal', 'management'].includes(req.userRole.toLowerCase());
    if (!isSelf && !isStaff) {
      return res.status(403).json({ detail: 'Forbidden: You do not have permission to view this streak.' });
    }
    const streak = await getStreak(student_id);
    res.json({ student_id, streak });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// ─── GET /student/ai-analysis/:student_id ───────────────────────────────────
router.get(['/student/ai-analysis/:student_id', '/ai/student/ai-analysis/:student_id'], authenticate, async (req, res) => {
  try {
    const { student_id } = req.params;
    let student = await User.findOne({ email: student_id, role: 'student' });
    if (!student && mongoose.Types.ObjectId.isValid(student_id)) {
      student = await User.findOne({ _id: new mongoose.Types.ObjectId(student_id), role: 'student' });
    }
    if (!student) return res.status(404).json({ detail: 'Student not found' });

    const isSelf = req.userEmail && req.userEmail.toLowerCase() === student.email.toLowerCase();
    const isStaff = req.userRole && ['admin', 'teacher', 'hod', 'principal', 'management'].includes(req.userRole.toLowerCase());
    if (!isSelf && !isStaff) {
      return res.status(403).json({ detail: 'Forbidden: You do not have permission to view this analysis.' });
    }

    const attendanceSummary = await getAttendanceSummary(student.email);
    const analysis = await getStudentInsights(student.full_name, attendanceSummary);
    res.json({ analysis });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// ─── GET /admin/activity-log ────────────────────────────────────────────────
router.get(['/admin/activity-log', '/ai/admin/activity-log'], authenticate, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const events = [];
    const [attendanceRecords, sessions, securityLogs, leaves] = await Promise.all([
      Attendance.find().sort({ timestamp: -1 }).limit(50).lean(),
      Session.find().sort({ start_time: -1 }).limit(20).lean(),
      SecurityLog.find().sort({ timestamp: -1 }).limit(20).lean(),
      Leave.find().sort({ created_at: -1 }).limit(20).lean(),
    ]);

      attendanceRecords.forEach((rec) =>
        events.push({
          type: 'attendance',
          icon: 'check_circle',
          title: 'Attendance Marked',
          detail: `${rec.student_email} marked present`,
          timestamp: rec.timestamp.toISOString(),
      color: 'success',
      })
    );
sessions.forEach((s) =>
  events.push({
    type: 'session',
    icon: 'play_circle',
    title: 'Session Started',
    detail: `${s.subject} by ${s.teacher_id}`,
    timestamp: s.start_time.toISOString(),
  color: 'info',
      })
    );
securityLogs.forEach((log) =>
  events.push({
    type: 'security',
    icon: 'warning',
    title: 'Security Alert',
    detail: `Intruder detected at ${log.location}`,
    timestamp: log.timestamp.toISOString(),
  color: 'error',
      })
    );
leaves.forEach((leave) =>
  events.push({
    type: 'leave',
    icon: 'event_busy',
    title: 'Leave Request',
    detail: `${leave.user_id} — ${leave.reason} (${leave.status})`,
    timestamp: leave.created_at.toISOString(),
color: 'warning',
      })
    );

events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
res.json(events.slice(0, 80));
  } catch (error) {
  reportInternalError(res, error, 'AI activity log');
}
});

// ─── POST /ai/ask ───────────────────────────────────────────────────────────
router.post(['/ask', '/ai/ask'], authenticate, async (req, res) => {
  try {
    if (req.headers['x-groq-api-key']) {
      return res.status(400).json({ detail: 'Client-supplied AI credentials are not accepted.' });
    }
    const targetEmail = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    if (!targetEmail) return res.status(400).json({ detail: 'A student email is required.' });

    const role = (req.userRole || '').toLowerCase();
    const isSelf = role === 'student' && req.userEmail?.toLowerCase() === targetEmail;
    const isStaff = ['admin', 'super_admin', 'teacher', 'hod', 'principal', 'management'].includes(role);
    if (!isSelf && !isStaff) {
      return res.status(403).json({ detail: "Forbidden: You do not have permission to query this student's AI insights." });
    }

    const student = await User.findOne({ email: targetEmail, role: 'student' });
    if (!student) return res.status(404).json({ detail: 'Student not found.' });

    const attendanceSummary = await getAttendanceSummary(targetEmail);
    const analysis = await getStudentInsights(student.full_name, attendanceSummary);
    res.json({ answer: analysis, response: analysis });
  } catch (error) {
    console.error('[AI] /ask error:', error);
    res.status(503).json({ detail: 'AI service unavailable.', answer: 'AI Engine offline', response: 'AI Engine offline' });
  }
});

// ─── POST /ai/feedback & /api/assistant/feedback ────────────────────────────
const handleFeedbackRequest = async (req, res) => {
  try {
    const { responseId, conversationId, rating, category, feedback, currentRoute } = req.body;
    const userEmail = req.userEmail || req.user?.email || 'anonymous';
    const userRole = (req.userRole || 'student').toLowerCase();

    if (!rating || !['helpful', 'not_helpful'].includes(rating)) {
      return res.status(400).json({ detail: "Invalid rating. Must be 'helpful' or 'not_helpful'." });
    }

      const feedbackId = await recordFeedback({
        responseId,
        conversationId,
        userEmail,
        userRole,
        collegeId: req.userCollege || null,
        rating,
      category,
      currentRoute,
      feedback,
    });

    return res.json({ success: true, feedbackId });
  } catch (error) {
    console.error('[Nexa Feedback Error]', error);
    return res.status(500).json({ detail: 'Feedback submission failed.' });
  }
};

router.post(['/feedback', '/assistant/feedback', '/api/assistant/feedback', '/ai/feedback'], authenticate, handleFeedbackRequest);

// ─── POST /ai/chat & /ai/chat/stream (Unified Orchestrator) ─────────────────
const handleChatRequest = async (req, res) => {
      const wantsStream = req.path.endsWith('/stream');
      const abortController = new AbortController();
      req.on('close', () => {
        if (!res.writableEnded) {
          abortController.abort();
        }
      });

        try {
          const normalizedBody = {
            ...req.body,
            message: req.body?.message || req.body?.query || '',
            currentRoute: req.body?.currentRoute || req.body?.screenContext || '',
          };
          const parsed = ChatRequestSchema.safeParse(normalizedBody);
          if (!parsed.success) {
            return res.status(400).json({ detail: parsed.error.issues[0]?.message || 'Message is required.' });
          }

            if (wantsStream) {
              res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
              res.setHeader('Cache-Control', 'no-cache, no-transform');
              res.setHeader('Connection', 'keep-alive');
              res.flushHeaders?.();
            }

                  const result = await processNexaRequest({
                    rawInput: parsed.data,
                    user: {
                      userEmail: req.userEmail || req.user?.email,
                      userRole: req.userRole || 'student',
                      userName: req.userName || req.user?.name,
                      userCollege: req.userCollege || null,
                    },
                    stream: wantsStream,
                    signal: abortController.signal,
                    onEvent: (event, data) => {
                      if (!res.writableEnded) {
                        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
                      }
                      },
                    });

                if (wantsStream) {
                  if (!res.writableEnded) res.end();
                  return;
                }
                return res.json(result);
              } catch (error) {
                if (error?.message?.includes('security threat') || error?.message?.includes('Prompt injection')) {
                  if (wantsStream && res.headersSent) {
                    res.write(`event: error\ndata: ${JSON.stringify({ detail: error.message })}\n\n`);
                    return res.end();
                  }
                  return res.status(400).json({ detail: error.message });
                }
                console.error('Nexa Chat Error:', error);
                if (!res.headersSent) {
                  return res.status(500).json({ detail: 'Chat service error.' });
                }
                res.write(`event: error\ndata: ${JSON.stringify({ detail: 'Chat service error.' })}\n\n`);
                return res.end();
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

              // ─── Persistent Nexa Conversation Management ────────────────────────────────
              router.get(['/ai/conversations', '/conversations'], authenticate, async (req, res) => {
                try {
                  const conversations = await listConversations(req.userEmail, {
                    limit: req.query.limit,
                    includeArchived: req.query.archived === 'true',
                    search: req.query.q || '',
                  });
                  res.json({ conversations });
                } catch (error) {
                  reportInternalError(res, error, 'Nexa:Conversations');
                }
              });

            router.patch(['/ai/conversations/:id', '/conversations/:id'], authenticate, async (req, res) => {
              try {
                const updated = await updateConversation(req.params.id, req.userEmail, {
                  title: req.body?.title,
                  archived: req.body?.archived,
                });
                if (!updated) return res.status(404).json({ detail: 'Conversation not found.' });
                res.json({ success: true, conversation: { id: updated._id.toString(), title: updated.title, archived: updated.archived } });
              } catch (error) {
                reportInternalError(res, error, 'Nexa:UpdateConversation');
              }
            });

            router.delete(['/ai/conversations/:id', '/conversations/:id'], authenticate, async (req, res) => {
              try {
                if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
                  return res.status(400).json({ detail: 'Invalid conversation ID.' });
                }
              const deleted = await deleteConversation(req.params.id, req.userEmail);
              if (!deleted) return res.status(404).json({ detail: 'Conversation not found.' });
              res.json({ success: true, message: 'Conversation deleted.' });
            } catch (error) {
              reportInternalError(res, error, 'Nexa:DeleteConversation');
            }
          });

          // ─── Controlled AI Action Confirmation ──────────────────────────────────────
          router.post(['/ai/actions/:actionId/confirm', '/actions/:actionId/confirm'], authenticate, async (req, res) => {
            try {
              const action = await AIActionConfirmation.findOne({
                action_id: req.params.actionId,
                user_email: req.userEmail.toLowerCase(),
              });
              if (!action) return res.status(404).json({ detail: 'Action proposal not found.' });
              if (action.status !== 'pending') return res.status(409).json({ detail: `Action already ${action.status}.` });
              if (action.expires_at < new Date()) {
                action.status = 'expired';
                await action.save();
                return res.status(410).json({ detail: 'Action proposal expired.' });
              }

    if(action.action_type === 'submit_leave') {
                    const created = await Leave.create({
                      user_id: req.userEmail.toLowerCase(),
                      category: action.payload.category || 'Medical',
                      start_date: action.payload.startDate,
                      end_date: action.payload.endDate,
                      reason: action.payload.reason,
                      status: 'Pending',
                      college_id: action.college_id || undefined,
                    });
                    action.status = 'confirmed';
                    action.confirmed_at = new Date();
                    action.result = { leaveId: created._id.toString() };
                    await action.save();
                    return res.json({ success: true, status: 'confirmed', result: action.result });
                  }
              return res.status(400).json({ detail: 'Unsupported action type.' });
            } catch (error) {
              reportInternalError(res, error, 'Nexa:ConfirmAction');
            }
          });

          // ─── User Assistant Preferences & AI Observability Metrics ──────────────────
          router.get(['/ai/preferences', '/preferences'], authenticate, async (req, res) => {
            try {
              const preferences = await getUserPreferences(req.userEmail);
              res.json({ preferences });
            } catch (error) {
              reportInternalError(res, error, 'Nexa:GetPreferences');
            }
          });

          router.put(['/ai/preferences', '/preferences'], authenticate, async (req, res) => {
            try {
              const preferences = await upsertUserPreferences(req.userEmail, req.userCollege || null, req.body || {});
              res.json({ success: true, preferences });
            } catch (error) {
              reportInternalError(res, error, 'Nexa:UpdatePreferences');
            }
          });

          router.get(['/ai/metrics', '/metrics'], authenticate, requireRole(['admin', 'super_admin']), async (req, res) => {
            try {
              const isSuperAdmin = String(req.userRole || '').toLowerCase() === 'super_admin';
              const data = await getUsageSummary({
                collegeId: isSuperAdmin ? req.query.collegeId || null : req.userCollege || null,
                days: Number(req.query.days || 7),
              });
              res.json(data);
            } catch (error) {
              reportInternalError(res, error, 'Nexa:Metrics');
            }
          });

          module.exports = router;
