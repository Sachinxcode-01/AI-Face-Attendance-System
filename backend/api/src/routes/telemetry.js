const express = require('express');
const os = require('os');
const mongoose = require('mongoose');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const SecurityLog = require('../models/SecurityLog');
const Session = require('../models/Session');
const { resolveAdminTenant, buildTenantUserFilter } = require('../utils/tenantScope');
const reportInternalError = require('../utils/httpError');

function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${d}d ${h}h ${m}m`;
}

router.get('/system', authenticate, requireRole(['teacher', 'admin', 'super_admin', 'hod', 'principal']), async (req, res) => {
  try {
    const startMs = Date.now();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const memoryUsage = totalMem > 0 ? Math.round(((totalMem - freeMem) / totalMem) * 100) : 0;
    const loadAvg = os.loadavg()[0] || 0;
    const cpuCount = os.cpus()?.length || 1;
    const cpuUsage = Math.min(100, Math.round((loadAvg / cpuCount) * 100));

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const tenant = await resolveAdminTenant(req);
    const studentFilter = buildTenantUserFilter(tenant, { role: 'student' });
    const tenantUsers = (!tenant.isSuperAdmin && (tenant.collegeId || tenant.collegeName))
      ? await User.find(buildTenantUserFilter(tenant), 'email').lean()
      : null;
    const tenantEmails = tenantUsers ? tenantUsers.map((u) => u.email) : null;

    const sessionFilter = { is_active: true };
    const attendanceFilter = { timestamp: { $gte: todayStart } };
    const securityFilter = { status: 'Active' };
    if (tenantEmails) {
      sessionFilter.teacher_id = { $in: tenantEmails };
      attendanceFilter.student_email = { $in: tenantEmails };
    }
    if (!tenant.isSuperAdmin && tenant.collegeId) {
      securityFilter.college_id = tenant.collegeId;
    }

    const [totalStudents, activeSessions, presentCount, intruderCount] = await Promise.all([
      User.countDocuments(studentFilter),
      Session.countDocuments(sessionFilter),
      Attendance.countDocuments(attendanceFilter),
      SecurityLog.countDocuments(securityFilter)
    ]);

    const apiResponseTime = Date.now() - startMs;

    res.json({
      cpu_usage: cpuUsage,
      gpu_usage: null,
      memory_usage: memoryUsage,
      scan_fps: null,
      api_response_time: apiResponseTime,
      active_cameras: activeSessions,
      ai_engine_status: process.env.AI_SERVICE_URL ? 'Configured' : 'Local',
      hardware_acceleration: os.arch(),
      mongodb_connection: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
      system_uptime: formatUptime(process.uptime()),
      total_students: totalStudents,
      present_count: presentCount,
      active_sessions: activeSessions,
      intruder_count: intruderCount
    });
  } catch (error) {
    reportInternalError(res, error, 'Telemetry');
  }
});

module.exports = router;
