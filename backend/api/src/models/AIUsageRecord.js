'use strict';

const mongoose = require('mongoose');

const AIUsageRecordSchema = new mongoose.Schema({
  request_id: { type: String, required: true, index: true },
  user_email: { type: String, required: true, lowercase: true, trim: true, index: true },
  user_role: { type: String, required: true, lowercase: true, index: true },
  college_id: { type: String, index: true },
  intent: { type: String, default: 'general', index: true },
  provider: { type: String, enum: ['groq', 'gemini', 'deterministic', 'knowledge', 'fallback'], required: true, index: true },
  model: { type: String, default: 'none' },
  fallback_used: { type: Boolean, default: false },
  streamed: { type: Boolean, default: false },
  success: { type: Boolean, default: true, index: true },
  error_code: { type: String, default: null },
  input_tokens: { type: Number, default: 0 },
  output_tokens: { type: Number, default: 0 },
  estimated_cost_usd: { type: Number, default: 0 },
  ttft_ms: { type: Number, default: null },
  total_latency_ms: { type: Number, default: 0 },
  tool_count: { type: Number, default: 0 },
  language: { type: String, default: 'en' },
  created_at: { type: Date, default: Date.now, index: -1 },
});

AIUsageRecordSchema.index({ college_id: 1, created_at: -1 });
AIUsageRecordSchema.index({ created_at: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 }); // 90-day retention

module.exports = mongoose.model('AIUsageRecord', AIUsageRecordSchema, 'ai_usage_records');
