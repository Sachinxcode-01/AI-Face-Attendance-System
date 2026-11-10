const mongoose = require('mongoose');

const SecurityLogSchema = new mongoose.Schema({
  location: { type: String, required: true },
  type: { type: String, default: "intruder" },
  timestamp: { type: Date, default: Date.now, index: -1 },
  image_base64: { type: String },
  status: { type: String, default: "Active", index: true } // Active, Acknowledged, Safe
});

SecurityLogSchema.index({ status: 1, timestamp: -1 });

module.exports = mongoose.model('SecurityLog', SecurityLogSchema, 'security_logs');
