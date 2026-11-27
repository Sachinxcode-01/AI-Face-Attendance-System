'use strict';

const crypto = require('crypto');
const toolRegistry = require('../tools');
const { retrieveKnowledge } = require('../knowledge/retrieval.service');
const { routeGenerate, routeGenerateStream } = require('../providers/provider-router');
const {
  sanitizePrompt,
  isSecretsQuery,
  sanitizeUntrustedContext,
} = require('../security/input-validation');
const { sanitizeModelOutput, filterActionsForRole } = require('../security/output-validation');
const { normalizeRole } = require('../security/tool-authorisation');
const {
  detectLanguage,
  detectSupportiveTone,
  parseTargetPercentage,
  classifyIntent,
} = require('./intent-router');
const { persistTurn, getConversationContext, getUserPreferences } = require('../memory/conversation.service');
const { recordUsageMetric } = require('../monitoring/ai-metrics');

function buildLanguageDirective(language) {
  if (language === 'kn') {
    return 'Respond in clear Kannada (ಕನ್ನಡ). Keep technical labels, route names, and numbers accurate.';
  }
  if (language === 'hi') {
    return 'Respond in clear Hindi (हिंदी). Keep technical labels, route names, and numbers accurate.';
  }
  if (language === 'hinglish') {
    return 'Respond in clear, polite Hinglish (Hindi written in Latin script mixed with standard English academic terms).';
  }
  return 'Respond in clear, concise English.';
}

function buildSecretsRefusal(language) {
  if (language === 'kn') return 'ನನ್ನ ಬಳಿ ಯಾವುದೇ ಸೀಕ್ರೆಟ್‌ಗಳು, ಎಪಿಐ ಕೀಗಳು ಅಥವಾ ಖಾಸಗಿ ಶ್ರೇಯಾಂಕಗಳ ಮಾಹಿತಿಯಿಲ್ಲ.';
  if (language === 'hi') return 'मेरे पास कोई गुप्त जानकारी, एपीआई कुंजी या पासवर्ड नहीं हैं।';
  return 'I cannot expose secrets, API keys, OTPs, passwords, biometric embeddings, or system credentials.';
}

function buildUnrelatedReply(language) {
  if (language === 'kn') return 'ನಾನು ಸ್ಮಾರ್ಟ್ ಅಟೆಂಡೆನ್ಸ್ AI, ಹಾಜರಾತಿ, ವೇಳಾಪಟ್ಟಿ, QR ಮತ್ತು ಮುಖ ಪರಿಶೀಲನೆಯಲ್ಲಿ ಸಹಾಯ ಮಾಡಲು ವಿನ್ಯಾಸಗೊಳಿಸಲಾಗಿದೆ.';
  if (language === 'hi') return 'मैं स्मार्ट अटेंडेंस एआई, उपस्थिति, समयसारणी, क्यूआर और फेस सत्यापन में सहायता के लिए डिज़ाइन किया गया हूँ।';
  return 'I am designed to help with SmartFace Campus Intelligence: attendance, deterministic recovery plans, timetables, leave/dispute workflows, and institutional operations.';
}

