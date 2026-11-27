'use strict';

const mongoose = require('mongoose');
const AIUsageRecord = require('../../../models/AIUsageRecord');

// Approximate per-1M token rates in USD for internal budget telemetry
const COST_PER_1M = {
  'llama-3.3-70b-versatile': { input: 0.59, output: 0.79 },
  'llama-3.1-8b-instant': { input: 0.05, output: 0.08 },
  'gemini-2.5-flash': { input: 0.15, output: 0.60 },
  'gemini-2.0-flash': { input: 0.10, output: 0.40 },
};

function estimateCostUsd(model, inputTokens = 0, outputTokens = 0) {
  const rate = COST_PER_1M[model];
  if (!rate) return 0;
  return Number((((inputTokens * rate.input) + (outputTokens * rate.output)) / 1_000_000).toFixed(6));
}

async function recordUsageMetric(metric) {
  if (mongoose.connection.readyState !== 1) return;
  try {
    await AIUsageRecord.create({
      ...metric,
      estimated_cost_usd: estimateCostUsd(metric.model, metric.input_tokens, metric.output_tokens),
    });
  } catch (err) {
    console.warn('[Nexa Metrics] Failed to record usage:', err.message);
  }
}

async function getUsageSummary({ collegeId = null, days = 7 } = {}) {
  if (mongoose.connection.readyState !== 1) {
    return { available: false, totalRequests: 0, byProvider: [] };
  }
  const since = new Date(Date.now() - Math.max(1, days) * 24 * 60 * 60 * 1000);
  const match = { created_at: { $gte: since } };
  if (collegeId) match.college_id = collegeId;

  const [totals, byProvider] = await Promise.all([
    AIUsageRecord.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalRequests: { $sum: 1 },
          successfulRequests: { $sum: { $cond: ['$success', 1, 0] } },
          fallbackCount: { $sum: { $cond: ['$fallback_used', 1, 0] } },
          totalInputTokens: { $sum: '$input_tokens' },
          totalOutputTokens: { $sum: '$output_tokens' },
          totalCostUsd: { $sum: '$estimated_cost_usd' },
          avgLatencyMs: { $avg: '$total_latency_ms' },
          avgTtftMs: { $avg: '$ttft_ms' },
        },
      },
    ]),
    AIUsageRecord.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$provider',
          requests: { $sum: 1 },
          failures: { $sum: { $cond: ['$success', 0, 1] } },
          avgLatencyMs: { $avg: '$total_latency_ms' },
          inputTokens: { $sum: '$input_tokens' },
          outputTokens: { $sum: '$output_tokens' },
        },
      },
    ]),
  ]);

  return {
    available: true,
    windowDays: days,
    summary: totals[0] || {
      totalRequests: 0,
      successfulRequests: 0,
      fallbackCount: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCostUsd: 0,
      avgLatencyMs: 0,
      avgTtftMs: null,
    },
    byProvider,
  };
}

module.exports = {
  estimateCostUsd,
  recordUsageMetric,
  getUsageSummary,
};
