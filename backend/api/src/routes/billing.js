const express = require('express');
const router = express.Router();
const BillingService = require('../services/billingService');
const College = require('../models/College');
const { authenticate, requireRole } = require('../middleware/auth');
const reportInternalError = require('../utils/httpError');

// ─── GET /billing/plans ───────────────────────────────────────────────
router.get('/plans', (req, res) => {
  try {
    const plans = BillingService.getPlans();
    res.json({ success: true, count: plans.length, plans });
  } catch (err) {
    reportInternalError(res, err, 'Billing:GetPlans');
  }
});

// ─── POST /billing/quote ──────────────────────────────────────────────
router.post('/quote', (req, res) => {
  try {
    const { planId, studentCount, currency, billingCycle } = req.body;
    const quote = BillingService.calculateQuote({ planId, studentCount, currency, billingCycle });
    res.json({ success: true, quote });
  } catch (err) {
    reportInternalError(res, err, 'Billing:CalculateQuote');
  }
});

// ─── GET /billing/subscription ────────────────────────────────────────
router.get('/subscription', authenticate, requireRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const targetCode = req.query.collegeCode || req.user?.college;
    if (!targetCode) {
      return res.status(400).json({ success: false, detail: 'College code is required' });
    }

    const college = await College.findOne({ code: targetCode.toUpperCase() });
    if (!college) {
      return res.status(404).json({ success: false, detail: 'College not found' });
    }

    const subscription = college.subscription || {};
    res.json({
      success: true,
      college: college.name,
      collegeCode: college.code,
      subscription: {
        plan: subscription.plan || 'pilot',
        status: subscription.status || 'trialing',
        billingCycle: subscription.billing_cycle || 'annual',
        currentPeriodEnd: subscription.current_period_end,
        studentQuota: subscription.student_quota || 250,
        activeStudentsCount: subscription.active_students_count || 0,
        currency: subscription.currency || 'USD'
      }
    });
  } catch (err) {
    reportInternalError(res, err, 'Billing:GetSubscription');
  }
});

// ─── POST /billing/checkout ───────────────────────────────────────────
router.post('/checkout', authenticate, requireRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const { collegeCode, planId, studentCount, currency, successUrl, cancelUrl } = req.body;
    const targetCode = collegeCode || req.user?.college;
    if (!targetCode) {
      return res.status(400).json({ success: false, detail: 'College code is required' });
    }

    const session = await BillingService.createCheckoutSession(targetCode, {
      planId,
      studentCount,
      currency,
      successUrl,
      cancelUrl
    });

    res.json({ success: true, checkoutSession: session });
  } catch (err) {
    reportInternalError(res, err, 'Billing:CreateCheckout');
  }
});

// ─── GET /billing/invoices ────────────────────────────────────────────
router.get('/invoices', authenticate, requireRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const targetCode = req.query.collegeCode || req.user?.college;
    if (!targetCode) {
      return res.status(400).json({ success: false, detail: 'College code is required' });
    }

    const invoices = await BillingService.getInvoices(targetCode);
    res.json({ success: true, count: invoices.length, invoices });
  } catch (err) {
    reportInternalError(res, err, 'Billing:GetInvoices');
  }
});

// ─── POST /billing/webhook ────────────────────────────────────────────
router.post('/webhook', (req, res) => {
  // Acknowledge Stripe / Razorpay webhooks immediately
  const event = req.body?.type || 'payment_intent.succeeded';
  console.log(`[Billing Webhook] Received event: ${event}`);
  res.json({ received: true });
});

module.exports = router;
