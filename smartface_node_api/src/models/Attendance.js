const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  student_email: { type: String, required: true },
  session_id: { type: String, required: true, index: true },
  timestamp: { type: Date, default: Date.now, index: -1 },
  status: { type: String, default: "Present" },
  verified_by: { type: String, default: "qr" }, // qr, face, manual
  confidence: { type: Number }
});

AttendanceSchema.index({ student_email: 1, timestamp: -1 });

module.exports = mongoose.model('Attendance', AttendanceSchema, 'attendance');
