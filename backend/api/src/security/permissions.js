/**
 * Centralized granular permissions list
 */
const PERMISSIONS = Object.freeze({
  // Attendance
  ATTENDANCE_READ: 'attendance.read',
  ATTENDANCE_READ_OWN: 'attendance.read.own',
  ATTENDANCE_WRITE: 'attendance.write',
  ATTENDANCE_WRITE_FACE: 'attendance.write.face',
  ATTENDANCE_WRITE_QR: 'attendance.write.qr',
  ATTENDANCE_MANAGE: 'attendance.manage',

  // Sessions
  SESSION_READ: 'session.read',
  SESSION_CREATE: 'session.create',
  SESSION_MANAGE: 'session.manage',

  // Leaves
  LEAVE_APPLY: 'leave.apply',
  LEAVE_READ_OWN: 'leave.read.own',
  LEAVE_READ_WARD: 'leave.read.ward',
  LEAVE_APPROVE: 'leave.approve',
  LEAVE_MANAGE: 'leave.manage',

  // Analytics & Reports
  ANALYTICS_VIEW_OWN: 'analytics.view.own',
  ANALYTICS_VIEW_CLASS: 'analytics.view.class',
  ANALYTICS_VIEW_SYSTEM: 'analytics.view.system',
  ANALYTICS_EXPORT: 'analytics.export',

  // Users & Biometrics
  USER_READ: 'user.read',
  USER_MANAGE: 'user.manage',
  BIOMETRIC_ENROLL: 'biometric.enroll',
  BIOMETRIC_MANAGE: 'biometric.manage',

  // Notifications
  NOTIFICATION_READ: 'notification.read',
  NOTIFICATION_BROADCAST: 'notification.broadcast',

  // AI & Models
  AI_STATUS_READ: 'ai.status.read',
  AI_TRAIN: 'ai.train'
});

module.exports = {
  PERMISSIONS
};
