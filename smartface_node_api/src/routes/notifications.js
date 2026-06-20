const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Notification = require('../models/Notification');
const { authenticate } = require('../middleware/auth');

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
