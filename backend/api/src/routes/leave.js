const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Leave = require('../models/Leave');
const User = require('../models/User');
const EmailService = require('../services/emailService');
const notificationService = require('../services/notificationService');
const { authenticate, requireRole } = require('../middleware/auth');
const { trackJob } = require('../utils/jobTracker');
const validate = require('../middleware/validate');
const { leaveApplySchema } = require('../schemas/validationSchemas');
const reportInternalError = require('../utils/httpError');

const leaveReviewRoles = ['teacher', 'hod', 'principal', 'management', 'admin', 'super_admin'];

async function staffLeaveScope(req) {
  const role = (req.userRole || '').toLowerCase();
  if (!['teacher', 'hod'].includes(role)) return {};

  const staff = await User.findOne({ email: req.userEmail }, 'department').lean();
  if (!staff?.department) return { user_id: { $in: [] } };

  const users = await User.find({ department: staff.department }, 'email').lean();
  return { user_id: { $in: users.map((user) => user.email.toLowerCase()) } };
}

// ─── POST /leave/apply ──────────────────────────────────────────
router.post('/apply', authenticate, requireRole(['student']), validate(leaveApplySchema), async (req, res) => {
  try {
    const { user_id, reason, start_date, end_date } = req.body;

    if (req.userEmail.toLowerCase() !== user_id.toLowerCase() && req.userRole.toLowerCase() !== 'admin') {
      return res.status(403).json({ detail: "Forbidden: Cannot apply for leave on behalf of another user." });
    }

    const newLeave = new Leave({
      user_id,
      reason,
      start_date,
      end_date,
      status: "Pending"
    });

    await newLeave.save();

    // Notify admin
    trackJob(notificationService.createNotification(
      "admin",
      "New Leave Request",
      `${user_id} has requested leave from ${start_date} to ${end_date}`,
      "leave_request",
      "High",
      { leave_id: newLeave._id.toString(), user_id }
    ).catch(console.error));

    res.json({ message: "Leave application submitted", id: newLeave._id.toString() });
  } catch (error) {
    reportInternalError(res, error, 'Leave');
  }
});

// ─── GET /leave/student/:email ──────────────────────────────────
router.get('/student/:email', authenticate, async (req, res) => {
  try {
    const email = req.params.email.trim().toLowerCase();
    const role = (req.userRole || '').toLowerCase();
    const isSelf = req.userEmail?.toLowerCase() === email;
    if (!isSelf && !leaveReviewRoles.includes(role)) {
      return res.status(403).json({ detail: 'You are not allowed to view these leave requests.' });
    }
    const scope = await staffLeaveScope(req);
    if (!isSelf && scope.user_id && !scope.user_id.$in.includes(email)) {
      return res.status(403).json({ detail: 'You are not allowed to view leave requests outside your department.' });
    }
    
    const leaves = await Leave.find({ user_id: email }).sort({ created_at: -1 }).lean();
    
    const result = leaves.map(l => {
      l.id = l._id.toString();
      delete l._id;
      return l;
    });
    
    res.json(result);
  } catch (error) {
    reportInternalError(res, error, 'Leave');
  }
});

// ─── GET /leave/admin/pending ───────────────────────────────────
router.get('/admin/pending', authenticate, requireRole(leaveReviewRoles), async (req, res) => {
  try {
    const scope = await staffLeaveScope(req);
    const leaves = await Leave.find({
      ...scope,
      status: { $in: ['Pending', 'Under Review'] },
    }).sort({ created_at: 1 }).lean();
    
    const result = leaves.map(l => {
      l.id = l._id.toString();
      delete l._id;
      return l;
    });
    
    res.json(result);
  } catch (error) {
    reportInternalError(res, error, 'Leave');
  }
});

// ─── PATCH /leave/action ──────────────────────────────────────────
router.patch('/action', authenticate, requireRole(leaveReviewRoles), async (req, res) => {
  try {
    const { leave_id, status, remarks } = req.body;
    if (!mongoose.Types.ObjectId.isValid(leave_id) || !['Under Review', 'Clarification', 'Approved', 'Rejected'].includes(status) || (remarks != null && (typeof remarks !== 'string' || remarks.length > 1000))) {
      return res.status(400).json({ detail: 'Invalid leave status.' });
    }

    const scope = await staffLeaveScope(req);
    const leave = await Leave.findOne({ _id: leave_id, ...scope });
    if (!leave) return res.status(404).json({ detail: 'Leave request not found.' });

    leave.status = status;
    leave.remarks = remarks;
    await leave.save();

    trackJob(EmailService.sendLeaveStatusUpdate(leave.user_id, status, remarks).catch(console.error));
    trackJob(notificationService.createNotification(
      leave.user_id,
      'Leave Application Status',
      `Your leave request from ${leave.start_date} to ${leave.end_date} has been ${status.toLowerCase()}.`,
      'leave_status',
      'High',
      { leave_id, status }
    ).catch(console.error));

    res.json({ message: `Leave ${status.toLowerCase()} successfully` });
  } catch (error) {
    console.error('[Leave] Review action error:', error);
    res.status(500).json({ detail: 'Unable to update leave request.' });
  }
});

router.get('/analytics', authenticate, requireRole(leaveReviewRoles), async (req, res) => {
  try {
    const scope = await staffLeaveScope(req);
    const leaves = await Leave.find(scope, 'user_id status created_at').lean();
    const userEmails = [...new Set(leaves.map((leave) => leave.user_id))];
    const users = await User.find({ email: { $in: userEmails } }, 'email department').lean();
    const departmentByEmail = new Map(users.map((user) => [user.email.toLowerCase(), user.department || 'Unassigned']));
    const departmentCounts = new Map();
    const monthlyCounts = new Map();
    const monthStarts = [];
    const currentMonth = new Date();
    currentMonth.setUTCDate(1);
    currentMonth.setUTCHours(0, 0, 0, 0);
    for (let offset = 5; offset >= 0; offset--) {
      monthStarts.push(new Date(Date.UTC(currentMonth.getUTCFullYear(), currentMonth.getUTCMonth() - offset, 1)));
    }
    const recentMonthKeys = new Set(monthStarts.map((month) => month.toISOString().slice(0, 7)));
    let approved = 0;

    for (const leave of leaves) {
      if (leave.status === 'Approved') approved++;
      const department = departmentByEmail.get(leave.user_id.toLowerCase()) || 'Unassigned';
      departmentCounts.set(department, (departmentCounts.get(department) || 0) + 1);
      const monthKey = leave.created_at?.toISOString().slice(0, 7);
      if (monthKey && recentMonthKeys.has(monthKey)) {
        monthlyCounts.set(monthKey, (monthlyCounts.get(monthKey) || 0) + 1);
      }
    }

    const totalRequests = leaves.length;
    const departmentStatistics = Object.fromEntries(
      [...departmentCounts].map(([department, count]) => [
        department,
        totalRequests ? Math.round((count / totalRequests) * 1000) / 10 : 0,
      ])
    );
    const monthlyTrends = Object.fromEntries(monthStarts.map((month) => [
      month.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }),
      monthlyCounts.get(month.toISOString().slice(0, 7)) || 0,
    ]));

    res.json({
      total_requests: totalRequests,
      approval_rate: totalRequests ? approved / totalRequests : 0,
      department_statistics: departmentStatistics,
      monthly_trends: monthlyTrends,
    });
  } catch (error) {
    console.error('[Leave] Analytics error:', error);
    res.status(500).json({ detail: 'Unable to load leave analytics.' });
  }
});

module.exports = router;
