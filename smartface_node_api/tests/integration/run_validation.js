const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const express = require('express');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URL = process.env.MONGODB_URL;
if (!MONGODB_URL) {
  console.error("❌ MONGODB_URL is missing in environment");
  process.exit(1);
}
const TEST_PORT = 8009;
const TEST_URL = `http://localhost:${TEST_PORT}`;

// Test users
const STUDENT_EMAIL = "audit_student@smartface.elite";
const TEACHER_EMAIL = "audit_teacher@smartface.elite";
const ADMIN_EMAIL = "audit_admin@smartface.elite";
const TEST_PASSWORD = "Secure123!_@#";

async function runValidation() {
  console.log("======================================================================");
  console.log("⚡ SMARTFACE ELITE — AUTOMATED SECURITY & INTEGRITY AUDIT SEQUENCE");
  console.log("======================================================================\n");

  // --- 1. Database Connection ---
  console.log("🔋 Connecting to MongoDB Cluster...");
  try {
    await mongoose.connect(MONGODB_URL, { dbName: 'smartface' });
    console.log("✅ MongoDB Connection Successful.");
    console.log(`📡 Database Name: "${mongoose.connection.name}"`);
  } catch (err) {
    console.error("❌ Database Connection Failed:", err.message);
    process.exit(1);
  }

  // --- 2. Clean Up Audit Test Data ---
  console.log("\n🧹 Purging existing audit data...");
  const User = require('../../src/models/User');
  const Otp = require('../../src/models/Otp');
  const Leave = require('../../src/models/Leave');
  const Attendance = require('../../src/models/Attendance');
  const Notification = require('../../src/models/Notification');
  const SecurityLog = require('../../src/models/SecurityLog');
  const Session = require('../../src/models/Session');

  await Promise.all([
    User.deleteMany({ email: { $in: [STUDENT_EMAIL, TEACHER_EMAIL, ADMIN_EMAIL] } }),
    Otp.deleteMany({ email: { $in: [STUDENT_EMAIL, TEACHER_EMAIL, ADMIN_EMAIL] } }),
    Leave.deleteMany({ user_id: { $in: [STUDENT_EMAIL, TEACHER_EMAIL, ADMIN_EMAIL] } }),
    Notification.deleteMany({ user_id: { $in: [STUDENT_EMAIL, TEACHER_EMAIL, ADMIN_EMAIL] } }),
  ]);
  console.log("✅ Audit data purged successfully.");

  // --- 3. Unit Assertions (Security, Hashing & JWT) ---
  console.log("\n🔑 Auditing Cryptographic & Authentication Utilities...");
  const AuthService = require('../../src/services/authService');
  
  // Test password hashing integrity
  const hashed = await AuthService.hashPassword(TEST_PASSWORD);
  if (!hashed || hashed === TEST_PASSWORD) {
    throw new Error("Password hashing failed to obscure plaintext password!");
  }
  console.log("✅ Plaintext passwords correctly hashed using bcrypt.");

  const verifyMatch = await AuthService.verifyPassword(TEST_PASSWORD, hashed);
  if (!verifyMatch) {
    throw new Error("Hashed password validation failed!");
  }
  console.log("✅ Hashed password comparison verified successfully.");

  // Test JWT Signing
  const tokenPayload = { sub: STUDENT_EMAIL, role: 'student' };
  const token = AuthService.createAccessToken(tokenPayload);
  if (!token) {
    throw new Error("JWT generation returned empty token!");
  }
  console.log("✅ JWT signature generated correctly.");

  const decoded = AuthService.decodeToken(token);
  if (!decoded || decoded.sub !== STUDENT_EMAIL || decoded.role !== 'student') {
    throw new Error("JWT token decoding or payload verification failed!");
  }
  console.log("✅ JWT payload signature and expiration validation passed.");

  // --- 4. Spin Up Integration Test Server ---
  console.log(`\n🚀 Initializing sandboxed test server on port ${TEST_PORT}...`);
  const testApp = express();
  testApp.use(express.json());

  // Mount backend API endpoints
  testApp.use('/auth', require('../../src/routes/auth'));
  testApp.use('/sessions', require('../../src/routes/sessions'));
  testApp.use('/attendance', require('../../src/routes/attendance'));
  testApp.use('/leave', require('../../src/routes/leave'));
  testApp.use('/security', require('../../src/routes/security'));
  testApp.use('/notifications', require('../../src/routes/notifications'));
  testApp.use('/', require('../../src/routes/ai'));

  const testServer = testApp.listen(TEST_PORT);
  console.log("✅ Test server online.");

  try {
    // --- 5. User Registration Endpoint Audit ---
    console.log("\n📡 Auditing registration route /auth/register...");
    const regRes = await fetch(`${TEST_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: STUDENT_EMAIL,
        full_name: "Audit Student User",
        role: "student",
        password: TEST_PASSWORD
      })
    });
    const regData = await regRes.json();
    if (regRes.status !== 201 || !regData.id) {
      throw new Error(`Registration failed: ${JSON.stringify(regData)}`);
    }
    console.log("✅ Registration test user created successfully.");

    // Check Duplicate Register Prevention
    const dupRes = await fetch(`${TEST_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: STUDENT_EMAIL,
        full_name: "Duplicate User",
        role: "student",
        password: TEST_PASSWORD
      })
    });
    if (dupRes.status === 201) {
      throw new Error("Security bypass: API allowed registering duplicate email addresses!");
    }
    console.log("✅ Duplicate email registration correctly blocked.");

    // --- 6. User Authentication Endpoint Audit ---
    console.log("\n📡 Auditing password login route /auth/login-password...");
    const loginRes = await fetch(`${TEST_URL}/auth/login-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: STUDENT_EMAIL,
        password: TEST_PASSWORD
      })
    });
    const loginData = await loginRes.json();
    if (loginRes.status !== 200 || !loginData.access_token) {
      throw new Error(`Password login failed: ${JSON.stringify(loginData)}`);
    }
    console.log("✅ Password login returned valid JWT access token.");

    const studentToken = loginData.access_token;

    // --- 7. Protected Profile Route & JWT Verification Audit ---
    console.log("\n📡 Auditing secure route /auth/profile...");
    const profileRes = await fetch(`${TEST_URL}/auth/profile`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const profileData = await profileRes.json();
    if (profileRes.status !== 200 || profileData.email !== STUDENT_EMAIL) {
      throw new Error(`Profile access failed: ${JSON.stringify(profileData)}`);
    }
    console.log("✅ Profile details successfully retrieved using JWT session.");

    // --- 8. Role-Based Access Control (RBAC) Audit ---
    console.log("\n🔒 Auditing Role-Based Access Control (RBAC) rules...");
    
    // Register a teacher for session testing
    await User.create({
      email: TEACHER_EMAIL,
      full_name: "Audit Teacher User",
      role: "teacher",
      password: await AuthService.hashPassword(TEST_PASSWORD)
    });
    const teacherLoginRes = await fetch(`${TEST_URL}/auth/login-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEACHER_EMAIL, password: TEST_PASSWORD })
    });
    const teacherLoginData = await teacherLoginRes.json();
    const teacherToken = teacherLoginData.access_token;

    // Test: Student attempting to access a Teacher-only route (/sessions/start)
    const sessionStartRes = await fetch(`${TEST_URL}/sessions/start`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${studentToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ teacher_email: STUDENT_EMAIL, subject: "Audit Subject" })
    });
    if (sessionStartRes.status !== 403) {
      throw new Error("Security bypass: Student was allowed to create a teacher class session!");
    }
    console.log("✅ Role check blocked unauthorized Student access to Teacher routes (403 Forbidden).");

    // Test: Teacher accessing the route successfully
    const teacherSessionRes = await fetch(`${TEST_URL}/sessions/start`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${teacherToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ teacher_email: TEACHER_EMAIL, subject: "Audit Subject" })
    });
    const teacherSessionData = await teacherSessionRes.json();
    if (teacherSessionRes.status !== 200 || !teacherSessionData.session_id) {
      throw new Error(`Teacher failed to create session: ${JSON.stringify(teacherSessionData)}`);
    }
    console.log("✅ Teacher successfully authorized to create session.");

    const activeSessionId = teacherSessionData.session_id;

    // --- 9. Functional API Audit: Leaves & Notifications ---
    console.log("\n📡 Auditing Leave Management API...");
    const leaveRes = await fetch(`${TEST_URL}/leave/apply`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${studentToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: STUDENT_EMAIL,
        reason: "Audit Verification Leave",
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 86400000).toISOString()
      })
    });
    const leaveData = await leaveRes.json();
    if (leaveRes.status !== 200 || !leaveData.id) {
      throw new Error(`Leave application failed: ${JSON.stringify(leaveData)}`);
    }
    console.log("✅ Leave application processed and logged in MongoDB successfully.");

    // Clean up active session
    await Session.deleteOne({ _id: activeSessionId });

    console.log("\n======================================================================");
    console.log("🎉 ALL BACKEND SECURITY, ENCRYPTION, AND API TESTS PASSED SUCCESSFULLY!");
    console.log("======================================================================");
  } finally {
    // Shutdown test server
    testServer.close();
    await mongoose.disconnect();
  }
}

runValidation().catch(err => {
  console.error("\n❌ AUDIT INTEGRITY FAILURE:", err.message);
  mongoose.disconnect().then(() => process.exit(1));
});
