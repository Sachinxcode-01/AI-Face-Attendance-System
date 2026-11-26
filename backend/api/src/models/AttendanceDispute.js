const mongoose = require('mongoose');

const AttendanceDisputeSchema = new mongoose.Schema({
  student_email: { type: String, required: true, index: true },
  session_id: { type: String, required: true, index: true },
  attendance_id: { type: String },
  college_id: { type: String, index: true },
  subject: { type: String },
  reason_category: {
    type: String,
    enum: [
      'facial_recognition_failure',
      'qr_scanning_failure',
      'incorrect_absence',
      'incorrect_late_marking',
      'network_failure',
      'faculty_recording_error',
      'institutional_activity',
      'technical_issue',
      'other'
    ],
    default: 'other'
  },
  reason: { type: String, required: true },
  requested_status: { type: String, enum: ['Present', 'Excused', 'Late'], default: 'Present' },
  evidence_url: { type: String },
  evidence_name: { type: String },
  status: { type: String, enum: ['Pending', 'Under Review', 'Approved', 'Rejected'], default: 'Pending', index: true },
  resolved_by: { type: String },
  remarks: { type: String },
  resolved_at: { type: Date },
  audit_trail: [{
    status: { type: String },
    actor: { type: String },
    role: { type: String },
    note: { type: String },
    timestamp: { type: Date, default: Date.now }
  }],
  updated_at: { type: Date, default: Date.now },
  created_at: { type: Date, default: Date.now, index: -1 }
});

AttendanceDisputeSchema.index({ student_email: 1, session_id: 1 });
AttendanceDisputeSchema.index({ student_email: 1, created_at: -1 });
AttendanceDisputeSchema.index({ status: 1, created_at: -1 });

module.exports = mongoose.model('AttendanceDispute', AttendanceDisputeSchema, 'attendance_disputes');
