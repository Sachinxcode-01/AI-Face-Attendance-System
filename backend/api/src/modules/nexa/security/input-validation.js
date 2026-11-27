'use strict';

const { z } = require('zod');

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s*(instructions|rules|prompts)?/i,
  /ignore\s+previous/i,
  /disregard\s+(all\s+)?(previous|above|system)/i,
  /system\s*prompt/i,
  /reveal\s+(your\s+)?(system|instructions|prompt|secrets)/i,
  /bypass\s+(security|restriction|auth|permission|role)/i,
  /bypass\s+restriction/i,
  /you\s+are\s+now\s+/i,
  /acting\s+as\s+/i,
  /pretend\s+(to\s+be|you\s+are)\s+(admin|super_admin|teacher|system)/i,
  /delete\s+all/i,
  /drop\s+table/i,
  /db\.\w+\.find\s*\(/i,
  /find\s*\(.*\)/i,
  /\$where\b/i,
  /\$ne\b/i,
  /\$gt\b/i,
  /<script\b[^>]*>/i,
];

const SECRETS_TRIGGERS = [
  'api key',
  'groq key',
  'gemini key',
  'google key',
  'jwt secret',
  'system prompt',
  'otp',
  'password',
  'face embedding',
  'face vector',
  'biometric template',
  'private key',
  'service role key',
  'mongodb_url',
  'mongo_uri',
];

const ChatRequestSchema = z.object({
  message: z.string().trim().min(1, 'Message is required.').max(2000, 'Message exceeds 2000 character limit.'),
  conversationId: z.string().trim().max(128).optional().nullable(),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant', 'nexa', 'system']).default('user'),
        content: z.string().max(4000),
      })
    )
    .max(20)
    .optional()
    .default([]),
  currentRoute: z.string().max(200).optional().default(''),
  language: z.string().max(24).optional().default('auto'),
  student_email: z.string().email().max(254).optional(),
  selected_subject: z.string().max(120).optional(),
});

/**
 * Normalizes language codes from UI variants ('English', 'Hindi', 'Kannada', 'en', 'hi', 'kn', 'hinglish').
 */
function normalizeLanguageCode(raw) {
  const s = String(raw || 'auto').trim().toLowerCase();
  if (s === 'en' || s === 'english') return 'en';
  if (s === 'kn' || s === 'kannada' || s === 'ಕನ್ನಡ') return 'kn';
  if (s === 'hi' || s === 'hindi' || s === 'हिंदी') return 'hi';
  if (s === 'hinglish') return 'hinglish';
  return 'auto';
}

/**
 * Sanitizes user prompt against prompt injection and NoSQL/XSS payloads.
 * Throws an Error when an explicit injection/attack pattern is detected.
 */
function sanitizePrompt(text) {
  if (typeof text !== 'string') return '';
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      throw new Error('Potential prompt injection or security threat detected.');
    }
  }
  return text.replace(/[\$\{\}]/g, '').trim();
}

/**
 * Detects if user is asking for protected secrets, credentials, or biometric vectors.
 */
function isSecretsQuery(cleanMessage) {
  const lower = String(cleanMessage || '').toLowerCase();
  return SECRETS_TRIGGERS.some((trigger) => lower.includes(trigger));
}

/**
 * Strips instruction-like patterns from untrusted retrieved documents / tool strings
 * so indirect prompt injection in DB/knowledge docs cannot hijack the LLM.
 */
function sanitizeUntrustedContext(text, maxLen = 1800) {
  if (typeof text !== 'string') return '';
  let cleaned = text
    .replace(/ignore\s+(all\s+)?previous\s+instructions?/gi, '[redacted-instruction]')
    .replace(/system\s*prompt/gi, '[redacted-term]')
    .replace(/<\/?script[^>]*>/gi, '');
  if (cleaned.length > maxLen) {
    cleaned = `${cleaned.slice(0, maxLen)}…`;
  }
  return cleaned;
}

module.exports = {
  ChatRequestSchema,
  normalizeLanguageCode,
  sanitizePrompt,
  isSecretsQuery,
  sanitizeUntrustedContext,
};
