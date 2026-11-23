const { hasPermission, hasAnyPermission } = require('./rbac');

/**
 * Express middleware to enforce permission requirements
 */
function requirePermission(requiredPermission) {
  return (req, res, next) => {
    const role = req.userRole;
    if (!role) {
      return res.status(401).json({ detail: 'Authentication required' });
    }

    if (!hasPermission(role, requiredPermission)) {
      return res.status(403).json({
        detail: `Access forbidden: missing required permission [${requiredPermission}]`
      });
    }

    next();
  };
}

function requireAnyPermission(requiredPermissions = []) {
  return (req, res, next) => {
    const role = req.userRole;
    if (!role) {
      return res.status(401).json({ detail: 'Authentication required' });
    }

    if (!hasAnyPermission(role, requiredPermissions)) {
      return res.status(403).json({
        detail: 'Access forbidden: insufficient role permissions'
      });
    }

    next();
  };
}

module.exports = {
  requirePermission,
  requireAnyPermission
};
