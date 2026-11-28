const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Notification = require('../models/Notification');
const User = require('../models/User');
const { authenticate, requireRole } = require('../middleware/auth');
const reportInternalError = require('../utils/httpError');
const { resolveAdminTenant, buildTenantUserFilter } = require('../utils/tenantScope');

// ─── POST /notifications/send (teacher/admin targeted student/parent alert) ──
router.post('/send', authenticate, requireRole(['teacher', 'hod', 'principal', 'admin', 'super_admin']), async (req, res) => {
  try {
    const { recipient_id, student_email, title, message, priority, parent_email, type } = req.body || {};
    const targetRaw = String(student_email || recipient_id || '').trim();
    if (!targetRaw || typeof message !== 'string' || !message.trim() || message.length > 1000) {
      return res.status(400).json({ detail: 'A valid student recipient and message (1-1000 chars) are required.' });
    }

    let targetStudent = await User.findOne(
      mongoose.Types.ObjectId.isValid(targetRaw)
        ? { _id: targetRaw, role: 'student' }
        : { email: targetRaw.toLowerCase(), role: 'student' },
      'email full_name college_id department parent_details'
    ).lean();

    if (!targetStudent) {
      return res.status(404).json({ detail: 'Target student not found.' });
    }

    const sender = await User.findOne({ email: req.userEmail }, 'college_id department').lean();
    if (req.userRole.toLowerCase() !== 'super_admin') {
      if (sender?.college_id && targetStudent.college_id && sender.college_id !== targetStudent.college_id) {
        return res.status(403).json({ detail: 'Forbidden: cannot notify students from another institution.' });
      }
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const rawStoredParent = typeof targetStudent.parent_details === 'string' ? targetStudent.parent_details.trim().toLowerCase() : '';
    const registeredParent = emailPattern.test(rawStoredParent) ? rawStoredParent : null;
    let resolvedParent = registeredParent;

    if (parent_email !== undefined && parent_email !== null && String(parent_email).trim() !== '') {
      const requestedParent = typeof parent_email === 'string' ? parent_email.trim().toLowerCase() : '';
      if (!emailPattern.test(requestedParent)) {
        return res.status(400).json({ detail: 'Invalid parent_email address.' });
      }
      if (requestedParent === registeredParent) {
        resolvedParent = requestedParent;
      } else {
        const linkedParent = await User.exists({
          email: requestedParent,
          role: 'parent',
          $or: [
            { children: targetStudent.email.toLowerCase() },
            { 'linked_children.email': targetStudent.email.toLowerCase() },
          ],
        });
        if (!linkedParent) {
          return res.status(403).json({ detail: 'Forbidden: supplied parent_email is not linked to this student.' });
        }
        resolvedParent = requestedParent;
      }
    }

    const notifService = require('../services/notificationService');
    const resolvedTitle = typeof title === 'string' && title.trim() ? title.trim().slice(0, 120) : 'Academic Attendance Alert';
    const resolvedPriority = ['Info', 'Low', 'Normal', 'High', 'Critical', 'Urgent'].includes(priority) ? priority : 'High';

    const created = await notifService.createNotification(
      targetStudent.email,
      resolvedTitle,
      message.trim(),
      type || 'attendance_warning',
      resolvedPriority,
      { sender: req.userEmail }
    );

    let parentNotified = false;
    if (resolvedParent) {
      try {
        const parentCreated = await notifService.createNotification(
          resolvedParent,
          `Ward Notice: ${resolvedTitle}`,
          `${targetStudent.full_name || targetStudent.email}: ${message.trim()}`,
          type || 'attendance_warning',
          resolvedPriority,
          { sender: req.userEmail, student_email: targetStudent.email }
        );
        parentNotified = Boolean(parentCreated && parentCreated.id);
      } catch (_) {
        parentNotified = false;
      }
    }

    res.status(201).json({
      success: true,
      id: created?.id || null,
      recipient: targetStudent.email,
      parent_notified: parentNotified,
    });
  } catch (error) {
    reportInternalError(res, error, 'Notifications:Send');
  }
});

// ─── POST /notifications/announcement ──────────────────────────────
  router.post('/announcement', authenticate, requireRole(['admin', 'super_admin']), async (req, res) => {
    try {
      const { title, message, type, priority, role, department } = req.body;

      if (!title || !message) {
        return res.status(400).json({ detail: "Title and message are required." });
      }

      const tenant = await resolveAdminTenant(req);
      const extraFilter = {};
      if (role) extraFilter.role = role;
      if (department) extraFilter.department = department;
      const filterQuery = buildTenantUserFilter(tenant, extraFilter);

      const users = await User.find(filterQuery, 'email').lean();
      const emails = users.map(u => u.email);

      if (emails.length === 0) {
        return res.json({ message: "No recipient users found matching filters." });
      }

      const notifService = require('../services/notificationService');

      // Create notifications for all matching users and broadcast over WebSocket
      for (const email of emails) {
        await notifService.createNotification(
          email,
          title,
          message,
          type || 'announcement',
          priority || 'Info',
        { filter_role: role, filter_department: department, college_id: tenant.collegeId || null }
        );
      }

      res.status(201).json({
        message: `Announcement created and sent to ${emails.length} users.`,
        recipient_count: emails.length
      });
    } catch (error) {
      reportInternalError(res, error, 'Notifications');
    }
  });

  // ─── GET /notifications (current authenticated user) ───────────────
  router.get('/', authenticate, async (req, res) => {
    try {
      const email = req.userEmail.toLowerCase();
      const filter = { user_id: email };
      if (req.query.type && req.query.type !== 'all') {
        filter.type = String(req.query.type);
      }
      if (req.query.unread === 'true') {
        filter.is_read = { $ne: true };
      }
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '50', 10)));

      const [notifications, unreadCount, user] = await Promise.all([
        Notification.find(filter).sort({ created_at: -1 }).limit(limit).lean(),
        Notification.countDocuments({ user_id: email, is_read: { $ne: true } }),
        User.findOne({ email }, 'notification_preferences').lean()
      ]);

      const result = notifications.map(n => ({
        ...n,
        id: n._id.toString(),
        _id: undefined,
      }));

      res.json({
        notifications: result,
        unread_count: unreadCount,
        preferences: user?.notification_preferences || { email: true, push: true, in_app: true }
      });
    } catch (error) {
      reportInternalError(res, error, 'Notifications');
    }
  });

  // ─── PATCH /notifications/read-all ────────────────────────────────
  router.patch('/read-all', authenticate, async (req, res) => {
    try {
      await Notification.updateMany(
        { user_id: req.userEmail.toLowerCase() },
        { $set: { is_read: true } }
      );
      res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
      reportInternalError(res, error, 'Notifications');
    }
  });

  // ─── PATCH /notifications/:id/read ────────────────────────────────
  router.patch('/:id/read', authenticate, async (req, res) => {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ detail: 'Invalid notification ID.' });
      }
      const updated = await Notification.findOneAndUpdate(
        { _id: id, user_id: req.userEmail.toLowerCase() },
        { $set: { is_read: true } },
        { new: true }
      ).lean();
      if (!updated) return res.status(404).json({ detail: 'Notification not found.' });
      res.json({ success: true, id, is_read: true });
    } catch (error) {
      reportInternalError(res, error, 'Notifications');
    }
  });

  // ─── GET /notifications/:email ──────────────────────────────────
  router.get('/:email', authenticate, async (req, res) => {
    try {
      const { email } = req.params;

      if (req.userEmail.toLowerCase() !== email.toLowerCase() && req.userRole.toLowerCase() !== 'admin') {
        return res.status(403).json({ detail: "Forbidden: Cannot access notifications for another user." });
      }

      const notifications = await Notification.find({ user_id: email })
        .sort({ created_at: -1 })
        .limit(20)
        .lean();

      const result = notifications.map(n => {
        n.id = n._id.toString();
        delete n._id;
        return n;
      });

      res.json(result);
    } catch (error) {
      reportInternalError(res, error, 'Notifications');
    }
  });

  // ─── GET /notifications/unread-count/:email ──────────────────────
  router.get('/unread-count/:email', authenticate, async (req, res) => {
    try {
      const { email } = req.params;

      if (req.userEmail.toLowerCase() !== email.toLowerCase() && req.userRole.toLowerCase() !== 'admin') {
        return res.status(403).json({ detail: "Forbidden: Cannot access notification counts for another user." });
      }

      const count = await Notification.countDocuments({ user_id: email, is_read: { $ne: true } });
      res.json({ unread_count: count });
    } catch (error) {
      reportInternalError(res, error, 'Notifications');
    }
  });

  // ─── PATCH /notifications/mark-read ──────────────────────────────
  router.patch('/mark-read', authenticate, async (req, res) => {
    try {
      const { ids } = req.body;

      if (ids !== undefined && (!Array.isArray(ids) || ids.length > 100 || ids.some(id => typeof id !== 'string'))) {
        return res.status(400).json({ detail: 'Notification ids must be an array of up to 100 ids.' });
      }

      if (!ids || ids.length === 0) {
        await Notification.updateMany(
          { user_id: req.userEmail },
          { $set: { is_read: true } }
        );
      } else {
        const objectIds = ids
          .filter(id => mongoose.Types.ObjectId.isValid(id))
          .map(id => new mongoose.Types.ObjectId(id));

        await Notification.updateMany(
          { _id: { $in: objectIds }, user_id: req.userEmail },
          { $set: { is_read: true } }
        );
      }

      res.json({ message: "Notifications marked as read" });
    } catch (error) {
      reportInternalError(res, error, 'Notifications');
    }
  });

  module.exports = router;
