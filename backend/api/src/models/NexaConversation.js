'use strict';

const mongoose = require('mongoose');

const NexaMessageSchema = new mongoose.Schema({
  id: { type: String, required: true },
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  suggestedActions: { type: [mongoose.Schema.Types.Mixed], default: [] },
  structured: { type: mongoose.Schema.Types.Mixed, default: null },
  feedback: { type: String, enum: ['helpful', 'not_helpful', null], default: null },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const NexaConversationSchema = new mongoose.Schema({
  user_email: { type: String, required: true, index: true, lowercase: true, trim: true },
  college_id: { type: String, index: true },
  title: { type: String, default: 'New Conversation' },
  messages: { type: [NexaMessageSchema], default: [] },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now, index: -1 }
});

NexaConversationSchema.index({ user_email: 1, updated_at: -1 });

module.exports = mongoose.model('NexaConversation', NexaConversationSchema, 'nexa_conversations');
