'use strict';

const { authorizeWardAccess, getAuthorizedWards } = require('../../../services/guardianService');
const { resolveAdminTenant } = require('../../../utils/tenantScope');

const ROLE_ALIASES = {
  faculty: 'teacher',
  management: 'admin',
  principal: 'admin',
};

function normalizeRole(rawRole) {
  const r = String(rawRole || 'student').trim().toLowerCase();
  return ROLE_ALIASES[r] || r;
}

/**
 * Authorizes a tool execution against server-side authenticated context.
 * Never trusts role or target identity supplied in LLM arguments alone.
 */
async function authorizeToolCall(tool, args, authCtx) {
  const role = normalizeRole(authCtx?.userRole);
  const rawRole = String(authCtx?.userRole || 'student').trim().toLowerCase();

  if (!authCtx?.userEmail) {
    return { allowed: false, reason: 'Authentication required for tool execution.' };
  }

  // Check role membership against both normalized and raw role
  if (Array.isArray(tool.allowedRoles) && tool.allowedRoles.length > 0) {
    const ok = tool.allowedRoles.includes(role) || tool.allowedRoles.includes(rawRole);
    if (!ok) {
      return {
        allowed: false,
        reason: `Role '${rawRole}' is not authorized to invoke tool '${tool.name}'.`,
      };
    }
  }

  // Student ownership enforcement: cannot query another student's records
  if (role === 'student' && args?.studentEmail) {
    if (args.studentEmail.trim().toLowerCase() !== authCtx.userEmail.toLowerCase()) {
      return {
        allowed: false,
        reason: 'Students may only access their own academic records.',
      };
    }
  }

  // Parent / guardian relationship enforcement
  if (role === 'parent' && tool.requiresWardAuth) {
    const targetEmail = (args?.studentEmail || authCtx.selectedWardEmail || '').trim().toLowerCase();
    if (targetEmail) {
      const wardAuth = await authorizeWardAccess(
        { userEmail: authCtx.userEmail, userRole: 'parent' },
        targetEmail,
        'use_nexa'
      );
      if (!wardAuth.allowed) {
        return { allowed: false, reason: wardAuth.reason || 'Guardian relationship not verified.' };
      }
    } else {
      const wards = await getAuthorizedWards(authCtx.userEmail);
      if (!wards || wards.length === 0) {
        return { allowed: false, reason: 'No active linked wards found for this guardian account.' };
      }
    }
  }

  // Admin tenant resolution
  if (['admin', 'super_admin', 'hod'].includes(role) && !authCtx.tenant) {
    authCtx.tenant = await resolveAdminTenant({
      userEmail: authCtx.userEmail,
      userRole: rawRole,
    });
  }

  return { allowed: true };
}

module.exports = {
  normalizeRole,
  authorizeToolCall,
};
