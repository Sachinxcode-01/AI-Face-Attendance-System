const mongoose = require('mongoose');

const AttendanceDisputeSchema = new mongoose.Schema({
  student_email: { type: String, required: true, index: true },
  session_id: { type: String, required: true, index: true },
  attendance_id: { type: String },
  college_id: { type: String, index: true },
  subject: { type: String },
  reason: { type: String, required: true },
  requested_status: { type: String, enum: ['Present', 'Excused', 'Late'], default: 'Present' },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending', index: true },
  resolved_by: { type: String },
  remarks: { type: String },
  resolved_at: { type: Date },
  created_at: { type: Date, default: Date.now, index: -1 }
});

AttendanceDisputeSchema.index({ student_email: 1, session_id: 1 });

module.exports = mongoose.model('AttendanceDispute', AttendanceDisputeSchema, 'attendance_disputes');
