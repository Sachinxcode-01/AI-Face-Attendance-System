'use strict';

const fs = require('fs');
const path = require('path');
const { filterActionsForRole } = require('../security/output-validation');
const { sanitizeUntrustedContext } = require('../security/input-validation');

const CORE_KNOWLEDGE_BASE = [
  {
    id: 'kb_overview',
    title: 'SmartFace Platform Overview',
    roles: ['student', 'teacher', 'parent', 'admin', 'hod', 'super_admin'],
    keywords: ['what is smart attendance', 'about app', 'how app works', 'overview', 'smartface', 'nexa'],
    answer:
      'Smart Attendance AI (SmartFace) is an enterprise academic attendance platform featuring AI face recognition, dynamic rolling QR codes, real-time analytics, leave management, and role-based portals for Students, Teachers, Parents, Admins, and Super Admins.',
    actions: [],
  },
  {
    id: 'kb_qr_checkin',
    title: 'QR Attendance Check-in',
    roles: ['student'],
    keywords: ['qr', 'scan', 'qr code', 'mark qr', 'check in', 'checkin'],
    answer:
      "To mark QR attendance: Go to Classroom Check-in, switch to QR Mode, scan or enter the teacher's live rolling QR code token, and submit. Your verification logs in real-time with a receipt ID.",
    actions: [{ type: 'navigate', label: 'Open Check-in', route: '/student/checkin', roles: ['student'] }],
  },
  {
    id: 'kb_face_checkin',
    title: 'Face Verification Check-in',
    roles: ['student'],
    keywords: ['face', 'facial', 'recognition', 'face attendance', 'camera', 'biometric'],
    answer:
      'To use Face Verification: Open Classroom Check-in in Face Mode, align your face inside the frame in good lighting, and click Verify Face. Never use photos or screens.',
    actions: [{ type: 'navigate', label: 'Open Face Check-in', route: '/student/checkin', roles: ['student'] }],
  },
  {
    id: 'kb_timetable',
    title: 'Timetable & Calendar Export',
    roles: ['student', 'teacher'],
    keywords: ['timetable', 'schedule', 'classes today', 'class schedule', 'ics'],
    answer:
      'You can check your daily schedule, time slots, live class status, cancelled/rescheduled updates, and export ICS calendars on the Timetable screen.',
    actions: [
      { type: 'navigate', label: 'Open Timetable', route: '/student/timetable', roles: ['student'] },
      { type: 'navigate', label: 'Faculty Timetable', route: '/teacher/timetable', roles: ['teacher'] },
    ],
  },
  {
    id: 'kb_leave',
    title: 'Leave Application & Review',
    roles: ['student', 'teacher', 'admin', 'parent'],
    keywords: ['leave', 'apply leave', 'sick leave', 'absent request', 'medical leave'],
    answer:
      'To apply for leave: Go to Apply Leave, pick your leave type and dates, attach supporting documents if needed, and submit for faculty review.',
    actions: [
      { type: 'navigate', label: 'Apply for Leave', route: '/student/leave/apply', roles: ['student'] },
      { type: 'navigate', label: 'Review Leave Requests', route: '/teacher/leave-approvals', roles: ['teacher', 'admin'] },
    ],
  },
  {
    id: 'kb_reports',
    title: 'Attendance Reports & Analytics',
    roles: ['student', 'teacher', 'admin', 'parent'],
    keywords: ['report', 'analytics', 'percentage', 'subject attendance', 'download report', 'csv', 'pdf'],
    answer:
      'You can view subject-wise attendance breakdowns, deterministic forecasts, and download CSV/Excel/PDF-ready reports in Attendance & Analytics.',
    actions: [
      { type: 'navigate', label: 'View Analytics', route: '/student/analytics', roles: ['student'] },
      { type: 'navigate', label: 'View Attendance & Reports', route: '/student/attendance', roles: ['student'] },
      { type: 'navigate', label: 'Faculty Reports', route: '/teacher/reports', roles: ['teacher', 'admin'] },
    ],
  },
  {
    id: 'kb_teacher_session',
    title: 'Launching Attendance Sessions',
    roles: ['teacher'],
    keywords: ['start session', 'generate qr', 'teacher qr', 'faculty portal', 'kiosk'],
    answer:
      'Teachers can launch an attendance session from Session Management, project a rotating anti-proxy QR code in QR Projector, or run Kiosk Mode for biometric verification.',
    actions: [
      { type: 'navigate', label: 'QR Projector', route: '/teacher/qr-projector', roles: ['teacher'] },
      { type: 'navigate', label: 'Sessions', route: '/teacher/sessions', roles: ['teacher'] },
    ],
  },
  {
    id: 'kb_parent_ward',
    title: 'Parent Portal & Ward Switching',
    roles: ['parent'],
    keywords: ['ward', 'child', 'parent portal', 'switch ward', 'guardian'],
    answer:
      'Parents can view linked ward attendance, subject performance, and leave history in the Parent Portal. Use the ward dropdown at top to switch between multiple children.',
    actions: [{ type: 'navigate', label: 'Parent Portal', route: '/parent', roles: ['parent'] }],
  },
  {
    id: 'kb_admin_ops',
    title: 'Admin Command Center & Telemetry',
    roles: ['admin', 'hod', 'super_admin'],
    keywords: ['system health', 'audit', 'security', 'logs', 'admin portal', 'device', 'offline'],
    answer:
      'Administrators can monitor live session telemetry, inspect security alerts and intruder logs, audit user accounts, and view institution analytics in the Command Center.',
    actions: [
      { type: 'navigate', label: 'System Health', route: '/admin/system-health', roles: ['admin', 'hod'] },
      { type: 'navigate', label: 'Security Logs', route: '/admin/security-logs', roles: ['admin', 'hod'] },
    ],
  },
  {
    id: 'kb_profile_photo',
    title: 'Profile Photo & Account Settings',
    roles: ['student', 'teacher', 'parent', 'admin', 'hod', 'super_admin'],
    keywords: ['photo', 'profile photo', 'avatar', 'settings'],
    answer:
      'You can update your profile photo in Profile Settings. Choose a JPEG/PNG under 5 MB. Photos save permanently to server storage and update automatically across all screens.',
    actions: [{ type: 'navigate', label: 'Open Profile', route: '/student/profile', roles: ['student', 'teacher', 'parent', 'admin'] }],
  },
];

