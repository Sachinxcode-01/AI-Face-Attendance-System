const express = require('express');
const router = express.Router();

// Mount all v1 sub-routes
router.use('/auth', require('../../routes/auth'));
router.use('/attendance', require('../../routes/attendance'));
router.use('/teacher', require('../../routes/teacher'));
router.use('/parent', require('../../routes/parent'));
router.use('/leave', require('../../routes/leave'));
router.use('/analytics', require('../../routes/analytics'));
router.use('/notifications', require('../../routes/notifications'));
router.use('/sessions', require('../../routes/sessions'));
router.use('/academic', require('../../routes/academic'));

// AI monitoring endpoint
router.get('/ai/status', async (req, res) => {
  const aiUrl = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8001';
  try {
    const resp = await fetch(`${aiUrl}/ready`);
    const data = await resp.json();
    res.json({
      success: true,
      service: 'SmartFace AI Pro',
      engine: 'InsightFace ArcFace (buffalo_l)',
      modelVersion: 'ArcFace-512D',
      status: resp.ok ? 'healthy' : 'degraded',
      details: data
    });
  } catch (err) {
    res.json({
      success: false,
      service: 'SmartFace AI Pro',
      status: 'offline',
      error: err.message
    });
  }
});

module.exports = router;
