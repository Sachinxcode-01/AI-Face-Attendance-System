'use strict';

const crypto = require('crypto');
const mongoose = require('mongoose');
const User = require('../models/User');
const GuardianRelationship = require('../models/GuardianRelationship');
const GuardianInvitation = require('../models/GuardianInvitation');
const cache = require('../utils/cache');

function hashInvitationCode(code) {
  return crypto.createHash('sha256').update(String(code || '').trim().toUpperCase()).digest('hex');
}

function generateInvitationCode() {
  // 8-character URL-safe uppercase alphanumeric code (e.g. SF-A1B2C3D4)
  const raw = crypto.randomBytes(5).toString('hex').toUpperCase().slice(0, 8);
  return `SF-${raw}`;
}

function isRelationshipCurrentlyActive(rel) {
  if (!rel || rel.status !== 'active') return false;
  if (rel.expires_at && new Date(rel.expires_at) <= new Date()) return false;
  return true;
}

/**
 * Resolve all active, non-expired guardian relationships for a parent.
 * Automatically migrates legacy User.children / User.linked_children entries
 * only when no explicit GuardianRelationship record exists yet.
 */
async function getActiveRelationshipsForParent(parentEmail) {
  const cleanParent = String(parentEmail || '').trim().toLowerCase();
  if (!cleanParent || mongoose.connection.readyState !== 1) return [];

  const existing = await GuardianRelationship.find({ parent_email: cleanParent }).lean();
  const knownStudents = new Set(existing.map((r) => r.student_email));

  const parentUser = await User.findOne(
    { email: cleanParent },
    'children linked_children college_id'
  ).lean();

  if (parentUser) {
    const legacyEmails = new Set([
      ...(Array.isArray(parentUser.children) ? parentUser.children : []),
      ...(Array.isArray(parentUser.linked_children) ? parentUser.linked_children.map((c) => c.email) : []),
    ].filter(Boolean).map((e) => String(e).trim().toLowerCase()));

    const unmigrated = [...legacyEmails].filter((e) => !knownStudents.has(e));
    if (unmigrated.length > 0) {
      const students = await User.find(
        { email: { $in: unmigrated }, role: 'student' },
        'email college_id parent_details'
      ).lean();

      for (const s of students) {
        const sameCollege = !parentUser.college_id || !s.college_id || parentUser.college_id === s.college_id;
        if (!sameCollege) continue;
        try {
          const created = await GuardianRelationship.create({
            parent_email: cleanParent,
            student_email: s.email.toLowerCase(),
            college_id: s.college_id || parentUser.college_id || undefined,
            relationship_type: 'legal_guardian',
            status: 'active',
            verification_method: 'legacy_sync',
            consent_granted: true,
            consent_granted_at: new Date(),
            approved_by: 'system_migration',
            approved_at: new Date(),
            audit_trail: [{
              action: 'legacy_sync',
              actor: 'system',
              role: 'system',
              note: 'Migrated existing linked ward relationship',
            }],
          });
          existing.push(created.toObject());
        } catch {
          // Ignore duplicate key race
        }
      }
    }
  }

  const now = new Date();
  return existing.filter((r) => r.status === 'active' && (!r.expires_at || new Date(r.expires_at) > now));
}

/**
 * Returns sanitized student profiles for all active linked wards of a parent.
 * Never returns biometric embeddings, passwords, tokens, or raw facial images.
 */
async function getAuthorizedWards(parentEmail) {
  const activeRels = await getActiveRelationshipsForParent(parentEmail);
  if (activeRels.length === 0) return [];

  const studentEmails = activeRels.map((r) => r.student_email);
  const relByStudent = new Map(activeRels.map((r) => [r.student_email, r]));

  const students = await User.find(
    { email: { $in: studentEmails }, role: 'student', account_status: { $ne: 'archived' } },
    'email full_name student_id usn roll_number college college_id department course semester section academic_year'
  ).lean();

  return students.map((s) => {
    const email = s.email.toLowerCase();
    const rel = relByStudent.get(email);
    return {
      email: s.email,
      full_name: s.full_name,
      student_id: s.student_id || s.usn || s.roll_number || '',
      college: s.college || '',
      college_id: s.college_id || '',
      department: s.department || '',
      course: s.course || '',
      semester: s.semester || '',
      section: s.section || '',
      academic_year: s.academic_year || '',
      relationship_type: rel?.relationship_type || 'legal_guardian',
      relationship_status: rel?.status || 'active',
      permissions: rel?.permissions || {},
      linked_at: rel?.approved_at || rel?.created_at || null,
    };
  });
}

/**
 * Verifies whether the authenticated user (parent or admin) has access to studentEmail
 * and (optionally) a specific guardian permission key.
 */
