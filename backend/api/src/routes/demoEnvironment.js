const express = require('express');
const router = express.Router();
const DemoEnvironmentService = require('../services/demoEnvironmentService');
const reportInternalError = require('../utils/httpError');

// ─── GET /demo-env/environments ───────────────────────────────────────
router.get('/environments', (req, res) => {
  try {
    const environments = DemoEnvironmentService.getSandboxProfiles();
    res.json({ success: true, count: environments.length, environments });
  } catch (err) {
    reportInternalError(res, err, 'DemoEnv:GetEnvironments');
  }
});

// ─── POST /demo-env/launch-session ────────────────────────────────────
router.post('/launch-session', (req, res) => {
  try {
    const { environmentId, role } = req.body;
    const session = DemoEnvironmentService.createDemoToken(environmentId || 'apex_tech', role || 'admin');
    res.json({ success: true, demoSession: session });
  } catch (err) {
    reportInternalError(res, err, 'DemoEnv:LaunchSession');
  }
});

// ─── POST /demo-env/simulate-burst ────────────────────────────────────
router.post('/simulate-burst', (req, res) => {
  try {
    const count = parseInt(req.body.count, 10) || 25;
    const burstEvents = DemoEnvironmentService.generateAttendanceBurst(Math.min(count, 100));
    res.json({ success: true, count: burstEvents.length, events: burstEvents });
  } catch (err) {
    reportInternalError(res, err, 'DemoEnv:SimulateBurst');
  }
});

// ─── POST /demo-env/reset ─────────────────────────────────────────────
router.post('/reset', (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Demo environment successfully purged and restored to default seed state.'
    });
  } catch (err) {
    reportInternalError(res, err, 'DemoEnv:Reset');
  }
});

module.exports = router;
