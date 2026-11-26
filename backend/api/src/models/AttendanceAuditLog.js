const mongoose = require('mongoose');

const AttendanceAuditLogSchema = new mongoose.Schema({
  actor_email: { type: String, required: true, index: true },
  college_id: { type: String, index: true },
  role: { type: String, required: true },
  action: {
    type: String,
    enum: [
      'ATTENDANCE_MARKED', 'QR_GENERATED', 'QR_REGENERATED', 'LEAVE_APPROVED',
      'LEAVE_DECISION', 'SESSION_CREATED', 'SESSION_READY', 'SESSION_STARTED', 'SESSION_PAUSED',
      'SESSION_RESUMED', 'SESSION_EXTENDED', 'SESSION_CLOSED', 'SESSION_CANCELLED',
      'SESSION_UNDER_REVIEW', 'SESSION_FINALISED', 'SESSION_STATUS_UPDATED', 'MANUAL_ATTENDANCE', 'BULK_ATTENDANCE',
      'LOGIN_EVENT', 'LOGIN_FAILED', 'LOGOUT_EVENT', 'PASSWORD_RESET',
      'PASSWORD_RESET_FAILED', 'PASSWORD_CHANGED', 'PROFILE_UPDATED',
      'BIOMETRIC_ENROLLED', 'BIOMETRIC_DELETED', 'PRIVACY_DATA_EXPORTED',
      'ACCOUNT_DELETION_REQUESTED', 'ROLE_VIOLATION', 'PERMISSION_DENIED',
      'ATTENDANCE_EXPORT', 'BROADCAST_SENT', 'TIMETABLE_SLOT_CREATED',
      'TIMETABLE_SLOT_UPDATED', 'TIMETABLE_SLOT_DELETED', 'DISPUTE_SUBMITTED',
      'DISPUTE_RESOLVED', 'EMAIL_VERIFIED', 'INTERVENTION_LOGGED',
      'ANNOUNCEMENT_PUBLISHED', 'ANNOUNCEMENT_DELETED', 'KIOSK_FACE_VERIFY'
    ],
    required: true
  },
  target_resource: { type: String },
  request_id: { type: String },
  details: { type: mongoose.Schema.Types.Mixed },
  ip_address: { type: String },
  timestamp: { type: Date, default: Date.now, index: -1 }
});

AttendanceAuditLogSchema.index({ college_id: 1, timestamp: -1 });
AttendanceAuditLogSchema.index({ actor_email: 1, timestamp: -1 });

module.exports = mongoose.model('AttendanceAuditLog', AttendanceAuditLogSchema, 'attendance_audit_logs');
