const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const crypto = require('crypto');

const User = require('../models/User');
const Otp = require('../models/Otp');
const UserSession = require('../models/UserSession');
const AuthService = require('../services/authService');
const EmailService = require('../services/emailService');
const { authenticate } = require('../middleware/auth');
const { trackJob } = require('../utils/jobTracker');
const { limitRegister, limitOtpSend, limitOtpVerify, limitLoginPassword } = require('../middleware/rateLimiter');

const AttendanceAuditLog = require('../models/AttendanceAuditLog');

function formatAuthResponse(user, accessToken, refreshToken, message = "Success") {
  const wizardCompleted = user.setup_completed || user.biometric_registered || false;
  return {
    success: true,
    message: message,
    access_token: accessToken,
    refresh_token: refreshToken,
    token_type: "bearer",
    role: user.role,
    biometric_registered: user.biometric_registered || false,
    setup_completed: wizardCompleted,
    data: {
      accessToken: accessToken,
      refreshToken: refreshToken,
      user: {
        id: user._id ? user._id.toString() : (user.id || ""),
        name: user.full_name || "",
        email: user.email,
        role: user.role,
        introCompleted: true,
        wizardCompleted: wizardCompleted
      }
    }
  };
}

async function logSecurityEvent(email, role, action, details, req) {
  try {
    const ip = req ? (req.ip || req.headers['x-forwarded-for'] || '127.0.0.1') : '127.0.0.1';
    await AttendanceAuditLog.create({
      actor_email: email,
      role: role || 'unknown',
      action,
      details,
      ip_address: ip
    });
  } catch (err) {
    console.error("Audit log error:", err);
  }
}

async function registerSession(userId, accessToken, req) {
  try {
    const userAgent = req.headers['user-agent'] || 'Unknown Device';
    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    
    const tokenHash = crypto.createHash('sha256').update(accessToken).digest('hex');
    const refreshToken = crypto.randomBytes(32).toString('hex');
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    
    // Expiry is 7 days
    const expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    await UserSession.create({
      userId,
      device: userAgent,
      ip,
      location: "Local Network",
      tokenHash,
      refreshTokenHash,
      refreshTokenFamily: crypto.randomUUID(),
      expiry,
      created_at: new Date()
    });
    
    return refreshToken;
  } catch (err) {
    console.error("Session Registration Error:", err);
    throw err;
  }
}

// Configure Multer for temp/avatar storage
const avatarsDir = path.join(__dirname, '../../../data/avatars');
fs.mkdirSync(avatarsDir, { recursive: true });

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, avatarsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeEmail = req.userEmail.replace(/@/g, '_at_').replace(/\./g, '_');
    const timestamp = Math.floor(Date.now() / 1000);
    cb(null, `avatar_${safeEmail}_${timestamp}${ext}`);
  }
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.heic', '.heif'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (file.mimetype.startsWith('image/') || allowedTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, and WEBP images are accepted."));
    }
  }
});

// Configure Multer for student face dataset upload
const datasetDir = path.join(__dirname, '../../../data/dataset');
fs.mkdirSync(datasetDir, { recursive: true });

const datasetStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const email = req.query.student_email;
      const student = await User.findOne({ email });
      if (!student) {
        return cb(new Error("Student not found"));
      }
      const safeName = student.full_name.replace(/ /g, '_');
      const rollNo = student.student_id || '000';
      const folderName = `${safeName}_${rollNo}`;
      const studentFolder = path.join(datasetDir, folderName);
      fs.mkdirSync(studentFolder, { recursive: true });
      cb(null, studentFolder);
    } catch (err) {
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const datasetUpload = multer({
  storage: datasetStorage,
  fileFilter: (req, file, cb) => {
    const allowedExts = ['.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG or PNG images are allowed"));
    }
  }
});

// ─── POST /auth/register ──────────────────────────────────────────
router.post('/register', limitRegister, async (req, res) => {
  try {
    const { email, full_name, role, password } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ detail: "Email already registered" });
    }

    if (!password || password.length < 8) {
      return res.status(400).json({ detail: "Password must be at least 8 characters long." });
    }
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasDigit = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    if (!hasUpper || !hasLower || !hasDigit || !hasSpecial) {
      return res.status(400).json({ detail: "Password must contain uppercase, lowercase, numbers, and special characters." });
    }
    const emailPrefix = email.split('@')[0].toLowerCase();
    const weakPatterns = ['password', '12345', 'qwerty', 'smartface', emailPrefix];
    if (weakPatterns.some(p => password.toLowerCase().includes(p))) {
      return res.status(400).json({ detail: "Weak or common password pattern detected. Please use a stronger password." });
    }

    const hashedPassword = await AuthService.hashPassword(password);
    const newUser = new User({
      email,
      full_name,
      role: role.toLowerCase(),
      password: hashedPassword
    });

    await newUser.save();

    // Send Welcome Email in background
    trackJob(EmailService.sendRegistrationSuccess(email, full_name).catch(console.error));

    const response = newUser.toObject();
    delete response.password;
    response.id = response._id.toString();
    delete response._id;

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      id: response.id,
      email: response.email,
      full_name: response.full_name,
      role: response.role,
      data: {
        accessToken: null,
        refreshToken: null,
        user: {
          id: response.id,
          name: response.full_name,
          email: response.email,
          role: response.role,
          introCompleted: false,
          wizardCompleted: false
        }
      }
    });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// ─── POST /auth/login-otp/send ─────────────────────────────────────
router.post('/login-otp/send', limitOtpSend, async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ detail: "User not found" });
    }

    // OTP Resend Cooldown (60 seconds)
    const existing = await Otp.findOne({ email });
    if (existing) {
      const createdTime = existing.expiry.getTime() - 5 * 60 * 1000;
      const elapsed = (Date.now() - createdTime) / 1000;
      if (elapsed < 60) {
        return res.status(429).json({ detail: `Please wait ${Math.ceil(60 - elapsed)}s before requesting a new OTP.` });
      }
    }

    const otpVal = Array.from({ length: 6 }, () => Math.floor(Math.random() * 10)).join('');
    const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await Otp.updateOne(
      { email },
      { $set: { otp: otpVal, expiry, role: user.role, type: 'login', attempts: 0, deliveryStatus: 'pending' } },
      { upsert: true }
    );

    console.log(`Generated login OTP for email index hash`); // do not expose email or OTP in production logs

    // Send OTP email
    const emailSent = await EmailService.sendOtp(email, otpVal, 'login');
    if (!emailSent) {
      await Otp.updateOne({ email }, { $set: { deliveryStatus: 'failed' } });
      return res.status(400).json({
        success: false,
        message: "Email service failed. Please try again.",
        detail: "Email service failed. Please try again."
      });
    }

    await Otp.updateOne({ email }, { $set: { deliveryStatus: 'sent' } });

    res.json({
      success: true,
      message: "OTP sent successfully"
    });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// ─── POST /auth/login-otp/verify ──────────────────────────────────
