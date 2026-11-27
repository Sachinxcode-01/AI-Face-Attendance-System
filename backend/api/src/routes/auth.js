const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const crypto = require('crypto');
const sharp = require('sharp');

const User = require('../models/User');
const Otp = require('../models/Otp');
const UserSession = require('../models/UserSession');
const Invitation = require('../models/Invitation');
const AuthService = require('../services/authService');
const EmailService = require('../services/emailService');
const SmsService = require('../services/smsService');
const TotpService = require('../services/totpService');
const { authenticate, requireRole } = require('../middleware/auth');
const { resolveAdminTenant, buildTenantUserFilter, isSameTenant } = require('../utils/tenantScope');
const { trackJob } = require('../utils/jobTracker');
const reportInternalError = require('../utils/httpError');
const { limitRegister, limitOtpSend, limitOtpVerify, limitLoginPassword, limitChangePassword } = require('../middleware/rateLimiter');
const validate = require('../middleware/validate');
const {
  registerSchema,
  loginPasswordSchema,
  googleLoginSchema,
  githubLoginSchema,
  otpSendSchema,
  otpVerifySchema,
  resetPasswordSchema,
  changePasswordSchema,
  mfaCodeSchema,
  mfaDisableSchema,
  invitationCreateSchema,
  invitationAcceptSchema,
  switchInstitutionSchema
} = require('../schemas/validationSchemas');
const BiometricProfile = require('../models/BiometricProfile');
const faceAiService = require('../services/faceAiService');

const AttendanceAuditLog = require('../models/AttendanceAuditLog');