function formatVerifiedContext(toolResults, kbDocs) {
  const sections = [];
  const sources = [];

  for (const res of toolResults) {
    if (!res.ok) {
      sections.push(`[Tool ${res.tool} unavailable: ${res.error}]`);
      continue;
    }
    sources.push({ type: 'tool', name: res.tool });
    const d = res.data || {};

    if (res.tool === 'get_attendance_summary' && d.available) {
      const f = d.targetForecast || {};
      const lines = [
        `Attendance: ${d.overallPercentage ?? 0}% (${d.attended}/${d.conducted} conducted, ${d.missed} missed, ${d.streak}-day streak, Standing: ${d.standing || 'N/A'}, Risk: ${d.risk?.riskLevel || d.risk?.level || 'N/A'}).`,
        `Policy: min ${d.policy?.minPercentage ?? 75}%, approvedLeaveCountsAsPresent=${Boolean(d.policy?.approvedLeaveCountsAsPresent)}.`,
      ];
      if (f.classesNeeded === null) {
        lines.push(`Target ${f.targetPercentage}%: mathematically impossible after an absence.`);
      } else if (f.classesNeeded > 0) {
        lines.push(`Target ${f.targetPercentage}%: need ${f.classesNeeded} consecutive class(es) (${f.statusNote}).`);
      } else {
        lines.push(`Target ${f.targetPercentage}%: eligible (${f.allowableAbsences} safe absence(s) remaining).`);
      }
      if (d.lowestSubject) {
        lines.push(`Lowest subject: ${d.lowestSubject.subject} at ${d.lowestSubject.percentage}% (${d.lowestSubject.attended}/${d.lowestSubject.conducted}, needs ${d.lowestSubject.classes_needed ?? 0}).`);
      }
      if (d.upcomingClasses?.length) {
        const nxt = d.upcomingClasses[0];
        lines.push(`Next class today: ${nxt.subject} at ${nxt.time} in ${nxt.room} (${nxt.status}).`);
      } else if (d.todayClasses?.length) {
        lines.push(`Today's classes: ${d.todayClasses.map((c) => `${c.subject} @ ${c.time} [${c.status}]`).join('; ')}.`);
      }
      sections.push(lines.join(' '));
    } else if (res.tool === 'calculate_required_classes' && d.available) {
      sections.push(`Deterministic Target Calculation (${d.scope || 'overall'} @ ${d.targetPercentage}%): ${d.statusNote}`);
    } else if (res.tool === 'simulate_attendance_scenario' && d.available) {
      sections.push(`What-If Simulation: Current ${d.currentPercentage ?? 0}% -> Projected ${d.projectedPercentage ?? 0}% (${d.projectedAttended}/${d.projectedConducted}). ${d.eligibleAfter ? 'Meets target.' : `Below target (needs ${d.classesNeededAfter ?? 'N/A'} more).`}`);
    } else if (res.tool === 'get_teacher_classroom_summary' && d.available) {
      const lines = [
        `Faculty Overview (${d.department || 'Dept'} | ${d.semester || 'Current Semester'}): ${d.activeSessions} active / ${d.totalSessions} total sessions, ${d.totalAssignedStudents} assigned students, overall ${d.overallAttendanceRate}% (policy min ${d.policyMinPercentage}%).`,
        `Today: ${d.attendanceToday} check-ins, ${d.completedToday} completed / ${d.upcomingToday} upcoming / ${d.cancelledToday} cancelled.`,
        `Pending: ${d.pendingLeaves} leave(s), ${d.pendingDisputes} dispute(s).`,
        `Below ${d.policyMinPercentage}%: ${d.belowTargetCount} student(s). Consecutive absences (>=3): ${d.consecutiveAbsencesCount} student(s).`,
      ];
      if (d.subjectWise?.length) {
        const sorted = [...d.subjectWise].sort((a, b) => a.attendance_rate - b.attendance_rate);
        lines.push(`Lowest subject: ${sorted[0].subject} (${sorted[0].attendance_rate}%).`);
      }
      sections.push(lines.join(' '));
    } else if (res.tool === 'get_leave_and_dispute_status' && d.available) {
      const leaveText = (d.leaves || []).slice(0, 3).map((l) => `${l.category || 'Leave'} (${l.start_date}..${l.end_date}): ${l.status}`).join('; ');
      const dispText = (d.disputes || []).slice(0, 3).map((x) => `${x.subject || x.session_id}: ${x.status}`).join('; ');
      sections.push(`Leaves: ${leaveText || 'None'}. Disputes: ${dispText || 'None'}.`);
    } else if (res.tool === 'get_institution_operations_summary' && d.available) {
      sections.push(
        `Institution (${d.institutionName}): ${d.totalStudents} students, ${d.totalFaculty} faculty, ${d.activeSessions} active sessions, ${d.todayAttendance} attendance records today, ${d.pendingLeaves} pending leaves, ${d.pendingDisputes} pending disputes, ${d.activeSecurityAlerts} active security alerts, ${d.offlineDevices} offline/non-active devices. Min policy: ${d.minAttendancePolicy}%.`
      );
    } else if (res.tool === 'get_platform_operations_summary' && d.available) {
      sections.push(
        `Platform Operations: ${d.activeColleges}/${d.totalColleges} active colleges, ${d.failedBackgroundJobs} failed background jobs, ${d.activePlatformSecurityAlerts} active platform security alerts, API uptime ${d.uptimeSeconds}s.`
      );
    }
  }

  for (const doc of kbDocs) {
    sources.push({ type: 'knowledge', id: doc.id, title: doc.title });
    sections.push(`[Knowledge: ${doc.title}] ${sanitizeUntrustedContext(doc.answer, 600)}`);
  }

  return {
    contextBlock: sections.join('\n'),
    sources,
  };
}

