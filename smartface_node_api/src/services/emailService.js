const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const loginOtpTemplate = require('../templates/email/loginOtpTemplate');
const registerOtpTemplate = require('../templates/email/registerOtpTemplate');
const forgotPasswordOtpTemplate = require('../templates/email/forgotPasswordOtpTemplate');
const resetPasswordSuccessTemplate = require('../templates/email/resetPasswordSuccessTemplate');
const welcomeTemplate = require('../templates/email/welcomeTemplate');

class EmailService {
  static getClient() {
    const { BrevoClient } = require('@getbrevo/brevo');
    return new BrevoClient({ apiKey: process.env.BREVO_API_KEY });
  }

  static async sendEmail(param1, param2, param3, param4) {
    let to, subject, html, text;
    if (typeof param1 === 'object' && param1 !== null && !Array.isArray(param1)) {
      to = param1.to;
      subject = param1.subject;
      html = param1.html;
      text = param1.text;
    } else {
      to = param1;
      subject = param2;
      text = param3;
      html = param4;
    }

    const provider = process.env.EMAIL_PROVIDER || 'resend';
    const emailFrom = process.env.EMAIL_FROM || process.env.EMAIL_FROM_ADDRESS || 'onboarding@resend.dev';
    const emailSenderName = process.env.EMAIL_SENDER_NAME || 'Smart Attendance AI';

    if (process.env.NODE_ENV === 'test' || provider === 'test') {
      console.log(`[Email Mock] to: ${to} | subject: ${subject}`);
      return {
        success: true,
        provider: "mock",
        messageId: "mock-message-id",
        status: "sent"
      };
    }

    if (provider === 'resend') {
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey || apiKey.trim() === '' || apiKey === 'your_resend_api_key') {
        console.error("[EmailService] Provider: Resend | Error: RESEND_API_KEY is missing or invalid.");
        return {
          success: false,
          provider: "resend",
          statusCode: 401,
          message: "RESEND_API_KEY is missing or invalid"
        };
      }

      // Format from field appropriately
      let fromField = emailFrom;
      if (!emailFrom.includes('<')) {
        fromField = `${emailSenderName} <${emailFrom}>`;
      }

      const isTestSender = emailFrom.includes('onboarding@resend.dev');

      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: fromField,
            to: [to],
            subject: subject,
            html: html,
            text: text
          })
        });

        const data = await response.json();
        const maskedEmail = to.replace(/^(.)(.*)(@.*)$/, (_, a, b, c) => a + '*'.repeat(b.length) + c);

        if (!response.ok) {
          const statusCode = response.status;
          let errMsg = data.message || 'Unknown Resend error';

          // If EMAIL_FROM uses onboarding@resend.dev, allow only Resend account email for testing
          // and return clean error for other recipients.
          if (isTestSender) {
            errMsg = "Resend test sender can only send to the account email. Add a verified domain for production.";
          }

          console.error(`[EmailService] Provider: Resend | Status Code: ${statusCode} | Error Message: ${errMsg} | Recipient: ${maskedEmail}`);
          
          return {
            success: false,
            provider: "resend",
            statusCode: statusCode,
            message: errMsg
          };
        }

        return {
          success: true,
          provider: "resend",
          messageId: data.id || "unknown",
          status: "sent"
        };
      } catch (err) {
        const maskedEmail = to.replace(/^(.)(.*)(@.*)$/, (_, a, b, c) => a + '*'.repeat(b.length) + c);
        let errMsg = err.message;
        if (isTestSender) {
          errMsg = "Resend test sender can only send to the account email. Add a verified domain for production.";
        }
        console.error(`[EmailService] Provider: Resend | Status Code: 500 | Error Message: ${errMsg} | Recipient: ${maskedEmail}`);
        return {
          success: false,
          provider: "resend",
          statusCode: 500,
          message: errMsg
        };
      }
    } else {
      // Fallback to Brevo
      const brevoKey = process.env.BREVO_API_KEY;
      if (!brevoKey || brevoKey.trim() === '') {
        return {
          success: false,
          provider: "brevo",
          statusCode: 401,
          message: "BREVO_API_KEY is missing and provider is set to brevo"
        };
      }
      try {
        const client = this.getClient();
        await client.transactionalEmails.sendTransacEmail({
          sender: { name: emailSenderName, email: emailFrom },
          to: [{ email: to }],
          subject: subject,
          textContent: text,
          htmlContent: html,
        });
        return {
          success: true,
          provider: "brevo",
          messageId: "brevo-success",
          status: "sent"
        };
      } catch (error) {
        const statusCode = error.statusCode || error.status || 500;
        const errMsg = error.body?.message || error.message || 'Unknown Brevo error';
        const maskedEmail = to.replace(/^(.)(.*)(@.*)$/, (_, a, b, c) => a + '*'.repeat(b.length) + c);
        console.error(`[EmailService] Provider: Brevo | Status Code: ${statusCode} | Error Message: ${errMsg} | Recipient: ${maskedEmail}`);
        return {
          success: false,
          provider: "brevo",
          statusCode: statusCode,
          message: errMsg
        };
      }
    }
  }

  static async sendRegistrationSuccess(email, name) {
    const template = welcomeTemplate(name);
    const res = await this.sendEmail(email, template.subject, template.text, template.html);
    return res.success;
  }

  static async sendOtp(email, otp, type = 'login') {
    let template;
    if (type === 'forgot_password' || type === 'password_reset') {
      template = forgotPasswordOtpTemplate(otp);
    } else if (type === 'register') {
      template = registerOtpTemplate(otp);
    } else {
      template = loginOtpTemplate(otp);
    }

    const res = await this.sendEmail(email, template.subject, template.text, template.html);
    return res.success;
  }

  static async sendResetPasswordSuccess(email) {
    const template = resetPasswordSuccessTemplate();
    const res = await this.sendEmail(email, template.subject, template.text, template.html);
    return res.success;
  }

  static async sendIntruderAlert(adminEmail, timestamp, location) {
    const subject = "🚨 AttendAI SECURITY ALERT: Unauthorized Access Detected";
    
    const textBody = `SECURITY THREAT LEVEL: HIGH\n\nAn unauthorized intruder attempt was flagged at ${timestamp} on Location/Camera ${location}.\nPlease log in to the administrator portal to review threat intelligence logs immediately.\n\nAttendAI Security Grid`;

    const htmlBody = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AttendAI Intruder Alert</title>
    <style>
        body { background-color: #0A0E21; color: #FFFFFF; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; }
        .container { max-width: 500px; margin: 40px auto; background: linear-gradient(135deg, #1C0A0A 0%, #0F0505 100%); border: 2px solid #EF4444; border-radius: 20px; overflow: hidden; box-shadow: 0 0 30px rgba(239, 68, 68, 0.3); }
        .header { background: #EF4444; color: #000000; padding: 20px; text-align: center; font-weight: 800; font-size: 20px; letter-spacing: 2px; }
        .content { padding: 30px; text-align: center; }
        .alert-box { background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 12px; padding: 20px; margin: 20px 0; text-align: left; }
        .alert-item { margin-bottom: 10px; font-size: 14px; color: #FCA5A5; }
        .cta-btn { background: #EF4444; color: #FFFFFF !important; padding: 14px 28px; font-weight: bold; text-decoration: none; border-radius: 10px; display: inline-block; margin-top: 15px; box-shadow: 0 5px 15px rgba(239, 68, 68, 0.4); }
        .footer { background: #0F0505; padding: 15px; text-align: center; font-size: 11px; color: #7F1D1D; border-top: 1px solid rgba(239, 68, 68, 0.1); }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">🚨 INTRUSION ALERT DETECTION</div>
        <div class="content">
            <h3 style="color: #EF4444; margin-top: 0;">Unrecognized Identity Pattern Flagged</h3>
            <p style="color: #E2E8F0; font-size: 14px; line-height: 1.5;">Our smart neural video analytics stream has captured an unauthorized face recognition scan trying to authenticate credentials.</p>
            <div class="alert-box">
                <div class="alert-item"><strong>🕒 System Timestamp:</strong> ${timestamp}</div>
                <div class="alert-item"><strong>📹 Device / Node ID:</strong> Location ${location}</div>
                <div class="alert-item"><strong>⚠️ Severity:</strong> High (Intruder Profile)</div>
            </div>
            <a href="https://attendai.campus/admin" class="cta-btn">Access Security Control Grid</a>
        </div>
        <div class="footer">
            <p>AttendAI Tactical Defense Systems. Automated threat mitigation is active.</p>
        </div>
    </div>
</body>
</html>`;

    await this.sendEmail(adminEmail, subject, textBody, htmlBody);
  }

  static async sendLeaveStatusUpdate(email, status, remarks) {
    const subject = `AttendAI Leave Management: Request ${status}`;
    
    const textBody = `AttendAI Leave Authorization System\n\nYour leave request has been evaluated and updated to: ${status}.\nRemarks: ${remarks}\n\nReview details on your mobile student portal.`;

    const isApproved = status.toUpperCase() === 'APPROVED';
    const htmlBody = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AttendAI Leave Update</title>
    <style>
        body { background-color: #0A0E21; color: #FFFFFF; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; }
        .container { max-width: 500px; margin: 40px auto; background: linear-gradient(135deg, #1A1F38 0%, #0F142C 100%); border: 1px solid rgba(255, 215, 0, 0.2); border-radius: 20px; overflow: hidden; box-shadow: 0 15px 35px rgba(0, 0, 0, 0.5); }
        .header { background: #050714; padding: 25px; text-align: center; border-bottom: 2px solid #FFD700; }
        .logo { color: #FFD700; font-size: 22px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; margin: 0; }
        .content { padding: 35px 30px; }
        .status-badge { display: inline-block; padding: 8px 18px; font-weight: bold; font-size: 14px; border-radius: 20px; margin-bottom: 20px; background: ${isApproved ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'}; color: ${isApproved ? '#10B981' : '#EF4444'}; border: 1px solid ${isApproved ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}; }
        .remarks-box { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 12px; padding: 15px; margin: 20px 0; color: #E2E8F0; font-size: 14px; }
        .footer { background: #050714; padding: 20px; text-align: center; font-size: 11px; color: #718096; border-top: 1px solid rgba(255, 255, 255, 0.05); }
    </style>
</head>
<body>
    <div class="container">
        <div class="header"><h1 class="logo">⚡ AttendAI ACADEMICS</h1></div>
        <div class="content">
            <h3 style="color: #FFFFFF; margin-top: 0; font-weight: 600;">Leave Application Decision</h3>
            <p style="color: #A0AEC0; font-size: 14px; margin-bottom: 10px;">The Academic Administration Board has updated the status of your authorization request:</p>
            <div class="status-badge">${status.toUpperCase()}</div>
            <div class="remarks-box">
                <strong>📝 Administrator Remarks:</strong><br>
                <span style="font-style: italic; color: #CBD5E0; display: inline-block; margin-top: 8px;">"${remarks}"</span>
            </div>
            <p style="color: #718096; font-size: 12px; margin-top: 25px; line-height: 1.4;">Please refer to your mobile application's leave log for full detailed breakdown and any academic rescheduling.</p>
        </div>
        <div class="footer"><p>© 2026 AttendAI Academic Operations Center</p></div>
    </div>
</body>
</html>`;

    await this.sendEmail(email, subject, textBody, htmlBody);
  }

  static async sendSuspiciousLoginAlert(email, ip, timestamp) {
    const subject = "⚠️ SECURITY ALERT: Suspicious Login Detected";
    const textBody = `Hello,\n\nA suspicious login attempt was detected on your SmartFace AI account.\nIP Address: ${ip}\nTime: ${timestamp}\n\nIf this wasn't you, please reset your password immediately or contact campus support.\n\nBest regards,\nSmartFace Security Team`;
    await this.sendEmail(email, subject, textBody, textBody);
  }

  static async sendNewDeviceLoginAlert(email, device, ip, timestamp) {
    const subject = "📱 SECURITY ALERT: New Device Login";
    const textBody = `Hello,\n\nYour SmartFace AI account was logged into from a new device.\nDevice: ${device}\nIP Address: ${ip}\nTime: ${timestamp}\n\nIf this was you, you can safely ignore this email. If not, revoke this session from your active devices profile screen immediately.\n\nBest regards,\nSmartFace Security Team`;
    await this.sendEmail(email, subject, textBody, textBody);
  }
}

module.exports = EmailService;
