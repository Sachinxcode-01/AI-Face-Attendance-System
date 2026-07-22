const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env
dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URL = process.env.MONGODB_URL || "mongodb://localhost:27017/smartface";
const API_URL = "http://localhost:8000";
const TEST_EMAIL = "test_otp_user@rec.edu";

async function runTest() {
  console.log("🔋 Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URL, { dbName: 'smartface' });
  console.log("✅ MongoDB connected.");

  // Get collections
  const User = require('../../src/models/User');
  const Otp = require('../../src/models/Otp');

  // 1. Setup test user
  console.log(`\n👤 Setting up test user: ${TEST_EMAIL}`);
  await User.deleteOne({ email: TEST_EMAIL });
  await Otp.deleteOne({ email: TEST_EMAIL });

  const testUser = new User({
    email: TEST_EMAIL,
    full_name: "Test OTP User",
    role: "student",
    biometric_registered: false
  });
  await testUser.save();
  console.log("✅ Test user created.");

  // 2. Request OTP
  console.log("\n📡 Sending OTP request to backend /auth/login-otp/send...");
  const sendRes = await fetch(`${API_URL}/auth/login-otp/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_EMAIL })
  });

  const sendData = await sendRes.json();
  console.log("Response:", sendData);

  if (sendRes.status !== 200) {
    throw new Error(`Failed to request OTP: ${sendData.detail}`);
  }

  // 3. Fetch OTP from DB
  console.log("\n🔎 Reading generated OTP directly from MongoDB...");
  const otpRecord = await Otp.findOne({ email: TEST_EMAIL });
  if (!otpRecord) {
    throw new Error("No OTP record found in database!");
  }
  console.log(`✅ Found OTP in database: "${otpRecord.otp}" (Expires: ${otpRecord.expiry})`);

  // 4. Verify OTP
  console.log("\n📡 Sending OTP verification to backend /auth/login-otp/verify...");
  const verifyRes = await fetch(`${API_URL}/auth/login-otp/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_EMAIL, otp: otpRecord.otp })
  });

  const verifyData = await verifyRes.json();
  console.log("Response:", verifyData);

  if (verifyRes.status === 200 && verifyData.access_token) {
    console.log("\n🎉 SUCCESS: OTP Verification passed and JWT access token issued!");
  } else {
    throw new Error(`OTP Verification failed: ${verifyData.detail}`);
  }

  // Cleanup
  console.log("\n🧹 Cleaning up database...");
  await User.deleteOne({ email: TEST_EMAIL });
  await Otp.deleteOne({ email: TEST_EMAIL });
  console.log("✅ Cleanup complete.");

  const { awaitPendingJobs } = require('../../src/utils/jobTracker');
  await mongoose.connection.close();
  console.log("🏁 Test completed successfully.");
}

runTest().catch(err => {
  console.error("\n❌ TEST FAILED:", err.message);
  const { awaitPendingJobs } = require('../../src/utils/jobTracker');
  awaitPendingJobs().then(() => {
    mongoose.disconnect().then(() => {
      setTimeout(() => process.exit(1), 100);
    }).catch(() => setTimeout(() => process.exit(1), 100));
  });
});

