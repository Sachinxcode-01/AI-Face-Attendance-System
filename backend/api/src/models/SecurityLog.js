const mongoose = require('mongoose');

const SecurityLogSchema = new mongoose.Schema({
  location: { type: String, required: true },
  college_id: { type: String, index: true },
  type: { type: String, default: "intruder" },
  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  confidence: { type: Number, default: null },
  timestamp: { type: Date, default: Date.now, index: -1 },
  image_base64: { type: String },
  status: { type: String, default: "Active", index: true }, // Active, Under review, Investigating, Escalated, Resolved, False positive, Closed, Acknowledged
  assigned_to: { type: String, default: null },
  resolution_notes: { type: String, default: '' },
  resolved_at: { type: Date, default: null },
  resolved_by: { type: String, default: null }
});

SecurityLogSchema.index({ status: 1, timestamp: -1 });
SecurityLogSchema.index({ college_id: 1, status: 1, timestamp: -1 });

module.exports = mongoose.model('SecurityLog', SecurityLogSchema, 'security_logs');
