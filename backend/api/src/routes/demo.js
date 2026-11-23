const express = require('express');
const router = express.Router();
const { validate } = require('../middleware/validators');
const { demoRequestSchema } = require('../schemas/validationSchemas');
const { limitDemoRequest } = require('../middleware/rateLimiter');
const EmailService = require('../services/emailService');
const { trackJob } = require('../utils/jobTracker');
const reportInternalError = require('../utils/httpError');

// ─── POST /demo or /api/demo ──────────────────────────────────────────
router.post('/', limitDemoRequest, validate(demoRequestSchema), async (req, res) => {
  try {
    const { fullName, email, institution, campusSize, phone, notes } = req.body;

    const leadEmail = process.env.ADMIN_NOTIFY_EMAIL || process.env.SALES_EMAIL || 'kalinganavarsachin@gmail.com';

    // 1. Send internal lead notification email
    const internalSubject = `[SmartFace Demo Lead] ${fullName} from ${institution}`;
    const internalText = `New Campus Walkthrough Demo Request:
Name: ${fullName}
Email: ${email}
Institution: ${institution}
Campus Size: ${campusSize}
Phone: ${phone || 'Not provided'}
Notes: ${notes || 'None'}
Requested At: ${new Date().toISOString()}`;

    const internalHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0b0b12; color: #f5f5f8; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
        <h2 style="color: #8f8bff; margin-top: 0;">🚀 New Campus Demo Request</h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 14px;">
          <tr><td style="padding: 8px 0; color: #8a8a97; width: 140px;">Full Name:</td><td style="color: #ffffff; font-weight: bold;">${fullName}</td></tr>
          <tr><td style="padding: 8px 0; color: #8a8a97;">Work Email:</td><td><a href="mailto:${email}" style="color: #6fd8ff;">${email}</a></td></tr>
          <tr><td style="padding: 8px 0; color: #8a8a97;">Institution:</td><td style="color: #ffffff;">${institution}</td></tr>
          <tr><td style="padding: 8px 0; color: #8a8a97;">Campus Size:</td><td style="color: #ffffff;">${campusSize}</td></tr>
          <tr><td style="padding: 8px 0; color: #8a8a97;">Phone:</td><td style="color: #ffffff;">${phone || 'Not provided'}</td></tr>
          <tr><td style="padding: 8px 0; color: #8a8a97;">Notes:</td><td style="color: #b6b6c2;">${notes || 'None'}</td></tr>
          <tr><td style="padding: 8px 0; color: #8a8a97;">Received At:</td><td style="color: #8a8a97; font-family: monospace;">${new Date().toISOString()}</td></tr>
        </table>
      </div>
    `;

    trackJob(
      EmailService.sendEmail({
        to: leadEmail,
        subject: internalSubject,
        text: internalText,
        html: internalHtml
      }).catch(err => console.error('[DemoRequest] Failed to send lead notification:', err))
    );

    // 2. Send automated confirmation email to the prospective campus client
    const clientSubject = `SmartFace Campus Walkthrough Demo Request Received`;
    const clientText = `Hello ${fullName},

Thank you for requesting a live SmartFace campus walkthrough.

We have received your institutional details for ${institution} (${campusSize}). A SmartFace enterprise architect has been assigned to prepare your 30-minute interactive session covering:
- ArcFace 512-dimension neural embedding verification (<120ms latency)
- Dynamic anti-proxy rotating QR codes (30-second cryptographic drift window)
- Synchronized multi-role portals (Student, Faculty, Admin Sentinel, Parent)
- Integration with your existing SIS/LMS campus infrastructure

We will reach out to schedule your walkthrough at your convenience.

Best regards,
The SmartFace Architecture Team
https://ai-face-attendance-beta.vercel.app`;

    const clientHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #050507; color: #b6b6c2; border-radius: 16px; border: 1px solid rgba(255,255,255,0.08);">
        <div style="margin-bottom: 20px;">
          <h1 style="color: #f5f5f8; font-size: 20px; font-weight: 600; margin: 0;">SmartFace Campus Demo Request</h1>
          <p style="color: #8f8bff; font-size: 12px; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.1em; font-family: monospace;">Touchless Biometric Attendance & Campus Security</p>
        </div>
        <p style="color: #f5f5f8; font-size: 15px;">Hello ${fullName},</p>
        <p style="line-height: 1.6; font-size: 14px;">
          Thank you for requesting a campus walkthrough for <strong>${institution}</strong>. Our deployment team has received your information and is preparing a tailored live environment.
        </p>
        <div style="background-color: #101016; border-radius: 12px; padding: 16px; margin: 20px 0; border: 1px solid rgba(255,255,255,0.06);">
          <p style="color: #f5f5f8; font-weight: 600; font-size: 13px; margin: 0 0 10px 0;">Your Walkthrough Agenda:</p>
          <ul style="margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.6; color: #b6b6c2;">
            <li>Live 512-D ArcFace verification under varying illumination</li>
            <li>Anti-buddy punching rotating QR code hardware-locking</li>
            <li>Kiosk mode & teacher dashboard live synchronization</li>
            <li>Zero-knowledge FERPA & GDPR compliance architecture</li>
          </ul>
        </div>
        <p style="font-size: 13px; color: #8a8a97; line-height: 1.5;">
          An enterprise architect will follow up shortly to confirm a session time that suits your schedule. If you have immediate questions, feel free to reply directly to this email.
        </p>
        <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.08); margin: 24px 0;" />
        <p style="font-size: 11px; color: #60606c; font-family: monospace; margin: 0;">
          SmartFace AI Attendance Platform · Gadag, Karnataka, India
        </p>
      </div>
    `;

    trackJob(
      EmailService.sendEmail({
        to: email,
        subject: clientSubject,
        text: clientText,
        html: clientHtml
      }).catch(err => console.error('[DemoRequest] Failed to send client confirmation:', err))
    );

    res.status(200).json({
      success: true,
      message: "Campus demo request received. A confirmation has been sent to your email."
    });
  } catch (error) {
    reportInternalError(res, error, 'DemoRequest');
  }
});

module.exports = router;