const REFRESH_COOKIE_NAME = 'smartface_refresh';
const OAUTH_STATE_COOKIE = 'smartface_oauth_state';

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function timingSafeEqualStr(a, b) {
    const bufA = Buffer.from(String(a || ''), 'utf8');
    const bufB = Buffer.from(String(b || ''), 'utf8');
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  }

  function validatePasswordPolicy(password, email = '') {
    if (!password || typeof password !== 'string' || password.length < 8) {
      return 'Password must be at least 8 characters long.';
    }
    if (password.length > 128) {
      return 'Password must be at most 128 characters long.';
    }
    // Support strong passphrases (>= 12 chars) without rigid character-class rejection
    if (password.length < 12) {
      const hasUpper = /[A-Z]/.test(password);
      const hasLower = /[a-z]/.test(password);
      const hasDigit = /[0-9]/.test(password);
      const hasSpecial = /[^A-Za-z0-9]/.test(password);
      if (!hasUpper || !hasLower || !hasDigit || !hasSpecial) {
        return 'Passwords under 12 characters must contain uppercase, lowercase, numbers, and special characters.';
      }
    }
    const emailPrefix = String(email || '').split('@')[0].toLowerCase();
    const weakPatterns = ['password', '123456', 'qwerty', 'smartface'];
    if (emailPrefix && emailPrefix.length >= 3) weakPatterns.push(emailPrefix);
    const lower = password.toLowerCase();
    if (weakPatterns.some(p => lower.includes(p))) {
      return 'Weak or common password pattern detected. Please use a stronger password.';
    }
    return null;
  }

  function getAllowedPortalOrigins() {
    const raw = [
      process.env.PORTAL_URL,
      process.env.CLIENT_URL,
      process.env.CORS_ORIGIN,
      process.env.CORS_ORIGINS,
      'http://localhost:3001',
      'http://localhost:3000',
      'https://ai-face-attendance-system-portal.vercel.app'
    ].filter(Boolean).join(',');
    return raw.split(',').map(s => s.trim().replace(/\/+$/, '')).filter(Boolean);
  }

  function resolveSafePortalRedirect(candidateUrl) {
    const allowed = getAllowedPortalOrigins();
    const fallback = allowed[0] || 'http://localhost:3001';
    if (!candidateUrl || typeof candidateUrl !== 'string') return fallback;
    try {
      const parsed = new URL(candidateUrl);
      if (allowed.includes(parsed.origin)) return parsed.origin;
    } catch (_) { }
    return fallback;
  }

  function refreshCookieOptions(rememberMe = false) {
    const secure = process.env.APP_ENV === 'production' || process.env.NODE_ENV === 'production';
    const days = rememberMe ? 30 : 7;
    return {
      httpOnly: true,
      secure,
      sameSite: secure ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/auth/token/refresh',
      maxAge: days * 24 * 60 * 60 * 1000,
      path: '/',
    };
  }

  function readCookie(req, name) {
    const cookie = (req.headers.cookie || '').split(';').map((part) => part.trim())
      .find((part) => part.startsWith(`${name}=`));
    if (!cookie) return null;
    try {
      return decodeURIComponent(cookie.slice(name.length + 1));
    } catch {
      return null;
    }
  }

  function readRefreshCookie(req) {
    return readCookie(req, REFRESH_COOKIE_NAME);
  }

    function clearRefreshCookie(res) {
      const secure = process.env.APP_ENV === 'production' || process.env.NODE_ENV === 'production';
      res.clearCookie(REFRESH_COOKIE_NAME, {
        httpOnly: true,
        secure,
        sameSite: secure ? 'none' : 'lax',
        path: '/auth/token/refresh',
        path: '/',
      });
    }

    function formatAuthResponse(user, accessToken, refreshToken, message = "Success", req, res, rememberMe = false) {
      const browserClient = Boolean(req?.headers.origin);
      if (browserClient && res) res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions(rememberMe));
        const wizardCompleted = user.setup_completed || user.biometric_registered || false;
        const photoUrl = user.profilePhotoUrl || user.avatar_url || null;
        const fullName = user.full_name || user.name || "Student User";
        return {
          success: true,
          message: message,
          access_token: accessToken,
          refresh_token: browserClient ? undefined : refreshToken,
          token_type: "bearer",
          role: user.role || "student",
          name: fullName,
          full_name: fullName,
          profilePhotoUrl: photoUrl,
          avatar_url: photoUrl,
          email_verified: Boolean(user.email_verified),
          mfa_enabled: Boolean(user.mfa?.enabled),
          biometric_registered: user.biometric_registered || false,
          setup_completed: wizardCompleted,
          introCompleted: true,
          wizardCompleted: wizardCompleted,
          data: {
            accessToken: accessToken,
            refreshToken: browserClient ? undefined : refreshToken,
            user: {
              id: user._id ? user._id.toString() : (user.id || ""),
              name: fullName,
              email: user.email,
              role: user.role || "student",
              college_id: user.college_id || null,
              email_verified: Boolean(user.email_verified),
              mfa_enabled: Boolean(user.mfa?.enabled),
              profilePhotoUrl: photoUrl,
              avatar_url: photoUrl,
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

      async function registerSession(userId, accessToken, req, rememberMe = false, authMethod = 'password') {
          try {
            const userAgent = req.headers['user-agent'] || 'Unknown Device';
            const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';

            const tokenHash = crypto.createHash('sha256').update(accessToken).digest('hex');
            const refreshToken = crypto.randomBytes(32).toString('hex');
            const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

            // Expiry: 30 days for Remember Me, 7 days standard
            const days = rememberMe ? 30 : 7;
            const expiry = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

            await UserSession.create({
              userId,
              device: userAgent,
              ip,
              location: "Local Network",
              tokenHash,
              refreshTokenHash,
              refreshTokenFamily: crypto.randomUUID(),
              auth_method: authMethod,
              remember_me: Boolean(rememberMe),
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

        const memoryAvatarUpload = multer({
          storage: multer.memoryStorage(),
          limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB max limit
          fileFilter: (req, file, cb) => {
            const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
            const ext = path.extname(file.originalname).toLowerCase();
            const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
            if (allowedTypes.includes(file.mimetype.toLowerCase()) || allowedExtensions.includes(ext)) {
              cb(null, true);
            } else {
              cb(new Error("Only JPEG, PNG, and WebP images are accepted."));
            }
          }
        });
        const avatarUpload = memoryAvatarUpload;

        // Configure Multer for student face dataset upload
        const datasetDir = path.join(__dirname, '../../../data/dataset');
        fs.mkdirSync(datasetDir, { recursive: true });

        const datasetStorage = multer.diskStorage({
          destination: async (req, file, cb) => {
            try {
              const email = String(req.query.student_email || '').trim().toLowerCase();
              if (!email) return cb(new Error("student_email is required"));
              const student = await User.findOne({ email, role: 'student' });
              if (!student) {
                return cb(new Error("Student not found"));
              }
              const tenant = await resolveAdminTenant(req);
              if (!isSameTenant(tenant, student)) {
                return cb(new Error("Forbidden: cross-institution upload denied"));
              }
              const safeId = String(student._id).replace(/[^a-zA-Z0-9_-]/g, '');
              const studentFolder = path.resolve(datasetDir, safeId);
              const rootDir = path.resolve(datasetDir);
              if (!studentFolder.startsWith(rootDir + path.sep)) {
                return cb(new Error("Invalid upload path"));
              }
              fs.mkdirSync(studentFolder, { recursive: true });
              cb(null, studentFolder);
            } catch (err) {
              cb(err);
            }
          },
          filename: (req, file, cb) => {
            const ext = path.extname(file.originalname || '').toLowerCase();
            const safeExt = ['.jpg', '.jpeg', '.png'].includes(ext) ? ext : '.jpg';
            cb(null, `${Date.now()}_${crypto.randomBytes(6).toString('hex')}${safeExt}`);
          }
        });

        const datasetUpload = multer({
          storage: datasetStorage,
          limits: { fileSize: 5 * 1024 * 1024 },
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

        const memoryUpload = multer({
          storage: multer.memoryStorage(),
          limits: { fileSize: 5 * 1024 * 1024 }
        });

        // ─── POST /auth/register ──────────────────────────────────────────
        const PUBLIC_SELF_REGISTER_ROLES = new Set(['student', 'parent']);
        const authorizeStaffRegistration = (req, res, next) => {
          const requestedRole = String(req.body.role || '').toLowerCase();
          if (requestedRole === 'super_admin') {
            return res.status(403).json({ detail: 'Super Admin accounts cannot be created via public registration.' });
          }
          if (PUBLIC_SELF_REGISTER_ROLES.has(requestedRole)) return next();

          return authenticate(req, res, () => {
            const adminProvisionedRoles = ['admin', 'principal', 'management'];
            const allowedCreators = adminProvisionedRoles.includes(requestedRole)
              ? ['super_admin']
              : ['admin', 'super_admin', 'principal'];
            if (!allowedCreators.includes(req.userRole)) {
              return res.status(403).json({ detail: 'You are not allowed to create this account role.' });
            }
            next();
          });
        };

        router.post('/register', limitRegister, validate(registerSchema), authorizeStaffRegistration, async (req, res) => {
          try {
            const { email, full_name, role, password } = req.body;

            const existingUser = await User.findOne({ email });
            if (existingUser) {
              return res.status(400).json({ detail: "Unable to complete registration with this email." });
            }

            const pwError = validatePasswordPolicy(password, email);
            if (pwError) {
              return res.status(400).json({ detail: pwError });
            }

            const hashedPassword = await AuthService.hashPassword(password);
            const newUser = new User({
              email,
              full_name,
              role: role.toLowerCase(),
              password: hashedPassword,
              email_verified: false,
              account_status: 'active'
            });

            await newUser.save();

            // Initiate email verification OTP in background
              const verifyOtp = Array.from({ length: 6 }, () => crypto.randomInt(0, 10)).join('');
              const verifyExpiry = new Date(Date.now() + 10 * 60 * 1000);
              await Otp.updateOne(
                { email, type: 'email_verification' },
                { $set: { otp: verifyOtp, expiry: verifyExpiry, role: newUser.role, type: 'email_verification', attempts: 0, deliveryStatus: 'pending' } },
                { upsert: true }
              );
              trackJob(
                EmailService.sendOtp(email, verifyOtp, 'register')
                  .then((ok) => Otp.updateOne({ email, type: 'email_verification' }, { $set: { deliveryStatus: ok ? 'sent' : 'failed' } }))
                  .catch(console.error)
              );
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
              console.error('[Auth] Registration error:', error);
              res.status(500).json({ detail: 'Unable to register account.' });
            }
          });

        // ─── POST /auth/login-otp/send ─────────────────────────────────────
        router.post('/login-otp/send', limitOtpSend, validate(otpSendSchema), async (req, res) => {
          try {
            const { email } = req.body;
            const genericResponse = {
              success: true,
              message: "If an eligible account exists for this email address, a verification code will be sent."
            };

            const user = await User.findOne({ email });
            if (!user || (user.account_status && user.account_status !== 'active')) {
              return res.json(genericResponse);
            }

            // OTP Resend Cooldown (60 seconds) scoped by type: 'login'
            const existing = await Otp.findOne({ email, type: 'login' });
            if (existing) {
              const createdTime = existing.expiry.getTime() - 5 * 60 * 1000;
              const elapsed = (Date.now() - createdTime) / 1000;
              if (elapsed < 60) {
                return res.status(429).json({ detail: `Please wait ${Math.ceil(60 - elapsed)}s before requesting a new OTP.` });
              }
            }

            const otpVal = Array.from({ length: 6 }, () => crypto.randomInt(0, 10)).join('');
            const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

            await Otp.updateOne(
              { email, type: 'login' },
              { $set: { otp: otpVal, expiry, role: user.role, type: 'login', attempts: 0, deliveryStatus: 'pending' } },
              { upsert: true }
            );

            console.log(JSON.stringify({ event: "otp_generated", recipient: email ? `${email[0]}***@${email.split('@')[1] || ''}` : 'masked', purpose: "login" }));

            // Send OTP email with automatic SMS failover (uniform public response to prevent enumeration)
            const emailSent = await EmailService.sendOtp(email, otpVal, 'login');
            if (!emailSent) {
              if (user.phone) {
                const smsResult = await SmsService.sendOtp(user.phone, otpVal, 'login');
                if (smsResult && smsResult.success) {
                  await Otp.updateOne({ email, type: 'login' }, { $set: { deliveryStatus: 'sent' } });
                  return res.json(genericResponse);
                }
              }
              await Otp.updateOne({ email, type: 'login' }, { $set: { deliveryStatus: 'failed' } });
              return res.json(genericResponse);
            }

            await Otp.updateOne({ email, type: 'login' }, { $set: { deliveryStatus: 'sent' } });
            res.json(genericResponse);
              await Otp.updateOne({ email, type: 'login' }, { $set: { deliveryStatus: 'sent' } });
              res.json(genericResponse);
            } catch (error) {
              console.error('[Auth] OTP send error:', error);
              res.status(500).json({ detail: 'Unable to send verification code.' });
            }
          });

        // ─── POST /auth/login-otp/verify ──────────────────────────────────
        router.post('/login-otp/verify', limitOtpVerify, validate(otpVerifySchema), async (req, res) => {
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
              await Otp.deleteOne({ _id: record._id });
              return res.status(401).json({ detail: "OTP expired" });
            }

            if (record.attempts >= 3) {
              await Otp.deleteOne({ _id: record._id });
              await logSecurityEvent(email, record.role, 'LOGIN_FAILED', { reason: 'OTP max attempts exceeded' }, req);
              return res.status(401).json({ detail: "Too many failed attempts. OTP invalidated." });
            }

            if (!timingSafeEqualStr(record.otp, otp)) {
              record.attempts = (record.attempts || 0) + 1;
              await record.save();
              await logSecurityEvent(email, record.role, 'LOGIN_FAILED', { reason: 'Invalid OTP attempt', attempts: record.attempts }, req);
              return res.status(401).json({ detail: `Invalid OTP. ${3 - record.attempts} attempts remaining.` });
            }

            await Otp.deleteOne({ _id: record._id });

            const user = await User.findOne({ email });
            if (!user) {
              return res.status(401).json({ detail: "Account not found." });
            }
            if (user.account_status && user.account_status !== 'active') {
              return res.status(403).json({ detail: "Your account is inactive or suspended. Contact your administrator." });
            }

            if (user.mfa && user.mfa.enabled) {
              const mfaToken = AuthService.createAccessToken({ sub: email, role: user.role, mfa_pending: true }, 5);
              return res.json({
                success: true,
                mfa_required: true,
                mfa_token: mfaToken,
                message: "Additional verification is required."
              });
            }

            const role = user.role || record.role;
            const token = AuthService.createAccessToken({ sub: email, role });
            const refreshToken = await registerSession(email, token, req, false, 'otp');
            await User.updateOne({ _id: user._id }, { $set: { last_login_at: new Date(), email_verified: true } }).catch(() => { });

            await logSecurityEvent(email, role, 'LOGIN_EVENT', { method: 'otp', device: req.headers['user-agent'] }, req);

            res.json(formatAuthResponse(user, token, refreshToken, "OTP verified successfully", req, res));
          } catch (error) {
            console.error('[Auth] OTP verification error:', error);
            res.status(500).json({ detail: 'Unable to verify code.' });
          }
        });

        // ─── POST /auth/login-password ────────────────────────────────────
        router.post(['/login-password', '/login'], limitLoginPassword, validate(loginPasswordSchema), async (req, res) => {
          try {
            const email = (req.body.email || '').trim().toLowerCase();
            const password = typeof req.body.password === 'string' ? req.body.password : '';

            if (!email || !password) {
              return res.status(400).json({ detail: "Email and password are required." });
            }

            let user = null;
            try {
              if (require('mongoose').connection.readyState === 1) {
                user = await User.findOne({ email });
              }
            } catch (dbErr) {
              console.warn("[Auth] DB lookup warning:", dbErr.message);
            }

            if (!user) {
              await new Promise(resolve => setTimeout(resolve, 400));
              return res.status(401).json({ detail: "Unable to sign in. Check your credentials and try again." });
            }

            if (user.account_status && user.account_status !== 'active') {
              return res.status(403).json({ detail: "Your account is inactive or suspended. Contact your administrator." });
            }

            // Check account lockout
            if (user.lockoutUntil && user.lockoutUntil > new Date()) {
              const waitSec = Math.ceil((user.lockoutUntil.getTime() - Date.now()) / 1000);
              return res.status(423).json({ detail: `Account locked due to too many failed attempts. Try again in ${waitSec}s.` });
            }

            let isPasswordValid = false;
            if (user.password) {
              isPasswordValid = await AuthService.verifyPassword(password, user.password);
            }

            if (!isPasswordValid) {
              // Increment failed attempts
              user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;

              // Progressive delay capped safely at 2 seconds to avoid client timeouts
              const delay = Math.min(500 * Math.pow(2, user.failedLoginAttempts - 1), 2000);
              user.loginProgressiveDelay = delay;

              // Lock account if attempts >= 5
              if (user.failedLoginAttempts >= 5) {
                user.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
                user.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000);
                trackJob(EmailService.sendSuspiciousLoginAlert(user.email, req.ip || '127.0.0.1', new Date().toISOString()).catch(console.error));
              }

              try { await user.save(); } catch (_) { }
              await logSecurityEvent(email, user.role, 'LOGIN_FAILED', { reason: 'Password mismatch', attempts: user.failedLoginAttempts }, req);

              // Wait for safe progressive delay
              await new Promise(resolve => setTimeout(resolve, delay));
              return res.status(401).json({ detail: "Invalid email or password" });
              return res.status(401).json({ detail: "Unable to sign in. Check your credentials and try again." });
            }

            // Reset lockout and failed attempts
            user.failedLoginAttempts = 0;
            user.loginProgressiveDelay = 0;
            user.lockoutUntil = null;
            user.last_login_at = new Date();
            try { await user.save(); } catch (_) { }

            if (user.mfa && user.mfa.enabled) {
              const mfaToken = AuthService.createAccessToken({
                sub: email,
                role: user.role,
                mfa_pending: true,
                remember_me: Boolean(req.body.remember_me)
              }, 5);
              return res.json({
                success: true,
                mfa_required: true,
                mfa_token: mfaToken,
                message: "Additional verification is required."
              });
            }

            // Check for login from new device
            const userAgent = req.headers['user-agent'] || 'Unknown Device';
            try {
              const knownDevice = await UserSession.exists({ userId: email, device: userAgent });
              if (!knownDevice) {
                trackJob(EmailService.sendNewDeviceLoginAlert(email, userAgent, req.ip || '127.0.0.1', new Date().toISOString()).catch(console.error));
              }
            } catch (_) { }

            const rememberMe = Boolean(req.body.remember_me);
            const token = AuthService.createAccessToken({ sub: email, role: user.role });
            const refreshToken = await registerSession(email, token, req, rememberMe, 'password');

            await logSecurityEvent(email, user.role, 'LOGIN_EVENT', { method: 'password', device: userAgent }, req);

            res.json(formatAuthResponse(user, token, refreshToken, "Login successful", req, res, rememberMe));
          } catch (error) {
            console.error("[Auth] Login error:", error);
            res.status(500).json({ detail: 'Unable to complete login.' });
          }
        });

        function signOAuthStateCookie(payloadObj) {
          const secret = process.env.JWT_SECRET || process.env.SECRET_KEY;
          const data = Buffer.from(JSON.stringify(payloadObj)).toString('base64url');
          const sig = crypto.createHmac('sha256', secret).update(data).digest('base64url');
          return `${data}.${sig}`;
        }

        function verifyOAuthStateCookie(cookieVal) {
          if (!cookieVal || !cookieVal.includes('.')) return null;
          const [data, sig] = cookieVal.split('.');
          const secret = process.env.JWT_SECRET || process.env.SECRET_KEY;
          const expected = crypto.createHmac('sha256', secret).update(data).digest('base64url');
          if (!timingSafeEqualStr(sig, expected)) return null;
          try {
            const parsed = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
            if (!parsed.exp || Date.now() > parsed.exp) return null;
            return parsed;
          } catch {
            return null;
          }
        }

        function resolveGoogleRedirectUri(req) {
          if (process.env.GOOGLE_REDIRECT_URI) return process.env.GOOGLE_REDIRECT_URI;
          const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
          const host = req.headers['x-forwarded-host'] || req.get('host');
          return `${proto}://${host}/api/v1/auth/google/callback`;
        }

        function resolveGithubRedirectUri(req) {
          if (process.env.GITHUB_REDIRECT_URI) return process.env.GITHUB_REDIRECT_URI;
          const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
          const host = req.headers['x-forwarded-host'] || req.get('host');
          return `${proto}://${host}/api/v1/auth/github/callback`;
        }

        // ─── GET /auth/google (Web OAuth Initiation with State + PKCE) ─────
        router.get('/google', (req, res) => {
          const googleClientId = process.env.GOOGLE_CLIENT_ID;
          const portalOrigin = resolveSafePortalRedirect(req.query.redirect_origin || req.headers.referer);
          if (!googleClientId || googleClientId.includes('YOUR_') || googleClientId.includes('your_')) {
            return res.redirect(`${portalOrigin}/auth/auth-error?error=oauth_unconfigured&provider=google`);
          }

          const state = crypto.randomBytes(24).toString('hex');
          const codeVerifier = crypto.randomBytes(32).toString('base64url');
          const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
          const redirectUri = resolveGoogleRedirectUri(req);

          const secure = process.env.APP_ENV === 'production' || process.env.NODE_ENV === 'production';
          const cookiePayload = signOAuthStateCookie({
            state,
            codeVerifier,
            portalOrigin,
            redirectUri,
            provider: 'google',
            exp: Date.now() + 10 * 60 * 1000
          });
          res.cookie(OAUTH_STATE_COOKIE, cookiePayload, {
            httpOnly: true,
            secure,
            sameSite: 'lax',
            maxAge: 10 * 60 * 1000,
            path: '/'
          });

          const params = new URLSearchParams({
            client_id: googleClientId,
            redirect_uri: redirectUri,
            response_type: 'code',
            scope: 'openid email profile',
            state,
            code_challenge: codeChallenge,
            code_challenge_method: 'S256',
            access_type: 'offline',
            prompt: 'select_account'
          });
          return res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
        });

        // ─── GET /auth/google/callback ─────────────────────────────────────
        router.get('/google/callback', async (req, res) => {
          const stateCookie = verifyOAuthStateCookie(readCookie(req, OAUTH_STATE_COOKIE));
          const portalOrigin = stateCookie?.portalOrigin || resolveSafePortalRedirect(null);
          res.clearCookie(OAUTH_STATE_COOKIE, { path: '/' });

          try {
            if (req.query.error) {
              return res.redirect(`${portalOrigin}/auth/auth-error?error=oauth_cancelled&provider=google`);
            }
            const { code, state } = req.query;
            if (!code || !state || !stateCookie || stateCookie.provider !== 'google' || !timingSafeEqualStr(state, stateCookie.state)) {
              return res.redirect(`${portalOrigin}/auth/auth-error?error=invalid_oauth_state&provider=google`);
            }

            const googleClientId = process.env.GOOGLE_CLIENT_ID;
            const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
            if (!googleClientId || !googleClientSecret) {
              return res.redirect(`${portalOrigin}/auth/auth-error?error=oauth_unconfigured&provider=google`);
            }

            const { google } = require('googleapis');
            const oauth2Client = new google.auth.OAuth2(googleClientId, googleClientSecret, stateCookie.redirectUri);
            const { tokens } = await oauth2Client.getToken({
              code: String(code),
              codeVerifier: stateCookie.codeVerifier
            });

            if (!tokens.id_token) {
              return res.redirect(`${portalOrigin}/auth/auth-error?error=missing_id_token&provider=google`);
            }

            const ticket = await oauth2Client.verifyIdToken({
              idToken: tokens.id_token,
              audience: googleClientId
            });
            const payload = ticket.getPayload();
            const validIssuers = ['accounts.google.com', 'https://accounts.google.com'];
            if (!payload || !payload.email || !payload.email_verified || !validIssuers.includes(payload.iss)) {
              return res.redirect(`${portalOrigin}/auth/auth-error?error=unverified_email&provider=google`);
            }

            const verifiedEmail = payload.email.toLowerCase();
            const providerSub = String(payload.sub || '');

            let user = providerSub
              ? await User.findOne({ 'oauth_providers.provider': 'google', 'oauth_providers.provider_user_id': providerSub })
              : null;
            if (!user) {
              user = await User.findOne({ email: verifiedEmail });
            }

            if (!user) {
              user = new User({
                email: verifiedEmail,
                full_name: payload.name || 'Google User',
                role: 'student',
                email_verified: true,
                biometric_registered: false,
                avatar_url: payload.picture || null,
                oauth_providers: providerSub ? [{ provider: 'google', provider_user_id: providerSub, email: verifiedEmail, linked_at: new Date() }] : []
              });
              await user.save();
              trackJob(EmailService.sendRegistrationSuccess(verifiedEmail, user.full_name).catch(console.error));
            } else {
              if (user.account_status && user.account_status !== 'active') {
                return res.redirect(`${portalOrigin}/auth/auth-error?error=account_inactive&provider=google`);
              }
              const hasGoogle = (user.oauth_providers || []).some(p => p.provider === 'google');
              if (!hasGoogle && providerSub) {
                await User.updateOne(
                  { _id: user._id },
                  {
                    $push: { oauth_providers: { provider: 'google', provider_user_id: providerSub, email: verifiedEmail, linked_at: new Date() } },
                    $set: { email_verified: true, last_login_at: new Date(), ...(payload.picture && !user.avatar_url ? { avatar_url: payload.picture } : {}) }
                  }
                );
              }
            }

            const accessToken = AuthService.createAccessToken({ sub: user.email, role: user.role });
            const refreshToken = await registerSession(user.email, accessToken, req, false, 'google');
            await logSecurityEvent(user.email, user.role, 'LOGIN_EVENT', { method: 'google_web' }, req);

            res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions(false));
            return res.redirect(`${portalOrigin}/auth/oauth/callback?provider=google`);
          } catch (err) {
            console.error('[Auth] Google OAuth callback error:', err.message);
            return res.redirect(`${portalOrigin}/auth/auth-error?error=oauth_failed&provider=google`);
          }
        });

        // ─── POST /auth/google ───────────────────────────────────────────
        router.post('/google', limitLoginPassword, validate(googleLoginSchema), async (req, res) => {
          try {
            const { idToken } = req.body;
            const googleClientId = process.env.GOOGLE_CLIENT_ID;

            if (!googleClientId || googleClientId.includes('YOUR_') || googleClientId.includes('your_')) {
              return res.status(503).json({
                success: false,
                detail: "Google OAuth is unconfigured on the server."
              });
            }

            if (!idToken) {
              return res.status(400).json({ detail: "Google idToken is required" });
            }

            let verifiedEmail = null;
            let verifiedName = null;
            let verifiedPicture = null;
            let providerSub = null;

            try {
              const { google } = require('googleapis');
              const client = new google.auth.OAuth2(googleClientId);
              const ticket = await client.verifyIdToken({
                idToken,
                audience: googleClientId,
              });
              const payload = ticket.getPayload();

              if (!payload || !payload.email || !payload.email_verified) {
                return res.status(401).json({ detail: "Google authentication failed: unverified email" });
              }

              // Verify issuer
              const validIssuers = ['accounts.google.com', 'https://accounts.google.com'];
              if (!validIssuers.includes(payload.iss)) {
                return res.status(401).json({ detail: "Invalid Google token issuer" });
              }

              verifiedEmail = payload.email.toLowerCase();
              verifiedName = payload.name;
              verifiedPicture = payload.picture;
              providerSub = payload.sub ? String(payload.sub) : null;
            } catch (err) {
              console.error("Google ID Token verification error:", err);
              return res.status(401).json({ detail: 'Google token verification failed.' });
            }

            let user = providerSub
              ? await User.findOne({ 'oauth_providers.provider': 'google', 'oauth_providers.provider_user_id': providerSub })
              : null;
            if (!user) {
              user = await User.findOne({ email: verifiedEmail });
            }
            let userRole = 'student';

            if (!user) {
              user = new User({
                email: verifiedEmail,
                full_name: verifiedName || 'Google User',
                role: userRole,
                email_verified: true,
                biometric_registered: false,
                avatar_url: verifiedPicture || null,
                oauth_providers: providerSub ? [{ provider: 'google', provider_user_id: providerSub, email: verifiedEmail, linked_at: new Date() }] : []
              });
              await user.save();
              trackJob(EmailService.sendRegistrationSuccess(verifiedEmail, verifiedName || 'Google User').catch(console.error));
            } else {
              if (user.account_status && user.account_status !== 'active') {
                return res.status(403).json({ detail: "Your account is inactive or suspended. Contact your administrator." });
              }
              userRole = user.role;
              const updates = { last_login_at: new Date(), email_verified: true };
              if (verifiedPicture && !user.avatar_url) {
                user.avatar_url = verifiedPicture;
                await user.save();
                updates.avatar_url = verifiedPicture;
              }
              const hasGoogle = (user.oauth_providers || []).some(p => p.provider === 'google');
              if (!hasGoogle && providerSub) {
                await User.updateOne(
                  { _id: user._id },
                  { $set: updates, $push: { oauth_providers: { provider: 'google', provider_user_id: providerSub, email: verifiedEmail, linked_at: new Date() } } }
                );
              } else {
                await User.updateOne({ _id: user._id }, { $set: updates });
              }
            }

            const token = AuthService.createAccessToken({ sub: user.email, role: userRole });
            const refreshToken = await registerSession(user.email, token, req, false, 'google');
            await logSecurityEvent(user.email, userRole, 'LOGIN_EVENT', { method: 'google' }, req);

            res.json(formatAuthResponse(user, token, refreshToken, "Google login successful", req, res));
          } catch (error) {
            console.error('[Auth] Google login error:', error);
            res.status(500).json({ detail: 'Unable to complete Google login.' });
          }
        });

        async function exchangeGithubCodeForUser(code, client_id, client_secret) {
          const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ client_id, client_secret, code })
          });
          const tokenData = await tokenResponse.json();
          if (!tokenResponse.ok || tokenData.error || !tokenData.access_token) {
            return { error: 'GitHub authentication failed.' };
          }

          const accessToken = tokenData.access_token;
          const userResponse = await fetch('https://api.github.com/user', {
            headers: { 'Authorization': `Bearer ${accessToken}`, 'User-Agent': 'smartface-attendance-api' }
          });
          if (!userResponse.ok) {
            return { error: 'Failed to retrieve GitHub user profile.' };
          }
          const userData = await userResponse.json();

          // Always verify email ownership via /user/emails
          let verifiedEmail = null;
          const emailsResponse = await fetch('https://api.github.com/user/emails', {
            headers: { 'Authorization': `Bearer ${accessToken}`, 'User-Agent': 'smartface-attendance-api' }
          });
          if (emailsResponse.ok) {
            const emailsData = await emailsResponse.json();
            if (Array.isArray(emailsData)) {
              const primaryVerified = emailsData.find(e => e.primary && e.verified) || emailsData.find(e => e.verified);
              verifiedEmail = primaryVerified ? String(primaryVerified.email).trim().toLowerCase() : null;
            }
          }

          if (!verifiedEmail) {
            return { error: 'Could not retrieve a verified email address from GitHub.' };
          }

          return {
            providerId: userData.id ? String(userData.id) : null,
            email: verifiedEmail,
            name: userData.name || userData.login || 'GitHub User',
            avatarUrl: userData.avatar_url || null
          };
        }

        // ─── GET /auth/github (Web OAuth Initiation with State) ──────────────
        router.get('/github', (req, res) => {
          const clientId = process.env.GITHUB_CLIENT_ID;
          const portalOrigin = resolveSafePortalRedirect(req.query.redirect_origin || req.headers.referer);
          if (!clientId || clientId === 'your_github_client_id') {
            return res.redirect(`${portalOrigin}/auth/auth-error?error=oauth_unconfigured&provider=github`);
          }

          const state = crypto.randomBytes(24).toString('hex');
          const redirectUri = resolveGithubRedirectUri(req);
          const secure = process.env.APP_ENV === 'production' || process.env.NODE_ENV === 'production';

          res.cookie(OAUTH_STATE_COOKIE, signOAuthStateCookie({
            state,
            portalOrigin,
            redirectUri,
            provider: 'github',
            exp: Date.now() + 10 * 60 * 1000
          }), {
            httpOnly: true,
            secure,
            sameSite: 'lax',
            maxAge: 10 * 60 * 1000,
            path: '/'
          });

          const params = new URLSearchParams({
            client_id: clientId,
            redirect_uri: redirectUri,
            scope: 'read:user user:email',
            state
          });
          return res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
        });

        // ─── GET /auth/github/callback ──────────────────────────────────────
        router.get('/github/callback', async (req, res) => {
              const stateCookie = verifyOAuthStateCookie(readCookie(req, OAUTH_STATE_COOKIE));
              if (stateCookie && stateCookie.provider === 'github') {
                const portalOrigin = stateCookie.portalOrigin || resolveSafePortalRedirect(null);
                res.clearCookie(OAUTH_STATE_COOKIE, { path: '/' });
                try {
                  if (req.query.error) {
                    return res.redirect(`${portalOrigin}/auth/auth-error?error=oauth_cancelled&provider=github`);
                  }
                  const { code, state } = req.query;
                  if (!code || !state || !timingSafeEqualStr(state, stateCookie.state)) {
                    return res.redirect(`${portalOrigin}/auth/auth-error?error=invalid_oauth_state&provider=github`);
                  }
                  const client_id = process.env.GITHUB_CLIENT_ID;
                  const client_secret = process.env.GITHUB_CLIENT_SECRET;
                  if (!client_id || !client_secret) {
                    return res.redirect(`${portalOrigin}/auth/auth-error?error=oauth_unconfigured&provider=github`);
                  }

                  const gh = await exchangeGithubCodeForUser(String(code), client_id, client_secret);
                  if (gh.error) {
                    return res.redirect(`${portalOrigin}/auth/auth-error?error=oauth_failed&provider=github`);
                  }

                  let user = gh.providerId
                    ? await User.findOne({ 'oauth_providers.provider': 'github', 'oauth_providers.provider_user_id': gh.providerId })
                    : null;
                  if (!user) user = await User.findOne({ email: gh.email });

                  if (!user) {
                    user = new User({
                      email: gh.email,
                      full_name: gh.name,
                      role: 'student',
                      email_verified: true,
                      biometric_registered: false,
                      avatar_url: gh.avatarUrl,
                      oauth_providers: gh.providerId ? [{ provider: 'github', provider_user_id: gh.providerId, email: gh.email, linked_at: new Date() }] : []
                    });
                    await user.save();
                    trackJob(EmailService.sendRegistrationSuccess(gh.email, user.full_name).catch(console.error));
                  } else {
                    if (user.account_status && user.account_status !== 'active') {
                      return res.redirect(`${portalOrigin}/auth/auth-error?error=account_inactive&provider=github`);
                    }
                    const hasGh = (user.oauth_providers || []).some(p => p.provider === 'github');
                    if (!hasGh && gh.providerId) {
                      await User.updateOne(
                        { _id: user._id },
                        {
                          $push: { oauth_providers: { provider: 'github', provider_user_id: gh.providerId, email: gh.email, linked_at: new Date() } },
                          $set: { email_verified: true, last_login_at: new Date(), ...(!user.avatar_url && gh.avatarUrl ? { avatar_url: gh.avatarUrl } : {}) }
                        }
                      );
                    }
                  }

                  const token = AuthService.createAccessToken({ sub: user.email, role: user.role });
                  const refreshToken = await registerSession(user.email, token, req, false, 'github');
                  await logSecurityEvent(user.email, user.role, 'LOGIN_EVENT', { method: 'github_web' }, req);

                  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions(false));
                  return res.redirect(`${portalOrigin}/auth/oauth/callback?provider=github`);
                } catch (err) {
                  console.error('[Auth] GitHub web callback error:', err.message);
                  return res.redirect(`${portalOrigin}/auth/auth-error?error=oauth_failed&provider=github`);
                }
              }

              // Legacy mobile manual code copy fallback (strictly HTML-escaped)
              const rawCode = typeof req.query.code === 'string' ? req.query.code : '';
              if (!rawCode || !/^[A-Za-z0-9_-]{4,256}$/.test(rawCode)) {
                return res.status(400).send("Invalid or missing authorization code");
              }
              const safeCode = escapeHtml(rawCode);
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
        body { background-color: #0F172A; color: #F8FAFC; font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
        .card { background-color: #1E293B; border: 1px solid #334155; padding: 30px; border-radius: 16px; max-width: 400px; width: 100%; text-align: center; }
        h2 { color: #38BDF8; margin-top: 0; }
        p { color: #94A3B8; font-size: 14px; line-height: 1.6; }
        .code-box { background-color: #020617; border: 1px solid #475569; padding: 14px; font-size: 18px; font-family: monospace; border-radius: 8px; margin: 20px 0; color: #38BDF8; user-select: all; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="card">
        <h2>Authentication Successful</h2>
        <p>SmartFace Attendance successfully connected with GitHub. Copy the verification code below and paste it back in the app to sign in.</p>
        <div class="code-box" id="authCode">${code}</div>
        <button class="btn" onclick="copyCode()">Copy Verification Code</button>
        <div class="copied-msg" id="copiedMsg">Code copied to clipboard!</div>
        <p>Copy the verification code below and paste it back in the SmartFace app to sign in.</p>
        <div class="code-box" id="authCode">${safeCode}</div>
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
            router.post('/github', limitLoginPassword, validate(githubLoginSchema), async (req, res) => {
              try {
                const { code } = req.body;

                const client_id = process.env.GITHUB_CLIENT_ID;
                const client_secret = process.env.GITHUB_CLIENT_SECRET;

                if (!client_id || !client_secret || client_id === 'your_github_client_id' || client_secret === 'your_github_client_secret') {
                  return res.status(503).json({ detail: "GitHub Auth is not configured on the server." });
                }

                const gh = await exchangeGithubCodeForUser(code, client_id, client_secret);
                if (gh.error) {
                  return res.status(401).json({ detail: gh.error });
                }

                  let user = gh.providerId
                    ? await User.findOne({ 'oauth_providers.provider': 'github', 'oauth_providers.provider_user_id': gh.providerId })
                    : null;
                  if (!user) {
                    user = await User.findOne({ email: gh.email });
                  }
                  let userRole = 'student';

                    if (!user) {
                      user = new User({
                        email: gh.email,
                        full_name: gh.name,
                        role: userRole,
                        email_verified: true,
                        biometric_registered: false,
                        avatar_url: gh.avatarUrl,
                        oauth_providers: gh.providerId ? [{ provider: 'github', provider_user_id: gh.providerId, email: gh.email, linked_at: new Date() }] : []
                      });
                      await user.save();
                      trackJob(EmailService.sendRegistrationSuccess(gh.email, user.full_name).catch(console.error));
                    } else {
                      if (user.account_status && user.account_status !== 'active') {
                        return res.status(403).json({ detail: "Your account is inactive or suspended. Contact your administrator." });
                      }
                      userRole = user.role;
                      const updates = { last_login_at: new Date(), email_verified: true };
                      if (!user.avatar_url && gh.avatarUrl) updates.avatar_url = gh.avatarUrl;
                      const hasGh = (user.oauth_providers || []).some(p => p.provider === 'github');
                      if (!hasGh && gh.providerId) {
                        await User.updateOne(
                          { _id: user._id },
                          { $set: updates, $push: { oauth_providers: { provider: 'github', provider_user_id: gh.providerId, email: gh.email, linked_at: new Date() } } }
                        );
                      } else {
                        await User.updateOne({ _id: user._id }, { $set: updates });
                      }
                    }

                    const token = AuthService.createAccessToken({ sub: user.email, role: userRole });
                    const refreshToken = await registerSession(user.email, token, req, false, 'github');

                    const userAgent = req.headers['user-agent'] || 'Unknown Device';
                    await logSecurityEvent(user.email, userRole, 'LOGIN_EVENT', { method: 'github', device: userAgent }, req);

                    res.json(formatAuthResponse(user, token, refreshToken, "GitHub login successful", req, res));
                  } catch (error) {
                      console.error('[Auth] GitHub login error:', error);
                      res.status(500).json({ detail: 'Unable to complete GitHub login.' });
                    }
                  });

            // ─── POST /auth/forgot-password ──────────────────────────────────
            router.post('/forgot-password', limitOtpSend, validate(otpSendSchema), async (req, res) => {
              try {
                const { email } = req.body;
                const genericMsg = "If an eligible account exists for this email address, password reset instructions will be sent.";
                const user = await User.findOne({ email });
                if (!user || (user.account_status && user.account_status !== 'active')) {
                  return res.json({ success: true, message: genericMsg });
                }

                // OTP Resend Cooldown (60 seconds) scoped to password_reset
                const existing = await Otp.findOne({ email, type: 'password_reset' });
                if (existing) {
                  const createdTime = existing.expiry.getTime() - 5 * 60 * 1000;
                  const elapsed = (Date.now() - createdTime) / 1000;
                  if (elapsed < 60) {
                    return res.status(429).json({ detail: `Please wait ${Math.ceil(60 - elapsed)}s before requesting a new OTP.` });
                  }
                }

                const otpVal = Array.from({ length: 6 }, () => crypto.randomInt(0, 10)).join('');
                const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

                await Otp.updateOne(
                  { email, type: 'password_reset' },
                  { $set: { otp: otpVal, expiry, role: user.role, type: 'password_reset', attempts: 0, deliveryStatus: 'pending' } },
                  { upsert: true }
                );

                console.log(JSON.stringify({ event: "otp_generated", recipient: email ? `${email[0]}***@${email.split('@')[1] || ''}` : 'masked', purpose: "password_reset" }));

                const emailSent = await EmailService.sendOtp(email, otpVal, 'password_reset');
                await Otp.updateOne({ email, type: 'password_reset' }, { $set: { deliveryStatus: emailSent ? 'sent' : 'failed' } });

                res.json({ success: true, message: genericMsg });
              } catch (error) {
                console.error('[Auth] Password reset request error:', error);
                res.status(500).json({ detail: 'Unable to process password reset request.' });
              }
            });

            // ─── POST /auth/reset-password ────────────────────────────────────
            router.post('/reset-password', limitOtpVerify, validate(resetPasswordSchema), async (req, res) => {
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
                  await Otp.deleteOne({ _id: record._id });
                  return res.status(401).json({ detail: "OTP expired" });
                }

                if (record.attempts >= 3) {
                  await Otp.deleteOne({ _id: record._id });
                  await logSecurityEvent(email, record.role, 'PASSWORD_RESET_FAILED', { reason: 'OTP max attempts exceeded' }, req);
                  return res.status(401).json({ detail: "Too many failed attempts. OTP invalidated." });
                }

                if (!timingSafeEqualStr(record.otp, otp)) {
                  record.attempts = (record.attempts || 0) + 1;
                  await record.save();
                  await logSecurityEvent(email, record.role, 'PASSWORD_RESET_FAILED', { reason: 'Invalid OTP attempt', attempts: record.attempts }, req);
                  return res.status(401).json({ detail: `Invalid OTP. ${3 - record.attempts} attempts remaining.` });
                }

                const pwError = validatePasswordPolicy(new_password, email);
                if (pwError) {
                  return res.status(400).json({ detail: pwError });
                }

                const user = await User.findOne({ email });
                if (!user) {
                  return res.status(404).json({ detail: "User not found" });
                }

                await Otp.deleteOne({ _id: record._id });

                const hashedPassword = await AuthService.hashPassword(new_password);
                await User.updateOne({ email }, { $set: { password: hashedPassword, password_changed_at: new Date(), failedLoginAttempts: 0, lockoutUntil: null } });

                // Invalidate all active sessions
                if (process.env.NODE_ENV === 'test') {
                  const userSessions = await UserSession.find({ userId: email }).select('tokenHash').lean();
                  if (!global._revokedTestTokens) global._revokedTestTokens = new Set();
                  for (const s of userSessions) {
                    if (s.tokenHash) global._revokedTestTokens.add(s.tokenHash);
                  }
                }
                await UserSession.deleteMany({ userId: email });
                clearRefreshCookie(res);

                // Send password reset success email
                trackJob(EmailService.sendResetPasswordSuccess(email).catch(console.error));

                await logSecurityEvent(email, user.role, 'PASSWORD_RESET', { status: 'success' }, req);

                res.json({ success: true, message: "Password updated successfully" });
              } catch (error) {
                console.error('[Auth] Password reset error:', error);
                res.status(500).json({ detail: 'Unable to reset password.' });
              }
            });

            // ─── POST /auth/change-password ───────────────────────────────────
            router.post('/change-password', authenticate, limitChangePassword, validate(changePasswordSchema), async (req, res) => {
              try {
                const { current_password, new_password } = req.body;
                const user = await User.findOne({ email: req.userEmail });
                if (!user || !user.password) {
                  return res.status(404).json({ detail: "User account or password not found." });
                }

                const isMatch = await AuthService.verifyPassword(current_password, user.password);
                if (!isMatch) {
                  return res.status(400).json({ detail: "Current password is incorrect." });
                }

                const pwError = validatePasswordPolicy(new_password, req.userEmail);
                if (pwError) {
                  return res.status(400).json({ detail: pwError });
                }

                const hashedPassword = await AuthService.hashPassword(new_password);
                const now = new Date();
                await User.updateOne({ email: req.userEmail }, { $set: { password: hashedPassword, password_changed_at: now } });

                // Revoke all other active sessions for this user
                const rawAuth = req.headers['authorization'] || '';
                const currentToken = rawAuth.split(' ')[1] || '';
                const currentTokenHash = currentToken ? crypto.createHash('sha256').update(currentToken).digest('hex') : null;
                const otherSessions = await UserSession.find({
                  userId: req.userEmail,
                  ...(currentTokenHash ? { tokenHash: { $ne: currentTokenHash } } : {})
                }).select('tokenHash').lean();
                if (process.env.NODE_ENV === 'test') {
                  if (!global._revokedTestTokens) global._revokedTestTokens = new Set();
                  for (const s of otherSessions) {
                    if (s.tokenHash) global._revokedTestTokens.add(s.tokenHash);
                  }
                }
                await UserSession.deleteMany({
                  userId: req.userEmail,
                  ...(currentTokenHash ? { tokenHash: { $ne: currentTokenHash } } : {})
                });

                await logSecurityEvent(req.userEmail, user.role, 'PASSWORD_CHANGED', { status: 'success', other_sessions_revoked: otherSessions.length }, req);

                res.json({ success: true, message: "Password updated successfully" });
              } catch (error) {
                reportInternalError(res, error, 'Auth');
              }
            });

            router.get(['/profile', '/me'], authenticate, async (req, res) => {
              try {
                let user = null;
                try {
                  if (require('mongoose').connection.readyState === 1) {
                    user = await User.findOne({ email: req.userEmail }).lean();
                  }
                } catch (_) { }

                if (!user) {
                  const student = datasetService.findStudent(req.userEmail);
                  if (student) {
                    const studentPhoto = `https://api.dicebear.com/7.x/bottts/png?seed=${encodeURIComponent(student.name)}`;
                    return res.json({
                      success: true,
                      message: "Profile retrieved successfully",
                      id: student.roll,
                      email: student.email,
                      full_name: student.name,
                      role: 'student',
                      student_id: student.roll,
                      roll_number: student.roll,
                      department: student.department,
                      semester: student.semester,
                      setup_completed: true,
                      biometric_registered: true,
                      profilePhotoUrl: studentPhoto,
                      avatar_url: studentPhoto,
                      data: {
                        user: {
                          id: student.roll,
                          name: student.name,
                          email: student.email,
                          role: 'student',
                          student_id: student.roll,
                          department: student.department,
                          semester: student.semester,
                          profilePhotoUrl: studentPhoto,
                          avatar_url: studentPhoto,
                          introCompleted: true,
                          wizardCompleted: true
                        }
                      }
                    });
                  }
                  return res.status(404).json({ detail: "User not found" });
                }

                user.id = user._id.toString();
                delete user._id;
                delete user.password;

                const photoUrl = user.profilePhotoUrl || user.avatar_url || null;
                user.profilePhotoUrl = photoUrl;
                user.avatar_url = photoUrl;

                const wizardCompleted = user.setup_completed || user.biometric_registered || false;
                res.json({
                  success: true,
                  message: "Profile retrieved successfully",
                  profilePhotoUrl: photoUrl,
                  avatar_url: photoUrl,
                  ...user,
                  data: {
                    user: {
                      id: user.id,
                      name: user.full_name,
                      email: user.email,
                      role: user.role,
                      profilePhotoUrl: photoUrl,
                      avatar_url: photoUrl,
                      introCompleted: true,
                      wizardCompleted: wizardCompleted
                    }
                  }
                });
              } catch (error) {
                reportInternalError(res, error, 'Auth');
              }
            });

            // ─── POST /auth/update-profile ────────────────────────────────────
            router.post('/update-profile', authenticate, async (req, res) => {
              try {
                const role = (req.userRole || '').toLowerCase();
                const isAdmin = role === 'admin' || role === 'super_admin';

                // Institution-controlled identifiers, roles, and academic assignments cannot be edited by students
                const studentEditableKeys = new Set([
                  'full_name', 'phone', 'dob', 'gender', 'address',
                  'parent_details', 'language_preference', 'theme_preference',
                  'setup_completed', 'profilePhotoUrl', 'avatar_url'
                ]);
                const teacherEditableKeys = new Set([
                  ...studentEditableKeys,
                  'designation', 'specialization', 'qualification', 'experience'
                ]);
                const adminEditableKeys = new Set([
                  ...teacherEditableKeys,
                  'department', 'college', 'semester', 'student_id', 'employee_id',
                  'usn', 'course', 'section', 'roll_number', 'linked_children'
                ]);
                const allowedSet = isAdmin
                  ? adminEditableKeys
                  : (role === 'teacher' ? teacherEditableKeys : studentEditableKeys);

                const updateFields = {};
                for (const key of Object.keys(req.body || {})) {
                  if (!allowedSet.has(key)) continue;
                  const val = req.body[key];
                  if (val === undefined || val === null) continue;
                  if (key === 'full_name') {
                    if (typeof val !== 'string' || val.trim().length < 1 || val.trim().length > 120) {
                      return res.status(400).json({ detail: 'Full name must be between 1 and 120 characters.' });
                    }
                    updateFields.full_name = val.trim();
                  } else if (key === 'phone') {
                    if (typeof val !== 'string' || val.length > 30) {
                      return res.status(400).json({ detail: 'Phone number must be at most 30 characters.' });
                    }
                    updateFields.phone = val.trim();
                  } else if (key === 'profilePhotoUrl' || key === 'avatar_url') {
                    if (typeof val !== 'string' || (!val.startsWith('/static/') && !/^https:\/\//i.test(val))) {
                      return res.status(400).json({ detail: 'Invalid avatar URL.' });
                    }
                    updateFields[key] = val;
                  } else if (typeof val === 'string') {
                    updateFields[key] = val.trim().slice(0, 500);
                  } else {
                    updateFields[key] = val;
                  }
                }

                if (!isAdmin && role === 'parent' && req.body.linked_children !== undefined) {
                  updateFields.linked_children = req.body.linked_children;
                }

                if (updateFields.profilePhotoUrl && !updateFields.avatar_url) {
                  updateFields.avatar_url = updateFields.profilePhotoUrl;
                } else if (updateFields.avatar_url && !updateFields.profilePhotoUrl) {
                  updateFields.profilePhotoUrl = updateFields.avatar_url;
                }

                if (Object.keys(updateFields).length > 0) {
                  await User.updateOne({ email: req.userEmail }, { $set: updateFields });
                  await logSecurityEvent(req.userEmail, req.userRole, 'PROFILE_UPDATED', { fields: Object.keys(updateFields) }, req);
                }

                const updated = await User.findOne({ email: req.userEmail }, '-password').lean();
                res.json({ success: true, message: "Profile updated successfully", user: updated });
              } catch (error) {
                reportInternalError(res, error, 'Auth');
              }
            });

            // ─── PATCH /auth/notification-preferences ─────────────────────────────
            router.patch('/notification-preferences', authenticate, async (req, res) => {
              try {
                const { email, push, in_app, shortage_alerts, reminder_minutes_before, quiet_hours } = req.body || {};
                const updateFields = {};
                if (email !== undefined) updateFields['notification_preferences.email'] = Boolean(email);
                if (push !== undefined) updateFields['notification_preferences.push'] = Boolean(push);
                if (in_app !== undefined) updateFields['notification_preferences.in_app'] = Boolean(in_app);
                if (shortage_alerts !== undefined) updateFields['notification_preferences.shortage_alerts'] = Boolean(shortage_alerts);
                if (reminder_minutes_before !== undefined) {
                  const mins = Number(reminder_minutes_before);
                  if (!Number.isFinite(mins) || mins < 5 || mins > 120) {
                    return res.status(400).json({ detail: 'Reminder lead time must be between 5 and 120 minutes.' });
                  }
                  updateFields['notification_preferences.reminder_minutes_before'] = Math.round(mins);
                }
                if (quiet_hours && typeof quiet_hours === 'object') {
                  if (quiet_hours.enabled !== undefined) updateFields['notification_preferences.quiet_hours.enabled'] = Boolean(quiet_hours.enabled);
                  if (typeof quiet_hours.start === 'string' && /^\d{2}:\d{2}$/.test(quiet_hours.start)) {
                    updateFields['notification_preferences.quiet_hours.start'] = quiet_hours.start;
                  }
                  if (typeof quiet_hours.end === 'string' && /^\d{2}:\d{2}$/.test(quiet_hours.end)) {
                    updateFields['notification_preferences.quiet_hours.end'] = quiet_hours.end;
                  }
                }

                await User.updateOne({ email: req.userEmail }, { $set: updateFields });
                const updated = await User.findOne({ email: req.userEmail }, 'notification_preferences').lean();
                res.json({ success: true, message: "Notification preferences updated successfully", notification_preferences: updated?.notification_preferences });
              } catch (error) {
                reportInternalError(res, error, 'Auth');
              }
            });

            // ─── GET /auth/biometric-status ───────────────────────────────────
            router.get('/biometric-status', authenticate, async (req, res) => {
              try {
                const email = req.userEmail.toLowerCase().trim();
                const [user, profile] = await Promise.all([
                  User.findOne({ email }, 'biometric_registered privacy_preferences').lean(),
                  BiometricProfile.findOne({ user_email: email }, '-embedding').lean()
                ]);

                res.json({
                  success: true,
                  enrolled: Boolean(user?.biometric_registered || profile),
                  biometric_registered: Boolean(user?.biometric_registered || profile),
                  consent_given: Boolean(profile?.consent_given ?? user?.privacy_preferences?.biometric_consent),
                  consent_timestamp: profile?.consent_timestamp || user?.privacy_preferences?.consent_updated_at || null,
                  vector_version: profile?.vector_version || null,
                  updated_at: profile?.updated_at || null
                });
              } catch (error) {
                reportInternalError(res, error, 'Auth');
              }
            });

            // ─── POST /auth/register-biometric ─────────────────────────────────
            router.post('/register-biometric', authenticate, memoryUpload.single('image'), async (req, res) => {
              try {
                const user = await User.findOne({ email: req.userEmail });
                if (!user) {
                  return res.status(404).json({ detail: "User not found" });
                }

                const consentRaw = req.body?.consent_given;
                const consentGiven = consentRaw === true || consentRaw === 'true' || consentRaw === undefined;
                if (!consentGiven) {
                  return res.status(400).json({ detail: "Explicit biometric consent is required before enrollment." });
                }

                let enrolledSuccessfully = false;
                let imageBuffer = null;

                if (req.file && req.file.buffer) {
                  imageBuffer = req.file.buffer;
                } else if (req.body && req.body.image_base64) {
                  imageBuffer = Buffer.from(req.body.image_base64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
                }

                if (!imageBuffer) {
                  return res.status(400).json({ detail: "Face image is required for biometric registration." });
                }

                const enrollRes = await faceAiService.enrollFace(imageBuffer, req.userEmail);
                if (!enrollRes.success || !enrollRes.embedding) {
                  return res.status(enrollRes.status || 400).json({ detail: enrollRes.message || "Face enrollment failed" });
                }

                await BiometricProfile.findOneAndUpdate(
                  { user_email: req.userEmail.toLowerCase().trim() },
                  {
                    user_email: req.userEmail.toLowerCase().trim(),
                    user_id: user._id,
                    embedding: enrollRes.embedding,
                    consent_given: true,
                    consent_timestamp: new Date(),
                    updated_at: new Date()
                  },
                  { upsert: true, new: true }
                );
                enrolledSuccessfully = true;

                await User.updateOne(
                    { email: req.userEmail },
                    {
                      $set: {
                        biometric_registered: true,
                        'privacy_preferences.biometric_consent': true,
                        'privacy_preferences.consent_updated_at': new Date()
                      }
                    }
                  );
                  await logSecurityEvent(req.userEmail, user.role, 'BIOMETRIC_ENROLLED', { enrolled: enrolledSuccessfully }, req);
                  res.json({
                    success: true,
                    message: "Biometric registration successful",
                    enrolled: enrolledSuccessfully
                  });
                } catch (error) {
                  reportInternalError(res, error, 'Auth');
                }
              });

            // ─── DELETE /auth/biometric ─────────────────────────────────────────
            router.delete('/biometric', authenticate, async (req, res) => {
              try {
                const email = req.userEmail.toLowerCase().trim();
                await Promise.all([
                  BiometricProfile.deleteOne({ user_email: email }),
                  User.updateOne(
                    { email },
                    {
                      $set: {
                        biometric_registered: false,
                        'privacy_preferences.biometric_consent': false,
                        'privacy_preferences.consent_updated_at': new Date()
                      }
                    }
                  )
                ]);
                await logSecurityEvent(email, req.userRole, 'BIOMETRIC_DELETED', { self_requested: true }, req);
                res.json({ success: true, message: 'Biometric template and consent withdrawn successfully.' });
              } catch (error) {
                reportInternalError(res, error, 'Auth');
              }
            });

            // ─── GET /auth/privacy/export ──────────────────────────────────────
            router.get('/privacy/export', authenticate, async (req, res) => {
              try {
                const email = req.userEmail.toLowerCase().trim();
                const Attendance = require('../models/Attendance');
                const Leave = require('../models/Leave');
                const AttendanceDispute = require('../models/AttendanceDispute');

                const [user, bio, attendanceCount, leaves, disputes] = await Promise.all([
                  User.findOne({ email }, '-password').lean(),
                  BiometricProfile.findOne({ user_email: email }, '-embedding').lean(),
                  Attendance.countDocuments({ student_email: email }),
                  Leave.find({ user_id: email }).lean(),
                  AttendanceDispute.find({ student_email: email }).lean()
                ]);

                if (!user) return res.status(404).json({ detail: 'User not found' });

                await logSecurityEvent(email, req.userRole, 'PRIVACY_DATA_EXPORTED', {}, req);
                res.json({
                  exported_at: new Date().toISOString(),
                  notice: 'Biometric embeddings are excluded for security and privacy.',
                  profile: user,
                  biometric_metadata: bio || null,
                  attendance_records_count: attendanceCount,
                  leave_applications: leaves,
                  attendance_disputes: disputes
                });
              } catch (error) {
                reportInternalError(res, error, 'Auth');
              }
            });

            // ─── POST /auth/privacy/delete-request ─────────────────────────────
            router.post('/privacy/delete-request', authenticate, async (req, res) => {
              try {
                const email = req.userEmail.toLowerCase().trim();
                const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim().slice(0, 500) : 'Student requested account/data deletion review';
                await User.updateOne(
                  { email },
                  {
                    $set: {
                      'privacy_preferences.deletion_requested_at': new Date(),
                      'privacy_preferences.deletion_reason': reason
                    }
                  }
                );
                await logSecurityEvent(email, req.userRole, 'ACCOUNT_DELETION_REQUESTED', { reason }, req);
                res.json({
                  success: true,
                  message: 'Your data deletion request has been logged for institutional compliance review.'
                });
              } catch (error) {
                reportInternalError(res, error, 'Auth');
              }
            });

            // ─── GET /auth/session ────────────────────────────────────────────
            router.get('/session', authenticate, async (req, res) => {
              try {
                const user = await User.findOne({ email: req.userEmail }, 'email role full_name college_id email_verified biometric_registered setup_completed').lean();
                if (!user) return res.status(404).json({ valid: false, detail: 'User not found' });
                res.json({
                  valid: true,
                  user: {
                    id: user._id.toString(),
                    email: user.email,
                    role: user.role,
                    full_name: user.full_name,
                    college_id: user.college_id || null,
                    email_verified: Boolean(user.email_verified),
                    biometric_registered: Boolean(user.biometric_registered),
                    setup_completed: Boolean(user.setup_completed)
                  }
                });
              } catch (error) {
                reportInternalError(res, error, 'Auth');
              }
            });

            // ─── POST /auth/send-verification & /resend-verification ───────────
            router.post(['/send-verification', '/resend-verification'], limitOtpSend, validate(otpSendSchema), async (req, res) => {
              try {
                const { email } = req.body;
                const genericMsg = 'If an eligible account exists, a verification code will be sent.';
                const user = await User.findOne({ email });
                if (!user || user.email_verified || (user.account_status && user.account_status !== 'active')) {
                  return res.json({ success: true, message: genericMsg });
                }

                const existing = await Otp.findOne({ email, type: 'email_verification' });
                if (existing) {
                  const createdTime = existing.expiry.getTime() - 10 * 60 * 1000;
                  if ((Date.now() - createdTime) / 1000 < 60) {
                    return res.status(429).json({ detail: 'Please wait before requesting another verification code.' });
                  }
                }

                const otpVal = Array.from({ length: 6 }, () => crypto.randomInt(0, 10)).join('');
                const expiry = new Date(Date.now() + 10 * 60 * 1000);
                await Otp.updateOne(
                  { email, type: 'email_verification' },
                  { $set: { otp: otpVal, expiry, role: user.role, type: 'email_verification', attempts: 0, deliveryStatus: 'pending' } },
                  { upsert: true }
                );

                const sent = await EmailService.sendOtp(email, otpVal, 'register');
                await Otp.updateOne({ email, type: 'email_verification' }, { $set: { deliveryStatus: sent ? 'sent' : 'failed' } });
                res.json({ success: true, message: genericMsg });
              } catch (error) {
                reportInternalError(res, error, 'Auth');
              }
            });

            // ─── POST /auth/verify-email ──────────────────────────────────────
            router.post('/verify-email', limitOtpVerify, validate(otpVerifySchema), async (req, res) => {
              try {
                const { email, otp } = req.body;
                const record = await Otp.findOne({ email, type: 'email_verification' });
                if (!record || record.deliveryStatus === 'failed' || new Date() > record.expiry) {
                  return res.status(401).json({ detail: 'Invalid or expired verification code' });
                }
                if (record.attempts >= 3) {
                  await Otp.deleteOne({ _id: record._id });
                  return res.status(401).json({ detail: 'Too many failed attempts. Code invalidated.' });
                }
                if (!timingSafeEqualStr(record.otp, otp)) {
                  record.attempts = (record.attempts || 0) + 1;
                  await record.save();
                  return res.status(401).json({ detail: 'Invalid verification code' });
                }
                await Otp.deleteOne({ _id: record._id });
                const user = await User.findOneAndUpdate(
                  { email },
                  { $set: { email_verified: true } },
                  { new: true }
                );
                if (!user) return res.status(404).json({ detail: 'User not found' });
                await logSecurityEvent(email, user.role, 'EMAIL_VERIFIED', {}, req);
                res.json({ success: true, email_verified: true, message: 'Email verified successfully.' });
              } catch (error) {
                reportInternalError(res, error, 'Auth');
              }
            });

            // ─── GET /auth/students ───────────────────────────────────────────
            router.get('/students', authenticate, requireRole(['teacher', 'hod', 'principal', 'management', 'admin', 'super_admin']), async (req, res) => {
              try {
                const tenant = await resolveAdminTenant(req);
                const filter = buildTenantUserFilter(tenant, { role: 'student' });
                const students = await User.find(filter).lean();
                const result = students.map(s => ({
                  email: s.email,
                  full_name: s.full_name,
                  student_id: s.student_id || '000',
                  profilePhotoUrl: s.profilePhotoUrl || s.avatar_url || null,
                  avatar_url: s.profilePhotoUrl || s.avatar_url || null
                }));
                res.json(result);
              } catch (error) {
                reportInternalError(res, error, 'Auth');
              }
            });

            // ─── POST /auth/upload-student-face ─────────────────────────────────
            router.post('/upload-student-face', authenticate, requireRole(['teacher', 'hod', 'principal', 'admin', 'super_admin']), (req, res) => {
              datasetUpload.single('file')(req, res, (err) => {
                if (err) {
                  return res.status(400).json({ detail: 'Invalid upload request.' });
                }
                if (!req.file) {
                  return res.status(400).json({ detail: "No file uploaded" });
                }
                res.json({ message: `Successfully uploaded ${req.file.filename} for student.` });
              });
            });

            // Helper handler for profile photo uploads using Multer memoryStorage and Sharp optimization
            const handleProfilePhotoUpload = async (req, res) => {
              const uploadMiddleware = memoryAvatarUpload.fields([
                { name: 'file', maxCount: 1 },
                { name: 'photo', maxCount: 1 },
                { name: 'avatar', maxCount: 1 }
              ]);

              uploadMiddleware(req, res, async (err) => {
                if (err) {
                  if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({ success: false, detail: "File too large. Maximum size is 2MB." });
                  }
                  return res.status(400).json({ success: false, detail: 'Invalid upload request.' });
                }

                const file = (req.files && (req.files.file?.[0] || req.files.photo?.[0] || req.files.avatar?.[0])) || req.file;
                if (!file || !file.buffer) {
                  return res.status(400).json({ success: false, detail: "No image file uploaded." });
                }

                try {
                  const buffer = file.buffer;
                  // Validate magic bytes to verify true image format
                  const isJpeg = buffer.length > 3 && buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
                  const isPng = buffer.length > 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
                  const isWebp = buffer.length > 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';

                  if (!isJpeg && !isPng && !isWebp) {
                    return res.status(400).json({ success: false, detail: "Invalid image content. File signature does not match JPEG, PNG, or WebP." });
                  }

                  // Generate UUID-based filename and safe destination path
                  const fileUuid = crypto.randomUUID();
                  const outputFilename = `avatar_${fileUuid}.webp`;
                  const outputPath = path.join(avatarsDir, outputFilename);

                  // Re-encode via Sharp: resize to 400x400 cover crop, strip EXIF metadata, convert to WebP
                  await sharp(buffer)
                    .resize(400, 400, {
                      fit: 'cover',
                      position: 'center'
                    })
                    .rotate() // auto-orient based on EXIF before stripping
                    .withMetadata(false) // strip all EXIF metadata for privacy & security
                    .webp({ quality: 85 })
                    .toFile(outputPath);

                  // Delete prior avatar file if it was a local file in avatarsDir
                  const user = await User.findOne({ email: req.userEmail });
                  if (user && (user.profilePhotoUrl || user.avatar_url)) {
                    const oldUrl = user.profilePhotoUrl || user.avatar_url;
                    const oldFilename = path.basename(oldUrl);
                    if (oldFilename && oldFilename !== outputFilename) {
                      const oldPath = path.join(avatarsDir, oldFilename);
                      if (fs.existsSync(oldPath)) {
                        try {
                          fs.unlinkSync(oldPath);
                        } catch (unlinkErr) {
                          console.warn("Could not delete old avatar:", unlinkErr.message);
                        }
                      }
                    }
                  }

                  const avatarUrl = `/static/avatars/${outputFilename}`;
                  await User.updateOne(
                    { email: req.userEmail },
                    {
                      $set: {
                        avatar_url: avatarUrl,
                        profilePhotoUrl: avatarUrl,
                        profilePhotoPublicId: outputFilename
                      }
                    }
                  );

                  const updatedUser = await User.findOne({ email: req.userEmail }).lean();

                  return res.json({
                    success: true,
                    message: "Profile photo updated successfully.",
                    profilePhotoUrl: avatarUrl,
                    avatar_url: avatarUrl,
                    profilePhotoPublicId: outputFilename,
                    user: {
                      id: updatedUser._id.toString(),
                      name: updatedUser.full_name,
                      email: updatedUser.email,
                      role: updatedUser.role,
                      profilePhotoUrl: avatarUrl,
                      avatar_url: avatarUrl
                    }
                  });
                } catch (processErr) {
                  console.error("Avatar image processing error:", processErr);
                  return res.status(500).json({ success: false, detail: "Failed to process and optimize image: " + processErr.message });
                }
              });
            };

            // ─── POST /auth/update-profile-photo & aliases ──────────────────────────
            router.post('/update-profile-photo', authenticate, handleProfilePhotoUpload);
            router.post('/upload-avatar', authenticate, handleProfilePhotoUpload);
            router.patch('/users/me/profile-photo', authenticate, handleProfilePhotoUpload);
            router.post('/users/me/profile-photo', authenticate, handleProfilePhotoUpload);

            // ─── DELETE /api/users/me/profile-photo & DELETE /auth/delete-avatar ────────
            const handleProfilePhotoDelete = async (req, res) => {
              try {
                const user = await User.findOne({ email: req.userEmail });
                if (user && (user.profilePhotoUrl || user.avatar_url)) {
                  const oldUrl = user.profilePhotoUrl || user.avatar_url;
                  const oldFilename = oldUrl.split('/').pop();
                  if (oldFilename) {
                    const oldPath = path.join(avatarsDir, oldFilename);
                    if (fs.existsSync(oldPath)) {
                      try {
                        fs.unlinkSync(oldPath);
                      } catch (e) {
                        console.error("Failed to delete old avatar file:", e);
                      }
                    }
                  }
                }

                await User.updateOne(
                  { email: req.userEmail },
                  {
                    $unset: {
                      avatar_url: 1,
                      profilePhotoUrl: 1,
                      profilePhotoPublicId: 1
                    }
                  }
                );

                const updatedUser = await User.findOne({ email: req.userEmail }).lean();

                res.json({
                  success: true,
                  message: "Profile photo deleted successfully.",
                  profilePhotoUrl: null,
                  avatar_url: null,
                  user: {
                    id: updatedUser._id.toString(),
                    name: updatedUser.full_name,
                    email: updatedUser.email,
                    role: updatedUser.role,
                    profilePhotoUrl: null,
                    avatar_url: null
                  }
                });
              } catch (error) {
                reportInternalError(res, error, 'Auth');
              }
            };

            router.delete('/users/me/profile-photo', authenticate, handleProfilePhotoDelete);
            router.delete('/delete-avatar', authenticate, handleProfilePhotoDelete);

            // ─── POST /auth/train-faces ───────────────────────────────────────
            router.post('/train-faces', authenticate, requireRole(['teacher', 'hod', 'principal', 'admin', 'super_admin']), async (req, res) => {
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
                reportInternalError(res, error, 'Auth');
              }
            });

            // ─── POST /auth/token/refresh ──────────────────────────────────────
            router.post('/token/refresh', async (req, res) => {
              try {
                const browserClient = Boolean(req.headers.origin);
                const refresh_token = req.body?.refresh_token || (browserClient ? readRefreshCookie(req) : null);
                if (!refresh_token) {
                  if (browserClient) clearRefreshCookie(res);
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
                    if (browserClient) clearRefreshCookie(res);
                    return res.status(401).json({ detail: "Revoked session family due to token reuse detection." });
                  }
                  if (browserClient) clearRefreshCookie(res);
                  return res.status(401).json({ detail: "Invalid refresh token" });
                }

                // Check expiry
                if (new Date() > session.expiry) {
                  await UserSession.deleteOne({ _id: session._id });
                  if (browserClient) clearRefreshCookie(res);
                  return res.status(401).json({ detail: "Refresh token expired" });
                }

                const user = await User.findOne({ email: session.userId });
                if (!user || (user.account_status && user.account_status !== 'active')) {
                  await UserSession.deleteOne({ _id: session._id });
                  if (browserClient) clearRefreshCookie(res);
                  return res.status(401).json({ detail: "Account inactive or not found" });
                }

                const newAccessToken = AuthService.createAccessToken({ sub: user.email, role: user.role });
                const newRefreshToken = crypto.randomBytes(32).toString('hex');

                const newTokenHash = crypto.createHash('sha256').update(newAccessToken).digest('hex');
                const newRefreshTokenHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');

                const rememberMe = Boolean(session.remember_me);
                const ttlDays = rememberMe ? 30 : 7;

                session.tokenHash = newTokenHash;
                session.revokedRefreshTokenHashes = [...(session.revokedRefreshTokenHashes || []).slice(-19), incomingHash];
                session.refreshTokenHash = newRefreshTokenHash;
                session.lastActive = new Date();
                session.expiry = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);

                await session.save();

                if (browserClient) res.cookie(REFRESH_COOKIE_NAME, newRefreshToken, refreshCookieOptions(rememberMe));

                res.json({
                  access_token: newAccessToken,
                  refresh_token: browserClient ? undefined : newRefreshToken,
                  token_type: "bearer"
                });
              } catch (error) {
                reportInternalError(res, error, 'Auth');
              }
              });

            // ─── GET /auth/sessions/active ─────────────────────────────────────
            router.get('/sessions/active', authenticate, async (req, res) => {
              try {
                const rawAuth = req.headers['authorization'] || '';
                const tokenPart = rawAuth.includes(' ') ? rawAuth.split(' ')[1] : rawAuth;
                const currentTokenHash = tokenPart ? crypto.createHash('sha256').update(tokenPart).digest('hex') : null;

                const sessions = await UserSession.find({ userId: req.userEmail }).sort({ lastActive: -1 }).lean();
                const result = sessions.map(s => ({
                  id: s._id.toString(),
                  device: s.device || 'Authorized Device',
                  ip: s.ip || req.ip || '127.0.0.1',
                  location: s.location || 'Current Network',
                  last_active: s.lastActive || new Date(),
                  is_current: currentTokenHash ? currentTokenHash === s.tokenHash : false
                }));

                res.json(result);
              } catch (error) {
                reportInternalError(res, error, 'Auth');
              }
            });

            // ─── POST /auth/sessions/logout-all & /auth/logout-all ─────────────
            router.post(['/sessions/logout-all', '/logout-all'], authenticate, async (req, res) => {
                try {
                  const currentToken = req.headers['authorization'].split(' ')[1];
                  const currentTokenHash = crypto.createHash('sha256').update(currentToken).digest('hex');

                  // Delete all sessions for this user EXCEPT the current one
                  const otherSessions = await UserSession.find({
                    userId: req.userEmail,
                    tokenHash: { $ne: currentTokenHash }
                  }).select('tokenHash').lean();
                  if (!global._revokedTestTokens) global._revokedTestTokens = new Set();
                  for (const s of otherSessions) {
                    if (s.tokenHash) global._revokedTestTokens.add(s.tokenHash);
                  }
                  await UserSession.deleteMany({
                    userId: req.userEmail,
                    tokenHash: { $ne: currentTokenHash }
                  });

                  await logSecurityEvent(req.userEmail, req.userRole, 'LOGOUT_EVENT', { scope: 'all_other_devices' }, req);

                  res.json({ message: "Successfully logged out of all other devices" });
                } catch (error) {
                  reportInternalError(res, error, 'Auth');
                }
              });

              // ─── POST /auth/logout ─────────────────────────────────────────────
              // Revoke the current session (server-side) for a clean, secure logout.
              router.post('/logout', authenticate, async (req, res) => {
                try {
                  const currentToken = req.headers['authorization'].split(' ')[1];
                  const currentTokenHash = crypto.createHash('sha256').update(currentToken).digest('hex');
                  if (!global._revokedTestTokens) global._revokedTestTokens = new Set();
                  global._revokedTestTokens.add(currentTokenHash);
                  await UserSession.deleteOne({ userId: req.userEmail, tokenHash: currentTokenHash });

                  await logSecurityEvent(req.userEmail, req.userRole, 'LOGOUT_EVENT', { scope: 'current_device' }, req);
                  clearRefreshCookie(res);

                  res.json({ message: "Logged out successfully" });
                } catch (error) {
                  reportInternalError(res, error, 'Auth');
                }
              });

              // ─── DELETE /auth/sessions/:id ─────────────────────────────────────
              // Revoke a specific device session belonging to the authenticated user.
              router.delete('/sessions/:id', authenticate, async (req, res) => {
                try {
                  const { id } = req.params;
                  const sessionToDelete = await UserSession.findOne({ _id: id, userId: req.userEmail });
                  if (!sessionToDelete) {
                    return res.status(404).json({ detail: "Session not found" });
                  }
                  if (sessionToDelete.tokenHash) {
                    if (!global._revokedTestTokens) global._revokedTestTokens = new Set();
                    global._revokedTestTokens.add(sessionToDelete.tokenHash);
                  }
                  await UserSession.deleteOne({ _id: id, userId: req.userEmail });

                  await logSecurityEvent(req.userEmail, req.userRole, 'LOGOUT_EVENT', { scope: `device_${id}` }, req);

                  res.json({ message: "Session revoked successfully" });
                } catch (error) {
                  reportInternalError(res, error, 'Auth');
                }
              });

              // ─── MFA (TOTP + Recovery Codes) ────────────────────────────────────
              router.post('/mfa/setup', authenticate, async (req, res) => {
                try {
                  const user = await User.findOne({ email: req.userEmail });
                  if (!user) return res.status(404).json({ detail: 'User not found' });
                  if (user.mfa?.enabled) {
                    return res.status(400).json({ detail: 'MFA is already enabled. Disable it first to reconfigure.' });
                  }
                  const secret = TotpService.generateTotpSecret();
                  const encrypted = TotpService.encryptSecret(secret);
                  await User.updateOne(
                    { _id: user._id },
                    { $set: { 'mfa.totp_secret_encrypted': encrypted, 'mfa.enabled': false } }
                  );
                  const otpauthUrl = TotpService.buildOtpAuthUri({ secret, email: user.email });
                  res.json({ success: true, secret, otpauth_url: otpauthUrl });
                } catch (error) {
                  reportInternalError(res, error, 'Auth');
                }
              });

              router.post('/mfa/verify', authenticate, validate(mfaCodeSchema), async (req, res) => {
                try {
                  const user = await User.findOne({ email: req.userEmail });
                  if (!user || !user.mfa?.totp_secret_encrypted) {
                    return res.status(400).json({ detail: 'MFA setup has not been initiated.' });
                  }
                  const secret = TotpService.decryptSecret(user.mfa.totp_secret_encrypted);
                  if (!TotpService.verifyTotp(secret, req.body.code)) {
                    return res.status(401).json({ detail: 'Invalid authenticator code.' });
                  }
                  const { plain, hashes } = TotpService.generateRecoveryCodes(8);
                  await User.updateOne(
                    { _id: user._id },
                    { $set: { 'mfa.enabled': true, 'mfa.recovery_code_hashes': hashes, 'mfa.enrolled_at': new Date() } }
                  );
                  await logSecurityEvent(req.userEmail, user.role, 'MFA_ENABLED', {}, req);
                  res.json({ success: true, mfa_enabled: true, recovery_codes: plain });
                } catch (error) {
                  reportInternalError(res, error, 'Auth');
                }
              });

              router.post('/mfa/disable', authenticate, validate(mfaDisableSchema), async (req, res) => {
                try {
                  const user = await User.findOne({ email: req.userEmail });
                  if (!user || !user.mfa?.enabled) {
                    return res.status(400).json({ detail: 'MFA is not currently enabled.' });
                  }
                  const { current_password, code } = req.body;
                  let verified = false;
                  if (current_password && user.password) {
                    verified = await AuthService.verifyPassword(current_password, user.password);
                  }
                  if (!verified && code && user.mfa?.totp_secret_encrypted) {
                    const secret = TotpService.decryptSecret(user.mfa.totp_secret_encrypted);
                    verified = TotpService.verifyTotp(secret, code);
                  }
                  if (!verified) {
                    return res.status(401).json({ detail: 'Valid password or authenticator code required to disable MFA.' });
                  }
                  await User.updateOne(
                    { _id: user._id },
                    { $set: { 'mfa.enabled': false, 'mfa.totp_secret_encrypted': null, 'mfa.recovery_code_hashes': [] } }
                  );
                  await logSecurityEvent(req.userEmail, user.role, 'MFA_DISABLED', {}, req);
                  res.json({ success: true, mfa_enabled: false, message: 'MFA disabled successfully.' });
                } catch (error) {
                  reportInternalError(res, error, 'Auth');
                }
              });

              router.post('/mfa/challenge', limitOtpVerify, async (req, res) => {
                try {
                  const { mfa_token, code } = req.body || {};
                  if (!mfa_token || !code) {
                    return res.status(400).json({ detail: 'mfa_token and verification code are required.' });
                  }
                  const payload = AuthService.decodeToken(mfa_token);
                  if (!payload || !payload.mfa_pending || !payload.sub) {
                    return res.status(401).json({ detail: 'Invalid or expired MFA challenge token.' });
                  }
                  const user = await User.findOne({ email: payload.sub.toLowerCase() });
                  if (!user || (user.account_status && user.account_status !== 'active') || !user.mfa?.enabled) {
                    return res.status(401).json({ detail: 'MFA challenge failed.' });
                  }

                  const secret = TotpService.decryptSecret(user.mfa.totp_secret_encrypted);
                  let ok = TotpService.verifyTotp(secret, code);
                  if (!ok) {
                    const codeHash = TotpService.hashRecoveryCode(code);
                    const hashes = user.mfa.recovery_code_hashes || [];
                    if (hashes.includes(codeHash)) {
                      ok = true;
                      await User.updateOne(
                        { _id: user._id },
                        { $set: { 'mfa.recovery_code_hashes': hashes.filter(h => h !== codeHash) } }
                      );
                    }
                  }
                  if (!ok) {
                    await logSecurityEvent(user.email, user.role, 'MFA_CHALLENGE_FAILED', {}, req);
                    return res.status(401).json({ detail: 'Invalid verification or recovery code.' });
                  }

                  const rememberMe = Boolean(payload.remember_me);
                  const accessToken = AuthService.createAccessToken({ sub: user.email, role: user.role });
                  const refreshToken = await registerSession(user.email, accessToken, req, rememberMe, 'mfa');
                  await logSecurityEvent(user.email, user.role, 'LOGIN_EVENT', { method: 'mfa' }, req);
                  res.json(formatAuthResponse(user, accessToken, refreshToken, 'MFA verified', req, res, rememberMe));
                } catch (error) {
                  reportInternalError(res, error, 'Auth');
                }
              });

              // ─── Account Linking & Providers ────────────────────────────────────
              router.get('/providers', authenticate, async (req, res) => {
                try {
                  const user = await User.findOne({ email: req.userEmail }, 'password oauth_providers mfa.enabled').lean();
                  if (!user) return res.status(404).json({ detail: 'User not found' });
                  res.json({
                    success: true,
                    has_password: Boolean(user.password),
                    mfa_enabled: Boolean(user.mfa?.enabled),
                    providers: (user.oauth_providers || []).map(p => ({
                      provider: p.provider,
                      email: p.email,
                      linked_at: p.linked_at
                    }))
                  });
                } catch (error) {
                  reportInternalError(res, error, 'Auth');
                }
              });

              router.delete('/providers/:provider', authenticate, async (req, res) => {
                try {
                  const provider = String(req.params.provider || '').toLowerCase();
                  if (!['google', 'github'].includes(provider)) {
                    return res.status(400).json({ detail: 'Unsupported provider.' });
                  }
                  const user = await User.findOne({ email: req.userEmail });
                  if (!user) return res.status(404).json({ detail: 'User not found' });

                  const remaining = (user.oauth_providers || []).filter(p => p.provider !== provider);
                  if (!user.password && remaining.length === 0) {
                    return res.status(400).json({ detail: 'Cannot unlink your final sign-in method. Set a password first.' });
                  }
                  await User.updateOne({ _id: user._id }, { $set: { oauth_providers: remaining } });
                  await logSecurityEvent(req.userEmail, user.role, 'PROVIDER_UNLINKED', { provider }, req);
                  res.json({ success: true, message: `${provider} unlinked successfully.` });
                } catch (error) {
                  reportInternalError(res, error, 'Auth');
                }
              });

              // ─── Institutional Invitations ──────────────────────────────────────
              router.post('/invitations', authenticate, requireRole(['admin', 'super_admin', 'principal']), validate(invitationCreateSchema), async (req, res) => {
                try {
                  const { email, role, department, expires_hours } = req.body;
                  if (role === 'admin' && req.userRole !== 'super_admin') {
                    return res.status(403).json({ detail: 'Only super_admin can invite admin accounts.' });
                  }
                  const tenant = await resolveAdminTenant(req);
                  const rawToken = crypto.randomBytes(32).toString('hex');
                  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
                  const expiresAt = new Date(Date.now() + expires_hours * 60 * 60 * 1000);

                  await Invitation.create({
                    token_hash: tokenHash,
                    email,
                    role,
                    college_id: tenant.collegeId || null,
                    college_name: tenant.collegeName || null,
                    department: department || null,
                    invited_by: req.userEmail,
                    status: 'pending',
                    expires_at: expiresAt
                  });

                  await logSecurityEvent(req.userEmail, req.userRole, 'INVITATION_CREATED', { invited_email: email, role }, req);
                  res.status(201).json({
                    success: true,
                    invitation_token: rawToken,
                    expires_at: expiresAt
                  });
                } catch (error) {
                  reportInternalError(res, error, 'Auth');
                }
              });

              router.post('/invitations/accept', limitRegister, validate(invitationAcceptSchema), async (req, res) => {
                try {
                  const { token, full_name, password } = req.body;
                  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
                  const now = new Date();
                  const invite = await Invitation.findOneAndUpdate(
                    { token_hash: tokenHash, status: 'pending', expires_at: { $gt: now } },
                    { $set: { status: 'accepted', accepted_at: now } },
                    { new: true }
                  );
                  if (!invite) {
                    return res.status(400).json({ detail: 'Invalid, expired, or already used invitation token.' });
                  }

                  const pwError = validatePasswordPolicy(password, invite.email);
                  if (pwError) {
                    await Invitation.updateOne({ _id: invite._id }, { $set: { status: 'pending', accepted_at: null } });
                    return res.status(400).json({ detail: pwError });
                  }

                  const hashedPassword = await AuthService.hashPassword(password);
                  let user = await User.findOne({ email: invite.email });
                  if (!user) {
                    user = await User.create({
                      email: invite.email,
                      full_name,
                      role: invite.role,
                      password: hashedPassword,
                      email_verified: true,
                      account_status: 'active',
                      college_id: invite.college_id,
                      college: invite.college_name,
                      department: invite.department,
                      institutions: invite.college_id ? [{
                        college_id: invite.college_id,
                        college_name: invite.college_name,
                        role: invite.role,
                        department: invite.department,
                        status: 'active'
                      }] : []
                    });
                  } else {
                    await User.updateOne(
                      { _id: user._id },
                      {
                        $set: {
                          full_name,
                          password: hashedPassword,
                          role: invite.role,
                          email_verified: true,
                          account_status: 'active',
                          college_id: invite.college_id || user.college_id,
                          college: invite.college_name || user.college
                        }
                      }
                    );
                    user = await User.findById(user._id);
                  }

                  const accessToken = AuthService.createAccessToken({ sub: user.email, role: user.role });
                  const refreshToken = await registerSession(user.email, accessToken, req, false, 'invitation');
                  await logSecurityEvent(user.email, user.role, 'INVITATION_ACCEPTED', { college_id: invite.college_id }, req);
                  res.json(formatAuthResponse(user, accessToken, refreshToken, 'Invitation accepted successfully', req, res));
                } catch (error) {
                  reportInternalError(res, error, 'Auth');
                }
              });

              // ─── Multi-Institution Switch ───────────────────────────────────────
              router.post('/switch-institution', authenticate, validate(switchInstitutionSchema), async (req, res) => {
                try {
                  const targetCollegeId = req.body.college_id;
                  const user = await User.findOne({ email: req.userEmail });
                  if (!user) return res.status(404).json({ detail: 'User not found' });

                  const membership = (user.institutions || []).find(
                    inst => inst.college_id === targetCollegeId && inst.status === 'active'
                  );
                  const isPrimary = user.college_id && user.college_id === targetCollegeId;
                  if (!membership && !isPrimary && req.userRole !== 'super_admin') {
                    return res.status(403).json({ detail: 'Forbidden: No active membership in target institution.' });
                  }

                  const newRole = membership?.role || user.role;
                  await User.updateOne(
                    { _id: user._id },
                    { $set: { college_id: targetCollegeId, ...(membership?.college_name ? { college: membership.college_name } : {}), role: newRole } }
                  );
                  const updatedUser = await User.findById(user._id);
                  const accessToken = AuthService.createAccessToken({ sub: updatedUser.email, role: updatedUser.role, college_id: targetCollegeId });
                  const refreshToken = await registerSession(updatedUser.email, accessToken, req, false, 'institution_switch');
                  await logSecurityEvent(updatedUser.email, updatedUser.role, 'INSTITUTION_SWITCHED', { college_id: targetCollegeId }, req);
                  res.json(formatAuthResponse(updatedUser, accessToken, refreshToken, 'Institution switched', req, res));
                } catch (error) {
                  reportInternalError(res, error, 'Auth');
                }
              });

              module.exports = router;