async function authorizeWardAccess(req, studentEmail, permissionKey = null) {
  const cleanStudent = String(studentEmail || '').trim().toLowerCase();
  if (!cleanStudent) return { allowed: false, reason: 'Student identifier is required.' };

  const role = String(req.userRole || '').toLowerCase();
  if (role === 'super_admin') return { allowed: true, relationship: null };

  if (['admin', 'principal', 'management', 'hod', 'teacher'].includes(role)) {
    const [actor, student] = await Promise.all([
      User.findOne({ email: req.userEmail }, 'college_id').lean(),
      User.findOne({ email: cleanStudent, role: 'student' }, 'college_id').lean(),
    ]);
    if (!student) return { allowed: false, reason: 'Student not found.' };
    if (actor?.college_id && student.college_id && actor.college_id !== student.college_id) {
      return { allowed: false, reason: 'Cross-institution access denied.' };
    }
    return { allowed: true, relationship: null };
  }

  if (role !== 'parent') {
    return { allowed: false, reason: 'Forbidden.' };
  }

  const cleanParent = String(req.userEmail || '').trim().toLowerCase();
  let rel = await GuardianRelationship.findOne({
    parent_email: cleanParent,
    student_email: cleanStudent,
  }).lean();

  // Trigger legacy sync once if no GuardianRelationship document exists yet
  if (!rel) {
    await getActiveRelationshipsForParent(cleanParent);
    rel = await GuardianRelationship.findOne({
      parent_email: cleanParent,
      student_email: cleanStudent,
    }).lean();
  }

  if (!isRelationshipCurrentlyActive(rel)) {
    return { allowed: false, reason: 'No active guardian relationship exists for this student.' };
  }

  // Tenant isolation check
  const [parentUser, studentUser] = await Promise.all([
    User.findOne({ email: cleanParent }, 'college_id').lean(),
    User.findOne({ email: cleanStudent, role: 'student' }, 'college_id account_status').lean(),
  ]);
  if (!studentUser || studentUser.account_status === 'archived') {
    return { allowed: false, reason: 'Student account is unavailable.' };
  }
  if (parentUser?.college_id && studentUser.college_id && parentUser.college_id !== studentUser.college_id) {
    return { allowed: false, reason: 'Cross-institution guardian access is not permitted.' };
  }

  if (permissionKey && rel.permissions && rel.permissions[permissionKey] === false) {
    return { allowed: false, reason: `Guardian permission '${permissionKey}' is disabled for this relationship.` };
  }

  return { allowed: true, relationship: rel };
}

/**
 * Create a single-use expiring invitation code for a student.
 */
async function createInvitation({
  studentEmail,
  createdBy,
  createdByRole,
  intendedParentEmail = null,
  relationshipType = 'legal_guardian',
  ttlHours = 72,
}) {
  const cleanStudent = String(studentEmail || '').trim().toLowerCase();
  const student = await User.findOne({ email: cleanStudent, role: 'student' }, 'email college_id').lean();
  if (!student) {
    throw Object.assign(new Error('Student not found.'), { status: 404 });
  }

  const code = generateInvitationCode();
  const tokenHash = hashInvitationCode(code);
  const expiresAt = new Date(Date.now() + Math.max(1, Math.min(ttlHours, 168)) * 3600 * 1000);

  const invitation = await GuardianInvitation.create({
    token_hash: tokenHash,
    student_email: cleanStudent,
    college_id: student.college_id || undefined,
    intended_parent_email: intendedParentEmail ? String(intendedParentEmail).trim().toLowerCase() : undefined,
    relationship_type: relationshipType,
    created_by: String(createdBy || '').trim().toLowerCase(),
    created_by_role: createdByRole,
    status: 'active',
    expires_at: expiresAt,
  });

  return {
    invitation_id: invitation._id.toString(),
    code,
    student_email: cleanStudent,
    relationship_type: relationshipType,
    expires_at: expiresAt.toISOString(),
  };
}

/**
 * Atomically redeem a single-use guardian invitation code.
 */
async function redeemInvitation({ parentEmail, code, relationshipType }) {
  const cleanParent = String(parentEmail || '').trim().toLowerCase();
  const tokenHash = hashInvitationCode(code);
  const now = new Date();

  const invitation = await GuardianInvitation.findOneAndUpdate(
    {
      token_hash: tokenHash,
      status: 'active',
      expires_at: { $gt: now },
      $or: [
        { intended_parent_email: { $exists: false } },
        { intended_parent_email: null },
        { intended_parent_email: '' },
        { intended_parent_email: cleanParent },
      ],
    },
    {
      $set: {
        status: 'redeemed',
        redeemed_by: cleanParent,
        redeemed_at: now,
      },
    },
    { returnDocument: 'after' }
  );

  if (!invitation) {
    return { ok: false, status: 400, detail: 'Invalid, expired, or already used guardian invitation code.' };
  }

  const [parentUser, studentUser] = await Promise.all([
    User.findOne({ email: cleanParent }, 'email college_id').lean(),
    User.findOne({ email: invitation.student_email, role: 'student' }, 'email full_name student_id roll_number department college_id').lean(),
  ]);

  if (!studentUser) {
    return { ok: false, status: 404, detail: 'Associated student record is no longer active.' };
  }

  if (parentUser?.college_id && studentUser.college_id && parentUser.college_id !== studentUser.college_id) {
    return { ok: false, status: 403, detail: 'Institution mismatch: cannot link across institutions.' };
  }

  const rel = await GuardianRelationship.findOneAndUpdate(
    { parent_email: cleanParent, student_email: studentUser.email.toLowerCase() },
    {
      $set: {
        college_id: studentUser.college_id || parentUser?.college_id || undefined,
        relationship_type: relationshipType || invitation.relationship_type || 'legal_guardian',
        status: 'active',
        verification_method: 'invitation_code',
        consent_granted: true,
        consent_granted_at: now,
        consent_granted_by: invitation.created_by,
        approved_by: invitation.created_by,
        approved_at: now,
        updated_at: now,
      },
      $unset: { revoked_at: '', revoked_by: '', revocation_reason: '' },
      $push: {
        audit_trail: {
          action: 'redeemed_invitation',
          actor: cleanParent,
          role: 'parent',
          note: `Redeemed single-use invitation ${invitation._id}`,
          timestamp: now,
        },
      },
    },
    { upsert: true, returnDocument: 'after' }
  );

  await syncLegacyUserLinks(cleanParent, studentUser, true);
  invalidateParentCaches(cleanParent, studentUser.email);

  return { ok: true, relationship: rel, student: studentUser };
}

