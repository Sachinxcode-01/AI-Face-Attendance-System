'use strict';

const mongoose = require('mongoose');

const UserAssistantPreferenceSchema = new mongoose.Schema({
  user_email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  college_id: { type: String, index: true },
  preferred_language: { type: String, enum: ['en', 'kn', 'hi', 'hinglish'], default: 'en' },
  response_detail: { type: String, enum: ['concise', 'balanced', 'detailed'], default: 'balanced' },
  attendance_target: { type: Number, min: 1, max: 100, default: 75 },
  voice_rate: { type: Number, min: 0.25, max: 2.0, default: 0.5 },
  proactive_alerts_enabled: { type: Boolean, default: true },
  updated_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('UserAssistantPreference', UserAssistantPreferenceSchema, 'user_assistant_preferences');
