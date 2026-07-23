const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URL = process.env.MONGODB_URL || "mongodb://localhost:27017/smartface";
const API_URL = "http://localhost:8000";
const TEST_EMAIL = "test_google_user@smartface.pro";
const MOCK_PHOTO_1 = "https://lh3.googleusercontent.com/a/mock_avatar_url_123";
const MOCK_PHOTO_2 = "https://lh3.googleusercontent.com/a/mock_avatar_url_456";

async function runTest() {
  console.log("🔋 Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URL, { dbName: 'smartface' });
  console.log("✅ MongoDB connected.");

  const User = require('../../src/models/User');

  // Clean setup
  await User.deleteOne({ email: TEST_EMAIL });

  // 1. Google Login (Unconfigured / Missing idToken Check)
  console.log("\n📡 Logging in with Google (testing hardened security validation)...");
  const loginRes1 = await fetch(`${API_URL}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: TEST_EMAIL,
      name: "Test Google User",
      role: "student",
      avatar_url: MOCK_PHOTO_1
    })
  });

  const data1 = await loginRes1.json();
  console.log("Response:", data1);

  if (loginRes1.status !== 503 && loginRes1.status !== 400) {
    throw new Error(`Expected status 503 or 400 for unverified Google login attempt, got ${loginRes1.status}`);
  }
  console.log("✅ Google OAuth unverified body fallback correctly rejected with status", loginRes1.status);

  // Cleanup
  console.log("\n🧹 Cleaning up database...");
  await User.deleteOne({ email: TEST_EMAIL });
  console.log("✅ Cleanup complete.");

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

