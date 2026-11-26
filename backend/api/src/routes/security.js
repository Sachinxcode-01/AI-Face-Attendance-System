const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const SecurityLog = require('../models/SecurityLog');
const EmailService = require('../services/emailService');
const notificationService = require('../services/notificationService');
const auditService = require('../services/auditService');
const { authenticate, requireRole } = require('../middleware/auth');
const { resolveAdminTenant } = require('../utils/tenantScope');
const { trackJob } = require('../utils/jobTracker');
const reportInternalError = require('../utils/httpError');

const ALLOWED_INCIDENT_STATUSES = new Set([
  'Active', 'Detected', 'Under review', 'Investigating',
  'Escalated', 'Resolved', 'False positive', 'Closed', 'Acknowledged', 'Dispatched'
]);

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

    // Send email to admin in background if configured
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      const formattedDate = timestamp.toISOString().replace('T', ' ').substring(0, 19);
      trackJob(EmailService.sendIntruderAlert(adminEmail, formattedDate, alertLocation).catch(console.error));
    }

    res.json({ status: "alert_sent" });
  } catch (error) {
    reportInternalError(res, error, 'Security');
  }
});

// ─── GET /security/logs ───────────────────────────────────────────
router.get('/logs', authenticate, requireRole(['admin', 'super_admin', 'hod', 'principal']), async (req, res) => {
  try {
    const tenant = await resolveAdminTenant(req);
    const filter = {};
    if (!tenant.isSuperAdmin && tenant.collegeId) {
      filter.college_id = tenant.collegeId;
    }
    if (req.query.status && typeof req.query.status === 'string' && req.query.status !== 'all') {
      filter.status = req.query.status;
    }
    const logs = await SecurityLog.find(filter).sort({ timestamp: -1 }).limit(100).lean();
    const result = logs.map(l => {
      l.id = l._id.toString();
      delete l._id;
      l.status = l.status || "Active";
      return l;
    });
    res.json(result);
  } catch (error) {
    reportInternalError(res, error, 'Security');
  }
});

// ─── POST /security/acknowledge ──────────────────────────────────
router.post('/acknowledge', authenticate, requireRole(['teacher', 'admin', 'super_admin', 'hod', 'principal']), async (req, res) => {
  try {
    const { log_id, status, assigned_to, resolution_notes, severity } = req.body;
    if (!log_id || !mongoose.Types.ObjectId.isValid(log_id)) {
      return res.status(400).json({ detail: 'Invalid incident log_id.' });
    }
    const updateStatus = status || "Acknowledged";
    if (!ALLOWED_INCIDENT_STATUSES.has(updateStatus)) {
      return res.status(400).json({ detail: 'Invalid incident status.' });
    }

    const tenant = await resolveAdminTenant(req);
    const existing = await SecurityLog.findById(log_id);
    if (!existing) {
      return res.status(404).json({ detail: 'Security incident not found.' });
    }
    if (!tenant.isSuperAdmin && existing.college_id && tenant.collegeId && existing.college_id !== tenant.collegeId) {
      return res.status(403).json({ detail: 'Forbidden: Cross-institution security incident access denied.' });
    }

    const prevStatus = existing.status;
    existing.status = updateStatus;
    if (typeof assigned_to === 'string') existing.assigned_to = assigned_to.trim();
    if (typeof resolution_notes === 'string') existing.resolution_notes = resolution_notes.trim().slice(0, 1000);
    if (['low', 'medium', 'high', 'critical'].includes(severity)) existing.severity = severity;
    if (['Resolved', 'False positive', 'Closed'].includes(updateStatus)) {
      existing.resolved_at = new Date();
      existing.resolved_by = req.userEmail;
    }
    await existing.save();

    await auditService.log('SECURITY_INCIDENT_UPDATED', req.userEmail, req.userRole, {
      incident_id: log_id,
      previous_status: prevStatus,
      new_status: updateStatus,
      assigned_to: existing.assigned_to,
      college_id: tenant.collegeId,
    }, req.ip, { module: 'SECURITY', entityId: log_id, collegeId: tenant.collegeId });

    res.json({ status: "success", message: `Alert marked as ${updateStatus.toLowerCase()}`, incident: { ...existing.toObject(), id: existing._id.toString() } });
  } catch (error) {
    reportInternalError(res, error, 'Security');
  }
});

// ─── PATCH /security/incidents/:id ───────────────────────────────
router.patch('/incidents/:id', authenticate, requireRole(['admin', 'super_admin', 'hod', 'principal']), async (req, res) => {
  req.body.log_id = req.params.id;
  const handler = router.stack.find(l => l.route?.path === '/acknowledge')?.route?.stack[2]?.handle;
  if (handler) return handler(req, res);
  return res.status(404).json({ detail: 'Handler not found' });
});

module.exports = router;
