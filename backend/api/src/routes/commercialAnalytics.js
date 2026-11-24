const express = require('express');
const router = express.Router();
const CommercialAnalyticsService = require('../services/commercialAnalyticsService');
const { authenticate, requireRole } = require('../middleware/auth');
const reportInternalError = require('../utils/httpError');

// ─── GET /commercial/metrics ──────────────────────────────────────────
router.get('/metrics', authenticate, requireRole(['super_admin', 'admin']), (req, res) => {
  try {
    const metrics = CommercialAnalyticsService.getExecutiveMetrics();
    res.json({ success: true, commercialMetrics: metrics });
  } catch (err) {
    reportInternalError(res, err, 'Commercial:GetMetrics');
  }
});

// ─── GET /commercial/pipeline ─────────────────────────────────────────
router.get('/pipeline', authenticate, requireRole(['super_admin', 'admin']), (req, res) => {
  try {
    const pipeline = CommercialAnalyticsService.getSalesPipeline();
    res.json({ success: true, pipeline });
  } catch (err) {
    reportInternalError(res, err, 'Commercial:GetPipeline');
  }
});

// ─── GET /commercial/forecast ─────────────────────────────────────────
router.get('/forecast', authenticate, requireRole(['super_admin', 'admin']), (req, res) => {
  try {
    const forecast = CommercialAnalyticsService.getRevenueForecast();
    res.json({ success: true, forecast });
  } catch (err) {
    reportInternalError(res, err, 'Commercial:GetForecast');
  }
});

module.exports = router;
