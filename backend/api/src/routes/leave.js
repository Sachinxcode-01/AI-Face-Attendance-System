const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const Leave = require('../models/Leave');
const User = require('../models/User');
const EmailService = require('../services/emailService');
const notificationService = require('../services/notificationService');
const { authenticate, requireRole } = require('../middleware/auth');
const { trackJob } = require('../utils/jobTracker');
const validate = require('../middleware/validate');
const { leaveApplySchema } = require('../schemas/validationSchemas');
const reportInternalError = require('../utils/httpError');
const cache = require('../utils/cache');
const { getInstitutionPolicy } = require('../services/studentAttendanceService');

const leaveReviewRoles = ['teacher', 'hod', 'principal', 'management', 'admin', 'super_admin'];
const ALLOWED_CATEGORIES = ['Medical', 'Personal', 'Emergency', 'Academic', 'Sports', 'Institutional Activity', 'Other'];

const leaveDocsDir = path.resolve(__dirname, '../../../data/leave_docs');
fs.mkdirSync(leaveDocsDir, { recursive: true });

const docUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

function isAllowedDocMagicBytes(buf) {
  if (!buf || buf.length < 4) return false;
  const isPdf = buf.slice(0, 4).toString('ascii') === '%PDF';
  const isJpeg = buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF;
  const isPng = buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47;
  const isWebp = buf.length >= 12 && buf.slice(0, 4).toString('ascii') === 'RIFF' && buf.slice(8, 12).toString('ascii') === 'WEBP';
  if (isPdf) return '.pdf';
  if (isJpeg) return '.jpg';
  if (isPng) return '.png';
  if (isWebp) return '.webp';
  return null;
}

async function staffLeaveScope(req) {
  const role = (req.userRole || '').toLowerCase();
  if (!['teacher', 'hod'].includes(role)) return {};

  const staff = await User.findOne({ email: req.userEmail }, 'department').lean();
  if (!staff?.department) return { user_id: { $in: [] } };

  const users = await User.find({ department: staff.department }, 'email').lean();
  return { user_id: { $in: users.map((user) => user.email.toLowerCase()) } };
}

// ─── POST /leave/upload-document ────────────────────────────────
router.post('/upload-document', authenticate, requireRole(['student', 'parent']), docUpload.single('file'), async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ detail: 'Supporting document file is required (PDF, JPEG, PNG, or WebP, max 5MB).' });
    }
    const ext = isAllowedDocMagicBytes(req.file.buffer);
    if (!ext) {
      return res.status(400).json({ detail: 'Unsupported document format. Allowed: PDF, JPEG, PNG, WebP.' });
    }
    const storedFilename = `leave_${crypto.randomUUID()}${ext}`;
    fs.writeFileSync(path.join(leaveDocsDir, storedFilename), req.file.buffer);
    res.status(201).json({
      success: true,
      document_url: `/leave/document/${storedFilename}`,
      document_name: path.basename(req.file.originalname || storedFilename).slice(0, 120)
    });
  } catch (error) {
    reportInternalError(res, error, 'Leave:Upload');
  }
});

// ─── GET /leave/document/:filename ──────────────────────────────
router.get('/document/:filename', authenticate, async (req, res) => {
  try {
    const safeName = path.basename(req.params.filename || '');
    if (!/^leave_[a-f0-9-]+\.(pdf|jpg|png|webp)$/i.test(safeName)) {
      return res.status(400).json({ detail: 'Invalid document reference.' });
    }
    const docUrl = `/leave/document/${safeName}`;
    const leave = await Leave.findOne({ document_url: docUrl }).lean();
    const role = (req.userRole || '').toLowerCase();
    const isReviewer = leaveReviewRoles.includes(role);
    const isOwner = leave && leave.user_id.toLowerCase() === req.userEmail.toLowerCase();
    if (!isReviewer && !isOwner) {
      return res.status(403).json({ detail: 'Forbidden: you do not have access to this attachment.' });
    }
    const filePath = path.join(leaveDocsDir, safeName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ detail: 'Document not found.' });
    }
    res.sendFile(filePath);
  } catch (error) {
    reportInternalError(res, error, 'Leave:Document');
  }
});

