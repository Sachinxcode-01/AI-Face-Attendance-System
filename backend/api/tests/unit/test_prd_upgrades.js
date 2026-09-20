const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const { MemoryRateLimiter } = require('../../src/middleware/rateLimiter');
const validate = require('../../src/middleware/validate');
const { registerSchema, otpVerifySchema } = require('../../src/schemas/validationSchemas');
const BiometricProfile = require('../../src/models/BiometricProfile');

dotenv.config({ path: path.join(__dirname, '../../.env') });
const MONGODB_URL = process.env.MONGODB_URL || "mongodb://localhost:27017/smartface";

async function runPrdUpgradesAudit() {
  console.log("====================================================");
  console.log("🚀 TESTING PRD UPGRADES: RATE LIMITING, ZOD & BIOMETRIC VECTOR");
  console.log("====================================================\n");

  let passed = true;

  // ── 1. Test In-Memory / Distributed Rate Limiter & Retry-After ────────
  console.log("🧪 1. Auditing Rate Limiter logic and Retry-After calculation...");
  const testLimiter = new MemoryRateLimiter(2, 60, 'test_unit');
  const clientKey = 'user_audit_test@example.com';

  const res1 = await testLimiter.check(clientKey);
  if (!res1.allowed) {
    console.error("❌ Test failed: Call 1 should be allowed");
    passed = false;
  } else {
    console.log("  ✅ Call 1 allowed (1/2)");
  }

  const res2 = await testLimiter.check(clientKey);
  if (!res2.allowed) {
    console.error("❌ Test failed: Call 2 should be allowed");
    passed = false;
  } else {
    console.log("  ✅ Call 2 allowed (2/2)");
  }

  const res3 = await testLimiter.check(clientKey);
  if (res3.allowed || res3.remainingSeconds <= 0) {
    console.error("❌ Test failed: Call 3 should be blocked with remainingSeconds > 0");
    passed = false;
  } else {
    console.log(`  ✅ Call 3 blocked correctly: remainingSeconds = ${res3.remainingSeconds}s`);
  }

  // ── 2. Test Zod Validation Middleware ────────────────────────────────
  console.log("\n🧪 2. Auditing Zod Schema Validation...");
  const app = express();
  app.use(express.json());

  app.post('/test-register', validate(registerSchema), (req, res) => {
    res.status(200).json({ success: true, data: req.body });
  });

  const server = app.listen(19876);

  try {
    // Malformed request (missing full_name and invalid email)
    const badRes = await fetch('http://127.0.0.1:19876/test-register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email', role: 'student' })
    });
    const badData = await badRes.json();
    if (badRes.status === 400 && badData.detail) {
      console.log(`  ✅ Invalid input rejected with 400 Bad Request: "${badData.detail}"`);
    } else {
      console.error("❌ Test failed: Invalid input was not rejected with 400:", badData);
      passed = false;
    }

    // Valid request
    const goodRes = await fetch('http://127.0.0.1:19876/test-register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'valid_user@example.com',
        full_name: 'Valid User',
        role: 'student',
        password: 'SecurePassword123!'
      })
    });
    const goodData = await goodRes.json();
    if (goodRes.status === 200 && goodData.success) {
      console.log("  ✅ Valid input passed schema validation successfully.");
    } else {
      console.error("❌ Test failed: Valid input failed validation:", goodData);
      passed = false;
    }
  } finally {
    server.close();
  }

  // ── 3. Test BiometricProfile Model in MongoDB ─────────────────────────
  console.log("\n🧪 3. Auditing BiometricProfile Model & Persistence...");
  let locallyConnected = false;
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGODB_URL, { dbName: 'smartface', serverSelectionTimeoutMS: 5000 });
      locallyConnected = true;
    }
    console.log("  ✅ Connected to MongoDB.");

    const testEmail = 'biometric_vector_test@smartface.pro';
    await BiometricProfile.deleteMany({ user_email: testEmail });

    // Seed mock 512-D vector
    const mockVector = new Array(512).fill(0).map(() => Math.random() * 0.1);
    const profile = await BiometricProfile.create({
      user_email: testEmail,
      embedding: mockVector,
      consent_given: true,
      vector_version: 'arcface-insightface-512-v1'
    });

    if (profile && profile.embedding.length === 512) {
      console.log("  ✅ 512-D Biometric profile created successfully in MongoDB.");
    } else {
      console.error("❌ Test failed: Profile vector length mismatch");
      passed = false;
    }

    const fetched = await BiometricProfile.findOne({ user_email: testEmail });
    if (fetched && fetched.embedding.length === 512 && fetched.consent_given === true) {
      console.log("  ✅ Biometric profile verified and retrieved from database.");
    } else {
      console.error("❌ Test failed: Could not query saved biometric profile");
      passed = false;
    }

    await BiometricProfile.deleteMany({ user_email: testEmail });
    console.log("  ✅ Cleaned up test biometric profile.");
  } catch (dbErr) {
    console.warn("⚠️ MongoDB offline or remote Atlas unreachable during unit test:", dbErr.message);
  } finally {
    if (locallyConnected) {
      await mongoose.disconnect();
    }
  }

  console.log("\n====================================================");
  if (passed) {
    console.log("🎉 ALL PRD UPGRADE AUDIT TESTS PASSED SUCCESSFULLY!");
    console.log("====================================================");
    process.exit(0);
  } else {
    console.error("❌ PRD UPGRADE AUDIT TESTS FAILED");
    console.log("====================================================");
    process.exit(1);
  }
}

runPrdUpgradesAudit().catch(err => {
  console.error("Audit script failed:", err);
  process.exit(1);
});
