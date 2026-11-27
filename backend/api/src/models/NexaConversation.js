'use strict';

const mongoose = require('mongoose');

const NexaMessageSchema = new mongoose.Schema({
  id: { type: String, required: true },
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  suggestedActions: { type: [mongoose.Schema.Types.Mixed], default: [] },
  sources: { type: [mongoose.Schema.Types.Mixed], default: [] },
  toolsUsed: { type: [String], default: [] },
  pendingAction: { type: mongoose.Schema.Types.Mixed, default: null },
  structured: { type: mongoose.Schema.Types.Mixed, default: null },
  feedback: { type: String, enum: ['helpful', 'not_helpful', null], default: null },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const NexaConversationSchema = new mongoose.Schema({
  user_email: { type: String, required: true, index: true, lowercase: true, trim: true },
  user_role: { type: String, default: 'student', lowercase: true, trim: true },
  college_id: { type: String, index: true },
  title: { type: String, default: 'New Conversation', maxlength: 120 },
  language: { type: String, default: 'en' },
  archived: { type: Boolean, default: false, index: true },
  summary: { type: String, default: '' },
  context_state: { type: mongoose.Schema.Types.Mixed, default: {} },
  messages: { type: [NexaMessageSchema], default: [] },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now, index: -1 },
});

NexaConversationSchema.index({ user_email: 1, archived: 1, updated_at: -1 });
NexaConversationSchema.index({ user_email: 1, college_id: 1, updated_at: -1 });

module.exports = mongoose.model('NexaConversation', NexaConversationSchema, 'nexa_conversations');