// ─── POST /leave/apply ──────────────────────────────────────────
router.post('/apply', authenticate, requireRole(['student', 'parent']), validate(leaveApplySchema), async (req, res) => {
  try {
    const { reason, start_date, end_date, category, leave_type, document_url, document_name } = req.body;
    const actorRole = (req.userRole || '').toLowerCase();
    let targetUserId = (req.body.user_id || req.body.student_email || req.userEmail || '').trim().toLowerCase();

    if (actorRole === 'student' && req.userEmail.toLowerCase() !== targetUserId) {
      return res.status(403).json({ detail: "Forbidden: Cannot apply for leave on behalf of another user." });
    }

    if (actorRole === 'parent') {
      const parent = await User.findOne({ email: req.userEmail.toLowerCase() }, 'children linked_children').lean();
      const wardEmails = new Set([
        ...(parent?.children || []).map(e => String(e).toLowerCase()),
        ...(parent?.linked_children || []).map(c => String(c.email || '').toLowerCase())
      ]);
      if (!targetUserId || !wardEmails.has(targetUserId)) {
        return res.status(403).json({ detail: "Forbidden: Student is not linked to your parent account." });
      }
    }

    // Validate date range
    const startDt = new Date(`${String(start_date).slice(0, 10)}T00:00:00.000Z`);
    const endDt = new Date(`${String(end_date).slice(0, 10)}T00:00:00.000Z`);
    if (Number.isNaN(startDt.getTime()) || Number.isNaN(endDt.getTime())) {
      return res.status(400).json({ detail: 'Invalid start_date or end_date format (expected YYYY-MM-DD).' });
    }
    if (endDt < startDt) {
      return res.status(400).json({ detail: 'End date must be on or after the start date.' });
    }
    const durationDays = Math.ceil((endDt - startDt) / 86400000) + 1;
    if (durationDays > 90) {
      return res.status(400).json({ detail: 'Single leave application cannot exceed 90 days.' });
    }

    const startStr = startDt.toISOString().slice(0, 10);
    const endStr = endDt.toISOString().slice(0, 10);

    // Detect overlapping active leave applications
    const overlapping = await Leave.findOne({
      user_id: targetUserId,
      status: { $in: ['Pending', 'Under Review', 'Clarification', 'Approved'] },
      start_date: { $lte: endStr },
      end_date: { $gte: startStr }
    }).lean();

    if (overlapping) {
      return res.status(409).json({
        detail: `Overlapping ${overlapping.status.toLowerCase()} leave exists (${overlapping.start_date} to ${overlapping.end_date}).`
      });
    }

    const studentUser = await User.findOne({ email: targetUserId }, 'college_id college').lean();
    const resolvedCategory = ALLOWED_CATEGORIES.includes(category) ? category : (ALLOWED_CATEGORIES.includes(leave_type) ? leave_type : 'Academic');
    const safeDocUrl = typeof document_url === 'string' && document_url.startsWith('/leave/document/') ? document_url : undefined;

    const newLeave = new Leave({
      user_id: targetUserId,
      college_id: studentUser?.college_id || req.userCollege || undefined,
      reason: String(reason).trim().slice(0, 1000),
      category: resolvedCategory,
      start_date: startStr,
      end_date: endStr,
      document_url: safeDocUrl,
      document_name: typeof document_name === 'string' ? document_name.slice(0, 120) : undefined,
      status: "Pending",
      status_history: [{
        status: 'Pending',
        actor: req.userEmail,
        note: 'Application submitted',
        timestamp: new Date()
      }]
    });

    await newLeave.save();

    // Notify student & admin
    trackJob(notificationService.createNotification(
      targetUserId,
      'Leave Application Submitted',
      `Your ${resolvedCategory} leave (${startStr} to ${endStr}) has been submitted for review.`,
      'leave_status',
      'Info',
      { leave_id: newLeave._id.toString() }
    ).catch(console.error));

    trackJob(notificationService.createNotification(
      "admin",
      "New Leave Request",
      `${targetUserId} has requested ${resolvedCategory} leave from ${startStr} to ${endStr}`,
      "leave_request",
      "High",
      { leave_id: newLeave._id.toString(), user_id: targetUserId }
    ).catch(console.error));

    res.json({
      success: true,
      message: "Leave application submitted",
      id: newLeave._id.toString(),
      leave: { ...newLeave.toObject(), id: newLeave._id.toString() }
    });
  } catch (error) {
    reportInternalError(res, error, 'Leave');
  }
});

