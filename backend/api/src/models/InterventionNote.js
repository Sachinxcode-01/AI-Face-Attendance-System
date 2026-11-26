const mongoose = require('mongoose');

const InterventionNoteSchema = new mongoose.Schema({
  teacher_email: { type: String, required: true, index: true, lowercase: true, trim: true },
  student_email: { type: String, required: true, index: true, lowercase: true, trim: true },
  college_id: { type: String, index: true },
  subject: { type: String },
  risk_level: { type: String },
  action_taken: {
    type: String,
    enum: ['note', 'reminder_sent', 'escalated', 'counseling_scheduled'],
    default: 'note',
  },
  note: { type: String, required: true, maxlength: 1000 },
  escalated_to: { type: String },
  created_at: { type: Date, default: Date.now, index: -1 },
});

InterventionNoteSchema.index({ teacher_email: 1, student_email: 1, created_at: -1 });

module.exports = mongoose.model('InterventionNote', InterventionNoteSchema, 'intervention_notes');
