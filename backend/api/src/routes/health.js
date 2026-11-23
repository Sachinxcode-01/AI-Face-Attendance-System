const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const os = require('os');
const faceAiService = require('../services/faceAiService');

// GET /health - General health
router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// GET /readiness - Readiness check
router.get('/readiness', (req, res) => {
  const dbReady = mongoose.connection.readyState === 1;
  if (!dbReady) {
    return res.status(503).json({ status: 'not_ready', database: 'disconnected' });
  }
  return res.json({ status: 'ready', database: 'connected' });
});

// GET /liveness - Liveness probe
router.get('/liveness', (req, res) => {
  res.json({ status: 'live' });
});

// GET /health/database
router.get('/database', (req, res) => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const state = states[mongoose.connection.readyState] || 'unknown';
  res.json({
    status: state === 'connected' ? 'ok' : 'degraded',
    state,
    host: mongoose.connection.host || 'local'
  });
});

// GET /health/ai
router.get('/ai', async (req, res) => {
  try {
    const aiUrl = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8001';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const resp = await fetch(`${aiUrl}/health`, { signal: controller.signal });
    clearTimeout(timeout);
    if (resp.ok) {
      return res.json({ status: 'ok', ai_service: 'connected' });
    }
    return res.status(503).json({ status: 'degraded', ai_service: 'unhealthy' });
  } catch (err) {
    return res.status(503).json({ status: 'offline', error: err.message });
  }
});

module.exports = router;
