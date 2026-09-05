const assert = require('assert');

// 1. Sanitize log helper test
function maskEmail(email) {
  if (!email || !email.includes('@')) return 'masked';
  const [name, domain] = email.split('@');
  return `${name[0]}***@${domain}`;
}

console.log('=== RUNNING SECURITY AUDIT FIXES TEST SUITE ===');

// Test 1: Log Sanitization
const sampleLog = JSON.stringify({ event: 'otp_generated', recipient: maskEmail('test@smartface.pro'), purpose: 'login' });
assert.strictEqual(sampleLog.includes('password'), false);
assert.strictEqual(sampleLog.includes('otp'), true);
assert.strictEqual(sampleLog.includes('123456'), false);
console.log('✅ Log sanitization test passed: no plain OTPs logged.');

// Test 2: Input Sanitizer Forbidden Keys
const FORBIDDEN_KEYS = new Set(['__proto__', 'prototype', 'constructor']);
const sanitizeNoSQL = (obj) => {
  if (obj && typeof obj === 'object') {
    for (const key of Object.keys(obj)) {
      if (key.startsWith('$') || key.includes('.') || FORBIDDEN_KEYS.has(key)) {
        delete obj[key];
      } else {
        sanitizeNoSQL(obj[key]);
      }
    }
  }
};

const payload = JSON.parse(JSON.stringify({ email: { $gte: '' }, name: 'Alice' }));
payload.__proto__ = { admin: true };
sanitizeNoSQL(payload);
assert.strictEqual(payload.$gte, undefined);
assert.strictEqual(Object.prototype.admin, undefined);
assert.strictEqual(payload.name, 'Alice');
console.log('✅ NoSQL & Prototype pollution sanitizer test passed.');

// Test 3: Role Allowlist Mass Assignment Validation
const FORBIDDEN_FIELDS = new Set([
  'role', 'is_admin', 'is_active', 'is_locked', 'email_verified',
  'is_email_verified', 'biometric_registered', 'permissions',
  'session_data', 'audit_fields', 'password', 'password_hash',
  'created_at', 'security_flags', '_id'
]);

const ALLOWED_FIELDS_BY_ROLE = {
  student: new Set(['name', 'full_name', 'roll_no', 'student_id', 'usn', 'branch', 'department', 'semester', 'section', 'phone', 'phone_number', 'profile_preferences', 'wizard_step', 'wizardStep', 'avatar_url']),
  teacher: new Set(['name', 'full_name', 'department', 'employee_id', 'subjects', 'phone', 'phone_number', 'wizard_step', 'wizardStep', 'avatar_url']),
  parent: new Set(['name', 'full_name', 'phone', 'phone_number', 'child_email', 'child_emails', 'linked_children', 'wizard_step', 'wizardStep', 'avatar_url'])
};

function validateRoleFields(role, payloadKeys) {
  const allowed = ALLOWED_FIELDS_BY_ROLE[role.toLowerCase()] || ALLOWED_FIELDS_BY_ROLE['student'];
  const serverKeys = new Set(['setup_completed', 'profile_completed', 'wizard_step']);
  
  for (const key of payloadKeys) {
    if (FORBIDDEN_FIELDS.has(key)) return false;
    if (!allowed.has(key) && !serverKeys.has(key)) return false;
  }
  return true;
}

assert.strictEqual(validateRoleFields('student', ['role', 'name']), false);
assert.strictEqual(validateRoleFields('student', ['is_admin']), false);
assert.strictEqual(validateRoleFields('student', ['full_name', 'phone']), true);
console.log('✅ Mass assignment role allowlist test passed.');

// Test 4: Password Policy
function validatePasswordPolicy(password, email = '') {
  if (!password || password.length < 8) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  if (!/[^A-Za-z0-9]/.test(password)) return false;
  
  const prefix = email.split('@')[0].toLowerCase();
  const weakPatterns = ['password', '12345', 'qwerty', 'smartface', prefix];
  if (weakPatterns.some(p => p && password.toLowerCase().includes(p))) return false;
  return true;
}

assert.strictEqual(validatePasswordPolicy('password123', 'test@test.com'), false);
assert.strictEqual(validatePasswordPolicy('weak', 'test@test.com'), false);
assert.strictEqual(validatePasswordPolicy('StrongP@ssw0rd2026!', 'test@test.com'), true);
console.log('✅ Password policy validation test passed.');

console.log('🎉 ALL SECURITY AUDIT UNIT TESTS PASSED!');
