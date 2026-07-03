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

  // 1. Google Login (New User)
  console.log("\n📡 Logging in with Google (new user) via /auth/google...");
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

  // Verify DB state
  const dbUser1 = await User.findOne({ email: TEST_EMAIL });
  if (!dbUser1) {
    throw new Error("User was not created in the database!");
  }
  console.log(`✅ User created successfully. avatar_url in DB: "${dbUser1.avatar_url}"`);
  if (dbUser1.avatar_url !== MOCK_PHOTO_1) {
    throw new Error(`Expected avatar_url to be "${MOCK_PHOTO_1}", but got "${dbUser1.avatar_url}"`);
  }

  // 2. Google Login (Existing User - with same photo, shouldn't change custom logic but let's test if it updates or preserves)
  console.log("\n📡 Logging in with Google (existing user, empty avatar check)...");
  // Set avatar_url to null to test sync on existing user
  await User.updateOne({ email: TEST_EMAIL }, { $set: { avatar_url: null } });
  
  const loginRes2 = await fetch(`${API_URL}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: TEST_EMAIL,
      name: "Test Google User",
      role: "student",
      avatar_url: MOCK_PHOTO_2
    })
  });

  const data2 = await loginRes2.json();
  console.log("Response:", data2);

  // Verify DB state
  const dbUser2 = await User.findOne({ email: TEST_EMAIL });
  console.log(`✅ Existing user updated. avatar_url in DB: "${dbUser2.avatar_url}"`);
  if (dbUser2.avatar_url !== MOCK_PHOTO_2) {
    throw new Error(`Expected avatar_url to be synced to "${MOCK_PHOTO_2}", but got "${dbUser2.avatar_url}"`);
  }

  // Cleanup
  console.log("\n🧹 Cleaning up database...");
  await User.deleteOne({ email: TEST_EMAIL });
  console.log("✅ Cleanup complete.");

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
