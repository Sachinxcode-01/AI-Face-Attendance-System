'use strict';

const mongoose = require('mongoose');
const User = require('../models/User');
const College = require('../models/College');

/**
 * Resolve the authenticated user's authoritative institution scope from DB.
 * Never trusts frontend-supplied college identifiers for non-super_admin roles.
 */
async function resolveAdminTenant(req) {
  const role = String(req.userRole || '').toLowerCase();
  const isSuperAdmin = role === 'super_admin';

  if (isSuperAdmin && req.query?.college_id) {
    const requested = String(req.query.college_id).trim();
    const collegeDoc = mongoose.Types.ObjectId.isValid(requested)
      ? await College.findById(requested).lean()
      : await College.findOne({ $or: [{ code: requested.toUpperCase() }, { name: requested }] }).lean();
    if (collegeDoc) {
      return {
        isSuperAdmin: true,
        collegeId: collegeDoc._id.toString(),
        collegeCode: collegeDoc.code,
        collegeName: collegeDoc.name,
        collegeDoc,
      };
    }
  }

  const user = await User.findOne(
    { email: String(req.userEmail || '').toLowerCase() },
    'email college college_id department role'
  ).lean();

  let collegeDoc = null;
  if (user?.college_id) {
    if (mongoose.Types.ObjectId.isValid(user.college_id)) {
      collegeDoc = await College.findById(user.college_id).lean();
    } else {
      collegeDoc = await College.findOne({
        $or: [{ code: String(user.college_id).toUpperCase() }, { name: user.college_id }],
      }).lean();
    }
  }
  if (!collegeDoc && user?.college) {
    collegeDoc = await College.findOne({
      $or: [{ name: user.college }, { code: String(user.college).toUpperCase() }],
    }).lean();
  }

  const collegeId = collegeDoc?._id?.toString() || (user?.college_id ? String(user.college_id) : null);
  const collegeName = collegeDoc?.name || user?.college || null;
  const collegeCode = collegeDoc?.code || null;

  return {
    isSuperAdmin,
    collegeId,
    collegeCode,
    collegeName,
    collegeDoc,
    user,
  };
}

/**
 * Build a MongoDB filter for User queries scoped to the caller's institution.
 * Super admins see all unless a specific tenant filter is active.
 */
function buildTenantUserFilter(tenant, extra = {}) {
  const filter = { ...extra };
  if (tenant.isSuperAdmin && !tenant.collegeId && !tenant.collegeName) {
    return filter;
  }
  const orClauses = [];
  if (tenant.collegeId) orClauses.push({ college_id: tenant.collegeId });
  if (tenant.collegeName) orClauses.push({ college: tenant.collegeName });
  if (orClauses.length > 0) {
    filter.$and = filter.$and || [];
    filter.$and.push({ $or: orClauses });
  } else if (!tenant.isSuperAdmin) {
    // Fail closed: non-super_admin without an institution scope must not see all tenants' data
    filter._id = null;
  }
  return filter;
}

/**
 * Check whether a target user/record belongs to the caller's institution.
 */
function isSameTenant(tenant, target) {
  if (tenant.isSuperAdmin) return true;
  if (!target) return false;
  if (!tenant.collegeId && !tenant.collegeName) return true;
  const targetCid = target.college_id ? String(target.college_id) : null;
  const targetCname = target.college ? String(target.college) : null;
  if (tenant.collegeId && targetCid && targetCid === tenant.collegeId) return true;
  if (tenant.collegeName && targetCname && targetCname.toLowerCase() === tenant.collegeName.toLowerCase()) return true;
  return false;
}

module.exports = {
  resolveAdminTenant,
  buildTenantUserFilter,
  isSameTenant,
};
