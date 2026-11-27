'use strict';

const assert = require('assert');
const http = require('http');
const express = require('express');
const mongoose = require('mongoose');
const crypto = require('crypto');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_enterprise_auth_secret_key_32chars';

const TotpService = require('../../src/services/totpService');
const AuthService = require('../../src/services/authService');
const DemoEnvironmentService = require('../../src/services/demoEnvironmentService');
const authRoutes = require('../../src/routes/auth');
const User = require('../../src/models/User');
const Otp = require('../../src/models/Otp');
const UserSession = require('../../src/models/UserSession');

async function run() {
  console.log('=== RUNNING ENTERPRISE AUTH SECURITY REGRESSION TESTS ===');

  // 1. TOTP & AES-256-GCM Secret Encryption + Recovery Codes
  {
    const secret = TotpService.generateTotpSecret();
    assert(secret.length >= 16, 'TOTP secret should be >= 16 chars');
    const encrypted = TotpService.encryptSecret(secret);
    assert(!encrypted.includes(secret), 'Encrypted TOTP secret must not contain plaintext');
    assert.strictEqual(TotpService.decryptSecret(encrypted), secret, 'Decrypted secret must match');

    const nowMs = Date.now();
    const step = Math.floor(nowMs / 1000 / 30);
    const code = TotpService.generateHotp(secret, step);
    assert.strictEqual(TotpService.verifyTotp(secret, code, 1, nowMs), true, 'Valid TOTP must verify');
    assert.strictEqual(TotpService.verifyTotp(secret, '000000', 1, nowMs), false, 'Invalid TOTP must fail');

    const { plain, hashes } = TotpService.generateRecoveryCodes(8);
    assert.strictEqual(plain.length, 8);
    assert.strictEqual(hashes.length, 8);
    assert.strictEqual(TotpService.hashRecoveryCode(plain[0]), hashes[0]);
    console.log('  ✅ 1. TOTP, AES-256-GCM encryption, and recovery codes passed');
  }

  // 2. Demo token isolation (must NOT verify with AuthService production secret)
  {
    const demo = DemoEnvironmentService.createDemoToken('apex_tech', 'admin');
    const decodedByProd = AuthService.decodeToken(demo.token);
    assert.strictEqual(decodedByProd, null, 'Demo token must NOT be accepted by production AuthService.decodeToken');
    console.log('  ✅ 2. Demo token secret isolation passed');
  }

  // 3. HTTP Route Security Regression Tests (ephemeral Express server)
  const app = express();
  app.use(express.json());
  app.use('/api/v1/auth', authRoutes);
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}/api/v1/auth`;

  const origReadyState = mongoose.connection.readyState;
  Object.defineProperty(mongoose.connection, 'readyState', { value: 1, configurable: true });

  const origUserFindOne = User.findOne;
  const origOtpFindOne = Otp.findOne;
  const origOtpDeleteOne = Otp.deleteOne;

  try {
    // 3a. Public registration blocks super_admin, principal, hod, management, admin, teacher
    for (const privRole of ['super_admin', 'principal', 'hod', 'management', 'admin', 'teacher']) {
      const res = await fetch(`${baseUrl}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `escalate-${privRole}@example.com`,
          full_name: 'Test User',
          role: privRole,
          password: 'StrongPassword@2026'
        })
      });
      assert(res.status === 401 || res.status === 403, `Expected 401/403 for unauthenticated role=${privRole}, got ${res.status}`);
    }
    console.log('  ✅ 3. Public /register privilege escalation blocked for all 6 elevated roles');

    // 3b. Suspended user blocked from login-password
    User.findOne = async () => ({
      _id: new mongoose.Types.ObjectId(),
      email: 'suspended@example.com',
      role: 'student',
      account_status: 'suspended',
      password: await AuthService.hashPassword('StrongPassword@2026')
    });
    const suspRes = await fetch(`${baseUrl}/login-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'suspended@example.com', password: 'StrongPassword@2026' })
    });
    assert.strictEqual(suspRes.status, 403, 'Suspended user must be rejected with 403');
    console.log('  ✅ 4. Suspended account login blocked');

    // 3c. /verify-email rejects login OTPs (must require type: 'email_verification')
    let queriedFilter = null;
    Otp.findOne = async (filter) => {
      queriedFilter = filter;
      return null;
    };
    const verRes = await fetch(`${baseUrl}/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'user@example.com', otp: '123456' })
    });
    assert.strictEqual(verRes.status, 401);
    assert.deepStrictEqual(queriedFilter, { email: 'user@example.com', type: 'email_verification' });
    console.log('  ✅ 5. /verify-email strictly enforces type=email_verification');

    // 3d. /github/callback escapes HTML injection
    const cbRes = await fetch(`${baseUrl}/github/callback?code=%3Cscript%3Ealert(1)%3C%2Fscript%3E`);
    assert.strictEqual(cbRes.status, 400, 'Invalid non-alphanumeric OAuth code should be rejected with 400');
    console.log('  ✅ 6. /github/callback rejects malformed/XSS code payloads');

    // 3e. /register-biometric rejects missing image
    const tok = AuthService.createAccessToken({ sub: 'bio@example.com', role: 'student' });
    const tokHash = crypto.createHash('sha256').update(tok).digest('hex');
    const origSessFind = UserSession.findOne;
    UserSession.findOne = async (q) => (q.tokenHash === tokHash ? { userId: 'bio@example.com', expiry: new Date(Date.now() + 60000) } : null);
    User.findOne = (q) => ({
      lean: async () => ({ email: 'bio@example.com', role: 'student', account_status: 'active' }),
      email: 'bio@example.com',
      role: 'student',
      account_status: 'active'
    });
    const bioRes = await fetch(`${baseUrl}/register-biometric`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tok}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    UserSession.findOne = origSessFind;
    assert.strictEqual(bioRes.status, 400, 'register-biometric without image must return 400');
    console.log('  ✅ 7. /register-biometric rejects empty/no-image enrollment');
  } finally {
    User.findOne = origUserFindOne;
    Otp.findOne = origOtpFindOne;
    Otp.deleteOne = origOtpDeleteOne;
    Object.defineProperty(mongoose.connection, 'readyState', { value: origReadyState, configurable: true });
    server.close();
  }

  console.log('🎉 ALL ENTERPRISE AUTH SECURITY REGRESSION TESTS PASSED!');
}

run().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
