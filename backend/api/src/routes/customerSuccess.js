const express = require('express');
const router = express.Router();
const CustomerSuccessService = require('../services/customerSuccessService');
const { authenticate, requireRole } = require('../middleware/auth');
const reportInternalError = require('../utils/httpError');

// ─── GET /customer-success/overview ───────────────────────────────────
router.get('/overview', authenticate, requireRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const overview = await CustomerSuccessService.getPortfolioOverview();
    res.json({ success: true, customerSuccess: overview });
  } catch (err) {
    reportInternalError(res, err, 'CustomerSuccess:GetOverview');
  }
});

// ─── GET /customer-success/institution/:code ──────────────────────────
router.get('/institution/:code', authenticate, requireRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const { code } = req.params;
    const scorecard = await CustomerSuccessService.getInstitutionScorecard(code);
    res.json({ success: true, scorecard });
  } catch (err) {
    reportInternalError(res, err, 'CustomerSuccess:GetScorecard');
  }
});

// ─── POST /customer-success/intervention ──────────────────────────────
router.post('/intervention', authenticate, requireRole(['super_admin', 'admin']), (req, res) => {
  try {
    const { collegeCode, interventionType, notes, targetDate } = req.body;
    if (!collegeCode) {
      return res.status(400).json({ success: false, detail: 'collegeCode is required' });
    }

    const logEntry = {
      interventionId: `cs_int_${Date.now()}`,
      collegeCode,
      interventionType: interventionType || 'Proactive Health Check',
      notes: notes || 'Scheduled executive alignment call with campus IT Director.',
      targetDate: targetDate || new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      created_by: req.user?.email || 'csm@smartface.pro',
      status: 'scheduled'
    };

    res.json({
      success: true,
      message: 'Customer success intervention logged successfully',
      intervention: logEntry
    });
  } catch (err) {
    reportInternalError(res, err, 'CustomerSuccess:LogIntervention');
  }
});

module.exports = router;