router.post('/login-otp/verify', limitOtpVerify, async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    const record = await Otp.findOne({ email, type: 'login' });
    if (!record) {
      return res.status(401).json({ detail: "Invalid OTP" });
    }

    if (record.deliveryStatus === 'failed') {
      return res.status(401).json({ detail: "OTP delivery failed. Please request a new OTP." });
    }

    if (new Date() > record.expiry) {
      await Otp.deleteOne({ email });
      return res.status(401).json({ detail: "OTP expired" });
    }

    if (record.attempts >= 3) {
      await Otp.deleteOne({ email });
      await logSecurityEvent(email, record.role, 'LOGIN_FAILED', { reason: 'OTP max attempts exceeded' }, req);
      return res.status(401).json({ detail: "Too many failed attempts. OTP invalidated." });
    }

    if (record.otp !== otp) {
      record.attempts = (record.attempts || 0) + 1;
      await record.save();
      await logSecurityEvent(email, record.role, 'LOGIN_FAILED', { reason: 'Invalid OTP attempt', attempts: record.attempts }, req);
      return res.status(401).json({ detail: `Invalid OTP. ${3 - record.attempts} attempts remaining.` });
    }

    await Otp.deleteOne({ email });

    const user = await User.findOne({ email });
    const biometricRegistered = user ? user.biometric_registered : false;
    const role = user ? user.role : record.role;

    const token = AuthService.createAccessToken({ sub: email, role });
    const refreshToken = await registerSession(email, token, req);

    await logSecurityEvent(email, role, 'LOGIN_EVENT', { method: 'otp', device: req.headers['user-agent'] }, req);

    res.json(formatAuthResponse(user || { email, role, biometric_registered: biometricRegistered, setup_completed: biometricRegistered }, token, refreshToken, "OTP verified successfully"));
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// ─── POST /auth/login-password ────────────────────────────────────
router.post(['/login-password', '/login'], limitLoginPassword, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      // Return generic message and introduce slight delay to prevent timing analysis
      await new Promise(resolve => setTimeout(resolve, 1000));
      return res.status(401).json({ detail: "Invalid email or password" });
    }

    // Check account lockout
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      const waitSec = Math.ceil((user.lockoutUntil.getTime() - Date.now()) / 1000);
      return res.status(423).json({ detail: `Account locked due to too many failed attempts. Try again in ${waitSec}s.` });
    }

    if (!user.password || !(await AuthService.verifyPassword(password, user.password))) {
      // Increment failed attempts
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      
      // Calculate progressive delay: 1s, 2s, 4s, 8s, 16s... capped at 30s
      const delay = 1000 * Math.pow(2, user.failedLoginAttempts - 1);
      user.loginProgressiveDelay = Math.min(delay, 30000);

      // Lock account if attempts >= 5
      if (user.failedLoginAttempts >= 5) {
        user.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
        trackJob(EmailService.sendSuspiciousLoginAlert(user.email, req.ip || '127.0.0.1', new Date().toISOString()).catch(console.error));
      }

      await user.save();
      await logSecurityEvent(email, user.role, 'LOGIN_FAILED', { reason: 'Password mismatch', attempts: user.failedLoginAttempts }, req);
      
      // Wait for progressive delay
      await new Promise(resolve => setTimeout(resolve, user.loginProgressiveDelay));
      return res.status(401).json({ detail: "Invalid email or password" });
    }

    // Delay response if previously calculated delay exists
    if (user.loginProgressiveDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Reset lockout and failed attempts
    user.failedLoginAttempts = 0;
    user.loginProgressiveDelay = 0;
    user.lockoutUntil = null;
    await user.save();

    // Check for login from new device
    const userAgent = req.headers['user-agent'] || 'Unknown Device';
    const knownDevice = await UserSession.exists({ userId: email, device: userAgent });
    if (!knownDevice) {
      trackJob(EmailService.sendNewDeviceLoginAlert(email, userAgent, req.ip || '127.0.0.1', new Date().toISOString()).catch(console.error));
    }

    const token = AuthService.createAccessToken({ sub: email, role: user.role });
    const refreshToken = await registerSession(email, token, req);

    await logSecurityEvent(email, user.role, 'LOGIN_EVENT', { method: 'password', device: userAgent }, req);

    res.json(formatAuthResponse(user, token, refreshToken, "Login successful"));
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// ─── POST /auth/google ───────────────────────────────────────────
router.post('/google', async (req, res) => {
  try {
    let { email, name, role, avatar_url, idToken } = req.body;

    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    // Verify Google ID Token if present and client ID is configured
    if (idToken && googleClientId && googleClientId !== 'YOUR_GOOGLE_CLIENT_ID' && googleClientId !== 'your_google_client_id' && googleClientId !== 'your_production_google_client_id_here') {
      try {
        const { google } = require('googleapis');
        const client = new google.auth.OAuth2(googleClientId);
        const ticket = await client.verifyIdToken({
          idToken: idToken,
          audience: googleClientId,
        });
        const payload = ticket.getPayload();
        email = payload.email;
        name = payload.name;
        avatar_url = payload.picture;
      } catch (err) {
        console.error("Google ID Token verification failed:", err);
        return res.status(401).json({ detail: "Google ID Token verification failed: " + err.message });
      }
    }

    if (!email) {
      return res.status(400).json({ detail: "Email is required" });
    }

    let user = await User.findOne({ email });
    let biometricRegistered = false;
    let userRole = role ? role.toLowerCase() : 'student';

    if (!user) {
      user = new User({
        email,
        full_name: name || 'Google User',
        role: userRole,
        biometric_registered: false,
        avatar_url: avatar_url || null
      });
      await user.save();
      // Send Welcome Email in background
      trackJob(EmailService.sendRegistrationSuccess(email, name || 'Google User').catch(console.error));
    } else {
      userRole = user.role;
      biometricRegistered = user.biometric_registered;
      // Sync Google profile photo if not already set
      if (!user.avatar_url && avatar_url) {
        await User.updateOne({ email }, { $set: { avatar_url } });
      }
    }

    const token = AuthService.createAccessToken({ sub: email, role: userRole });
    const refreshToken = await registerSession(email, token, req);

    // New device check
    const userAgent = req.headers['user-agent'] || 'Unknown Device';
    const knownDevice = await UserSession.exists({ userId: email, device: userAgent });
    if (!knownDevice) {
      trackJob(EmailService.sendNewDeviceLoginAlert(email, userAgent, req.ip || '127.0.0.1', new Date().toISOString()).catch(console.error));
    }

    await logSecurityEvent(email, userRole, 'LOGIN_EVENT', { method: 'google', device: userAgent }, req);

    res.json(formatAuthResponse(user, token, refreshToken, "Google login successful"));
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// ─── GET /auth/github/callback ──────────────────────────────────────
router.get('/github/callback', (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).send("Authorization code is missing");
  }
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>GitHub Authentication - SmartFace</title>
      <style>
        body {
          background-color: #0F172A;
          color: #F8FAFC;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          margin: 0;
          padding: 20px;
          box-sizing: border-box;
        }
        .card {
          background-color: #1E293B;
          border: 1px solid #334155;
          padding: 30px;
          border-radius: 16px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
          max-width: 400px;
          width: 100%;
          text-align: center;
        }
        h2 {
          color: #38BDF8;
          margin-top: 0;
        }
        p {
          color: #94A3B8;
          font-size: 14px;
          line-height: 1.6;
        }
        .code-box {
          background-color: #020617;
          border: 1px solid #475569;
          padding: 14px;
          font-size: 18px;
          font-family: monospace;
          border-radius: 8px;
          margin: 20px 0;
          letter-spacing: 1.5px;
          color: #38BDF8;
          user-select: all;
          font-weight: bold;
        }
        .btn {
          background-color: #3B82F6;
          color: white;
          border: none;
          padding: 12px 24px;
          font-size: 14px;
          font-weight: 600;
          border-radius: 8px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        .btn:hover {
          background-color: #2563EB;
        }
        .copied-msg {
          color: #10B981;
          font-size: 12px;
          margin-top: 10px;
          display: none;
        }
      </style>
    </head>
    <body>
      <div class="card">
        <h2>Authentication Successful</h2>
        <p>SmartFace Attendance successfully connected with GitHub. Copy the verification code below and paste it back in the app to sign in.</p>
        <div class="code-box" id="authCode">${code}</div>
        <button class="btn" onclick="copyCode()">Copy Verification Code</button>
        <div class="copied-msg" id="copiedMsg">Code copied to clipboard!</div>
      </div>
      <script>
        function copyCode() {
          const codeEl = document.getElementById('authCode');
          navigator.clipboard.writeText(codeEl.innerText);
          const msg = document.getElementById('copiedMsg');
          msg.style.display = 'block';
          setTimeout(() => {
            msg.style.display = 'none';
          }, 3000);
        }
      </script>
    </body>
    </html>
  `);
});

// ─── POST /auth/github ───────────────────────────────────────────
router.post('/github', async (req, res) => {
  try {
    const { code, role } = req.body;
    if (!code) {
      return res.status(400).json({ detail: "Authorization code is required" });
    }

    const client_id = process.env.GITHUB_CLIENT_ID;
    const client_secret = process.env.GITHUB_CLIENT_SECRET;

    if (!client_id || !client_secret || client_id === 'your_github_client_id' || client_secret === 'your_github_client_secret') {
      // Fallback for tests/development: if code is "test_code", allow mock login/registration
      if (code === 'test_code' || process.env.NODE_ENV === 'test') {
        const mockEmail = 'mock-github-user@smartface.ai';
        let user = await User.findOne({ email: mockEmail });
        let userRole = role ? role.toLowerCase() : 'student';
        if (!user) {
          user = new User({
            email: mockEmail,
            full_name: 'Mock GitHub User',
            role: userRole,
            biometric_registered: false,
          });
          await user.save();
        } else {
          userRole = user.role;
        }
        const token = AuthService.createAccessToken({ sub: mockEmail, role: userRole });
        const refreshToken = await registerSession(mockEmail, token, req);
        return res.json(formatAuthResponse(user, token, refreshToken, "GitHub login successful"));
      }
      return res.status(400).json({ detail: "GitHub Auth is not configured on the server." });
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id,
        client_secret,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();
    if (tokenData.error) {
      return res.status(400).json({ detail: `GitHub OAuth error: ${tokenData.error_description || tokenData.error}` });
    }

    const accessToken = tokenData.access_token;
    if (!accessToken) {
      return res.status(400).json({ detail: "Failed to obtain access token from GitHub." });
    }

    // Fetch user profile
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'smartface-attendance-api',
      },
    });

    const userData = await userResponse.json();
    let email = userData.email;

    // If email is not public, fetch user emails
    if (!email) {
      const emailsResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': 'smartface-attendance-api',
        },
      });
      const emailsData = await emailsResponse.json();
      if (Array.isArray(emailsData)) {
        const primaryEmail = emailsData.find(e => e.primary && e.verified);
        email = primaryEmail ? primaryEmail.email : (emailsData[0] ? emailsData[0].email : null);
      }
    }

    if (!email) {
      return res.status(400).json({ detail: "Could not retrieve a verified email address from GitHub." });
    }

    let user = await User.findOne({ email });
    let biometricRegistered = false;
    let userRole = role ? role.toLowerCase() : 'student';

    if (!user) {
      user = new User({
        email,
        full_name: userData.name || userData.login || 'GitHub User',
        role: userRole,
        biometric_registered: false,
        avatar_url: userData.avatar_url || null,
      });
      await user.save();
      trackJob(EmailService.sendRegistrationSuccess(email, user.full_name).catch(console.error));
    } else {
      userRole = user.role;
      biometricRegistered = user.biometric_registered;
      if (!user.avatar_url && userData.avatar_url) {
        await User.updateOne({ email }, { $set: { avatar_url: userData.avatar_url } });
      }
    }

    const token = AuthService.createAccessToken({ sub: email, role: userRole });
    const refreshToken = await registerSession(email, token, req);

    const userAgent = req.headers['user-agent'] || 'Unknown Device';
    await logSecurityEvent(email, userRole, 'LOGIN_EVENT', { method: 'github', device: userAgent }, req);

    res.json(formatAuthResponse(user, token, refreshToken, "GitHub login successful"));
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// ─── POST /auth/forgot-password ──────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ detail: "User not found" });
    }

    // OTP Resend Cooldown (60 seconds)
    const existing = await Otp.findOne({ email });
    if (existing) {
      const createdTime = existing.expiry.getTime() - 5 * 60 * 1000;
      const elapsed = (Date.now() - createdTime) / 1000;
      if (elapsed < 60) {
        return res.status(429).json({ detail: `Please wait ${Math.ceil(60 - elapsed)}s before requesting a new OTP.` });
      }
    }

    const otpVal = Array.from({ length: 6 }, () => Math.floor(Math.random() * 10)).join('');
    const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await Otp.updateOne(
      { email },
      { $set: { otp: otpVal, expiry, role: user.role, type: 'password_reset', attempts: 0, deliveryStatus: 'pending' } },
      { upsert: true }
    );

    console.log(`Generated password reset OTP for email index hash`); // do not expose email in logs

    // Send OTP email
    const emailSent = await EmailService.sendOtp(email, otpVal, 'password_reset');
    if (!emailSent) {
      await Otp.updateOne({ email }, { $set: { deliveryStatus: 'failed' } });
      return res.status(400).json({
        success: false,
        message: "Email service failed. Please try again.",
        detail: "Email service failed. Please try again."
      });
    }

    await Otp.updateOne({ email }, { $set: { deliveryStatus: 'sent' } });

    res.json({
      success: true,
      message: "OTP sent to email"
    });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// ─── POST /auth/reset-password ────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, new_password } = req.body;

    const record = await Otp.findOne({ email, type: 'password_reset' });
    if (!record) {
      return res.status(401).json({ detail: "Invalid OTP" });
    }

    if (record.deliveryStatus === 'failed') {
      return res.status(401).json({ detail: "OTP delivery failed. Please request a new OTP." });
    }

    if (new Date() > record.expiry) {
      await Otp.deleteOne({ email });
      return res.status(401).json({ detail: "OTP expired" });
    }

    if (record.attempts >= 3) {
      await Otp.deleteOne({ email });
      await logSecurityEvent(email, record.role, 'PASSWORD_RESET_FAILED', { reason: 'OTP max attempts exceeded' }, req);
      return res.status(401).json({ detail: "Too many failed attempts. OTP invalidated." });
    }

    if (record.otp !== otp) {
      record.attempts = (record.attempts || 0) + 1;
      await record.save();
      await logSecurityEvent(email, record.role, 'PASSWORD_RESET_FAILED', { reason: 'Invalid OTP attempt', attempts: record.attempts }, req);
      return res.status(401).json({ detail: `Invalid OTP. ${3 - record.attempts} attempts remaining.` });
    }

    // Strong password validation
    if (!new_password || new_password.length < 8) {
      return res.status(400).json({ detail: "Password must be at least 8 characters long." });
    }
    const hasUpper = /[A-Z]/.test(new_password);
    const hasLower = /[a-z]/.test(new_password);
    const hasDigit = /[0-9]/.test(new_password);
    const hasSpecial = /[^A-Za-z0-9]/.test(new_password);
    if (!hasUpper || !hasLower || !hasDigit || !hasSpecial) {
      return res.status(400).json({ detail: "Password must contain uppercase, lowercase, numbers, and special characters." });
    }
    const emailPrefix = email.split('@')[0].toLowerCase();
    const weakPatterns = ['password', '12345', 'qwerty', 'smartface', emailPrefix];
    if (weakPatterns.some(p => new_password.toLowerCase().includes(p))) {
      return res.status(400).json({ detail: "Weak or common password pattern detected. Please use a stronger password." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ detail: "User not found" });
    }

    await Otp.deleteOne({ email });

    const hashedPassword = await AuthService.hashPassword(new_password);
    await User.updateOne({ email }, { $set: { password: hashedPassword } });

    // Send password reset success email
    trackJob(EmailService.sendResetPasswordSuccess(email).catch(console.error));

    await logSecurityEvent(email, user.role, 'PASSWORD_RESET', { status: 'success' }, req);

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

router.get(['/profile', '/me'], authenticate, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.userEmail }).lean();
    if (!user) {
      return res.status(404).json({ detail: "User not found" });
    }

    user.id = user._id.toString();
    delete user._id;
    delete user.password;

    const wizardCompleted = user.setup_completed || user.biometric_registered || false;
    res.json({
      success: true,
      message: "Profile retrieved successfully",
      ...user,
      data: {
        user: {
          id: user.id,
          name: user.full_name,
          email: user.email,
          role: user.role,
          introCompleted: true,
          wizardCompleted: wizardCompleted
        }
      }
    });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// ─── POST /auth/update-profile ────────────────────────────────────
router.post('/update-profile', authenticate, async (req, res) => {
  try {
    const updateFields = {};
    const allowedKeys = [
      'full_name', 'phone', 'department', 'dob', 'college', 'semester', 'student_id',
      'employee_id', 'designation', 'specialization', 'qualification', 'experience', 'gender', 'address',
      'usn', 'course', 'section', 'roll_number', 'parent_details', 'language_preference',
      'setup_completed', 'linked_children'
    ];
    
    allowedKeys.forEach(key => {
      if (req.body[key] !== undefined && req.body[key] !== null) {
        updateFields[key] = req.body[key];
      }
    });

    await User.updateOne({ email: req.userEmail }, { $set: updateFields });

    res.json({ message: "Profile updated successfully" });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// ─── PATCH /auth/notification-preferences ─────────────────────────────
router.patch('/notification-preferences', authenticate, async (req, res) => {
  try {
    const { email, push, in_app } = req.body;
    const updateFields = {};
    if (email !== undefined) updateFields['notification_preferences.email'] = !!email;
    if (push !== undefined) updateFields['notification_preferences.push'] = !!push;
    if (in_app !== undefined) updateFields['notification_preferences.in_app'] = !!in_app;

    await User.updateOne({ email: req.userEmail }, { $set: updateFields });
    res.json({ message: "Notification preferences updated successfully" });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// ─── POST /auth/register-biometric ─────────────────────────────────
router.post('/register-biometric', authenticate, async (req, res) => {
  try {
    await User.updateOne({ email: req.userEmail }, { $set: { biometric_registered: true } });
    res.json({ message: "Biometric registration successful" });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// ─── GET /auth/students ───────────────────────────────────────────
router.get('/students', authenticate, async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).lean();
    const result = students.map(s => ({
      email: s.email,
      full_name: s.full_name,
      student_id: s.student_id || '000'
    }));
    res.json(result);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// ─── POST /auth/upload-student-face ─────────────────────────────────
router.post('/upload-student-face', authenticate, (req, res) => {
  datasetUpload.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ detail: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ detail: "No file uploaded" });
    }
    res.json({ message: `Successfully uploaded ${req.file.filename} for student.` });
  });
});

// ─── POST /auth/upload-avatar ─────────────────────────────────────
router.post('/upload-avatar', authenticate, async (req, res) => {
  avatarUpload.single('file')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ detail: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ detail: "No file uploaded" });
    }

    try {
      const user = await User.findOne({ email: req.userEmail });
      if (user && user.avatar_url) {
        // Delete old avatar
        const oldFilename = user.avatar_url.split('/').pop();
        const oldPath = path.join(avatarsDir, oldFilename);
        if (fs.existsSync(oldPath)) {
          try {
            fs.unlinkSync(oldPath);
          } catch (e) {
            console.error("Failed to delete old avatar file:", e);
          }
        }
      }

      const avatarUrl = `/static/avatars/${req.file.filename}`;
      await User.updateOne({ email: req.userEmail }, { $set: { avatar_url: avatarUrl } });

      res.json({
        message: "Profile picture updated successfully",
        avatar_url: avatarUrl
      });
    } catch (error) {
      res.status(500).json({ detail: error.message });
    }
  });
});

// ─── POST /auth/train-faces ───────────────────────────────────────
router.post('/train-faces', authenticate, async (req, res) => {
  try {
    const pythonScript = path.join(__dirname, '../../../core/train_faces.py');
    const venvPython = path.join(__dirname, '../../../venv/Scripts/python.exe');
    const pythonExecutable = fs.existsSync(venvPython) ? venvPython : 'python';
    console.log(`Initiating background model training via: ${pythonExecutable} ${pythonScript}`);
    
    // Spawn background python training task
    const py = spawn(pythonExecutable, [pythonScript], {
      detached: true,
      stdio: 'ignore'
    });
    
    py.unref(); // Allow node to exit independently of this spawned process

    res.json({ message: "AI face recognition model training initiated in the background." });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// ─── POST /auth/token/refresh ──────────────────────────────────────
router.post('/token/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) {
      return res.status(400).json({ detail: "Refresh token is required" });
    }

    const incomingHash = crypto.createHash('sha256').update(refresh_token).digest('hex');
    
    // Check active session
    let session = await UserSession.findOne({ refreshTokenHash: incomingHash });
    
    if (!session) {
      // Reused Refresh Token Detection: check if this hash is in revokedRefreshTokenHashes of any session
      const compromisedSession = await UserSession.findOne({ revokedRefreshTokenHashes: incomingHash });
      if (compromisedSession) {
        // Severe security alert: token reuse detected. Revoke entire session family!
        await UserSession.deleteOne({ _id: compromisedSession._id });
        await logSecurityEvent(compromisedSession.userId, 'unknown', 'ROLE_VIOLATION', { reason: 'Refresh token reuse/theft attempt', tokenHash: incomingHash }, req);
        return res.status(401).json({ detail: "Revoked session family due to token reuse detection." });
      }
      return res.status(401).json({ detail: "Invalid refresh token" });
    }

    // Check expiry
    if (new Date() > session.expiry) {
      await UserSession.deleteOne({ _id: session._id });
      return res.status(401).json({ detail: "Refresh token expired" });
    }

    const user = await User.findOne({ email: session.userId });
    if (!user) {
      await UserSession.deleteOne({ _id: session._id });
      return res.status(401).json({ detail: "User not found" });
    }

    const newAccessToken = AuthService.createAccessToken({ sub: user.email, role: user.role });
    const newRefreshToken = crypto.randomBytes(32).toString('hex');
    
    const newTokenHash = crypto.createHash('sha256').update(newAccessToken).digest('hex');
    const newRefreshTokenHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');

    session.tokenHash = newTokenHash;
    session.revokedRefreshTokenHashes.push(incomingHash);
    session.refreshTokenHash = newRefreshTokenHash;
    session.lastActive = new Date();
    session.expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    await session.save();

    res.json({
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
      token_type: "bearer"
    });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// ─── GET /auth/sessions/active ─────────────────────────────────────
router.get('/sessions/active', authenticate, async (req, res) => {
  try {
    const sessions = await UserSession.find({ userId: req.userEmail }).sort({ lastActive: -1 }).lean();
    const result = sessions.map(s => ({
      id: s._id.toString(),
      device: s.device,
      ip: s.ip,
      location: s.location,
      last_active: s.lastActive,
      is_current: crypto.createHash('sha256').update(req.headers['authorization'].split(' ')[1]).digest('hex') === s.tokenHash
    }));
    res.json(result);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// ─── POST /auth/sessions/logout-all ────────────────────────────────
router.post('/sessions/logout-all', authenticate, async (req, res) => {
  try {
    const currentToken = req.headers['authorization'].split(' ')[1];
    const currentTokenHash = crypto.createHash('sha256').update(currentToken).digest('hex');
    
    // Delete all sessions for this user EXCEPT the current one
    await UserSession.deleteMany({
      userId: req.userEmail,
      tokenHash: { $ne: currentTokenHash }
    });
    
    await logSecurityEvent(req.userEmail, req.userRole, 'LOGOUT_EVENT', { scope: 'all_other_devices' }, req);

    res.json({ message: "Successfully logged out of all other devices" });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// ─── POST /auth/logout ─────────────────────────────────────────────
// Revoke the current session (server-side) for a clean, secure logout.
router.post('/logout', authenticate, async (req, res) => {
  try {
    const currentToken = req.headers['authorization'].split(' ')[1];
    const currentTokenHash = crypto.createHash('sha256').update(currentToken).digest('hex');
    await UserSession.deleteOne({ userId: req.userEmail, tokenHash: currentTokenHash });
    
    await logSecurityEvent(req.userEmail, req.userRole, 'LOGOUT_EVENT', { scope: 'current_device' }, req);

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// ─── DELETE /auth/sessions/:id ─────────────────────────────────────
// Revoke a specific device session belonging to the authenticated user.
router.delete('/sessions/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await UserSession.deleteOne({ _id: id, userId: req.userEmail });
    if (result.deletedCount === 0) {
      return res.status(404).json({ detail: "Session not found" });
    }
    
    await logSecurityEvent(req.userEmail, req.userRole, 'LOGOUT_EVENT', { scope: `device_${id}` }, req);

    res.json({ message: "Session revoked successfully" });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

module.exports = router;
