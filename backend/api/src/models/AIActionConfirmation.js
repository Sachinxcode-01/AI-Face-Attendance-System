'use strict';

const mongoose = require('mongoose');

const AIActionConfirmationSchema = new mongoose.Schema({
  action_id: { type: String, required: true, unique: true, index: true },
  user_email: { type: String, required: true, lowercase: true, trim: true, index: true },
  user_role: { type: String, required: true, lowercase: true },
  college_id: { type: String, index: true },
  action_type: { type: String, enum: ['submit_leave', 'submit_correction'], required: true },
  payload: { type: mongoose.Schema.Types.Mixed, required: true },
  summary: { type: String, required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'cancelled', 'expired', 'failed'], default: 'pending', index: true },
  result: { type: mongoose.Schema.Types.Mixed, default: null },
  expires_at: { type: Date, required: true },
  confirmed_at: { type: Date, default: null },
  created_at: { type: Date, default: Date.now },
});

AIActionConfirmationSchema.index({ expires_at: 1 }, { expireAfterSeconds: 86400 }); // clean up 24h after expiry

module.exports = mongoose.model('AIActionConfirmation', AIActionConfirmationSchema, 'ai_action_confirmations');
