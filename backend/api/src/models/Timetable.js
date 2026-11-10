const mongoose = require('mongoose');

const TimetableSchema = new mongoose.Schema({
  user_id: { type: String, required: true, index: true }, // e.g., 'CSE_6_A' (dept_sem_sec) or teacher email
  subject: { type: String, required: true },
  day: { type: String, required: true }, // Monday, Tuesday, Wednesday, Thursday, Friday, Saturday
  time: { type: String, required: true }, // e.g., "09:00 AM - 10:30 AM"
  room: { type: String, default: "" },
  college_id: { type: String, default: "", index: true },
  teacher_email: { type: String, default: "", index: true },
  created_at: { type: Date, default: Date.now }
});

TimetableSchema.index({ college_id: 1, user_id: 1, day: 1 });

module.exports = mongoose.model('Timetable', TimetableSchema, 'timetable');
