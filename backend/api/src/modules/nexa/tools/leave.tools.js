'use strict';

const { z } = require('zod');
const mongoose = require('mongoose');
const crypto = require('crypto');
const Leave = require('../../../models/Leave');
const AttendanceDispute = require('../../../models/AttendanceDispute');
const AIActionConfirmation = require('../../../models/AIActionConfirmation');
const { getAuthorizedWards } = require('../../../services/guardianService');

function registerLeaveAndCorrectionTools(registry) {
  registry.register({
    name: 'get_leave_and_dispute_status',
    description: 'Check recent leave applications and attendance correction disputes.',
    allowedRoles: ['student', 'parent', 'teacher', 'admin', 'hod'],
    requiresWardAuth: true,
    schema: z.object({
      studentEmail: z.string().email().optional(),
      limit: z.number().int().min(1).max(15).default(5),
    }),
    async execute(args, authCtx) {
      if (mongoose.connection.readyState !== 1) return { available: false, leaves: [], disputes: [] };
      const role = String(authCtx.userRole || 'student').toLowerCase();

      if (role === 'teacher') {
        const [leaves, disputes] = await Promise.all([
          Leave.find({ status: 'Pending' }).sort({ created_at: -1 }).limit(args.limit).lean(),
          AttendanceDispute.find({ status: { $in: ['pending', 'Pending'] } }).sort({ created_at: -1 }).limit(args.limit).lean(),
        ]);
        return { available: true, scope: 'pending_faculty_review', leaves, disputes };
      }

      let email = authCtx.userEmail.toLowerCase();
      if (role === 'parent') {
        const wards = await getAuthorizedWards(authCtx.userEmail);
        if (!wards.length) return { available: false, leaves: [], disputes: [] };
        email = (args.studentEmail || authCtx.selectedWardEmail || wards[0].email).toLowerCase();
      }

      const [leaves, disputes] = await Promise.all([
        Leave.find({ user_id: email }).sort({ created_at: -1 }).limit(args.limit).lean(),
        AttendanceDispute.find({ student_email: email }).sort({ created_at: -1 }).limit(args.limit).lean(),
      ]);
      return { available: true, scope: 'student', leaves, disputes };
    },
  });

  registry.register({
    name: 'prepare_leave_application',
    description: 'Prepare a structured leave application draft requiring explicit user confirmation before submission.',
    allowedRoles: ['student'],
    requiresConfirmation: true,
    schema: z.object({
      category: z.enum(['Medical', 'Academic', 'Personal', 'Emergency', 'Other']).default('Medical'),
      startDate: z.string().min(4).max(30),
      endDate: z.string().min(4).max(30),
      reason: z.string().min(3).max(500),
    }),
    async execute(args, authCtx) {
      const actionId = `act_${crypto.randomBytes(6).toString('hex')}`;
      const summary = `${args.category} leave from ${args.startDate} to ${args.endDate}: "${args.reason}"`;
      if (mongoose.connection.readyState === 1) {
        await AIActionConfirmation.create({
          action_id: actionId,
          user_email: authCtx.userEmail.toLowerCase(),
          user_role: 'student',
          college_id: authCtx.collegeId || null,
          action_type: 'submit_leave',
          payload: args,
          summary,
          status: 'pending',
          expires_at: new Date(Date.now() + 15 * 60 * 1000),
        });
      }
      return {
        requiresConfirmation: true,
        actionId,
        actionType: 'submit_leave',
        summary,
        payload: args,
      };
    },
  });
}

module.exports = { registerLeaveAndCorrectionTools };
