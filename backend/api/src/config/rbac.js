/**
 * Centralized Role-Based Access Control (RBAC) Configuration
 * Single source of truth for platform roles, hierarchy, and permissions.
 */

const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  PRINCIPAL: 'principal',
  HOD: 'hod',
  MANAGEMENT: 'management',
  TEACHER: 'teacher',
  PARENT: 'parent',
  STUDENT: 'student'
};

const ROLE_HIERARCHY = {
  [ROLES.SUPER_ADMIN]: 100,
  [ROLES.ADMIN]: 80,
  [ROLES.PRINCIPAL]: 70,
  [ROLES.MANAGEMENT]: 60,
  [ROLES.HOD]: 50,
  [ROLES.TEACHER]: 30,
  [ROLES.PARENT]: 20,
  [ROLES.STUDENT]: 10
};

const PERMISSIONS = {
  // Attendance
  ATTENDANCE_READ_SELF: 'attendance:read_self',
  ATTENDANCE_READ_WARD: 'attendance:read_ward',
  ATTENDANCE_READ_DEPARTMENT: 'attendance:read_department',
  ATTENDANCE_READ_ALL: 'attendance:read_all',
  ATTENDANCE_MARK_FACE: 'attendance:mark_face',
  ATTENDANCE_MARK_MANUAL: 'attendance:mark_manual',
  ATTENDANCE_AUDIT: 'attendance:audit',

  // Sessions
  SESSIONS_CREATE: 'sessions:create',
  SESSIONS_STOP: 'sessions:stop',
  SESSIONS_READ: 'sessions:read',

  // Leaves
  LEAVE_APPLY: 'leave:apply',
  LEAVE_APPROVE: 'leave:approve',
  LEAVE_READ_SELF: 'leave:read_self',
  LEAVE_READ_ALL: 'leave:read_all',

  // Analytics & Intelligence
  ANALYTICS_READ_STUDENT: 'analytics:read_student',
  ANALYTICS_READ_INSTITUTIONAL: 'analytics:read_institutional',
  ANALYTICS_EXPORT: 'analytics:export',
  ACCURACY_MONITOR: 'accuracy:monitor',

  // Users & Roles
  USERS_READ: 'users:read',
  USERS_MANAGE: 'users:manage',
  USERS_BULK: 'users:bulk',

  // System & Multi-tenant Super Admin
  COLLEGES_MANAGE: 'colleges:manage',
  SYSTEM_CONFIG: 'system:config',
  SYSTEM_HEALTH: 'system:health',
  SECURITY_AUDIT: 'security:audit'
};

// Map roles to their permitted capabilities
const ROLE_PERMISSIONS = {
  [ROLES.STUDENT]: [
    PERMISSIONS.ATTENDANCE_READ_SELF,
    PERMISSIONS.ATTENDANCE_MARK_FACE,
    PERMISSIONS.SESSIONS_READ,
    PERMISSIONS.LEAVE_APPLY,
    PERMISSIONS.LEAVE_READ_SELF,
    PERMISSIONS.ANALYTICS_READ_STUDENT
  ],
  [ROLES.PARENT]: [
    PERMISSIONS.ATTENDANCE_READ_WARD,
    PERMISSIONS.SESSIONS_READ,
    PERMISSIONS.LEAVE_APPLY,
    PERMISSIONS.LEAVE_READ_SELF,
    PERMISSIONS.ANALYTICS_READ_STUDENT
  ],
  [ROLES.TEACHER]: [
    PERMISSIONS.ATTENDANCE_READ_SELF,
    PERMISSIONS.ATTENDANCE_READ_DEPARTMENT,
    PERMISSIONS.ATTENDANCE_MARK_MANUAL,
    PERMISSIONS.SESSIONS_CREATE,
    PERMISSIONS.SESSIONS_STOP,
    PERMISSIONS.SESSIONS_READ,
    PERMISSIONS.LEAVE_APPROVE,
    PERMISSIONS.LEAVE_READ_ALL,
    PERMISSIONS.ANALYTICS_READ_INSTITUTIONAL,
    PERMISSIONS.ANALYTICS_EXPORT,
    PERMISSIONS.USERS_READ
  ],
  [ROLES.HOD]: [
    PERMISSIONS.ATTENDANCE_READ_DEPARTMENT,
    PERMISSIONS.ATTENDANCE_MARK_MANUAL,
    PERMISSIONS.SESSIONS_CREATE,
    PERMISSIONS.SESSIONS_STOP,
    PERMISSIONS.SESSIONS_READ,
    PERMISSIONS.LEAVE_APPROVE,
    PERMISSIONS.LEAVE_READ_ALL,
    PERMISSIONS.ANALYTICS_READ_INSTITUTIONAL,
    PERMISSIONS.ANALYTICS_EXPORT,
    PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_MANAGE
  ],
  [ROLES.PRINCIPAL]: [
    PERMISSIONS.ATTENDANCE_READ_ALL,
    PERMISSIONS.SESSIONS_CREATE,
    PERMISSIONS.SESSIONS_STOP,
    PERMISSIONS.SESSIONS_READ,
    PERMISSIONS.LEAVE_APPROVE,
    PERMISSIONS.LEAVE_READ_ALL,
    PERMISSIONS.ANALYTICS_READ_INSTITUTIONAL,
    PERMISSIONS.ANALYTICS_EXPORT,
    PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_MANAGE,
    PERMISSIONS.USERS_BULK,
    PERMISSIONS.SECURITY_AUDIT
  ],
  [ROLES.ADMIN]: [
    PERMISSIONS.ATTENDANCE_READ_ALL,
    PERMISSIONS.ATTENDANCE_MARK_MANUAL,
    PERMISSIONS.ATTENDANCE_AUDIT,
    PERMISSIONS.SESSIONS_CREATE,
    PERMISSIONS.SESSIONS_STOP,
    PERMISSIONS.SESSIONS_READ,
    PERMISSIONS.LEAVE_APPROVE,
    PERMISSIONS.LEAVE_READ_ALL,
    PERMISSIONS.ANALYTICS_READ_INSTITUTIONAL,
    PERMISSIONS.ANALYTICS_EXPORT,
    PERMISSIONS.ACCURACY_MONITOR,
    PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_MANAGE,
    PERMISSIONS.USERS_BULK,
    PERMISSIONS.SYSTEM_CONFIG,
    PERMISSIONS.SYSTEM_HEALTH,
    PERMISSIONS.SECURITY_AUDIT
  ],
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS)
};

/**
 * Check if a role possesses a specific permission
 */
function hasPermission(userRole, permission) {
  if (!userRole) return false;
  const role = userRole.toLowerCase();
  const allowed = ROLE_PERMISSIONS[role];
  return Array.isArray(allowed) && allowed.includes(permission);
}

/**
 * Check if a role meets or exceeds a target hierarchy level
 */
function isAtLeastRole(userRole, targetRole) {
  if (!userRole || !targetRole) return false;
  const userRank = ROLE_HIERARCHY[userRole.toLowerCase()] || 0;
  const targetRank = ROLE_HIERARCHY[targetRole.toLowerCase()] || 0;
  return userRank >= targetRank;
}

module.exports = {
  ROLES,
  ROLE_HIERARCHY,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  hasPermission,
  isAtLeastRole
};
