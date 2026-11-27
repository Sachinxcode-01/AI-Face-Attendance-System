'use strict';

const Groq = require('groq-sdk');

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const DEFAULT_FAST_MODEL = process.env.GROQ_FAST_MODEL || 'llama-3.1-8b-instant';
const DEFAULT_REASONING_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

let groqClient = null;
if (GROQ_API_KEY && !GROQ_API_KEY.startsWith('your_')) {
  groqClient = new Groq({
    apiKey: GROQ_API_KEY,
    timeout: Number(process.env.NEXA_PROVIDER_TIMEOUT_MS || 12000),
    maxRetries: 1,
  });
}

function isConfigured() {
  return Boolean(groqClient);
}

function getModelCandidates(tier = 'balanced') {
  const preferred = tier === 'fast' ? DEFAULT_FAST_MODEL : DEFAULT_REASONING_MODEL;
  return [...new Set([preferred, 'llama-3.3-70b-versatile', 'llama-3.1-8b-instant'])];
}

async function generate({ messages, maxTokens = 450, temperature = 0.25, tier = 'balanced', signal }) {
  if (!groqClient) {
    throw new Error('GROQ_NOT_CONFIGURED');
  }
  const candidates = getModelCandidates(tier);
  let lastErr = null;
  for (const model of candidates) {
    try {
      const resp = await groqClient.chat.completions.create(
        {
          messages,
          model,
          temperature,
          max_tokens: maxTokens,
          stream: false,
        },
        signal ? { signal } : undefined
      );
      const text = resp?.choices?.[0]?.message?.content?.trim() || '';
      return {
        provider: 'groq',
        model,
        text,
        usage: {
          inputTokens: resp?.usage?.prompt_tokens || 0,
          outputTokens: resp?.usage?.completion_tokens || 0,
        },
      };
    } catch (err) {
      lastErr = err;
      const msg = String(err?.message || '');
      if (msg.includes('model_not_found') || err?.status === 404) {
        continue;
      }
      throw err;
    }
  }
  throw lastErr || new Error('GROQ_UNAVAILABLE');
}

async function* generateStream({ messages, maxTokens = 450, temperature = 0.25, tier = 'balanced', signal }) {
  if (!groqClient) {
    throw new Error('GROQ_NOT_CONFIGURED');
  }
  const candidates = getModelCandidates(tier);
  let streamResp = null;
  let usedModel = candidates[0];
  let lastErr = null;

  for (const model of candidates) {
    try {
      streamResp = await groqClient.chat.completions.create(
        {
          messages,
          model,
          temperature,
          max_tokens: maxTokens,
          stream: true,
        },
        signal ? { signal } : undefined
      );
      usedModel = model;
      break;
    } catch (err) {
      lastErr = err;
      const msg = String(err?.message || '');
      if (msg.includes('model_not_found') || err?.status === 404) {
        continue;
      }
      throw err;
    }
  }

  if (!streamResp) {
    throw lastErr || new Error('GROQ_STREAM_UNAVAILABLE');
  }

  for await (const chunk of streamResp) {
    if (signal?.aborted) break;
    const delta = chunk?.choices?.[0]?.delta?.content || '';
    if (delta) {
      yield { delta, model: usedModel, provider: 'groq' };
    }
  }
}

module.exports = {
  name: 'groq',
  isConfigured,
  generate,
  generateStream,
};
