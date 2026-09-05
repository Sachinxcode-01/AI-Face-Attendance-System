const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Session = require('../models/Session');
const User = require('../models/User');
const notificationService = require('../services/notificationService');
const { authenticate, requireRole } = require('../middleware/auth');
const { trackJob } = require('../utils/jobTracker');

router.post('/start', authenticate, requireRole(['teacher', 'admin']), async (req, res) => {
  try {
    const { teacher_email, subject } = req.body;

    if (req.userEmail.toLowerCase() !== teacher_email.toLowerCase() && req.userRole.toLowerCase() !== 'admin') {
      return res.status(403).json({ detail: "Forbidden: Cannot start session on behalf of another teacher." });
    }
    const sessionId = new mongoose.Types.ObjectId();
    const qrCode = `QR_${sessionId.toString()}_${Math.floor(1000 + Math.random() * 9000)}`;

    const newSession = new Session({
      _id: sessionId,
      teacher_id: teacher_email,
      subject,
      duration: "1 Hour",
      start_time: new Date(),
      is_active: true,
      qr_code: qrCode
    });

    await newSession.save();

    // Notify all students about the active session in the background
    trackJob(User.find({ role: 'student' }).then(students => {
      const promises = students.map(student => {
        if (student.email) {
          return notificationService.createNotification(
            student.email,
            "Live Session Alert",
            `New attendance session active for ${subject}`,
            "session_alert",
            "High",
            { session_id: sessionId.toString(), subject }
          );
        }
      });
      return Promise.all(promises);
    }).catch(console.error));

    res.json({
      session_id: sessionId.toString(),
      qr_code: qrCode,
      message: "Attendance session started successfully"
    });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// GET /sessions/active - Get currently active attendance session
router.get('/active', async (req, res) => {
  try {
    const activeSession = await Session.findOne({ is_active: true }).sort({ start_time: -1 }).lean();
    if (!activeSession) {
      return res.json({ is_active: false, message: "No active attendance session found" });
    }
    res.json({
      is_active: true,
      session_id: activeSession._id.toString(),
      teacher_id: activeSession.teacher_id,
      subject: activeSession.subject,
      start_time: activeSession.start_time,
      qr_code: activeSession.qr_code,
      duration: activeSession.duration
    });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// POST /sessions/stop - End an active attendance session
router.post('/stop', authenticate, requireRole(['teacher', 'admin']), async (req, res) => {
  try {
    const { session_id } = req.body;
    let query = { is_active: true };
    if (session_id && mongoose.Types.ObjectId.isValid(session_id)) {
      query = { _id: session_id, is_active: true };
    }

    const session = await Session.findOne(query);
    if (!session) {
      return res.status(404).json({ detail: "Active session not found" });
    }

    if (req.userRole.toLowerCase() !== 'admin' && req.userEmail.toLowerCase() !== session.teacher_id.toLowerCase()) {
      return res.status(403).json({ detail: "Forbidden: You can only stop sessions you created" });
    }

    session.is_active = false;
    await session.save();

    res.json({
      session_id: session._id.toString(),
      message: "Session ended successfully"
    });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

module.exports = router;
