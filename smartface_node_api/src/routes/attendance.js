const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Session = require('../models/Session');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const notificationService = require('../services/notificationService');
const GSheetsManager = require('../services/gsheetsManager');
const gsheets = new GSheetsManager();

const { authenticate } = require('../middleware/auth');
const SHEET_URL = process.env.GSHEETS_URL || "";

// ─── POST /attendance/mark ────────────────────────────────────────
router.post('/mark', authenticate, async (req, res) => {
  try {
    const { student_email, session_id, qr_code } = req.body;

    const session = await Session.findOne({ _id: session_id, is_active: true });
    if (!session) {
      return res.status(400).json({ detail: "Invalid or expired session" });
    }

    let qrVerified = false;

    // 1. Check rotating token pattern
    if (qr_code.startsWith("token_")) {
      const parts = qr_code.split("_");
      if (parts.length >= 2 && /^\d+$/.test(parts[1])) {
        const qrTimeMs = parseInt(parts[1], 10);
        const currentTimeMs = Date.now();
        if (Math.abs(currentTimeMs - qrTimeMs) <= 30000) {
          qrVerified = true;
        }
      }
    }
    // 2. Check raw timestamp
    else if (/^\d+$/.test(qr_code)) {
      const qrTimeMs = parseInt(qr_code, 10);
      const currentTimeMs = Date.now();
      if (Math.abs(currentTimeMs - qrTimeMs) <= 30000) {
        qrVerified = true;
      }
    }

    // 3. Fall back to static matching
    if (!qrVerified) {
      if (session.qr_code !== qr_code) {
        return res.status(400).json({ detail: "Invalid QR Code" });
      }
    }

    const timestamp = new Date();
    const newRecord = new Attendance({
      student_email,
      session_id,
      timestamp,
      status: "Present",
      verified_by: "qr"
    });

    await newRecord.save();

    // Broadcast update to live-logs WebSockets
    notificationService.broadcast({
      type: "attendance_update",
      student_email,
      session_id,
      status: "Present",
      timestamp: timestamp.toISOString()
    }).catch(console.error);

    // Sync to Google Sheets in background
    if (SHEET_URL) {
      User.findOne({ email: student_email }).then(user => {
        const name = user ? user.full_name : student_email;
        gsheets.addRecord(SHEET_URL, "Attendance", [
          name,
          student_email,
          session.subject,
          timestamp.toISOString(),
          "Present"
        ]).catch(err => console.error("GSheets Sync Error:", err));
      }).catch(console.error);
    }

    res.json({ status: "success", message: "Attendance marked successfully" });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// ─── POST /attendance/mark/face ───────────────────────────────────
router.post('/mark/face', async (req, res) => {
  try {
    const token = req.headers['token'] || req.headers['authorization']?.split(' ')[1];
    const expectedToken = process.env.FACE_SCANNER_TOKEN || "secure_face_scanner_default_key_123";
    if (token !== expectedToken) {
      return res.status(401).json({ detail: "Unauthorized face scanner token" });
    }

    const { student_email, confidence } = req.body;

    const session = await Session.findOne({ is_active: true });
    if (!session) {
      return res.status(400).json({ detail: "No active attendance session found" });
    }

    const existing = await Attendance.findOne({
      student_email,
      session_id: session._id.toString()
    });

    if (existing) {
      return res.json({ status: "success", message: "Attendance already marked for this session" });
    }

    const timestamp = new Date();
    const newRecord = new Attendance({
      student_email,
      session_id: session._id.toString(),
      timestamp,
      status: "Present",
      verified_by: "face",
      confidence
    });

    await newRecord.save();

    // Broadcast update to live-logs WebSockets
    notificationService.broadcast({
      type: "attendance_update",
      student_email,
      session_id: session._id.toString(),
      status: "Present",
      timestamp: timestamp.toISOString(),
      verified_by: "face",
      confidence
    }).catch(console.error);

    // Sync to Google Sheets in background
    if (SHEET_URL) {
      User.findOne({ email: student_email }).then(user => {
        const name = user ? user.full_name : student_email;
        const formattedDate = timestamp.toISOString().replace('T', ' ').substring(0, 19);
        gsheets.addRecord(SHEET_URL, "Attendance", [
          name,
          student_email,
          session.subject,
          formattedDate,
          "Present"
        ]).catch(err => console.error("GSheets Sync Error (Face Scanner):", err));
      }).catch(console.error);
    }

    res.json({ status: "success", message: "Face attendance marked successfully" });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

module.exports = router;
