const mongoose = require('mongoose');

const AttendanceAuditLogSchema = new mongoose.Schema({
  actor_email: { type: String, required: true, index: true },
  college_id: { type: String, index: true },
  role: { type: String, required: true },
  action: {
    type: String,
    enum: [
      'ATTENDANCE_MARKED', 'QR_GENERATED', 'LEAVE_APPROVED', 'SESSION_CREATED',
      'LOGIN_EVENT', 'LOGIN_FAILED', 'LOGOUT_EVENT', 'PASSWORD_RESET',
      'PASSWORD_RESET_FAILED', 'PASSWORD_CHANGED', 'PROFILE_UPDATED',
      'BIOMETRIC_ENROLLED', 'BIOMETRIC_DELETED', 'PRIVACY_DATA_EXPORTED',
      'ACCOUNT_DELETION_REQUESTED', 'ROLE_VIOLATION', 'ATTENDANCE_EXPORT',
      'BROADCAST_SENT', 'TIMETABLE_SLOT_CREATED', 'TIMETABLE_SLOT_DELETED',
      'DISPUTE_SUBMITTED', 'DISPUTE_RESOLVED', 'EMAIL_VERIFIED'
    ],
    required: true
  },
  details: { type: mongoose.Schema.Types.Mixed },
  ip_address: { type: String },
  timestamp: { type: Date, default: Date.now, index: -1 }
});

module.exports = mongoose.model('AttendanceAuditLog', AttendanceAuditLogSchema, 'attendance_audit_logs');
