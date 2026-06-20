const mongoose = require('mongoose');

const UserSessionSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  device: { type: String, required: true },
  ip: { type: String, required: true },
  location: { type: String, default: "Unknown Location" },
  tokenHash: { type: String, required: true, unique: true, index: true },
  lastActive: { type: Date, default: Date.now },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('UserSession', UserSessionSchema, 'user_sessions');
