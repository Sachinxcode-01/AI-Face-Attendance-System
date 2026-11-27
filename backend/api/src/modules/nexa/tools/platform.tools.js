'use strict';

const { z } = require('zod');
const mongoose = require('mongoose');
const User = require('../../../models/User');
const Session = require('../../../models/Session');
const Attendance = require('../../../models/Attendance');
const SecurityLog = require('../../../models/SecurityLog');
const Leave = require('../../../models/Leave');
const AttendanceDispute = require('../../../models/AttendanceDispute');
const CampusDevice = require('../../../models/CampusDevice');
const College = require('../../../models/College');
const JobExecution = require('../../../models/JobExecution');
const { resolveAdminTenant, buildTenantUserFilter } = require('../../../utils/tenantScope');
const { getProviderStatus } = require('../providers/provider-router');

function registerPlatformAndAdminTools(registry) {
  registry.register({
    name: 'get_institution_operations_summary',
    description: 'Get tenant-isolated institutional attendance, active sessions, pending leaves/disputes, and device health.',
    allowedRoles: ['admin', 'hod', 'super_admin'],
    schema: z.object({}),
    async execute(_args, authCtx) {
      if (mongoose.connection.readyState !== 1) {
        return { available: false, reason: 'Database unavailable.' };
      }
      const tenant = authCtx.tenant || (await resolveAdminTenant({ userEmail: authCtx.userEmail, userRole: authCtx.userRole }));
      const studentEmails = await User.find(buildTenantUserFilter(tenant, { role: 'student' })).distinct('email');
      const facultyEmails = await User.find(buildTenantUserFilter(tenant, { role: { $in: ['teacher', 'faculty'] } })).distinct('email');

      const scopedAll = tenant.isSuperAdmin && !tenant.collegeId;
      const sessScope = scopedAll ? {} : { teacher_id: { $in: facultyEmails } };
      const attScope = scopedAll ? {} : { student_email: { $in: studentEmails } };
      const secScope = scopedAll ? { status: 'Active' } : { college_id: tenant.collegeId, status: 'Active' };
      const devScope = scopedAll ? {} : { college_id: tenant.collegeId };

      const todayStart = new Date();
      todayStart.setUTCHours(0, 0, 0, 0);

      const [activeSessions, activeAlerts, todayAttendance, pendingLeaves, pendingDisputes, offlineDevices] = await Promise.all([
        Session.countDocuments({ ...sessScope, is_active: true }),
        SecurityLog.countDocuments(secScope),
        Attendance.countDocuments({ ...attScope, timestamp: { $gte: todayStart } }),
        Leave.countDocuments({ ...(scopedAll ? {} : { user_id: { $in: studentEmails } }), status: 'Pending' }),
        AttendanceDispute.countDocuments({
          ...(scopedAll ? {} : { student_email: { $in: studentEmails } }),
          status: { $in: ['pending', 'teacher_reviewed', 'escalated', 'Pending'] },
        }),
        CampusDevice.countDocuments({ ...devScope, status: { $ne: 'active' } }),
      ]);

      return {
        available: true,
        institutionName: tenant.collegeName || 'SmartFace',
        collegeId: tenant.collegeId || null,
        totalStudents: studentEmails.length,
        totalFaculty: facultyEmails.length,
        activeSessions,
        todayAttendance,
        pendingLeaves,
        pendingDisputes,
        activeSecurityAlerts: activeAlerts,
        offlineDevices,
        minAttendancePolicy: tenant.collegeDoc?.attendance_policy?.min_percentage ?? 75,
      };
    },
  });

  registry.register({
    name: 'get_platform_operations_summary',
    description: 'Get Super Admin platform-wide SaaS metrics: active colleges, background jobs, service & AI provider health.',
    allowedRoles: ['super_admin'],
    schema: z.object({}),
    async execute() {
      if (mongoose.connection.readyState !== 1) {
        return { available: false, reason: 'Database unavailable.', providers: getProviderStatus() };
      }
      const [totalColleges, activeColleges, failedJobs, recentJobs, activeAlerts] = await Promise.all([
        College.countDocuments({}),
        College.countDocuments({ status: { $in: ['active', 'Active', null] } }),
        JobExecution.countDocuments({ status: 'failed' }),
        JobExecution.find({}).sort({ started_at: -1 }).limit(5).select('job_name status duration_ms started_at').lean(),
        SecurityLog.countDocuments({ status: 'Active' }),
      ]);

      return {
        available: true,
        totalColleges,
        activeColleges,
        failedBackgroundJobs: failedJobs,
        recentJobs,
        activePlatformSecurityAlerts: activeAlerts,
        providers: getProviderStatus(),
        uptimeSeconds: Math.round(process.uptime()),
      };
    },
  });
}

module.exports = { registerPlatformAndAdminTools };
