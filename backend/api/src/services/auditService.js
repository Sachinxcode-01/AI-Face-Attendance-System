const AttendanceAuditLog = require('../models/AttendanceAuditLog');
const SystemAuditLog = require('../models/SystemAuditLog');

const VALID_SYSTEM_MODULES = new Set([
  'AUTH', 'ATTENDANCE', 'LEAVE', 'ACADEMIC', 'SECURITY', 'ADMIN', 'AI', 'NOTIFICATION'
]);

class AuditService {
  async log(action, actorEmail, role, details = {}, ip = '127.0.0.1', opts = {}) {
    try {
      const mod = VALID_SYSTEM_MODULES.has(opts.module) ? opts.module : 'ADMIN';
      const sysEntry = await SystemAuditLog.create({
        user_id: opts.userId || undefined,
        actor_email: actorEmail || 'system',
        role: role || 'system',
        action,
        module: mod,
        entity_id: opts.entityId || null,
        description: opts.description || '',
        details: {
          ...details,
          college_id: opts.collegeId || details?.college_id || null,
        },
        ip_address: ip,
        user_agent: opts.userAgent || 'unknown'
      });

      if (mod === 'ATTENDANCE' || mod === 'AUTH') {
        await AttendanceAuditLog.create({
          actor_email: actorEmail || 'system',
          role: role || 'system',
          action,
          details,
          ip_address: ip
        }).catch(() => null);
      }

      return sysEntry;
    } catch (err) {
      console.error('[AuditService Error]:', err.message);
      return null;
    }
  }
}

module.exports = new AuditService();
