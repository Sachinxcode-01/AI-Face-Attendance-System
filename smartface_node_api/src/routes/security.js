const express = require('express');
const router = express.Router();

const SecurityLog = require('../models/SecurityLog');
const EmailService = require('../services/emailService');
const notificationService = require('../services/notificationService');
const { authenticate, requireRole } = require('../middleware/auth');
const { trackJob } = require('../utils/jobTracker');

// ─── POST /security/intruder-alert ────────────────────────────────
router.post('/intruder-alert', async (req, res) => {
  try {
    const expectedToken = process.env.FACE_SCANNER_TOKEN;
    const clientToken = req.headers['token'] || req.headers['authorization']?.split(' ')[1] || req.headers['x-face-scanner-token'];

    let authorized = false;
    if (expectedToken && expectedToken.trim() !== '' && clientToken === expectedToken) {
      authorized = true;
    }

    if (!authorized) {
      const authHeader = req.headers['authorization'];
      if (authHeader) {
        const jwtToken = authHeader.split(' ')[1];
        const AuthService = require('../services/authService');
        const payload = AuthService.decodeToken(jwtToken);
        if (payload && (payload.role === 'admin' || payload.role === 'teacher' || payload.role === 'hod' || payload.role === 'principal' || payload.role === 'management')) {
          authorized = true;
        }
      }
    }

    if (!authorized) {
      return res.status(401).json({ detail: "Unauthorized scanner or session key" });
    }

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
    trackJob(notificationService.createNotification(
      "admin",
      "SECURITY ALERT",
      `Unknown person detected at ${alertLocation}`,
      "intruder_alert",
      "Critical",
      { location: alertLocation }
    ).catch(console.error));

    // Send email to admin in background
    const adminEmail = process.env.ADMIN_EMAIL || "saxhin0708@gmail.com";
    const formattedDate = timestamp.toISOString().replace('T', ' ').substring(0, 19);
    trackJob(EmailService.sendIntruderAlert(adminEmail, formattedDate, alertLocation).catch(console.error));

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
      l.status = l.status || "Active";
      return l;
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// ─── POST /security/acknowledge ──────────────────────────────────
router.post('/acknowledge', authenticate, requireRole(['teacher', 'admin']), async (req, res) => {
  try {
    const { log_id, status } = req.body;
    const updateStatus = status || "Acknowledged";
    
    await SecurityLog.updateOne({ _id: log_id }, { $set: { status: updateStatus } });
    res.json({ status: "success", message: `Alert marked as ${updateStatus.toLowerCase()}` });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

module.exports = router;
