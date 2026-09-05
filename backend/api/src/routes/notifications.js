const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Notification = require('../models/Notification');
const User = require('../models/User');
const { authenticate, requireRole } = require('../middleware/auth');

// ─── POST /notifications/announcement ──────────────────────────────
router.post('/announcement', authenticate, requireRole(['admin']), async (req, res) => {
  try {
    const { title, message, type, priority, role, department } = req.body;
    
    if (!title || !message) {
      return res.status(400).json({ detail: "Title and message are required." });
    }

    // Build user filter query
    const filterQuery = {};
    if (role) filterQuery.role = role;
    if (department) filterQuery.department = department;

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
        { filter_role: role, filter_department: department }
      );
    }

    res.status(201).json({
      message: `Announcement created and sent to ${emails.length} users.`,
      recipient_count: emails.length
    });
  } catch (error) {
    res.status(500).json({ detail: error.message });
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
    res.status(500).json({ detail: error.message });
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
    res.status(500).json({ detail: error.message });
  }
});

// ─── PATCH /notifications/mark-read ──────────────────────────────
router.patch('/mark-read', authenticate, async (req, res) => {
  try {
    const { ids } = req.body;
    
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
        { _id: { $in: objectIds } },
        { $set: { is_read: true } }
      );
    }

    res.json({ message: "Notifications marked as read" });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

module.exports = router;
