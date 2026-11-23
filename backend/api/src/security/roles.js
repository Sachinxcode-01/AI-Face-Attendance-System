/**
 * Centralized Roles definitions for SmartFace Attendance
 */
const ROLES = Object.freeze({
  STUDENT: 'student',
  TEACHER: 'teacher',
  PARENT: 'parent',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin'
});

const ROLE_HIERARCHY = Object.freeze({
  [ROLES.SUPER_ADMIN]: 100,
  [ROLES.ADMIN]: 80,
  [ROLES.TEACHER]: 50,
  [ROLES.PARENT]: 20,
  [ROLES.STUDENT]: 10
});

module.exports = {
  ROLES,
  ROLE_HIERARCHY
};
