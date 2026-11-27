'use strict';

const SECRET_VALUE_PATTERNS = [
  /gsk_[A-Za-z0-9_-]{16,}/g,
  /AIza[0-9A-Za-z_-]{20,}/g,
  /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g, // JWT
  /mongodb(\+srv)?:\/\/[^\s"']+/gi,
  /postgres(ql)?:\/\/[^\s"']+/gi,
  /re_[A-Za-z0-9_]{16,}/g, // Resend key
];

const ROUTE_ALLOWLIST = {
  student: [
    '/student', '/student/checkin', '/student/attendance', '/student/timetable',
    '/student/leave', '/student/leave/apply', '/student/analytics', '/student/ai-chat',
    '/student/notifications', '/student/profile',
    '/student/dashboard', '/student/qr-attendance', '/student/face-attendance',
    '/student/history', '/student/reports', '/student/leave-apply', '/student/leave-hub',
    '/notifications/nexus', '/settings',
  ],
  teacher: [
    '/teacher', '/teacher/sessions', '/teacher/sessions/create', '/teacher/qr-projector',
    '/teacher/kiosk', '/teacher/roster', '/teacher/leave-approvals', '/teacher/disputes',
    '/teacher/analytics', '/teacher/timetable', '/teacher/notifications', '/teacher/reports',
    '/teacher/ai-chat', '/teacher/profile', '/settings',
  ],
  parent: [
    '/parent', '/parent?tab=attendance', '/parent?tab=timetable',
    '/parent?tab=leave', '/parent?tab=disputes', '/parent?tab=reports', '/parent?tab=profile',
    '/parent/dashboard', '/parent/reports', '/parent/alerts', '/parent/leave-status',
    '/parent/profile', '/settings',
  ],
  admin: [
    '/admin', '/admin/dashboard', '/admin/users', '/admin/students', '/admin/faculty',
    '/admin/academics', '/admin/attendance', '/admin/devices', '/admin/biometrics',
    '/admin/sessions', '/admin/reports', '/admin/system-health', '/admin/security',
    '/admin/security-logs', '/admin/governance', '/admin/communications', '/admin/ai-chat',
    '/admin/profile', '/settings',
  ],
  hod: [
    '/admin', '/admin/dashboard', '/admin/users', '/admin/sessions',
    '/admin/reports', '/admin/system-health', '/admin/security-logs',
    '/admin/profile', '/settings',
  ],
  super_admin: [
    '/admin', '/admin/super-admin', '/admin/dashboard', '/admin/users',
    '/admin/devices', '/admin/security', '/admin/governance', '/admin/analytics',
    '/admin/ai-chat', '/settings',
  ],
};

/**
 * Redacts leaked credentials, connection strings, and unsafe HTML from model output.
 */
function sanitizeModelOutput(text) {
  if (typeof text !== 'string') return '';
  let out = text;
  for (const pat of SECRET_VALUE_PATTERNS) {
    out = out.replace(pat, '[REDACTED_SECRET]');
  }
  // Strip raw HTML script/iframe tags and hidden reasoning tags if a model emits them
  out = out
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<\/?iframe[^>]*>/gi, '');
  return out.trim();
}

/**
 * Filters suggested navigation actions by authenticated role allowlist.
 */
function filterActionsForRole(actions, role) {
  if (!Array.isArray(actions)) return [];
  const normalizedRole = String(role || 'student').toLowerCase();
  const allowedRoutes = ROUTE_ALLOWLIST[normalizedRole] || ROUTE_ALLOWLIST.student;

  return actions
    .filter((act) => {
      if (!act || typeof act.route !== 'string') return false;
      if (Array.isArray(act.roles) && !act.roles.includes(normalizedRole)) return false;
      return allowedRoutes.some((r) => act.route.startsWith(r));
    })
    .map((act) => ({
      type: act.type || 'navigate',
      label: String(act.label || 'Open'),
      route: act.route,
    }));
}

module.exports = {
  ROUTE_ALLOWLIST,
  sanitizeModelOutput,
  filterActionsForRole,
};
