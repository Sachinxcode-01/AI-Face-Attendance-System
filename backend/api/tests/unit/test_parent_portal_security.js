'use strict';

/**
 * Unit & Security Tests for Guardian Service, Invitation Hashing,
 * Relationship Statuses, and Parent Authorization Logic (DB-independent).
 */

const assert = require('assert');
const crypto = require('crypto');

const guardianService = require('../../src/services/guardianService');
const GuardianRelationship = require('../../src/models/GuardianRelationship');
const GuardianInvitation = require('../../src/models/GuardianInvitation');

function testInvitationCodeGenerationAndHashing() {
  const code1 = guardianService.generateInvitationCode();
  const code2 = guardianService.generateInvitationCode();
  assert(code1.startsWith('SF-'), 'Invitation code must start with SF-');
  assert.notStrictEqual(code1, code2, 'Generated invitation codes must be unique');

  const h1 = guardianService.hashInvitationCode(code1);
  const h1Lower = guardianService.hashInvitationCode(code1.toLowerCase());
  assert.strictEqual(h1, h1Lower, 'Invitation hash must be case-insensitive');
  assert.strictEqual(h1.length, 64, 'SHA-256 hex hash must be 64 chars');
  assert.notStrictEqual(h1, code1, 'Raw code must never equal its hash');
  console.log('  ✅ Invitation code generation & SHA-256 hashing passed');
}

function testRelationshipActivityChecks() {
  const future = new Date(Date.now() + 86400000);
  const past = new Date(Date.now() - 86400000);

  assert.strictEqual(guardianService.isRelationshipCurrentlyActive({ status: 'active' }), true);
  assert.strictEqual(guardianService.isRelationshipCurrentlyActive({ status: 'active', expires_at: future }), true);
  assert.strictEqual(guardianService.isRelationshipCurrentlyActive({ status: 'active', expires_at: past }), false);
  assert.strictEqual(guardianService.isRelationshipCurrentlyActive({ status: 'revoked' }), false);
  assert.strictEqual(guardianService.isRelationshipCurrentlyActive({ status: 'suspended' }), false);
  assert.strictEqual(guardianService.isRelationshipCurrentlyActive({ status: 'pending_approval' }), false);
  assert.strictEqual(guardianService.isRelationshipCurrentlyActive(null), false);
  console.log('  ✅ Guardian relationship status & expiry checks passed');
}

function testSchemaEnumsAndIndexes() {
  assert(GuardianRelationship.GUARDIAN_RELATIONSHIP_TYPES.includes('father'));
  assert(GuardianRelationship.GUARDIAN_RELATIONSHIP_TYPES.includes('mother'));
  assert(GuardianRelationship.GUARDIAN_RELATIONSHIP_TYPES.includes('legal_guardian'));
  assert(GuardianRelationship.GUARDIAN_RELATIONSHIP_TYPES.includes('authorized_guardian'));

  assert(GuardianRelationship.GUARDIAN_STATUSES.includes('pending_verification'));
  assert(GuardianRelationship.GUARDIAN_STATUSES.includes('pending_approval'));
  assert(GuardianRelationship.GUARDIAN_STATUSES.includes('active'));
  assert(GuardianRelationship.GUARDIAN_STATUSES.includes('revoked'));

  const indexes = GuardianRelationship.schema.indexes();
  const hasUniquePair = indexes.some(([spec, opts]) => spec.parent_email === 1 && spec.student_email === 1 && opts && opts.unique === true);
  assert(hasUniquePair, 'GuardianRelationship must enforce unique (parent_email, student_email) index');

  const invIndexes = GuardianInvitation.schema.indexes();
  assert(invIndexes.length >= 1, 'GuardianInvitation must define compound indexes');
  console.log('  ✅ Schema enums & unique compound index checks passed');
}

async function testAuthorizeWardAccessGuards() {
  const emptyEmail = await guardianService.authorizeWardAccess({ userRole: 'parent', userEmail: 'p@test.com' }, '');
  assert.strictEqual(emptyEmail.allowed, false);

  const studentRoleAttempt = await guardianService.authorizeWardAccess({ userRole: 'student', userEmail: 's@test.com' }, 'other@test.com');
  assert.strictEqual(studentRoleAttempt.allowed, false);

  const superAdmin = await guardianService.authorizeWardAccess({ userRole: 'super_admin', userEmail: 'sa@test.com' }, 'any@test.com');
  assert.strictEqual(superAdmin.allowed, true);
  console.log('  ✅ Role & input guard checks in authorizeWardAccess passed');
}

async function main() {
  console.log('🧪 --- Running Parent Portal Security & Guardian Unit Tests ---');
  testInvitationCodeGenerationAndHashing();
  testRelationshipActivityChecks();
  testSchemaEnumsAndIndexes();
  await testAuthorizeWardAccessGuards();
  console.log('🎉 ALL PARENT PORTAL SECURITY UNIT TESTS PASSED!');
}

main().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
