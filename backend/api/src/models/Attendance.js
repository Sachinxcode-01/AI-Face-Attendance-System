const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  student_email: { type: String, required: true },
  session_id: { type: String, required: true, index: true },
  timestamp: { type: Date, default: Date.now, index: -1 },
  status: { type: String, default: "Present" },
  verified_by: { type: String, default: "qr" }, // qr, face, manual
  confidence: { type: Number },
  lighting_quality: { type: String, default: "Good" }, // Good, Under-exposed, Over-exposed
  face_visibility: { type: String, default: "Excellent" } // Excellent, Partially Obscured, Weak Angle
});

AttendanceSchema.index({ student_email: 1, timestamp: -1 });
AttendanceSchema.index({ student_email: 1, session_id: 1 }, { unique: true });
// Analytics aggregations filter on status over a time window.
AttendanceSchema.index({ status: 1, timestamp: -1 });
// Live monitor tallies present/face per session.
AttendanceSchema.index({ session_id: 1, status: 1, verified_by: 1 });

module.exports = mongoose.model('Attendance', AttendanceSchema, 'attendance');
