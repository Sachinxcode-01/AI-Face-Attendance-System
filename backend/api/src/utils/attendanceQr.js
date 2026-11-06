const crypto = require('crypto');

const VALIDITY_MS = 20_000;

function signatureFor(session, issuedAt) {
  return crypto
    .createHmac('sha256', session.qr_code)
    .update(`${session._id}:${issuedAt}`)
    .digest('hex');
}

function issueAttendanceQrToken(session, now = Date.now()) {
  const issuedAt = now;
  return {
    token: `${issuedAt}.${signatureFor(session, issuedAt)}`,
    issued_at: new Date(issuedAt).toISOString(),
    expires_at: new Date(issuedAt + VALIDITY_MS).toISOString(),
  };
}

function verifyAttendanceQrToken(session, token, now = Date.now()) {
  if (typeof token !== 'string') return false;
  const [issuedAtValue, signature, extra] = token.split('.');
  const issuedAt = Number(issuedAtValue);
  if (
    extra !== undefined ||
    !Number.isSafeInteger(issuedAt) ||
    !/^[a-f0-9]{64}$/i.test(signature || '') ||
    issuedAt > now + 5_000 ||
    now - issuedAt > VALIDITY_MS
  ) return false;

  const expected = Buffer.from(signatureFor(session, issuedAt), 'hex');
  const supplied = Buffer.from(signature, 'hex');
  return expected.length === supplied.length && crypto.timingSafeEqual(expected, supplied);
}

module.exports = { issueAttendanceQrToken, verifyAttendanceQrToken };
