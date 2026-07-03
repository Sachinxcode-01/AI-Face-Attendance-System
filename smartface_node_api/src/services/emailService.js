const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

const SMTP_SERVER = process.env.SMTP_SERVER || "smtp.gmail.com";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587", 10);
const EMAIL_USER = process.env.EMAIL_USER || process.env.ADMIN_EMAIL;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;

class EmailService {
  static getTransporter() {
    return nodemailer.createTransport({
      host: SMTP_SERVER,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465, // true for 465, false for other ports
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  static async sendEmail(toEmail, subject, textBody, htmlBody) {
    if (process.env.NODE_ENV === 'test' || !EMAIL_PASSWORD || EMAIL_PASSWORD.trim() === '') {
      console.log(`[Email Mock] to: ${toEmail} | subject: ${subject}`);
      return true;
    }
    try {
      const transporter = this.getTransporter();
      await transporter.sendMail({
        from: `AttendAI Security <${EMAIL_USER}>`,
        to: toEmail,
        subject: subject,
        text: textBody,
        html: htmlBody,
      });
      return true;
    } catch (error) {
      console.error(`Failed to send email to ${toEmail}:`, error);
      return false;
    }
  }

  static async sendRegistrationSuccess(email, name) {
    const subject = "Welcome to SmartFace Elite — Your Smart Campus Access is Ready";
    
    const textBody = `Hello ${name},

Welcome to SmartFace Elite! Your account has been successfully created. You can now proceed with your biometric face registration on the mobile app.

Key features available to you:
- High-Fidelity Biometric Face Scanner
- Dynamic Rotating Session QR
- Real-Time Attendance Analytics
- Advanced Leave Management Suite
- Cyber Intruder Threat Logs

Best regards,
SmartFace Security Team`;

    const htmlBody = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to SmartFace Elite</title>
    <style>
        body {
            background-color: #040613;
            color: #FFFFFF;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 40px auto;
            background: linear-gradient(135deg, #070B1A 0%, #030510 100%);
            border: 1px solid rgba(255, 179, 0, 0.25);
            border-radius: 28px;
            overflow: hidden;
            box-shadow: 0 30px 60px rgba(0, 0, 0, 0.8), 0 0 50px rgba(255, 179, 0, 0.04);
        }
        .header {
            background: linear-gradient(135deg, #090E25 0%, #030510 100%);
            padding: 50px 20px;
            text-align: center;
            border-bottom: 2px solid #FFB300;
            position: relative;
        }
        .logo {
            color: #FFB300;
            font-size: 32px;
            font-weight: 900;
            letter-spacing: 5px;
            text-transform: uppercase;
            margin: 0;
            text-shadow: 0 0 20px rgba(255, 179, 0, 0.5);
        }
        .tagline {
            color: #8A99AD;
            font-size: 11px;
            margin-top: 10px;
            letter-spacing: 3px;
            font-weight: 700;
            text-transform: uppercase;
        }
        .content {
            padding: 45px 35px;
        }
        .greeting {
            font-size: 24px;
            color: #FFB300;
            margin-top: 0;
            font-weight: 800;
        }
        .intro {
            font-size: 15px;
            line-height: 1.65;
            color: #E2E8F0;
        }
        .step-container {
            margin: 35px 0;
        }
        .step-card {
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.04);
            border-radius: 18px;
            padding: 20px;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
        }
        .step-number {
            background: linear-gradient(135deg, #FFB300 0%, #FF8F00 100%);
            color: #000000;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 800;
            font-size: 14px;
            margin-right: 18px;
            flex-shrink: 0;
            box-shadow: 0 4px 10px rgba(255, 179, 0, 0.3);
        }
        .step-details {
            flex-grow: 1;
        }
        .step-title {
            color: #FFFFFF;
            font-weight: 700;
            font-size: 14px;
            margin-bottom: 4px;
        }
        .step-desc {
            color: #8A99AD;
            font-size: 12px;
            line-height: 1.4;
        }
        .cta-container {
            text-align: center;
            margin: 40px 0 20px 0;
        }
        .cta-btn {
            background: linear-gradient(135deg, #FFB300 0%, #FF8F00 100%);
            color: #040613 !important;
            padding: 18px 42px;
            font-weight: 800;
            font-size: 15px;
            text-decoration: none;
            border-radius: 18px;
            display: inline-block;
            box-shadow: 0 12px 24px rgba(255, 179, 0, 0.25);
            letter-spacing: 1px;
            text-transform: uppercase;
        }
        .privacy-box {
            background: rgba(16, 185, 129, 0.03);
            border-left: 4px solid #10B981;
            padding: 18px;
            border-radius: 12px;
            font-size: 13px;
            color: #A7F3D0;
            line-height: 1.5;
            margin-top: 35px;
        }
        .footer {
            background: #02030A;
            padding: 30px;
            text-align: center;
            border-top: 1px solid rgba(255, 255, 255, 0.04);
            font-size: 11px;
            color: #4A5568;
            line-height: 1.6;
        }
        .footer a {
            color: #FFB300;
            text-decoration: none;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="logo">⚡ SMARTFACE ELITE</h1>
            <div class="tagline">Next-Gen Biometric Campus Identity</div>
        </div>
        <div class="content">
            <h2 class="greeting">Welcome to the Network, ${name}!</h2>
            <p class="intro">Your credentials have been generated successfully. You are now ready to activate your <strong>SmartFace Elite</strong> security profile and join our precision smart campus grid.</p>
            
            <div class="step-container">
                <div class="step-card">
                    <div class="step-number">1</div>
                    <div class="step-details">
                        <div class="step-title">Verify System Profile</div>
                        <div class="step-desc">Enter your institutional USN/ID, department details, and academic class parameters on the Setup Wizard.</div>
                    </div>
                </div>
                <div class="step-card">
                    <div class="step-number">2</div>
                    <div class="step-details">
                        <div class="step-title">Register Biometric face ID</div>
                        <div class="step-desc">Utilize your mobile device's camera for local face scans to generate secure 128-d neural embeddings.</div>
                    </div>
                </div>
                <div class="step-card">
                    <div class="step-number">3</div>
                    <div class="step-details">
                        <div class="step-title">Enter Dashboard Nexus</div>
                        <div class="step-desc">Track real-time session updates, check-in using secure rotating QR codes, and review leave records.</div>
                    </div>
                </div>
            </div>

            <div class="cta-container">
                <a href="https://smartface.elite/setup" class="cta-btn">Complete Setup Wizard</a>
            </div>

            <div class="privacy-box">
                <strong>🔒 Biometric Privacy Shield</strong><br>
                For absolute security, your facial structure is mapped into mathematical embeddings stored locally on your secure hardware signature. Raw photos are never uploaded or retained on the core network.
            </div>
        </div>
        <div class="footer">
            <p>© 2026 SmartFace Elite Platforms Inc. All system routes are fully monitored under local safety policies.</p>
            <p>Direct inquiries to the security response team at <a href="mailto:support@smartface.elite">support@smartface.elite</a></p>
        </div>
    </div>
</body>
</html>`;

    await this.sendEmail(email, subject, textBody, htmlBody);
  }

  static async sendOtp(email, otp) {
    const subject = "AttendAI Security: One-Time Verification Passcode";
    
    const textBody = `AttendAI Security Authorization

Your secure passcode to authorize access or reset credentials is: ${otp}

This code will expire in 5 minutes. If you did not request this, please change your security settings immediately.

Best regards,
AttendAI Core Security`;

    const htmlBody = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AttendAI Verification Code</title>
    <style>
        body {
            background-color: #0A0E21;
            color: #FFFFFF;
            font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 500px;
            margin: 40px auto;
            background: linear-gradient(135deg, #1A1F38 0%, #0F142C 100%);
            border: 1px solid rgba(255, 215, 0, 0.25);
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.5);
        }
        .header {
            background: #050714;
            padding: 25px;
            text-align: center;
            border-bottom: 1px solid rgba(255, 215, 0, 0.15);
        }
        .logo {
            color: #FFD700;
            font-size: 22px;
            font-weight: 800;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            margin: 0;
        }
        .content {
            padding: 35px 30px;
            text-align: center;
        }
        .title {
            font-size: 20px;
            color: #FFFFFF;
            margin-top: 0;
            font-weight: 600;
        }
        .code-container {
            background: rgba(255, 215, 0, 0.05);
            border: 2px dashed rgba(255, 215, 0, 0.3);
            border-radius: 16px;
            padding: 20px;
            margin: 25px auto;
            max-width: 250px;
            box-shadow: 0 0 15px rgba(255, 215, 0, 0.05);
        }
        .code-digits {
            font-family: 'Courier New', Courier, monospace;
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 6px;
            color: #FFD700;
            margin: 0;
            text-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
        }
        .timer-warning {
            color: #EF4444;
            font-size: 13px;
            margin-top: 15px;
            font-weight: bold;
        }
        .footer {
            background: #050714;
            padding: 20px;
            text-align: center;
            font-size: 11px;
            color: #718096;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="logo">⚡ AttendAI SECURITY</h1>
        </div>
        <div class="content">
            <h2 class="title">Secure One-Time Passcode</h2>
            <p style="color: #E2E8F0; font-size: 15px; line-height: 1.5; margin: 0;">Use the verification token below to authorize your active session or reset credentials:</p>
            
            <div class="code-container">
                <div class="code-digits">${otp}</div>
            </div>
            
            <div class="timer-warning">
                ⏳ This security passcode will expire in 5 minutes
            </div>
            
            <p style="color: #718096; font-size: 12px; margin-top: 25px; line-height: 1.4;">
                If you did not request this authorization, a security audit trigger has logged this action. Please safeguard your account.
            </p>
        </div>
        <div class="footer">
            <p>© 2026 AttendAI Security Operations Center</p>
        </div>
    </div>
</body>
</html>`;

    await this.sendEmail(email, subject, textBody, htmlBody);
  }

  static async sendIntruderAlert(adminEmail, timestamp, location) {
    const subject = "🚨 AttendAI SECURITY ALERT: Unauthorized Access Detected";
    
    const textBody = `SECURITY THREAT LEVEL: HIGH

An unauthorized intruder attempt was flagged at ${timestamp} on Location/Camera ${location}.
Please log in to the administrator portal to review threat intelligence logs immediately.

AttendAI Security Grid`;

    const htmlBody = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AttendAI Intruder Alert</title>
    <style>
        body {
            background-color: #0A0E21;
            color: #FFFFFF;
            font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 500px;
            margin: 40px auto;
            background: linear-gradient(135deg, #1C0A0A 0%, #0F0505 100%);
            border: 2px solid #EF4444;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 0 30px rgba(239, 68, 68, 0.3);
        }
        .header {
            background: #EF4444;
            color: #000000;
            padding: 20px;
            text-align: center;
            font-weight: 800;
            font-size: 20px;
            letter-spacing: 2px;
        }
        .content {
            padding: 30px;
            text-align: center;
        }
        .alert-box {
            background: rgba(239, 68, 68, 0.05);
            border: 1px solid rgba(239, 68, 68, 0.3);
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
            text-align: left;
        }
        .alert-item {
            margin-bottom: 10px;
            font-size: 14px;
            color: #FCA5A5;
        }
        .cta-btn {
            background: #EF4444;
            color: #FFFFFF !important;
            padding: 14px 28px;
            font-weight: bold;
            text-decoration: none;
            border-radius: 10px;
            display: inline-block;
            margin-top: 15px;
            box-shadow: 0 5px 15px rgba(239, 68, 68, 0.4);
        }
        .footer {
            background: #0F0505;
            padding: 15px;
            text-align: center;
            font-size: 11px;
            color: #7F1D1D;
            border-top: 1px solid rgba(239, 68, 68, 0.1);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            🚨 INTRUSION ALERT DETECTION
        </div>
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
    
    const textBody = `AttendAI Leave Authorization System

Your leave request has been evaluated and updated to: ${status}.
Remarks: ${remarks}

Review details on your mobile student portal.`;

    const isApproved = status.toUpperCase() === 'APPROVED';
    const htmlBody = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AttendAI Leave Update</title>
    <style>
        body {
            background-color: #0A0E21;
            color: #FFFFFF;
            font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 500px;
            margin: 40px auto;
            background: linear-gradient(135deg, #1A1F38 0%, #0F142C 100%);
            border: 1px solid rgba(255, 215, 0, 0.2);
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.5);
        }
        .header {
            background: #050714;
            padding: 25px;
            text-align: center;
            border-bottom: 2px solid #FFD700;
        }
        .logo {
            color: #FFD700;
            font-size: 22px;
            font-weight: 800;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            margin: 0;
        }
        .content {
            padding: 35px 30px;
        }
        .status-badge {
            display: inline-block;
            padding: 8px 18px;
            font-weight: bold;
            font-size: 14px;
            border-radius: 20px;
            margin-bottom: 20px;
            background: ${isApproved ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'};
            color: ${isApproved ? '#10B981' : '#EF4444'};
            border: 1px solid ${isApproved ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'};
        }
        .remarks-box {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            padding: 15px;
            margin: 20px 0;
            color: #E2E8F0;
            font-size: 14px;
        }
        .footer {
            background: #050714;
            padding: 20px;
            text-align: center;
            font-size: 11px;
            color: #718096;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="logo">⚡ AttendAI ACADEMICS</h1>
        </div>
        <div class="content">
            <h3 style="color: #FFFFFF; margin-top: 0; font-weight: 600;">Leave Application Decision</h3>
            <p style="color: #A0AEC0; font-size: 14px; margin-bottom: 10px;">The Academic Administration Board has updated the status of your authorization request:</p>
            
            <div class="status-badge">
                ${status.toUpperCase()}
            </div>

            <div class="remarks-box">
                <strong>📝 Administrator Remarks:</strong><br>
                <span style="font-style: italic; color: #CBD5E0; display: inline-block; margin-top: 8px;">"${remarks}"</span>
            </div>
            
            <p style="color: #718096; font-size: 12px; margin-top: 25px; line-height: 1.4;">
                Please refer to your mobile application's leave log for full detailed breakdown and any academic rescheduling.
            </p>
        </div>
        <div class="footer">
            <p>© 2026 AttendAI Academic Operations Center</p>
        </div>
    </div>
</body>
</html>`;

    await this.sendEmail(email, subject, textBody, htmlBody);
  }

  static async sendSuspiciousLoginAlert(email, ip, timestamp) {
    const subject = "⚠️ SECURITY ALERT: Suspicious Login Detected";
    const textBody = `Hello,

A suspicious login attempt was detected on your SmartFace AI account.
IP Address: ${ip}
Time: ${timestamp}

If this wasn't you, please reset your password immediately or contact campus support.

Best regards,
SmartFace Security Team`;
    await this.sendEmail(email, subject, textBody, textBody);
  }

  static async sendNewDeviceLoginAlert(email, device, ip, timestamp) {
    const subject = "📱 SECURITY ALERT: New Device Login";
    const textBody = `Hello,

Your SmartFace AI account was logged into from a new device.
Device: ${device}
IP Address: ${ip}
Time: ${timestamp}

If this was you, you can safely ignore this email. If not, revoke this session from your active devices profile screen immediately.

Best regards,
SmartFace Security Team`;
    await this.sendEmail(email, subject, textBody, textBody);
  }
}

module.exports = EmailService;