let externalFaqDocs = null;
function loadExternalFaqDocs() {
  if (externalFaqDocs) return externalFaqDocs;
  try {
    const faqPath = path.resolve(__dirname, '../../../../../mobile/assets/knowledge/nexa_attendance_faq.json');
    if (fs.existsSync(faqPath)) {
      const parsed = JSON.parse(fs.readFileSync(faqPath, 'utf8'));
      const items = Array.isArray(parsed) ? parsed : parsed?.faqs || [];
      externalFaqDocs = items
        .filter((it) => it && (it.question || it.keywords) && it.answer)
        .map((it, idx) => ({
          id: `faq_ext_${idx}`,
          title: it.question || `FAQ ${idx + 1}`,
          roles: Array.isArray(it.roles) ? it.roles : ['student', 'teacher', 'parent', 'admin'],
          keywords: Array.isArray(it.keywords)
            ? it.keywords.map((k) => String(k).toLowerCase())
            : String(it.question || '')
                .toLowerCase()
                .split(/\W+/)
                .filter((w) => w.length > 3),
          answer: sanitizeUntrustedContext(String(it.answer), 800),
          actions: Array.isArray(it.actions) ? it.actions : [],
        }));
      return externalFaqDocs;
    }
  } catch {
    // non-fatal if mobile assets are not co-located in a deployment container
  }
  externalFaqDocs = [];
  return externalFaqDocs;
}

/**
 * Retrieves top matching role-permitted knowledge entries for a query.
 */
function retrieveKnowledge(query, userRole = 'student', limit = 2) {
  const qLower = String(query || '').toLowerCase();
  const role = String(userRole || 'student').toLowerCase();
  const corpus = [...CORE_KNOWLEDGE_BASE, ...loadExternalFaqDocs()];

  const scored = [];
  for (const doc of corpus) {
    if (Array.isArray(doc.roles) && doc.roles.length > 0 && !doc.roles.includes(role)) {
      continue;
    }
    const matches = (doc.keywords || []).filter((kw) => qLower.includes(String(kw).toLowerCase()));
    if (matches.length === 0) continue;

    const roleActions = filterActionsForRole(doc.actions || [], role);
    const maxKwLen = Math.max(...matches.map((m) => m.length));
    const score = matches.length * 100 + maxKwLen + (roleActions.length > 0 ? 500 : 0);

    scored.push({
      id: doc.id,
      title: doc.title,
      answer: doc.answer,
      actions: roleActions,
      score,
    });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

module.exports = {
  retrieveKnowledge,
  CORE_KNOWLEDGE_BASE,
};
