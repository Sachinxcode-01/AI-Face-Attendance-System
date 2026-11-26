'use strict';

const assert = require('assert');
const crypto = require('crypto');

const {
  isSessionAcceptingQr,
  issueAttendanceQrToken,
  verifyAttendanceQrToken,
} = require('../../src/utils/attendanceQr');
const {
  SESSION_TRANSITIONS,
  normalizeManualStatus,
  getEffectiveSessionStatus,
  computeRemainingSeconds,
} = require('../../src/services/teacherService');

console.log('🧪 --- Running Teacher Session Lifecycle & Dynamic QR Unit Tests ---');

// 1. Session lifecycle transition matrix checks
assert.ok(SESSION_TRANSITIONS.scheduled.has('ready'));
assert.ok(SESSION_TRANSITIONS.scheduled.has('active'));
assert.ok(SESSION_TRANSITIONS.scheduled.has('cancelled'));
assert.ok(!SESSION_TRANSITIONS.scheduled.has('finalised'));

assert.ok(SESSION_TRANSITIONS.active.has('paused'));
assert.ok(SESSION_TRANSITIONS.active.has('closed'));
assert.ok(SESSION_TRANSITIONS.paused.has('resumed'));
assert.ok(!SESSION_TRANSITIONS.paused.has('finalised'));
assert.ok(SESSION_TRANSITIONS.closed.has('under_review'));
assert.ok(SESSION_TRANSITIONS.closed.has('finalised'));
assert.strictEqual(SESSION_TRANSITIONS.finalised.size, 0);
assert.strictEqual(SESSION_TRANSITIONS.cancelled.size, 0);
console.log('  ✅ 9-state session lifecycle transition graph verified');

// 2. Manual status normalization checks
assert.strictEqual(normalizeManualStatus('present'), 'Present');
assert.strictEqual(normalizeManualStatus('approved leave'), 'Approved leave');
assert.strictEqual(normalizeManualStatus('medical leave'), 'Medical leave');
assert.strictEqual(normalizeManualStatus('pending verification'), 'Pending verification');
assert.strictEqual(normalizeManualStatus('manually recorded'), 'Manually recorded');
assert.strictEqual(normalizeManualStatus('cancelled session'), 'Cancelled session');
assert.strictEqual(normalizeManualStatus('invalid_status'), null);
console.log('  ✅ Manual attendance status normalization verified');

// 3. Remaining time & effective status checks
const now = Date.now();
const activeSession = {
  _id: '507f1f77bcf86cd799439011',
  is_active: true,
  status: 'active',
  qr_code: crypto.randomBytes(32).toString('hex'),
  qr_epoch: 1,
  qr_rotation_seconds: 15,
  start_time: new Date(now - 60_000),
  expires_at: new Date(now + 120_000),
};
assert.strictEqual(getEffectiveSessionStatus(activeSession), 'active');
assert.ok(computeRemainingSeconds(activeSession, now) >= 119);
assert.strictEqual(getEffectiveSessionStatus({ is_active: false }), 'closed');
assert.strictEqual(computeRemainingSeconds({ status: 'closed', is_active: false }, now), 0);
console.log('  ✅ Effective status & remaining window computation verified');

// 4. Dynamic QR token issuance & security validation
const issued = issueAttendanceQrToken(activeSession, now);
assert.strictEqual(issued.token.split('.').length, 4);
assert.strictEqual(issued.rotation_seconds, 15);
assert.strictEqual(verifyAttendanceQrToken(activeSession, issued.token, now + 5_000), true);
// Valid within grace window (15s + 5s = 20s)
assert.strictEqual(verifyAttendanceQrToken(activeSession, issued.token, now + 19_000), true);
// Expired past grace window
assert.strictEqual(verifyAttendanceQrToken(activeSession, issued.token, now + 21_000), false);
// Future-dated forgery rejected
assert.strictEqual(verifyAttendanceQrToken(activeSession, issued.token, now - 10_000), false);
console.log('  ✅ Dynamic QR expiry, grace window, and anti-backdating verified');

// 5. QR epoch regeneration immediately invalidates prior epoch tokens
const rotatedSession = { ...activeSession, qr_epoch: 2 };
assert.strictEqual(verifyAttendanceQrToken(rotatedSession, issued.token, now + 1_000), false);
const epoch2Token = issueAttendanceQrToken(rotatedSession, now + 1_000);
assert.strictEqual(verifyAttendanceQrToken(rotatedSession, epoch2Token.token, now + 2_000), true);
console.log('  ✅ QR epoch regeneration invalidation verified');

// 6. Session pause/close/expiry blocks QR acceptance
assert.strictEqual(isSessionAcceptingQr({ ...activeSession, status: 'paused' }, now), false);
assert.strictEqual(isSessionAcceptingQr({ ...activeSession, status: 'closed', is_active: false }, now), false);
assert.strictEqual(isSessionAcceptingQr({ ...activeSession, status: 'finalised', is_active: false }, now), false);
assert.strictEqual(isSessionAcceptingQr(activeSession, now + 130_000), false);
assert.strictEqual(verifyAttendanceQrToken({ ...activeSession, status: 'paused' }, issued.token, now + 1_000), false);
console.log('  ✅ Paused/closed/finalised/expired sessions block QR verification');

// 7. Tampered signature rejected
const parts = issued.token.split('.');
parts[3] = parts[3].replace(/^./, parts[3][0] === 'a' ? 'b' : 'a');
assert.strictEqual(verifyAttendanceQrToken(activeSession, parts.join('.'), now + 1_000), false);
console.log('  ✅ Tampered QR HMAC signature rejected');

console.log('✅ All Teacher Session Lifecycle & Dynamic QR unit tests passed!\n');
