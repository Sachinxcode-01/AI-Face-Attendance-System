'use strict';

const { normalizeLanguageCode } = require('../security/input-validation');

const UNRELATED_TRIGGERS = ['weather', 'president', 'recipe', 'movie', 'football', 'joke', 'crypto', 'stock'];

function detectLanguage(text, requestedLanguage = 'auto') {
  const normalized = normalizeLanguageCode(requestedLanguage);
  if (normalized !== 'auto') return normalized;

  if (/[\u0C80-\u0CFF]/.test(text)) return 'kn'; // Kannada script
  if (/[\u0900-\u097F]/.test(text)) return 'hi'; // Devanagari (Hindi)
  if (/\b(kitne|kitna|chahiye|mera|meri|mere|kya|hai|kal|aaj|hoga|nahi|karna)\b/i.test(text)) {
    return 'hinglish';
  }
  return 'en';
}

function detectSupportiveTone(text) {
  const lower = String(text || '').toLowerCase();
  if (/(worried|stressed|panic|confused|urgent|help me|scared|anxious|failed|shortage|low attendance)/i.test(lower)) {
    return 'supportive_calm';
  }
  return 'neutral';
}

function parseTargetPercentage(text) {
  const match = String(text || '').match(/(\d{1,3})\s*%/);
  if (!match) return null;
  const val = parseInt(match[1], 10);
  return Number.isInteger(val) && val >= 1 && val <= 100 ? val : null;
}

function parseWhatIfScenario(text) {
  const lower = String(text || '').toLowerCase();
  const missMatch = lower.match(/(?:miss|skip|bunk|absent(?:\s+for)?)\s+(\d{1,2})\s+(?:class|classes|lecture|lectures|day|days)/i);
  const attendMatch = lower.match(/(?:attend|present(?:\s+for)?)\s+(\d{1,2})\s+(?:class|classes|lecture|lectures|day|days)/i);
  if (missMatch || attendMatch) {
    return {
      missMore: missMatch ? parseInt(missMatch[1], 10) : 0,
      attendMore: attendMatch ? parseInt(attendMatch[1], 10) : 0,
    };
  }
  if (/miss\s+tomorrow/i.test(lower)) {
    return { missMore: 1, attendMore: 0 };
  }
  return null;
}

function classifyIntent(text, userRole = 'student') {
  const lower = String(text || '').toLowerCase();
  const role = String(userRole || 'student').toLowerCase();

  if (UNRELATED_TRIGGERS.some((t) => lower.includes(t)) && !/(attendance|class|leave|timetable|session|device)/i.test(lower)) {
    return { intent: 'unrelated', complexity: 'fast', tools: [] };
  }

  if (role === 'super_admin' && /(platform|service|health|job|college|tenant|uptime|provider|infrastructure|incident)/i.test(lower)) {
    return {
      intent: 'platform_operations',
      complexity: 'balanced',
      tools: ['get_platform_operations_summary', 'get_institution_operations_summary'],
    };
  }

  if (['admin', 'hod', 'super_admin'].includes(role)) {
    return {
      intent: 'institution_operations',
      complexity: 'balanced',
      tools: ['get_institution_operations_summary'],
    };
  }

  if (role === 'teacher') {
    if (/(timetable|schedule|next class|today.*class)/i.test(lower)) {
      return { intent: 'timetable_enquiry', complexity: 'fast', tools: ['get_today_timetable', 'get_teacher_classroom_summary'] };
    }
    if (/(leave|dispute|pending|correction)/i.test(lower)) {
      return { intent: 'leave_dispute_review', complexity: 'balanced', tools: ['get_leave_and_dispute_status', 'get_teacher_classroom_summary'] };
    }
    return { intent: 'classroom_analytics', complexity: 'balanced', tools: ['get_teacher_classroom_summary'] };
  }

  // Student & Parent intents
  if (/(draft|apply|create|submit)\s+(?:a\s+)?leave/i.test(lower) && role === 'student') {
    return { intent: 'leave_draft', complexity: 'balanced', tools: ['get_leave_and_dispute_status'] };
  }

  const whatIf = parseWhatIfScenario(lower);
  if (whatIf) {
    return { intent: 'attendance_simulation', complexity: 'fast', tools: ['get_attendance_summary', 'simulate_attendance_scenario'], whatIf };
  }

  if (/(reach|need|required|recover|recovery|target|75|80|85|90|%)/i.test(lower)) {
    return { intent: 'attendance_calculation', complexity: 'fast', tools: ['get_attendance_summary', 'calculate_required_classes'] };
  }

  if (/(timetable|schedule|next class|tomorrow|today.*class)/i.test(lower)) {
    return { intent: 'timetable_enquiry', complexity: 'fast', tools: ['get_today_timetable', 'get_attendance_summary'] };
  }

  if (/(leave|dispute|correction|application status)/i.test(lower)) {
    return { intent: 'leave_status', complexity: 'fast', tools: ['get_leave_and_dispute_status'] };
  }

  if (/(attendance|present|absent|missed|streak|lowest|subject|report|standing|eligible|ಹಾಜರಾತಿ|उपस्थिति)/i.test(lower)) {
    return { intent: 'attendance_enquiry', complexity: 'balanced', tools: ['get_attendance_summary'] };
  }

  return {
    intent: 'general',
    complexity: 'fast',
    tools: role === 'student' || role === 'parent' ? ['get_attendance_summary'] : [],
  };
}

module.exports = {
  detectLanguage,
  detectSupportiveTone,
  parseTargetPercentage,
  parseWhatIfScenario,
  classifyIntent,
};
