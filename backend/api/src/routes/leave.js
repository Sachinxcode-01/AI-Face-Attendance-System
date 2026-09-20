const express = require('express');
const router = express.Router();

const Leave = require('../models/Leave');
const EmailService = require('../services/emailService');
const notificationService = require('../services/notificationService');
const { authenticate, requireRole } = require('../middleware/auth');
const { trackJob } = require('../utils/jobTracker');
const validate = require('../middleware/validate');
const { leaveApplySchema } = require('../schemas/validationSchemas');

// ─── POST /leave/apply ──────────────────────────────────────────
router.post('/apply', authenticate, validate(leaveApplySchema), async (req, res) => {
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
    res.status(500).json({ detail: error.message });
  }
});

// ─── GET /leave/student/:email ──────────────────────────────────
router.get('/student/:email', authenticate, async (req, res) => {
  try {
    const { email } = req.params;
    
    const isSelf = req.userEmail && req.userEmail.toLowerCase() === email.toLowerCase();
    const isStaff = req.userRole && ['admin', 'teacher', 'hod', 'principal', 'management'].includes(req.userRole.toLowerCase());

    if (!isSelf && !isStaff) {
      return res.status(403).json({ detail: "Forbidden: You do not have permission to view these leaves." });
    }

    const leaves = await Leave.find({ user_id: email }).sort({ created_at: -1 }).lean();
    
    const result = leaves.map(l => {
      l.id = l._id.toString();
      delete l._id;
      return l;
    });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// ─── GET /leave/admin/pending ───────────────────────────────────
router.get('/admin/pending', authenticate, requireRole(['admin', 'teacher']), async (req, res) => {
  try {
    const leaves = await Leave.find({ status: { $in: ["Pending", "Under Review"] } }).sort({ created_at: 1 }).lean();
    
    const result = leaves.map(l => {
      l.id = l._id.toString();
      delete l._id;
      return l;
    });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// ─── PATCH /leave/action ──────────────────────────────────────────
router.patch('/action', authenticate, requireRole(['admin', 'teacher']), async (req, res) => {
  try {
    const { leave_id, status, remarks } = req.body;

    await Leave.updateOne({ _id: leave_id }, { $set: { status, remarks } });

    const leave = await Leave.findById(leave_id);
    if (leave) {
      // Send email in background
      trackJob(EmailService.sendLeaveStatusUpdate(leave.user_id, status, remarks).catch(console.error));
      
      // Save notification for the student
      trackJob(notificationService.createNotification(
        leave.user_id,
        "Leave Application Status",
        `Your leave request from ${leave.start_date} to ${leave.end_date} has been ${status.toLowerCase()}.`,
        "leave_status",
        "High",
        { leave_id, status }
      ).catch(console.error));
    }

    res.json({ message: `Leave ${status.toLowerCase()} successfully` });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

module.exports = router;
