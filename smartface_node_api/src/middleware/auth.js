const AuthService = require('../services/authService');

const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ detail: "Invalid or expired token" });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ detail: "Invalid or expired token" });
  }

  const payload = AuthService.decodeToken(token);
  if (!payload) {
    return res.status(401).json({ detail: "Invalid or expired token" });
  }

  req.userEmail = payload.sub;
  req.userRole = payload.role;
  next();
};

const requireRole = (roles) => {
  const allowedRoles = Array.isArray(roles) ? roles.map(r => r.toLowerCase()) : [roles.toLowerCase()];
  return (req, res, next) => {
    if (!req.userRole || !allowedRoles.includes(req.userRole.toLowerCase())) {
      return res.status(403).json({ detail: "Forbidden: insufficient permissions" });
    }
    next();
  };
};

module.exports = { authenticate, requireRole };
