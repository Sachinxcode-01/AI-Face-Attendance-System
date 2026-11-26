const crypto = require('crypto');

const DEFAULT_ROTATION_SECONDS = 15;
const GRACE_SECONDS = 5;

  function getRotationSeconds(session) {
    const rotSec = Number(session?.qr_rotation_seconds);
    return Number.isFinite(rotSec) && rotSec >= 5 && rotSec <= 120
      ? rotSec
      : DEFAULT_ROTATION_SECONDS;
  }

  function getValidityMs(session) {
    return (getRotationSeconds(session) + GRACE_SECONDS) * 1000;
  }

  function getDurationMinutes(session) {
    const durMins = Number(session?.duration_minutes);
    if (Number.isFinite(durMins) && durMins > 0) {
      return durMins + Number(session?.extended_minutes || 0);
    }
    if (typeof session?.duration === 'number' && Number.isFinite(session.duration) && session.duration > 0) {
      return session.duration + Number(session?.extended_minutes || 0);
    }
    if (typeof session?.duration === 'string') {
      const minMatch = session.duration.match(/(\d+(?:\.\d+)?)\s*min/i);
      if (minMatch) return Number(minMatch[1]) + Number(session?.extended_minutes || 0);
      const hrMatch = session.duration.match(/(\d+(?:\.\d+)?)\s*h/i);
      if (hrMatch) return Number(hrMatch[1]) * 60 + Number(session?.extended_minutes || 0);
    }
    return 60 + Number(session?.extended_minutes || 0);
  }

  function getSessionExpiryMs(session) {
    if (session?.expires_at) {
      const exp = new Date(session.expires_at).getTime();
      if (Number.isFinite(exp)) return exp;
    }
    if (session?.start_time) {
      const start = new Date(session.start_time).getTime();
      if (Number.isFinite(start)) return start + getDurationMinutes(session) * 60 * 1000;
    }
    return null;
  }

  function signatureForV2(session, issuedAt, epoch, nonce) {
    return crypto
      .createHmac('sha256', session.qr_code)
      .update(`${session._id}:${epoch}:${issuedAt}:${nonce}`)
      .digest('hex');
  }

  function signatureForLegacy(session, issuedAt) {
    return crypto
      .createHmac('sha256', session.qr_code)
      .update(`${session._id}:${issuedAt}`)
      .digest('hex');
  }

  function isSessionAcceptingQr(session, now = Date.now()) {
    if (!session || !session.is_active) return false;
    if (session.status && !['active', 'resumed'].includes(String(session.status).toLowerCase())) {
      return false;
    }
    const expiryMs = getSessionExpiryMs(session);
    if (expiryMs !== null && now > expiryMs) {
      return false;
    }
    return true;
  }

  function issueAttendanceQrToken(session, now = Date.now()) {
    const issuedAt = now;
    const epoch = Number(session.qr_epoch || 1);
    const nonce = crypto.randomBytes(6).toString('hex');
    const rotationSeconds = getRotationSeconds(session);
    const validityMs = (rotationSeconds + GRACE_SECONDS) * 1000;
    const tokenDeadlineMs = issuedAt + validityMs;
    const sessionExpiryMs = getSessionExpiryMs(session);
    const effectiveExpiryMs = sessionExpiryMs !== null ? Math.min(tokenDeadlineMs, sessionExpiryMs) : tokenDeadlineMs;
    return {
      token: `${issuedAt}.${epoch}.${nonce}.${signatureForV2(session, issuedAt, epoch, nonce)}`,
      issued_at: new Date(issuedAt).toISOString(),
      expires_at: new Date(effectiveExpiryMs).toISOString(),
      rotation_seconds: rotationSeconds,
      qr_epoch: epoch,
    };
  }

  function verifyAttendanceQrToken(session, token, now = Date.now()) {
    if (typeof token !== 'string' || !session?.qr_code) return false;
    if (!isSessionAcceptingQr(session, now)) return false;

    const parts = token.split('.');
    const validityMs = getValidityMs(session);

    if (parts.length === 4) {
      const [issuedAtValue, epochValue, nonce, signature] = parts;
      const issuedAt = Number(issuedAtValue);
      const epoch = Number(epochValue);
      const currentEpoch = Number(session.qr_epoch || 1);
      if (
        !Number.isSafeInteger(issuedAt) ||
        !Number.isSafeInteger(epoch) ||
        epoch !== currentEpoch ||
        !/^[a-f0-9]{12}$/i.test(nonce || '') ||
        !/^[a-f0-9]{64}$/i.test(signature || '') ||
        issuedAt > now + 5_000 ||
        now - issuedAt > validityMs
      ) {
        return false;
      }
      const expected = Buffer.from(signatureForV2(session, issuedAt, epoch, nonce), 'hex');
      const supplied = Buffer.from(signature, 'hex');
      return expected.length === supplied.length && crypto.timingSafeEqual(expected, supplied);
    }

    // Backward-compatible legacy 2-part token verification (only valid for epoch 1)
    if (parts.length === 2 && Number(session.qr_epoch || 1) === 1) {
      const [issuedAtValue, signature] = parts;
      const issuedAt = Number(issuedAtValue);
      if (
        !Number.isSafeInteger(issuedAt) ||
        !/^[a-f0-9]{64}$/i.test(signature || '') ||
        issuedAt > now + 5_000 ||
        now - issuedAt > validityMs
      ) {
        return false;
      }
      const expected = Buffer.from(signatureForLegacy(session, issuedAt), 'hex');
      const supplied = Buffer.from(signature, 'hex');
      return expected.length === supplied.length && crypto.timingSafeEqual(expected, supplied);
    }

    return false;
  }

  module.exports = { issueAttendanceQrToken, verifyAttendanceQrToken, isSessionAcceptingQr };
