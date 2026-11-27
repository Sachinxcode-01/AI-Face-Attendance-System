'use strict';

const mongoose = require('mongoose');

const AssistantFeedbackSchema = new mongoose.Schema({
  feedback_id: { type: String, required: true, unique: true, index: true },
  response_id: { type: String, required: true, index: true },
  conversation_id: { type: String, default: null },
  user_email: { type: String, required: true, lowercase: true, trim: true, index: true },
  user_role: { type: String, required: true, lowercase: true },
  college_id: { type: String, index: true },
  rating: { type: String, enum: ['helpful', 'not_helpful'], required: true },
  category: { type: String, default: 'general' },
  current_route: { type: String, default: '' },
  feedback: { type: String, default: '', maxlength: 500 },
  created_at: { type: Date, default: Date.now, index: -1 },
});

module.exports = mongoose.model('AssistantFeedback', AssistantFeedbackSchema, 'assistant_feedback');
