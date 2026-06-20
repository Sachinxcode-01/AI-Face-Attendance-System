const mongoose = require('mongoose');

const AttendanceAuditLogSchema = new mongoose.Schema({
  actor_email: { type: String, required: true, index: true },
  role: { type: String, required: true },
  action: { type: String, enum: ['ATTENDANCE_MARKED', 'QR_GENERATED', 'LEAVE_APPROVED', 'SESSION_CREATED', 'LOGIN_EVENT'], required: true },
  details: { type: mongoose.Schema.Types.Mixed },
  ip_address: { type: String },
  timestamp: { type: Date, default: Date.now, index: -1 }
});

module.exports = mongoose.model('AttendanceAuditLog', AttendanceAuditLogSchema, 'attendance_audit_logs');
