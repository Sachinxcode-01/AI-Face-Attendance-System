'use strict';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
const GEMINI_BASE_URL = process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta';
const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const GEMINI_FALLBACK_MODELS = [...new Set([DEFAULT_GEMINI_MODEL, 'gemini-2.0-flash'])];

function isConfigured() {
  return Boolean(GEMINI_API_KEY && !GEMINI_API_KEY.startsWith('your_'));
}

function toGeminiPayload(messages, { maxTokens = 450, temperature = 0.25 }) {
  const systemMsgs = messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n\n');
  const contents = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: String(m.content || '') }],
    }));

  const body = {
    contents: contents.length ? contents : [{ role: 'user', parts: [{ text: 'Hello' }] }],
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
    },
  };
  if (systemMsgs) {
    body.systemInstruction = { parts: [{ text: systemMsgs }] };
  }
  return body;
}

async function generate({ messages, maxTokens = 450, temperature = 0.25, signal }) {
  if (!isConfigured()) {
    throw new Error('GEMINI_NOT_CONFIGURED');
  }
  const payload = toGeminiPayload(messages, { maxTokens, temperature });
  let lastErr = null;

  for (const model of GEMINI_FALLBACK_MODELS) {
    const url = `${GEMINI_BASE_URL}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;
    const timeoutController = new AbortController();
    const timer = setTimeout(() => timeoutController.abort(), Number(process.env.NEXA_PROVIDER_TIMEOUT_MS || 12000));
    const combinedSignal = signal
      ? AbortSignal.any([signal, timeoutController.signal])
      : timeoutController.signal;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: combinedSignal,
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        const err = new Error(`Gemini HTTP ${res.status}: ${errText.slice(0, 200)}`);
        err.status = res.status;
        if (res.status === 404) {
          lastErr = err;
          continue;
        }
        throw err;
      }
      const data = await res.json();
      const text = (data?.candidates?.[0]?.content?.parts || [])
        .map((p) => p.text || '')
        .join('')
        .trim();
      return {
        provider: 'gemini',
        model,
        text,
        usage: {
          inputTokens: data?.usageMetadata?.promptTokenCount || 0,
          outputTokens: data?.usageMetadata?.candidatesTokenCount || 0,
        },
      };
    } catch (err) {
      lastErr = err;
      if (err?.status === 404) continue;
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr || new Error('GEMINI_UNAVAILABLE');
}

async function* generateStream({ messages, maxTokens = 450, temperature = 0.25, signal }) {
  if (!isConfigured()) {
    throw new Error('GEMINI_NOT_CONFIGURED');
  }
  const payload = toGeminiPayload(messages, { maxTokens, temperature });
  const model = GEMINI_FALLBACK_MODELS[0];
  const url = `${GEMINI_BASE_URL}/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse&key=${encodeURIComponent(GEMINI_API_KEY)}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  });

  if (!res.ok || !res.body) {
    const errText = await res.text().catch(() => '');
    const err = new Error(`Gemini Stream HTTP ${res.status}: ${errText.slice(0, 200)}`);
    err.status = res.status;
    throw err;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  while (true) {
    if (signal?.aborted) break;
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const jsonStr = trimmed.slice(5).trim();
      if (!jsonStr || jsonStr === '[DONE]') continue;
      try {
        const parsed = JSON.parse(jsonStr);
        const delta = (parsed?.candidates?.[0]?.content?.parts || [])
          .map((p) => p.text || '')
          .join('');
        if (delta) {
          yield { delta, model, provider: 'gemini' };
        }
      } catch {
        // ignore partial JSON frames
      }
    }
  }
}

module.exports = {
  name: 'gemini',
  isConfigured,
  generate,
  generateStream,
};
