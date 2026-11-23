const express = require('express');
const router = express.Router();
const accuracyMonitoringService = require('../services/accuracyMonitoringService');
const { authenticate, requireRole } = require('../middleware/auth');
const reportInternalError = require('../utils/httpError');

/**
 * GET /attendance/accuracy/metrics & /api/v1/accuracy/metrics
 * Face recognition accuracy, failure rates, FAR/FRR, and biometric telemetry.
 */
router.get(['/metrics', '/'], authenticate, requireRole(['admin', 'super_admin', 'principal', 'hod']), async (req, res) => {
  try {
    const hours = parseInt(req.query.hours || '168', 10);
    const data = await accuracyMonitoringService.getMetrics({ hours });
    res.json(data);
  } catch (err) {
    reportInternalError(res, err, 'AccuracyMonitoring');
  }
});

/**
 * POST /attendance/accuracy/report-failure
 * Report a recognition failure from biometric kiosk or mobile client for audit analytics
 */
router.post('/report-failure', authenticate, async (req, res) => {
  try {
    const { studentEmail, reason, confidence, lighting, location } = req.body;
    accuracyMonitoringService.recordFailure({
      studentEmail: studentEmail || req.userEmail,
      reason,
      confidence,
      lighting,
      location,
      device: req.headers['user-agent'] || 'Client'
    });

    res.json({ success: true, message: 'Recognition telemetry recorded.' });
  } catch (err) {
    reportInternalError(res, err, 'AccuracyMonitoring');
  }
});

module.exports = router;