function buildDeterministicFallback({ language, userName, userRole, contextBlock, kbDocs }) {
  if (kbDocs.length > 0 && !contextBlock.includes('Attendance:')) {
    return `${kbDocs[0].answer}${contextBlock ? `\n\n${contextBlock.split('\n')[0]}` : ''}`.trim();
  }
  if (contextBlock) {
    if (language === 'kn') return `ಇಲ್ಲಿದೆ ನಿಮ್ಮ ಖಾತೆಯ ನೈಜ ಡೇಟಾ:\n${contextBlock}`;
    if (language === 'hi') return `यहाँ आपका सत्यापित खाता डेटा है:\n${contextBlock}`;
    return `Here is your verified SmartFace summary:\n${contextBlock}`;
  }
  if (language === 'kn') {
    return `ನಮಸ್ಕಾರ ${userName}! ನಾನು ನಿಮ್ಮ ${userRole} ಡ್ಯಾಶ್‌ಬೋರ್ಡ್, QR ಸ್ಕ್ಯಾನಿಂಗ್, ಮುಖ ಹಾಜರಾತಿ, ವೇಳಾಪಟ್ಟಿ ಮತ್ತು ವರದಿಗಳಲ್ಲಿ ಸಹಾಯ ಮಾಡಬಲ್ಲೆ.`;
  }
  if (language === 'hi') {
    return `नमस्ते ${userName}! मैं आपकी ${userRole} डैशबोर्ड, क्यूआर स्कैनिंग, फेस उपस्थिति और रिपोर्ट में मदद कर सकता हूँ।`;
  }
  return `Hello ${userName}! I can help you with your ${userRole} attendance, deterministic target calculations, timetable, leave applications, and reports. What would you like to check?`;
}

/**
 * Unified Nexa Intelligence Orchestrator for both JSON and SSE streaming responses.
 */
