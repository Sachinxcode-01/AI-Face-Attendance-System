import os
from aiosmtplib import send
from email.message import EmailMessage
from dotenv import load_dotenv

load_dotenv()

class EmailService:
    @staticmethod
    async def send_email(to_email: str, subject: str, text_body: str, html_body: str):
        message = EmailMessage()
        message["From"] = os.getenv("EMAIL_USER")
        message["To"] = to_email
        message["Subject"] = subject
        
        # Set plain-text body
        message.set_content(text_body)
        
        # Add HTML alternative for modern mail clients
        message.add_alternative(html_body, subtype="html")

        try:
            await send(
                message,
                hostname=os.getenv("SMTP_SERVER"),
                port=int(os.getenv("SMTP_PORT")),
                username=os.getenv("EMAIL_USER"),
                password=os.getenv("EMAIL_PASSWORD"),
                start_tls=True,
            )
            return True
        except Exception as e:
            print(f"Failed to send email to {to_email}: {e}")
            return False

    @staticmethod
    async def send_registration_success(email: str, name: str):
        subject = "Welcome to AttendAI — Your Smart Campus Access is Ready"
        
        text_body = (
            f"Hello {name},\n\n"
            f"Welcome to AttendAI! Your account has been successfully created. You can now proceed with your biometric face registration on the mobile app.\n\n"
            f"Key features available to you:\n"
            f"- Face Recognition Attendance\n"
            f"- QR + Face Verification\n"
            f"- Attendance Reports & Streaks\n"
            f"- AI Attendance Insights\n"
            f"- Live Leave Management\n"
            f"- Real-Time Push Notifications\n\n"
            f"Best regards,\n"
            f"AttendAI Security Team"
        )
        
        html_body = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to AttendAI</title>
    <style>
        body {{
            background-color: #0A0E21;
            color: #FFFFFF;
            font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 0;
            -webkit-text-size-adjust: none;
            -ms-text-size-adjust: none;
        }}
        .container {{
            max-width: 600px;
            margin: 40px auto;
            background: linear-gradient(135deg, #1A1F38 0%, #0F142C 100%);
            border: 1px solid rgba(255, 215, 0, 0.2);
            border-radius: 24px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6), 0 0 50px rgba(255, 215, 0, 0.05);
        }}
        .header {{
            background: linear-gradient(to right, #1D2671, #C33764);
            padding: 40px 20px;
            text-align: center;
            border-bottom: 2px solid #FFD700;
        }}
        .logo {{
            color: #FFD700;
            font-size: 28px;
            font-weight: 800;
            letter-spacing: 2px;
            text-transform: uppercase;
            margin: 0;
            text-shadow: 0 0 10px rgba(255, 215, 0, 0.4);
        }}
        .content {{
            padding: 40px 30px;
        }}
        .greeting {{
            font-size: 22px;
            color: #FFD700;
            margin-top: 0;
            font-weight: 700;
        }}
        .intro {{
            font-size: 16px;
            line-height: 1.6;
            color: #E2E8F0;
        }}
        .features-grid {{
            margin: 30px 0;
            display: table;
            width: 100%;
        }}
        .feature-row {{
            display: table-row;
        }}
        .feature-card {{
            display: table-cell;
            width: 50%;
            padding: 15px;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            margin: 8px;
            vertical-align: top;
        }}
        .feature-title {{
            color: #FFD700;
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 5px;
        }}
        .feature-desc {{
            color: #A0AEC0;
            font-size: 12px;
            line-height: 1.4;
        }}
        .cta-container {{
            text-align: center;
            margin: 35px 0;
        }}
        .cta-btn {{
            background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
            color: #0A0E21 !important;
            padding: 16px 36px;
            font-weight: bold;
            font-size: 16px;
            text-decoration: none;
            border-radius: 14px;
            display: inline-block;
            box-shadow: 0 8px 20px rgba(255, 215, 0, 0.3);
            text-shadow: none;
            transition: all 0.3s ease;
        }}
        .security-note {{
            background: rgba(255, 0, 0, 0.05);
            border-left: 4px solid #FF3366;
            padding: 15px;
            border-radius: 8px;
            font-size: 13px;
            color: #F87171;
            margin-top: 30px;
        }}
        .footer {{
            background: #050714;
            padding: 25px;
            text-align: center;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
            font-size: 12px;
            color: #718096;
        }}
        .footer a {{
            color: #FFD700;
            text-decoration: none;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="logo">⚡ AttendAI</h1>
            <div style="color: #E2E8F0; font-size: 12px; margin-top: 8px; letter-spacing: 1px;">SMART CAMPUS IDENTITY SUITE</div>
        </div>
        <div class="content">
            <h2 class="greeting">Welcome to the Future, {name}!</h2>
            <p class="intro">Your high-security smart attendance credential is ready for authorization. We are thrilled to welcome you to <strong>AttendAI</strong>, our state-of-the-art neural campus ecosystem.</p>
            
            <p class="intro" style="margin-top: 20px; font-weight: bold; color: #FFD700;">Here is a summary of features now at your fingertips:</p>
            
            <div class="features-grid">
                <div class="feature-row">
                    <div class="feature-card">
                        <div class="feature-title">👁️ Biometric Verification</div>
                        <div class="feature-desc">Fast face recognition using local deep neural maps. Secure and instantaneous.</div>
                    </div>
                    <div class="feature-card">
                        <div class="feature-title">🔑 Dynamic Session QR</div>
                        <div class="feature-desc">Anti-spoofing rotating security codes synced in real-time with classroom beacons.</div>
                    </div>
                </div>
                <div class="feature-row">
                    <div class="feature-card">
                        <div class="feature-title">📈 AI Analytics Hub</div>
                        <div class="feature-desc">Deep performance tracking, predictive analytics, and streak logs to optimize your academic status.</div>
                    </div>
                    <div class="feature-card">
                        <div class="feature-title">📩 Intelligent Leaves</div>
                        <div class="feature-desc">Submit digital leave slips and track dean authorization instantly on your dashboard.</div>
                    </div>
                </div>
            </div>

            <div class="cta-container">
                <a href="https://attendai.campus" class="cta-btn">Authorize Setup Wizard</a>
            </div>

            <div class="security-note">
                <strong>🔒 Security and Privacy Assurance</strong><br>
                All biometric representations are securely hashed locally on your device and encrypted. We do not store raw images, ensuring 100% data confidentiality under modern safety compliance rules.
            </div>
        </div>
        <div class="footer">
            <p>© 2026 AttendAI Platforms Inc. All campus systems are fully monitored.</p>
            <p>Need support? Contact our technical response team at <a href="mailto:support@attendai.campus">support@attendai.campus</a></p>
        </div>
    </div>
</body>
</html>"""
        await EmailService.send_email(email, subject, text_body, html_body)

    @staticmethod
    async def send_otp(email: str, otp: str):
        subject = "AttendAI Security: One-Time Verification Passcode"
        
        text_body = (
            f"AttendAI Security Authorization\n\n"
            f"Your secure passcode to authorize access or reset credentials is: {otp}\n\n"
            f"This code will expire in 5 minutes. If you did not request this, please change your security settings immediately.\n\n"
            f"Best regards,\n"
            f"AttendAI Core Security"
        )
        
        html_body = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AttendAI Verification Code</title>
    <style>
        body {{
            background-color: #0A0E21;
            color: #FFFFFF;
            font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 0;
        }}
        .container {{
            max-width: 500px;
            margin: 40px auto;
            background: linear-gradient(135deg, #1A1F38 0%, #0F142C 100%);
            border: 1px solid rgba(255, 215, 0, 0.25);
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.5);
        }}
        .header {{
            background: #050714;
            padding: 25px;
            text-align: center;
            border-bottom: 1px solid rgba(255, 215, 0, 0.15);
        }}
        .logo {{
            color: #FFD700;
            font-size: 22px;
            font-weight: 800;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            margin: 0;
        }}
        .content {{
            padding: 35px 30px;
            text-align: center;
        }}
        .title {{
            font-size: 20px;
            color: #FFFFFF;
            margin-top: 0;
            font-weight: 600;
        }}
        .code-container {{
            background: rgba(255, 215, 0, 0.05);
            border: 2px dashed rgba(255, 215, 0, 0.3);
            border-radius: 16px;
            padding: 20px;
            margin: 25px auto;
            max-width: 250px;
            box-shadow: 0 0 15px rgba(255, 215, 0, 0.05);
        }}
        .code-digits {{
            font-family: 'Courier New', Courier, monospace;
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 6px;
            color: #FFD700;
            margin: 0;
            text-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
        }}
        .timer-warning {{
            color: #EF4444;
            font-size: 13px;
            margin-top: 15px;
            font-weight: bold;
        }}
        .footer {{
            background: #050714;
            padding: 20px;
            text-align: center;
            font-size: 11px;
            color: #718096;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
        }}
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
                <div class="code-digits">{otp}</div>
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
</html>"""
        await EmailService.send_email(email, subject, text_body, html_body)

    @staticmethod
    async def send_intruder_alert(admin_email: str, timestamp: str, camera_id: str):
        subject = "🚨 AttendAI SECURITY ALERT: Unauthorized Access Detected"
        
        text_body = (
            f"SECURITY THREAT LEVEL: HIGH\n\n"
            f"An unauthorized intruder attempt was flagged at {timestamp} on Camera {camera_id}.\n"
            f"Please log in to the administrator portal to review threat intelligence logs immediately.\n\n"
            f"AttendAI Security Grid"
        )
        
        html_body = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AttendAI Intruder Alert</title>
    <style>
        body {{
            background-color: #0A0E21;
            color: #FFFFFF;
            font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 0;
        }}
        .container {{
            max-width: 500px;
            margin: 40px auto;
            background: linear-gradient(135deg, #1C0A0A 0%, #0F0505 100%);
            border: 2px solid #EF4444;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 0 30px rgba(239, 68, 68, 0.3);
        }}
        .header {{
            background: #EF4444;
            color: #000000;
            padding: 20px;
            text-align: center;
            font-weight: 800;
            font-size: 20px;
            letter-spacing: 2px;
        }}
        .content {{
            padding: 30px;
            text-align: center;
        }}
        .alert-box {{
            background: rgba(239, 68, 68, 0.05);
            border: 1px solid rgba(239, 68, 68, 0.3);
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
            text-align: left;
        }}
        .alert-item {{
            margin-bottom: 10px;
            font-size: 14px;
            color: #FCA5A5;
        }}
        .cta-btn {{
            background: #EF4444;
            color: #FFFFFF !important;
            padding: 14px 28px;
            font-weight: bold;
            text-decoration: none;
            border-radius: 10px;
            display: inline-block;
            margin-top: 15px;
            box-shadow: 0 5px 15px rgba(239, 68, 68, 0.4);
        }}
        .footer {{
            background: #0F0505;
            padding: 15px;
            text-align: center;
            font-size: 11px;
            color: #7F1D1D;
            border-top: 1px solid rgba(239, 68, 68, 0.1);
        }}
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
                <div class="alert-item"><strong>🕒 System Timestamp:</strong> {timestamp}</div>
                <div class="alert-item"><strong>📹 Device / Node ID:</strong> Camera {camera_id}</div>
                <div class="alert-item"><strong>⚠️ Severity:</strong> High (Intruder Profile)</div>
            </div>

            <a href="https://attendai.campus/admin" class="cta-btn">Access Security Control Grid</a>
        </div>
        <div class="footer">
            <p>AttendAI Tactical Defense Systems. Automated threat mitigation is active.</p>
        </div>
    </div>
</body>
</html>"""
        await EmailService.send_email(admin_email, subject, text_body, html_body)

    @staticmethod
    async def send_leave_status_update(email: str, status: str, remarks: str):
        subject = f"AttendAI Leave Management: Request {status}"
        
        text_body = (
            f"AttendAI Leave Authorization System\n\n"
            f"Your leave request has been evaluated and update to: {status}.\n"
            f"Remarks: {remarks}\n\n"
            f"Review details on your mobile student portal."
        )
        
        html_body = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AttendAI Leave Update</title>
    <style>
        body {{
            background-color: #0A0E21;
            color: #FFFFFF;
            font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 0;
        }}
        .container {{
            max-width: 500px;
            margin: 40px auto;
            background: linear-gradient(135deg, #1A1F38 0%, #0F142C 100%);
            border: 1px solid rgba(255, 215, 0, 0.2);
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.5);
        }}
        .header {{
            background: #050714;
            padding: 25px;
            text-align: center;
            border-bottom: 2px solid #FFD700;
        }}
        .logo {{
            color: #FFD700;
            font-size: 22px;
            font-weight: 800;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            margin: 0;
        }}
        .content {{
            padding: 35px 30px;
        }}
        .status-badge {{
            display: inline-block;
            padding: 8px 18px;
            font-weight: bold;
            font-size: 14px;
            border-radius: 20px;
            margin-bottom: 20px;
            background: { 'rgba(16, 185, 129, 0.15)' if status.upper() == 'APPROVED' else 'rgba(239, 68, 68, 0.15)' };
            color: { '#10B981' if status.upper() == 'APPROVED' else '#EF4444' };
            border: 1px solid { 'rgba(16, 185, 129, 0.3)' if status.upper() == 'APPROVED' else 'rgba(239, 68, 68, 0.3)' };
        }}
        .remarks-box {{
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            padding: 15px;
            margin: 20px 0;
            color: #E2E8F0;
            font-size: 14px;
        }}
        .footer {{
            background: #050714;
            padding: 20px;
            text-align: center;
            font-size: 11px;
            color: #718096;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
        }}
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
                {status.upper()}
            </div>

            <div class="remarks-box">
                <strong>📝 Administrator Remarks:</strong><br>
                <span style="font-style: italic; color: #CBD5E0; display: inline-block; margin-top: 8px;">"{remarks}"</span>
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
</html>"""
        await EmailService.send_email(email, subject, text_body, html_body)
