'use strict';

const { z } = require('zod');
const mongoose = require('mongoose');
const teacherService = require('../../../services/teacherService');
const { getStudentAttendanceSummary } = require('../../../services/studentAttendanceService');
const { getAuthorizedWards } = require('../../../services/guardianService');
const Timetable = require('../../../models/Timetable');

function registerAcademicTools(registry) {
  registry.register({
    name: 'get_today_timetable',
    description: 'Get today’s scheduled classes for a student, ward, or teacher.',
    allowedRoles: ['student', 'parent', 'teacher', 'hod', 'admin'],
    requiresWardAuth: true,
    schema: z.object({
      studentEmail: z.string().email().optional(),
    }),
    async execute(args, authCtx) {
      const role = String(authCtx.userRole || 'student').toLowerCase();
      if (role === 'teacher') {
        if (mongoose.connection.readyState !== 1) return { available: false, classes: [] };
        const dash = await teacherService.getTeacherDashboard(authCtx.userEmail).catch(() => null);
        return {
          available: Boolean(dash),
          classes: dash?.today_schedule || [],
          completed: dash?.completed_lectures_today || 0,
          upcoming: dash?.upcoming_lectures_today || 0,
          cancelled: dash?.cancelled_lectures_today || 0,
        };
      }

      let email = authCtx.userEmail.toLowerCase();
      if (role === 'parent') {
        const wards = await getAuthorizedWards(authCtx.userEmail);
        if (!wards.length) return { available: false, classes: [] };
        email = (args.studentEmail || authCtx.selectedWardEmail || wards[0].email).toLowerCase();
      }
      const summary = await getStudentAttendanceSummary(email).catch(() => null);
      return {
        available: Boolean(summary),
        classes: summary?.today_classes || [],
        upcoming: summary?.upcoming_classes || [],
      };
    },
  });

  registry.register({
    name: 'get_teacher_classroom_summary',
    description: 'Retrieve teacher’s assigned classes, today’s lectures, at-risk students, and monthly comparison.',
    allowedRoles: ['teacher', 'hod', 'admin'],
    schema: z.object({
      targetPercentage: z.number().min(1).max(100).optional(),
    }),
    async execute(args, authCtx) {
      if (mongoose.connection.readyState !== 1) {
        return { available: false, reason: 'Database unavailable.' };
      }
      const [dash, analyticsData] = await Promise.all([
        teacherService.getTeacherDashboard(authCtx.userEmail).catch(() => null),
        teacherService
          .getTeacherAnalyticsAndRisk(
            authCtx.userEmail,
            args.targetPercentage ? { targetPercentage: args.targetPercentage } : {}
          )
          .catch(() => null),
      ]);
      if (!dash) return { available: false, reason: 'Teacher dashboard data unavailable.' };

      const target = args.targetPercentage ?? dash.academic_info?.min_percentage ?? 75;
      const riskStudents = analyticsData?.risk_students || [];
      const belowTarget = riskStudents.filter((s) => s.conducted > 0 && s.attendance_rate < target);
      const consecutiveAbsences = riskStudents.filter((s) => s.consecutive_absences >= 3);

      return {
        available: true,
        department: dash.department,
        semester: dash.academic_info?.semester,
        activeSessions: dash.active_sessions,
        totalSessions: dash.total_sessions,
        totalAssignedStudents: dash.total_assigned_students,
        overallAttendanceRate: dash.overall_attendance_rate,
        policyMinPercentage: dash.academic_info?.min_percentage ?? 75,
        attendanceToday: dash.attendance_today,
        completedToday: dash.completed_lectures_today,
        upcomingToday: dash.upcoming_lectures_today,
        cancelledToday: dash.cancelled_lectures_today,
        pendingLeaves: dash.pending_leaves,
        pendingDisputes: dash.pending_disputes,
        unreadNotifications: dash.unread_notifications,
        todaySchedule: dash.today_schedule || [],
        subjectWise: dash.subject_wise_attendance || [],
        monthComparison: analyticsData?.month_comparison || null,
        belowTargetCount: belowTarget.length,
        belowTargetSample: belowTarget.slice(0, 10),
        consecutiveAbsencesCount: consecutiveAbsences.length,
        consecutiveAbsencesSample: consecutiveAbsences.slice(0, 6),
      };
    },
  });
}

module.exports = { registerAcademicTools };
