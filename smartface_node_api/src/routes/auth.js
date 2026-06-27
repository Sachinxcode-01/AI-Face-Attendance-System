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
const { limitRegister, limitOtpSend, limitOtpVerify } = require('../middleware/rateLimiter');

async function registerSession(userId, token, req) {
  try {
    const userAgent = req.headers['user-agent'] || 'Unknown Device';
    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    
    // Hash token to identify the session uniquely
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    await UserSession.create({
      userId,
      device: userAgent,
      ip,
      location: "Local Network",
      tokenHash
    });
  } catch (err) {
    console.error("Session Registration Error:", err);
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

    const hashedPassword = await AuthService.hashPassword(password);
    const newUser = new User({
      email,
      full_name,
      role: role.toLowerCase(),
      password: hashedPassword
    });

    await newUser.save();

    // Send Welcome Email in background
    EmailService.sendRegistrationSuccess(email, full_name).catch(console.error);

    const response = newUser.toObject();
    delete response.password;
    response.id = response._id.toString();
    delete response._id;

    res.status(201).json(response);
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

    const otpVal = Array.from({ length: 6 }, () => Math.floor(Math.random() * 10)).join('');
    const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await Otp.updateOne(
      { email },
      { $set: { otp: otpVal, expiry, role: user.role, type: 'login' } },
      { upsert: true }
    );

    console.log(`Generated login OTP for ${email}`);

    // Send OTP email in background
    EmailService.sendOtp(email, otpVal).catch(console.error);

    res.json({ message: "OTP sent successfully" });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// ─── POST /auth/login-otp/verify ──────────────────────────────────
router.post('/login-otp/verify', limitOtpVerify, async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    const record = await Otp.findOne({ email, type: 'login' });
    if (!record || record.otp !== otp) {
      return res.status(401).json({ detail: "Invalid OTP" });
    }

    if (new Date() > record.expiry) {
      return res.status(401).json({ detail: "OTP expired" });
    }

    await Otp.deleteOne({ email });

    const user = await User.findOne({ email });
    const biometricRegistered = user ? user.biometric_registered : false;
    const role = user ? user.role : record.role;

    const token = AuthService.createAccessToken({ sub: email, role });
    await registerSession(email, token, req);

    res.json({
      access_token: token,
      token_type: "bearer",
      role,
      biometric_registered: biometricRegistered,
      setup_completed: user ? (user.setup_completed || user.biometric_registered) : biometricRegistered
    });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// ─── POST /auth/login-password ────────────────────────────────────
router.post('/login-password', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ detail: "Invalid email or password" });
    }

    if (!user.password || !(await AuthService.verifyPassword(password, user.password))) {
      return res.status(401).json({ detail: "Invalid email or password" });
    }

    const token = AuthService.createAccessToken({ sub: email, role: user.role });
    await registerSession(email, token, req);

    res.json({
      access_token: token,
      token_type: "bearer",
      role: user.role,
      biometric_registered: user.biometric_registered,
      setup_completed: user.setup_completed || user.biometric_registered
    });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// ─── POST /auth/google ───────────────────────────────────────────
router.post('/google', async (req, res) => {
  try {
    const { email, name, role, avatar_url } = req.body;
    let user = await User.findOne({ email });
    let biometricRegistered = false;
    let userRole = role ? role.toLowerCase() : 'student';

    if (!user) {
      user = new User({
        email,
        full_name: name,
        role: userRole,
        biometric_registered: false,
        avatar_url: avatar_url || null
      });
      await user.save();
      // Send Welcome Email in background
      EmailService.sendRegistrationSuccess(email, name).catch(console.error);
    } else {
      userRole = user.role;
      biometricRegistered = user.biometric_registered;
      // Sync Google profile photo if not already set
      if (!user.avatar_url && avatar_url) {
        await User.updateOne({ email }, { $set: { avatar_url } });
      }
    }

    const token = AuthService.createAccessToken({ sub: email, role: userRole });
    await registerSession(email, token, req);

    res.json({
      access_token: token,
      token_type: "bearer",
      role: userRole,
      biometric_registered: biometricRegistered,
      setup_completed: user.setup_completed || biometricRegistered
    });
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

    const otpVal = Array.from({ length: 6 }, () => Math.floor(Math.random() * 10)).join('');
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await Otp.updateOne(
      { email },
      { $set: { otp: otpVal, expiry, role: user.role, type: 'password_reset' } },
      { upsert: true }
    );

    console.log(`Generated password reset OTP for ${email}`);

    EmailService.sendOtp(email, otpVal).catch(console.error);

    res.json({ message: "OTP sent to email" });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// ─── POST /auth/reset-password ────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, new_password } = req.body;

    const record = await Otp.findOne({ email, type: 'password_reset' });
    if (!record || record.otp !== otp) {
      return res.status(401).json({ detail: "Invalid OTP" });
    }

    if (new Date() > record.expiry) {
      return res.status(401).json({ detail: "OTP expired" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ detail: "User not found" });
    }

    await Otp.deleteOne({ email });

    const hashedPassword = await AuthService.hashPassword(new_password);
    await User.updateOne({ email }, { $set: { password: hashedPassword } });

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// ─── GET /auth/profile ───────────────────────────────────────────
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.userEmail }).lean();
    if (!user) {
      return res.status(404).json({ detail: "User not found" });
    }

    user.id = user._id.toString();
    delete user._id;
    delete user.password;

    res.json(user);
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
    res.json({ message: "Session revoked successfully" });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

module.exports = router;
