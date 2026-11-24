const express = require('express');
const router = express.Router();
const WhiteLabelService = require('../services/whiteLabelService');
const College = require('../models/College');
const { authenticate, requireRole } = require('../middleware/auth');
const reportInternalError = require('../utils/httpError');

// ─── GET /white-label/resolve (Public) ────────────────────────────────
router.get('/resolve', async (req, res) => {
  try {
    const host = req.headers.host;
    const code = req.query.code || req.query.college;
    const branding = await WhiteLabelService.resolveBranding(host, code);
    res.json({ success: true, branding });
  } catch (err) {
    reportInternalError(res, err, 'WhiteLabel:Resolve');
  }
});

// ─── GET /white-label/config/:collegeCode ─────────────────────────────
router.get('/config/:collegeCode', async (req, res) => {
  try {
    const { collegeCode } = req.params;
    const branding = await WhiteLabelService.resolveBranding(null, collegeCode);
    res.json({ success: true, branding });
  } catch (err) {
    reportInternalError(res, err, 'WhiteLabel:GetConfig');
  }
});

// ─── PUT /white-label/config ──────────────────────────────────────────
router.put('/config', authenticate, requireRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const {
      collegeCode,
      logoUrl,
      faviconUrl,
      primaryColor,
      secondaryColor,
      accentColor,
      portalTitle,
      senderName,
      supportEmail
    } = req.body;

    const targetCode = collegeCode || req.user?.college;
    if (!targetCode) {
      return res.status(400).json({ success: false, detail: 'College code is required' });
    }

    const updates = {};
    if (logoUrl !== undefined) updates['branding.logo_url'] = logoUrl;
    if (faviconUrl !== undefined) updates['branding.favicon_url'] = faviconUrl;
    if (primaryColor !== undefined) updates['branding.primary_color'] = primaryColor;
    if (secondaryColor !== undefined) updates['branding.secondary_color'] = secondaryColor;
    if (accentColor !== undefined) updates['branding.accent_color'] = accentColor;
    if (portalTitle !== undefined) updates['branding.portal_title'] = portalTitle;
    if (senderName !== undefined) updates['branding.sender_name'] = senderName;
    if (supportEmail !== undefined) updates['branding.support_email'] = supportEmail;

    const college = await College.findOneAndUpdate(
      { code: targetCode.toUpperCase() },
      { $set: updates },
      { new: true }
    );

    if (!college) {
      return res.status(404).json({ success: false, detail: 'College not found' });
    }

    res.json({
      success: true,
      message: 'White-label branding updated successfully',
      branding: college.branding
    });
  } catch (err) {
    reportInternalError(res, err, 'WhiteLabel:UpdateConfig');
  }
});

// ─── POST /white-label/verify-domain ──────────────────────────────────
router.post('/verify-domain', authenticate, requireRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const { collegeCode, customDomain } = req.body;
    const targetCode = collegeCode || req.user?.college;
    if (!targetCode || !customDomain) {
      return res.status(400).json({ success: false, detail: 'Both collegeCode and customDomain are required' });
    }

    const result = await WhiteLabelService.verifyCustomDomain(targetCode, customDomain);
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (err) {
    reportInternalError(res, err, 'WhiteLabel:VerifyDomain');
  }
});

module.exports = router;
