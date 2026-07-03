const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URL = process.env.MONGODB_URL || "mongodb://localhost:27017/smartface";
const API_URL = "http://localhost:8000";
const TEST_EMAIL = "saxhin0708@gmail.com";
const ORIGINAL_HASH = "$2a$10$fdrVP0Xh9/NScEAtsFAV5OY3hWVrGobAhwanYv.tcud.fokFKmdqu";

async function runTest() {
  console.log("🔋 Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URL, { dbName: 'smartface' });
  console.log("✅ MongoDB connected.");

  const User = require('../../src/models/User');
  const Otp = require('../../src/models/Otp');

  // Ensure clean OTP state
  await Otp.deleteOne({ email: TEST_EMAIL });

  // 1. Request Password Reset OTP
  console.log("\n📡 Sending password reset OTP request to backend /auth/forgot-password...");
  const sendRes = await fetch(`${API_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_EMAIL })
  });

  const sendData = await sendRes.json();
  console.log("Response:", sendData);

  if (sendRes.status !== 200) {
    throw new Error(`Failed to request password reset OTP: ${sendData.detail}`);
  }

  // 2. Fetch OTP from DB
  console.log("\n🔎 Reading generated OTP directly from MongoDB...");
  const otpRecord = await Otp.findOne({ email: TEST_EMAIL, type: 'password_reset' });
  if (!otpRecord) {
    throw new Error("No password reset OTP record found in database!");
  }
  console.log(`✅ Found OTP in database: "${otpRecord.otp}" (Type: ${otpRecord.type})`);

  // 3. Verify with Incorrect OTP first
  console.log("\n📡 Testing rejection of invalid OTP...");
  const invalidVerifyRes = await fetch(`${API_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_EMAIL, otp: "000000", new_password: "NewSecure123!_@#" })
  });
  console.log("Status:", invalidVerifyRes.status);
  const invalidData = await invalidVerifyRes.json();
  console.log("Response:", invalidData);
  if (invalidVerifyRes.status === 200) {
    throw new Error("Vulnerability: The server accepted an invalid OTP code!");
  }
  console.log("✅ Invalid OTP successfully rejected.");

  // 4. Verify with Correct OTP
  console.log("\n📡 Testing password reset with correct OTP...");
  const verifyRes = await fetch(`${API_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_EMAIL, otp: otpRecord.otp, new_password: "NewSecure123!_@#" })
  });

  const verifyData = await verifyRes.json();
  console.log("Response:", verifyData);

  if (verifyRes.status === 200) {
    console.log("🎉 SUCCESS: Password Reset passed!");
  } else {
    throw new Error(`Password reset failed: ${verifyData.detail}`);
  }

  // 5. Restore original password hash
  console.log("\n🧹 Restoring original password hash in database...");
  await User.updateOne({ email: TEST_EMAIL }, { $set: { password: ORIGINAL_HASH } });
  console.log("✅ Original password hash restored.");

  await mongoose.disconnect();
  console.log("🏁 Test completed successfully.");
  setTimeout(() => process.exit(0), 1000);
}

runTest().catch(err => {
  console.error("\n❌ TEST FAILED:", err.message);
  mongoose.disconnect().then(() => {
    setTimeout(() => process.exit(1), 500);
  }).catch(() => process.exit(1));
});
