const AttendanceAuditLog = require('../models/AttendanceAuditLog');

class AuditService {
  async log(action, actorEmail, role, details = {}, ip = '127.0.0.1') {
    try {
      return await AttendanceAuditLog.create({
        actor_email: actorEmail || 'system',
        role: role || 'system',
        action,
        details,
        ip_address: ip
      });
    } catch (err) {
      console.error('[AuditService Error]:', err.message);
      return null;
    }
  }
}

module.exports = new AuditService();
