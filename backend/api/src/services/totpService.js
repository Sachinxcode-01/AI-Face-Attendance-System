'use strict';

const crypto = require('crypto');

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function getEncryptionKey() {
  const raw = process.env.MFA_ENCRYPTION_KEY || process.env.AUTH_SECRET || process.env.JWT_SECRET || process.env.SECRET_KEY;
  if (!raw) throw new Error('Missing MFA encryption key source');
  return crypto.createHash('sha256').update(raw).digest();
}

function base32Encode(buf) {
  let bits = 0;
  let value = 0;
  let out = '';
  for (let i = 0; i < buf.length; i++) {
    value = (value << 8) | buf[i];
    bits += 8;
    while (bits >= 5) {
      out += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    out += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }
  return out;
}

function base32Decode(str) {
  const clean = String(str || '').toUpperCase().replace(/=+$/, '').replace(/\s+/g, '');
  let bits = 0;
  let value = 0;
  const bytes = [];
  for (let i = 0; i < clean.length; i++) {
    const idx = BASE32_ALPHABET.indexOf(clean[i]);
    if (idx === -1) throw new Error('Invalid base32 character');
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

function generateTotpSecret() {
  return base32Encode(crypto.randomBytes(20));
}

function encryptSecret(plainSecret) {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(plainSecret, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${enc.toString('hex')}`;
}

function decryptSecret(payload) {
  const parts = String(payload || '').split(':');
  if (parts.length !== 3) throw new Error('Malformed encrypted TOTP secret');
  const key = getEncryptionKey();
  const iv = Buffer.from(parts[0], 'hex');
  const tag = Buffer.from(parts[1], 'hex');
  const data = Buffer.from(parts[2], 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}

function generateHotp(secretBase32, counter) {
  const key = base32Decode(secretBase32);
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(counter));
  const hmac = crypto.createHmac('sha1', key).update(msg).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code = ((hmac[offset] & 0x7f) << 24) |
               ((hmac[offset + 1] & 0xff) << 16) |
               ((hmac[offset + 2] & 0xff) << 8) |
               (hmac[offset + 3] & 0xff);
  return String(code % 1000000).padStart(6, '0');
}

function verifyTotp(secretBase32, token, window = 1, nowMs = Date.now()) {
  const clean = String(token || '').replace(/\s+/g, '');
  if (!/^\d{6}$/.test(clean)) return false;
  const step = Math.floor(nowMs / 1000 / 30);
  const candidateBuf = Buffer.from(clean, 'utf8');
  for (let delta = -window; delta <= window; delta++) {
    const expected = generateHotp(secretBase32, step + delta);
    const expectedBuf = Buffer.from(expected, 'utf8');
    if (crypto.timingSafeEqual(candidateBuf, expectedBuf)) {
      return true;
    }
  }
  return false;
}

function buildOtpAuthUri({ secret, email, issuer = 'SmartFace' }) {
  const label = encodeURIComponent(`${issuer}:${email}`);
  return `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

function generateRecoveryCodes(count = 8) {
  const plain = [];
  const hashes = [];
  for (let i = 0; i < count; i++) {
    const code = `${crypto.randomBytes(2).toString('hex').toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    plain.push(code);
    hashes.push(hashRecoveryCode(code));
  }
  return { plain, hashes };
}

function hashRecoveryCode(code) {
  return crypto.createHash('sha256').update(String(code || '').trim().toUpperCase()).digest('hex');
}

module.exports = {
  generateTotpSecret,
  encryptSecret,
  decryptSecret,
  generateHotp,
  verifyTotp,
  buildOtpAuthUri,
  generateRecoveryCodes,
  hashRecoveryCode
};