// ─── PATCH /leave/:id/withdraw ──────────────────────────────────
router.patch('/:id/withdraw', authenticate, requireRole(['student', 'parent']), async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ detail: 'Invalid leave application ID.' });
    }
    const leave = await Leave.findById(id);
    if (!leave) return res.status(404).json({ detail: 'Leave application not found.' });

    if (req.userRole === 'student' && leave.user_id.toLowerCase() !== req.userEmail.toLowerCase()) {
      return res.status(403).json({ detail: 'Forbidden: cannot withdraw another student\'s leave request.' });
    }

    const user = await User.findOne({ email: leave.user_id }, 'college_id college').lean();
    const policy = await getInstitutionPolicy(user);
    if (!policy.allowLeaveWithdrawal) {
      return res.status(403).json({ detail: 'Leave withdrawal is disabled by institutional policy.' });
    }

    if (!['Pending', 'Under Review', 'Clarification', 'Draft'].includes(leave.status)) {
      return res.status(400).json({ detail: `Cannot withdraw leave in "${leave.status}" status.` });
    }

    leave.status = 'Withdrawn';
    leave.updated_at = new Date();
    leave.status_history = leave.status_history || [];
    leave.status_history.push({
      status: 'Withdrawn',
      actor: req.userEmail,
      note: 'Withdrawn by applicant',
      timestamp: new Date()
    });
    await leave.save();

    res.json({ success: true, message: 'Leave application withdrawn.', status: leave.status });
  } catch (error) {
    reportInternalError(res, error, 'Leave:Withdraw');
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
    leave.reviewed_by = req.userEmail;
    leave.reviewed_at = new Date();
    leave.updated_at = new Date();
    leave.status_history = leave.status_history || [];
    leave.status_history.push({
      status,
      actor: req.userEmail,
      note: remarks || `Marked ${status}`,
      timestamp: new Date()
    });
    await leave.save();
    cache.invalidateAnalyticsForUser(leave.user_id);

    trackJob(EmailService.sendLeaveStatusUpdate(leave.user_id, status, remarks).catch(console.error));
    trackJob(notificationService.createNotification(
      leave.user_id,
      'Leave Application Status',
      `Your leave request from ${leave.start_date} to ${leave.end_date} has been ${status.toLowerCase()}.`,
      'leave_status',
      'High',
      { leave_id, status }
    ).catch(console.error));

    // Also notify linked parent of student
    trackJob((async () => {
      try {
        const studentUser = await User.findOne({ email: leave.user_id }).lean();
        const parentEmail = studentUser?.parent_details;
        if (parentEmail && parentEmail.includes('@')) {
          await notificationService.createNotification(
            parentEmail,
            'Ward Leave Status Update',
            `Leave request for ${studentUser.full_name || leave.user_id} (${leave.start_date} to ${leave.end_date}) has been ${status.toLowerCase()}.`,
            'leave_status',
            'High',
            { leave_id, status, student_email: leave.user_id }
          );
        }
      } catch (err) {
        console.error('Parent leave notification error:', err);
      }
    })());

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
