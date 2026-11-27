'use strict';

const { z } = require('zod');
const mongoose = require('mongoose');
const { getStudentAttendanceSummary } = require('../../../services/studentAttendanceService');
const { calculateTargetMetrics, simulateScenario } = require('../../../services/attendanceCalculator');
const { getAuthorizedWards } = require('../../../services/guardianService');

async function resolveTargetStudentEmail(args, authCtx) {
  const role = String(authCtx.userRole || 'student').toLowerCase();
  if (role === 'student') return authCtx.userEmail.toLowerCase();
  if (role === 'parent') {
    const wards = await getAuthorizedWards(authCtx.userEmail);
    if (!wards.length) return null;
    if (args.studentEmail) {
      const match = wards.find((w) => w.email.toLowerCase() === args.studentEmail.toLowerCase());
      return match ? match.email.toLowerCase() : null;
    }
    return (authCtx.selectedWardEmail || wards[0].email).toLowerCase();
  }
  return (args.studentEmail || authCtx.userEmail).toLowerCase();
}

function registerAttendanceTools(registry) {
  registry.register({
    name: 'get_attendance_summary',
    description: 'Retrieve verified attendance summary, subject breakdown, streak, and risk standing.',
    allowedRoles: ['student', 'parent', 'teacher', 'admin', 'hod', 'super_admin'],
    requiresWardAuth: true,
    schema: z.object({
      studentEmail: z.string().email().optional(),
      targetPercentage: z.number().min(1).max(100).optional(),
    }),
    async execute(args, authCtx) {
      const email = await resolveTargetStudentEmail(args, authCtx);
      if (!email) return { available: false, reason: 'No authorized student record found.' };
      const summary = await getStudentAttendanceSummary(email);
      if (!summary) return { available: false, reason: 'Attendance profile unavailable.' };

      const target = args.targetPercentage || summary.policy?.minPercentage || 75;
      const forecast = calculateTargetMetrics({
        attended: summary.total_present,
        conducted: summary.total_conducted,
        target,
        remainingClasses: summary.forecast?.remainingClasses ?? null,
      });

      const sortedSubjects = [...(summary.subjects || [])]
        .filter((s) => s.conducted > 0)
        .sort((a, b) => a.percentage - b.percentage);

      return {
        available: true,
        studentName: summary.student?.full_name || 'Student',
        overallPercentage: summary.overall_attendance,
        attended: summary.total_present,
        conducted: summary.total_conducted,
        missed: summary.total_missed,
        streak: summary.streak,
        consecutiveAbsences: summary.consecutive_absences,
        standing: summary.standing,
        risk: summary.risk,
        policy: summary.policy,
        targetForecast: forecast,
        lowestSubject: sortedSubjects[0] || null,
        subjects: summary.subjects || [],
        todayClasses: summary.today_classes || [],
        upcomingClasses: summary.upcoming_classes || [],
        syncedAt: new Date().toISOString(),
      };
    },
  });

  registry.register({
    name: 'calculate_required_classes',
    description: 'Deterministically compute classes needed or allowable absences for a target percentage.',
    allowedRoles: ['student', 'parent', 'teacher', 'admin', 'hod', 'super_admin'],
    requiresWardAuth: true,
    schema: z.object({
      studentEmail: z.string().email().optional(),
      targetPercentage: z.number().min(1).max(100).default(75),
      subject: z.string().max(120).optional(),
    }),
    async execute(args, authCtx) {
      const email = await resolveTargetStudentEmail(args, authCtx);
      if (!email) return { available: false, reason: 'No authorized student record found.' };
      const summary = await getStudentAttendanceSummary(email);
      if (!summary) return { available: false, reason: 'Attendance summary unavailable.' };

      if (args.subject) {
        const sub = (summary.subjects || []).find((s) =>
          s.subject.toLowerCase().includes(args.subject.toLowerCase())
        );
        if (sub) {
          return {
            available: true,
            scope: 'subject',
            subject: sub.subject,
            ...calculateTargetMetrics({
              attended: sub.attended,
              conducted: sub.conducted,
              target: args.targetPercentage,
            }),
          };
        }
      }

      return {
        available: true,
        scope: 'overall',
        ...calculateTargetMetrics({
          attended: summary.total_present,
          conducted: summary.total_conducted,
          target: args.targetPercentage,
          remainingClasses: summary.forecast?.remainingClasses ?? null,
        }),
      };
    },
  });

  registry.register({
    name: 'simulate_attendance_scenario',
    description: 'Simulate what-if attendance impact of attending or missing upcoming classes.',
    allowedRoles: ['student', 'parent'],
    requiresWardAuth: true,
    schema: z.object({
      studentEmail: z.string().email().optional(),
      attendMore: z.number().int().min(0).max(100).default(0),
      missMore: z.number().int().min(0).max(100).default(0),
      targetPercentage: z.number().min(1).max(100).optional(),
    }),
    async execute(args, authCtx) {
      const email = await resolveTargetStudentEmail(args, authCtx);
      if (!email) return { available: false, reason: 'No authorized student record found.' };
      const summary = await getStudentAttendanceSummary(email);
      if (!summary) return { available: false, reason: 'Attendance summary unavailable.' };
      const target = args.targetPercentage || summary.policy?.minPercentage || 75;
      return {
        available: true,
        currentPercentage: summary.overall_attendance,
        ...simulateScenario({
          attended: summary.total_present,
          conducted: summary.total_conducted,
          attendMore: args.attendMore,
          missMore: args.missMore,
          target,
        }),
      };
    },
  });
}

module.exports = { registerAttendanceTools };
