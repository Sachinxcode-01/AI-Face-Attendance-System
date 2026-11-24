const express = require('express');
const router = express.Router();
const SisService = require('../services/sisService');
const College = require('../models/College');
const { authenticate, requireRole } = require('../middleware/auth');
const reportInternalError = require('../utils/httpError');

// ─── GET /sis/connectors ──────────────────────────────────────────────
router.get('/connectors', (req, res) => {
  try {
    const connectors = SisService.getSupportedConnectors();
    res.json({ success: true, count: connectors.length, connectors });
  } catch (err) {
    reportInternalError(res, err, 'SIS:GetConnectors');
  }
});

// ─── POST /sis/test-connection ────────────────────────────────────────
router.post('/test-connection', authenticate, requireRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const { provider, apiUrl, apiKey } = req.body;
    const result = await SisService.testConnection({ provider, apiUrl, apiKey });
    res.json({ success: result.success, details: result });
  } catch (err) {
    reportInternalError(res, err, 'SIS:TestConnection');
  }
});

// ─── POST /sis/configure ──────────────────────────────────────────────
router.post('/configure', authenticate, requireRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const { collegeCode, provider, apiUrl, autoSyncFrequencyHours, syncEnabled } = req.body;
    if (!collegeCode) {
      return res.status(400).json({ success: false, detail: 'collegeCode is required' });
    }

    const updated = await College.findOneAndUpdate(
      { code: collegeCode.toUpperCase() },
      {
        $set: {
          'sis_config.provider': provider || 'none',
          'sis_config.api_url': apiUrl || null,
          'sis_config.sync_enabled': syncEnabled !== undefined ? syncEnabled : true,
          'sis_config.auto_sync_frequency_hours': autoSyncFrequencyHours || 24
        }
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, detail: 'College not found' });
    }

    res.json({
      success: true,
      message: 'SIS configuration saved successfully',
      sis_config: updated.sis_config
    });
  } catch (err) {
    reportInternalError(res, err, 'SIS:Configure');
  }
});

// ─── POST /sis/sync ───────────────────────────────────────────────────
router.post('/sync', authenticate, requireRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const { collegeCode, provider, forceFullSync } = req.body;
    const targetCode = collegeCode || req.user?.college;
    if (!targetCode) {
      return res.status(400).json({ success: false, detail: 'College code is required' });
    }

    const summary = await SisService.syncRoster(targetCode, { provider, forceFullSync });
    res.json({ success: true, message: 'SIS roster synchronization completed', summary });
  } catch (err) {
    reportInternalError(res, err, 'SIS:Sync');
  }
});

// ─── POST /sis/oneroster/validate-csv ──────────────────────────────────
router.post('/oneroster/validate-csv', authenticate, requireRole(['super_admin', 'admin']), (req, res) => {
  try {
    const { csvData } = req.body;
    if (!csvData) {
      return res.status(400).json({ success: false, detail: 'csvData string payload is required' });
    }
    const result = SisService.parseOneRosterCsv(csvData);
    res.json({ success: true, validation: result });
  } catch (err) {
    res.status(400).json({ success: false, detail: err.message });
  }
});

module.exports = router;