async function syncLegacyUserLinks(parentEmail, student, add = true) {
  const cleanParent = String(parentEmail || '').trim().toLowerCase();
  const cleanStudent = String(student.email || '').trim().toLowerCase();
  if (add) {
    await Promise.all([
      User.updateOne(
        { email: cleanParent },
        {
          $addToSet: {
            children: cleanStudent,
            linked_children: {
              email: cleanStudent,
              full_name: student.full_name || cleanStudent,
              student_id: student.student_id || student.roll_number || '',
            },
          },
        }
      ),
      User.updateOne({ email: cleanStudent }, { $set: { parent_details: cleanParent } }),
    ]);
  } else {
    await Promise.all([
      User.updateOne(
        { email: cleanParent },
        {
          $pull: {
            children: cleanStudent,
            linked_children: { email: cleanStudent },
          },
        }
      ),
      User.updateOne(
        { email: cleanStudent, parent_details: cleanParent },
        { $unset: { parent_details: '' } }
      ),
    ]);
  }
}

function invalidateParentCaches(parentEmail, studentEmail) {
  const p = String(parentEmail || '').trim().toLowerCase();
  const s = String(studentEmail || '').trim().toLowerCase();
  if (p) cache.invalidate(`parent:children:${p}`);
  if (p && s) cache.invalidate(`parent:dashboard:${p}:${s}`);
  if (s) {
    cache.invalidate(`student:summary:${s}`);
    if (typeof cache.invalidateAnalyticsForUser === 'function') {
      cache.invalidateAnalyticsForUser(s);
    }
  }
}

/**
 * Returns all active, non-expired guardian relationships for a given student.
 */
async function getActiveGuardiansForStudent(studentEmail) {
  const cleanStudent = String(studentEmail || '').trim().toLowerCase();
  if (!cleanStudent || mongoose.connection.readyState !== 1) return [];
  const now = new Date();
  return GuardianRelationship.find({
    student_email: cleanStudent,
    status: 'active',
    $or: [{ expires_at: { $exists: false } }, { expires_at: null }, { expires_at: { $gt: now } }],
  }).lean();
}

/**
 * Notifies all active, authorized guardians of a student while respecting
 * relationship permissions and guardian notification preferences.
 */
async function notifyAuthorizedGuardians(studentEmail, {
  title,
  message,
  type = 'attendance',
  priority = 'Info',
  extraData = {},
  permissionKey = 'view_attendance',
  preferenceKey = null,
}) {
  if (mongoose.connection.readyState !== 1) return;
  const rels = await getActiveGuardiansForStudent(studentEmail);
  if (rels.length === 0) return;

  const notificationService = require('./notificationService');
  const parentEmails = rels
    .filter((r) => !permissionKey || !r.permissions || r.permissions[permissionKey] !== false)
    .map((r) => r.parent_email);

  if (parentEmails.length === 0) return;

  const parents = await User.find(
    { email: { $in: parentEmails }, role: 'parent', account_status: { $ne: 'archived' } },
    'email notification_preferences'
  ).lean();

  for (const parent of parents) {
    if (preferenceKey && parent.notification_preferences?.[preferenceKey] === false) {
      continue;
    }
    await notificationService.createNotification(
      parent.email.toLowerCase(),
      title,
      message,
      type,
      priority,
      { ...extraData, student_email: String(studentEmail).trim().toLowerCase() }
    ).catch(() => { });
  }
}

module.exports = {
  hashInvitationCode,
  generateInvitationCode,
  isRelationshipCurrentlyActive,
  getActiveRelationshipsForParent,
  getAuthorizedWards,
  authorizeWardAccess,
  createInvitation,
  redeemInvitation,
  syncLegacyUserLinks,
  invalidateParentCaches,
  getActiveGuardiansForStudent,
  notifyAuthorizedGuardians,
};
