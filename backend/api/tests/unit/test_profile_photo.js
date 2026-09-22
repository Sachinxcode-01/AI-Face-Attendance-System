const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URL = process.env.MONGODB_URL || "mongodb://localhost:27017/smartface";
const API_URL = "http://localhost:8000";
const TEST_EMAIL = "photo_test_user@smartface.pro";

async function runTest() {
  console.log("🔋 Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URL, { dbName: 'smartface' });
  console.log("✅ MongoDB connected.");

  const User = require('../../src/models/User');

  // Clean setup
  await User.deleteOne({ email: TEST_EMAIL });

  // 1. Create a test user in DB
  const newUser = new User({
    email: TEST_EMAIL,
    full_name: "Photo Test User",
    role: "student"
  });
  await newUser.save();
  console.log("✅ Created test user in MongoDB.");

  // 2. Generate access token
  const AuthService = require('../../src/services/authService');
  const token = AuthService.createAccessToken({ sub: TEST_EMAIL, role: "student" });

  // 3. Verify initial profile returns null profilePhotoUrl
  console.log("📡 Fetching initial profile via GET /auth/me...");
  const meRes1 = await fetch(`${API_URL}/auth/me`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const meData1 = await meRes1.json();
  if (!meRes1.ok) {
    throw new Error(`GET /auth/me failed: ${meData1.detail}`);
  }
  if (meData1.profilePhotoUrl !== null && meData1.profilePhotoUrl !== undefined) {
    throw new Error(`Expected initial profilePhotoUrl to be null, got ${meData1.profilePhotoUrl}`);
  }
  console.log("✅ Initial profilePhotoUrl is cleanly null.");

  // 4. Test upload profile photo via Multipart FormData
  console.log("📡 Uploading profile photo via POST /auth/upload-avatar...");
  // Create a genuine 1x1 JPEG image buffer
  const jpegBuffer = Buffer.from(
    '/9j/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAABgj/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABykX//Z',
    'base64'
  );

  const formData = new FormData();
  formData.append('file', new Blob([jpegBuffer], { type: 'image/jpeg' }), 'avatar.jpg');

  const uploadRes = await fetch(`${API_URL}/auth/upload-avatar`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });

  const uploadData = await uploadRes.json();
  console.log("Upload Response:", uploadData);
  if (!uploadRes.ok || !uploadData.success) {
    throw new Error(`Upload failed: ${uploadData.detail || uploadData.message}`);
  }
  if (!uploadData.profilePhotoUrl || !uploadData.profilePhotoUrl.startsWith('/static/avatars/')) {
    throw new Error(`Expected profilePhotoUrl starting with /static/avatars/, got ${uploadData.profilePhotoUrl}`);
  }
  console.log("✅ Upload successful, returned permanent URL:", uploadData.profilePhotoUrl);

  // 5. Verify MongoDB persistence
  const updatedUserInDb = await User.findOne({ email: TEST_EMAIL });
  if (updatedUserInDb.profilePhotoUrl !== uploadData.profilePhotoUrl) {
    throw new Error(`MongoDB field profilePhotoUrl mismatch: expected ${uploadData.profilePhotoUrl}, got ${updatedUserInDb.profilePhotoUrl}`);
  }
  if (updatedUserInDb.avatar_url !== uploadData.profilePhotoUrl) {
    throw new Error(`MongoDB field avatar_url mismatch: expected ${uploadData.profilePhotoUrl}, got ${updatedUserInDb.avatar_url}`);
  }
  console.log("✅ Verified MongoDB permanent fields profilePhotoUrl & avatar_url.");

  // 6. Verify GET /auth/me returns saved profile photo URL
  const meRes2 = await fetch(`${API_URL}/auth/me`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const meData2 = await meRes2.json();
  if (meData2.profilePhotoUrl !== uploadData.profilePhotoUrl) {
    throw new Error(`GET /auth/me profilePhotoUrl mismatch: expected ${uploadData.profilePhotoUrl}, got ${meData2.profilePhotoUrl}`);
  }
  console.log("✅ Verified GET /auth/me returns profilePhotoUrl after upload.");

  // 7. Test Delete profile photo
  console.log("📡 Deleting profile photo via DELETE /auth/users/me/profile-photo...");
  const deleteRes = await fetch(`${API_URL}/auth/users/me/profile-photo`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const deleteData = await deleteRes.json();
  if (!deleteRes.ok || !deleteData.success) {
    throw new Error(`DELETE profile photo failed: ${deleteData.detail || deleteData.message}`);
  }
  console.log("✅ Delete profile photo succeeded.");

  // Cleanup
  console.log("\n🧹 Cleaning up database...");
  await User.deleteOne({ email: TEST_EMAIL });
  console.log("✅ Cleanup complete.");

  await mongoose.connection.close();
  console.log("🏁 Profile Photo Unit Test completed successfully.");
}

runTest().catch(err => {
  console.error("\n❌ PROFILE PHOTO TEST FAILED:", err);
  process.exit(1);
});
