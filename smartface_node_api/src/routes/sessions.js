const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Session = require('../models/Session');
const User = require('../models/User');
const notificationService = require('../services/notificationService');
const { authenticate, requireRole } = require('../middleware/auth');

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
    User.find({ role: 'student' }).then(students => {
      students.forEach(student => {
        if (student.email) {
          notificationService.createNotification(
            student.email,
            "Live Session Alert",
            `New attendance session active for ${subject}`,
            "session_alert",
            "High",
            { session_id: sessionId.toString(), subject }
          ).catch(console.error);
        }
      });
    }).catch(console.error);

    res.json({
      session_id: sessionId.toString(),
      qr_code: qrCode,
      message: "Attendance session started successfully"
    });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

module.exports = router;
