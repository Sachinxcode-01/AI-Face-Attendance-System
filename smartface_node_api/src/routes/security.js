const express = require('express');
const router = express.Router();

const SecurityLog = require('../models/SecurityLog');
const EmailService = require('../services/emailService');
const notificationService = require('../services/notificationService');
const { authenticate, requireRole } = require('../middleware/auth');

// ─── POST /security/intruder-alert ────────────────────────────────
router.post('/intruder-alert', async (req, res) => {
  try {
    const { location, camera_id, type, image_base64 } = req.body;
    const alertLocation = location || camera_id || "Unknown Location";
    const alertType = type || "intruder";
    const timestamp = new Date();

    const newLog = new SecurityLog({
      location: alertLocation,
      type: alertType,
      timestamp,
      image_base64
    });

    await newLog.save();

    // Create admin notification
    notificationService.createNotification(
      "admin",
      "SECURITY ALERT",
      `Unknown person detected at ${alertLocation}`,
      "intruder_alert",
      "Critical",
      { location: alertLocation }
    ).catch(console.error);

    // Send email to admin in background
    const adminEmail = process.env.ADMIN_EMAIL || "saxhin0708@gmail.com";
    const formattedDate = timestamp.toISOString().replace('T', ' ').substring(0, 19);
    EmailService.sendIntruderAlert(adminEmail, formattedDate, alertLocation).catch(console.error);

    res.json({ status: "alert_sent" });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// ─── GET /security/logs ───────────────────────────────────────────
router.get('/logs', authenticate, async (req, res) => {
  try {
    const logs = await SecurityLog.find().sort({ timestamp: -1 }).limit(50).lean();
    const result = logs.map(l => {
      l.id = l._id.toString();
      delete l._id;
      return l;
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

module.exports = router;
