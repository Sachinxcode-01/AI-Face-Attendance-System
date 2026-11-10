const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
  teacher_id: { type: String, required: true, index: true },
  subject: { type: String, required: true },
  duration: { type: String, default: "1 Hour" },
  start_time: { type: Date, default: Date.now, index: -1 },
  is_active: { type: Boolean, default: true, index: true },
  qr_code: { type: String, required: true }
});

// Serves the live-monitor / active-session lookups and per-subject analytics.
SessionSchema.index({ is_active: 1, start_time: -1 });
SessionSchema.index({ subject: 1 });

module.exports = mongoose.model('Session', SessionSchema, 'sessions');