async function processNexaRequest({
  rawInput,
  user,
  stream = false,
  onEvent = null,
  signal = null,
}) {
  const startedAt = Date.now();
  const requestId = `req_${crypto.randomBytes(6).toString('hex')}`;
  const userRole = normalizeRole(user?.userRole);
  const userEmail = String(user?.userEmail || 'user@smartface.ai').toLowerCase();
  const userName = String(user?.userName || userEmail.split('@')[0]);
  const collegeId = user?.userCollege || null;

  const emit = (event, data) => {
    if (stream && typeof onEvent === 'function') {
      onEvent(event, data);
    }
  };

  emit('status', { stage: 'accepted', requestId });

  const cleanMessage = sanitizePrompt(rawInput.message);
  const prefs = await getUserPreferences(userEmail).catch(() => ({}));
  const language = detectLanguage(cleanMessage, rawInput.language || prefs.preferred_language || 'auto');

  // Security check: explicit secret refusal
  if (isSecretsQuery(cleanMessage)) {
    const refusalMsg = buildSecretsRefusal(language);
    const saved = await persistTurn({
      conversationId: rawInput.conversationId,
      userEmail,
      userRole,
      collegeId,
      language,
      userText: cleanMessage,
      assistantText: refusalMsg,
    });
    const payload = {
      success: true,
      conversationId: saved.conversationId,
      reply: refusalMsg,
      message: { id: saved.assistantMsgId, role: 'assistant', content: refusalMsg, createdAt: new Date().toISOString() },
      suggestedActions: [],
      sources: [],
    };
    emit('delta', { text: refusalMsg });
    emit('done', payload);
    return payload;
  }

  const intentInfo = classifyIntent(cleanMessage, userRole);
  if (intentInfo.intent === 'unrelated') {
    const unrelatedReply = buildUnrelatedReply(language);
    const payload = {
      success: true,
      conversationId: rawInput.conversationId || `conv_${Date.now()}`,
      reply: unrelatedReply,
      message: { id: `msg_${Date.now()}`, role: 'assistant', content: unrelatedReply, createdAt: new Date().toISOString() },
      suggestedActions: [],
      sources: [],
    };
    emit('delta', { text: unrelatedReply });
    emit('done', payload);
    return payload;
  }

  // Load persisted conversation context if available
  const existingConv = await getConversationContext(rawInput.conversationId, userEmail).catch(() => null);
  const targetPct = parseTargetPercentage(cleanMessage) || prefs.attendance_target || 75;
  const authCtx = {
    userEmail,
    userRole,
    collegeId,
    selectedWardEmail: rawInput.student_email || null,
  };

  // Execute authorized tools in parallel
  emit('status', { stage: 'retrieving_context', intent: intentInfo.intent });
  const toolPromises = intentInfo.tools.map((toolName) => {
    emit('tool_start', { tool: toolName });
    const args = { studentEmail: rawInput.student_email };
    if (toolName === 'get_attendance_summary' || toolName === 'calculate_required_classes' || toolName === 'get_teacher_classroom_summary') {
      args.targetPercentage = targetPct;
    }
    if (toolName === 'simulate_attendance_scenario' && intentInfo.whatIf) {
      args.attendMore = intentInfo.whatIf.attendMore;
      args.missMore = intentInfo.whatIf.missMore;
      args.targetPercentage = targetPct;
    }
    return toolRegistry.execute(toolName, args, authCtx).then((res) => {
      emit('tool_done', { tool: toolName, ok: res.ok, latencyMs: res.latencyMs });
      return res;
    });
  });

  const [toolResults, kbDocs] = await Promise.all([
    Promise.all(toolPromises),
    Promise.resolve(retrieveKnowledge(cleanMessage, userRole, 2)),
  ]);

  const { contextBlock, sources } = formatVerifiedContext(toolResults, kbDocs);
  if (sources.length) emit('sources', { sources });

  const suggestedActions = filterActionsForRole(
    kbDocs.flatMap((d) => d.actions || []),
    userRole
  );

  // Build grounded system prompt (PII-minimized)
  const tone = detectSupportiveTone(cleanMessage);
  const systemPrompt = [
    `You are Nexa AI, the Campus Intelligence Engine for SmartFace.`,
    `Authenticated Role: ${userRole.toUpperCase()} (${userName.split(' ')[0]}).`,
    `Current Screen: ${rawInput.currentRoute || 'Dashboard'}.`,
    `Language Directive: ${buildLanguageDirective(language)}`,
    tone === 'supportive_calm'
      ? `Tone: Be calm, supportive, and practical without claiming to diagnose or know the user's inner feelings.`
      : `Tone: Be clear, concise, and professional.`,
    `Grounding Rules: Use ONLY verified facts in the Verified Context below. Never invent percentages, timetable slots, or policies. Never reveal secrets, tokens, or another user's private data.`,
    contextBlock ? `\nVerified Context:\n${contextBlock}` : '',
  ].filter(Boolean).join('\n');

  const historyMessages = (rawInput.history?.length ? rawInput.history : existingConv?.messages || [])
    .slice(-8)
    .map((h) => ({
      role: h.role === 'user' ? 'user' : 'assistant',
      content: String(h.content || '').slice(0, 1500),
    }));

  const llmMessages = [
    { role: 'system', content: systemPrompt },
    ...historyMessages,
    { role: 'user', content: cleanMessage },
  ];

  let finalReply = '';
  let usedProvider = 'fallback';
  let usedModel = 'none';
  let fallbackUsed = false;
  let inputTokens = 0;
  let outputTokens = 0;
  let ttftMs = null;

  if (stream) {
    try {
      for await (const chunk of routeGenerateStream({
        messages: llmMessages,
        language,
        complexity: intentInfo.complexity,
        maxTokens: 450,
        signal,
      })) {
        if (ttftMs === null) ttftMs = Date.now() - startedAt;
        usedProvider = chunk.provider;
        usedModel = chunk.model;
        fallbackUsed = Boolean(chunk.fallbackUsed);
        const safeDelta = sanitizeModelOutput(chunk.delta);
        if (safeDelta) {
          finalReply += chunk.delta;
          emit('delta', { text: chunk.delta });
        }
      }
    } catch (err) {
      if (!signal?.aborted) {
        console.warn('[Nexa Orchestrator] Stream error:', err.message);
      }
    }
  } else {
    const gen = await routeGenerate({
      messages: llmMessages,
      language,
      complexity: intentInfo.complexity,
      maxTokens: 450,
      signal,
    });
    usedProvider = gen.provider;
    usedModel = gen.model;
    fallbackUsed = Boolean(gen.fallbackUsed);
    inputTokens = gen.usage?.inputTokens || 0;
    outputTokens = gen.usage?.outputTokens || 0;
    if (gen.text) {
      finalReply = gen.text;
    }
  }

  finalReply = sanitizeModelOutput(finalReply);
  if (!finalReply) {
    usedProvider = 'deterministic';
    finalReply = buildDeterministicFallback({
      language,
      userName,
      userRole,
      contextBlock,
      kbDocs,
    });
    if (stream && !signal?.aborted) {
      emit('delta', { text: finalReply });
    }
  }

  const saved = await persistTurn({
    conversationId: rawInput.conversationId,
    userEmail,
    userRole,
    collegeId,
    language,
    userText: cleanMessage,
    assistantText: finalReply,
    suggestedActions,
    sources,
    toolsUsed: intentInfo.tools,
  });

  await recordUsageMetric({
    request_id: requestId,
    user_email: userEmail,
    user_role: userRole,
    college_id: collegeId,
    intent: intentInfo.intent,
    provider: usedProvider,
    model: usedModel,
    fallback_used: fallbackUsed,
    streamed: stream,
    success: true,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    ttft_ms: ttftMs,
    total_latency_ms: Date.now() - startedAt,
    tool_count: intentInfo.tools.length,
    language,
  });

  const payload = {
    success: true,
    conversationId: saved.conversationId,
    reply: finalReply,
    message: {
      id: saved.assistantMsgId,
      role: 'assistant',
      content: finalReply,
      createdAt: new Date().toISOString(),
    },
    suggestedActions,
    sources,
    meta: {
      intent: intentInfo.intent,
      language,
      provider: usedProvider,
      model: usedModel,
      latencyMs: Date.now() - startedAt,
    },
  };

  emit('done', payload);
  return payload;
}

module.exports = { processNexaRequest };
