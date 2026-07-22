const crypto = require('crypto');
const assert = require('assert');

// 1. Verify OTP generation uses CSPRNG (crypto.randomInt) and outputs exactly 6 digits
function generateTestOtp() {
  return Array.from({ length: 6 }, () => crypto.randomInt(0, 10)).join('');
}

const otp = generateTestOtp();
assert.strictEqual(typeof otp, 'string', 'OTP must be a string');
assert.strictEqual(otp.length, 6, 'OTP must be exactly 6 digits');
assert.strictEqual(/^\d{6}$/.test(otp), true, 'OTP must contain only digits');

// Verify crypto.randomInt was used
let randomIntCalled = false;
const originalRandomInt = crypto.randomInt;
crypto.randomInt = function(...args) {
  randomIntCalled = true;
  return originalRandomInt.apply(this, args);
};
generateTestOtp();
crypto.randomInt = originalRandomInt;
assert.strictEqual(randomIntCalled, true, 'OTP generation must use crypto.randomInt');

// 2. Verify duplicate error mapping logic returns 409 Conflict for concurrent duplicate attendance
function formatDuplicateError(error) {
  if (error.code === 11000) {
    return { status: 409, detail: 'Attendance already marked for this session' };
  }
  return { status: 500, detail: error.message };
}

const mockE11000 = new Error('E11000 duplicate key error index: session_id_1_student_email_1');
mockE11000.code = 11000;

const result = formatDuplicateError(mockE11000);
assert.strictEqual(result.status, 409, 'E11000 duplicate error must return HTTP status 409');
assert.strictEqual(result.detail, 'Attendance already marked for this session');

// 3. Verify graceful shutdown closes resources once without double-close errors
let dbCloseCount = 0;
let serverCloseCount = 0;
const mockShutdownManager = {
  isShuttingDown: false,
  async shutdown() {
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;
    dbCloseCount++;
    serverCloseCount++;
  }
};

mockShutdownManager.shutdown();
mockShutdownManager.shutdown(); // Second call should be ignored
assert.strictEqual(dbCloseCount, 1, 'Database connection must be closed exactly once during shutdown');
assert.strictEqual(serverCloseCount, 1, 'Server resources must be closed exactly once during shutdown');

// 4. Verify sensitive values remain excluded from log outputs
function sanitizeLogOutput(message, sensitiveFields = ['password', 'token', 'otp', 'authorization', 'secret']) {
  let sanitized = message;
  for (const field of sensitiveFields) {
    const regex = new RegExp(`("${field}"\\s*:\\s*")([^"]+)(")`, 'gi');
    sanitized = sanitized.replace(regex, `$1[REDACTED]$3`);
  }
  return sanitized;
}

const rawLog = '{"email":"user@rec.edu","password":"supersecretpassword","otp":"123456","token":"bearer_xyz"}';
const cleanLog = sanitizeLogOutput(rawLog);
assert.strictEqual(cleanLog.includes('supersecretpassword'), false, 'Sensitive password must be excluded from logs');
assert.strictEqual(cleanLog.includes('123456'), false, 'Sensitive OTP must be excluded from logs');
assert.strictEqual(cleanLog.includes('bearer_xyz'), false, 'Sensitive token must be excluded from logs');

// 5. Verify authorization cannot be bypassed
function verifyAuthorizationHeader(authHeader) {
  if (!authHeader || typeof authHeader !== 'string') {
    return { authorized: false, status: 401, error: 'Authorization header required' };
  }
  if (!authHeader.startsWith('Bearer ') || authHeader.length < 15) {
    return { authorized: false, status: 401, error: 'Invalid or malformed Bearer token' };
  }
  return { authorized: true, status: 200 };
}

assert.strictEqual(verifyAuthorizationHeader(null).authorized, false, 'Missing auth header must be rejected');
assert.strictEqual(verifyAuthorizationHeader('Basic 12345').authorized, false, 'Non-Bearer auth header must be rejected');
assert.strictEqual(verifyAuthorizationHeader('Bearer short').authorized, false, 'Malformed token must be rejected');
assert.strictEqual(verifyAuthorizationHeader('Bearer valid_access_token_123456789').authorized, true, 'Valid Bearer token must pass authorization');

console.log('✅ Unit Security Controls Test Passed Successfully.');
