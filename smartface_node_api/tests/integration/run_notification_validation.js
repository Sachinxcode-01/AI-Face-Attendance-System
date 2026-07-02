const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const express = require('express');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URL = process.env.MONGODB_URL || "mongodb://localhost:27017/smartface";
const TEST_PORT = 8011;
const TEST_URL = `http://localhost:${TEST_PORT}`;

const STUDENT_EMAIL = "notif_student@smartface.elite";
const ADMIN_EMAIL = "notif_admin@smartface.elite";
const TEST_PASSWORD = "Password123!";

async function runNotificationValidation() {
  console.log("======================================================================");
  console.log("⚡ SMARTFACE NOTIFICATIONS — INTEGRITY AUDIT SEQUENCE");
  console.log("======================================================================\n");

  console.log("🔋 Connecting to MongoDB...");
  try {
    await mongoose.connect(MONGODB_URL, { dbName: 'smartface' });
    console.log("✅ MongoDB Connected.");
  } catch (err) {
    console.error("❌ DB Connection Failed:", err.message);
    process.exit(1);
  }

  const User = require('../../src/models/User');
  const Notification = require('../../src/models/Notification');
  const AuthService = require('../../src/services/authService');

  // Purge test records
  await Promise.all([
    User.deleteMany({ email: { $in: [STUDENT_EMAIL, ADMIN_EMAIL] } }),
    Notification.deleteMany({ user_id: STUDENT_EMAIL })
  ]);
  console.log("🧹 Cleaned up existing notification test records.");

  // Create Users
  const student = await User.create({
    email: STUDENT_EMAIL,
    full_name: "Notification Student",
    role: "student",
    department: "CSE",
    password: await AuthService.hashPassword(TEST_PASSWORD)
  });

  const admin = await User.create({
    email: ADMIN_EMAIL,
    full_name: "Notification Admin",
    role: "admin",
    password: await AuthService.hashPassword(TEST_PASSWORD)
  });
  console.log("✅ Created student and admin test users.");

  // Generate Tokens
  const studentToken = AuthService.createAccessToken({ sub: STUDENT_EMAIL, role: 'student' });
  const adminToken = AuthService.createAccessToken({ sub: ADMIN_EMAIL, role: 'admin' });

  // Spin up test server
  const testApp = express();
  testApp.use(express.json());
  testApp.use('/auth', require('../../src/routes/auth'));
  testApp.use('/notifications', require('../../src/routes/notifications'));

  const testServer = testApp.listen(TEST_PORT);
  console.log(`🚀 Test server online on port ${TEST_PORT}.`);

  try {
    // 1. Audit Default Preferences
    console.log("\n📡 Auditing default preferences on /auth/profile...");
    const profileRes = await fetch(`${TEST_URL}/auth/profile`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const profileData = await profileRes.json();
    if (profileRes.status !== 200) {
      throw new Error(`Profile fetch failed: ${JSON.stringify(profileData)}`);
    }
    
    const prefs = profileData.notification_preferences;
    if (!prefs || prefs.email !== true || prefs.push !== true || prefs.in_app !== true) {
      throw new Error(`Default notification preferences incorrect: ${JSON.stringify(prefs)}`);
    }
    console.log("✅ Default notification preferences verified (email: true, push: true, in_app: true).");

    // 2. Audit Update Preferences
    console.log("\n📡 Auditing preference toggle on /auth/notification-preferences...");
    const updateRes = await fetch(`${TEST_URL}/auth/notification-preferences`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${studentToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: false, push: true, in_app: false })
    });
    const updateData = await updateRes.json();
    if (updateRes.status !== 200) {
      throw new Error(`Preferences update failed: ${JSON.stringify(updateData)}`);
    }
    console.log("✅ PATCH update response successful.");

    // Re-verify preferences in DB
    const freshStudent = await User.findOne({ email: STUDENT_EMAIL });
    const freshPrefs = freshStudent.notification_preferences;
    if (freshPrefs.email !== false || freshPrefs.push !== true || freshPrefs.in_app !== false) {
      throw new Error(`DB preferences update verification failed: ${JSON.stringify(freshPrefs)}`);
    }
    console.log("✅ Preferences successfully updated in MongoDB (email: false, push: true, in_app: false).");

    // 3. Audit Admin Announcement (unauthorized role test)
    console.log("\n🔒 Auditing announcement RBAC protection...");
    const badAnnouncementRes = await fetch(`${TEST_URL}/notifications/announcement`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${studentToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: "Unauthorized Announcement",
        message: "This should be blocked."
      })
    });
    if (badAnnouncementRes.status !== 403) {
      throw new Error("Security bypass: Student was allowed to access admin announcement endpoint!");
    }
    console.log("✅ Announcement route blocked for unauthorized student roles.");

    // 4. Audit Admin Announcement (authorized admin test)
    console.log("\n📡 Auditing announcement route /notifications/announcement...");
    const announcementRes = await fetch(`${TEST_URL}/notifications/announcement`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: "CSE Semester Exams Schedule",
        message: "The CSE Semester Exams are scheduled to begin from July 10th.",
        role: "student",
        department: "CSE",
        priority: "Urgent",
        type: "announcement"
      })
    });
    const announcementData = await announcementRes.json();
    if (announcementRes.status !== 201) {
      throw new Error(`Announcement creation failed: ${JSON.stringify(announcementData)}`);
    }
    console.log(`✅ Announcement successfully processed. Recipient count: ${announcementData.recipient_count}`);

    // 5. Verify announcement was saved for the student
    console.log("\n📡 Verifying notification feed on /notifications/:email...");
    const feedRes = await fetch(`${TEST_URL}/notifications/${STUDENT_EMAIL}`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const feedData = await feedRes.json();
    if (feedRes.status !== 200 || feedData.length === 0) {
      throw new Error(`Failed to load student notification feed: ${JSON.stringify(feedData)}`);
    }

    const testNotif = feedData[0];
    if (testNotif.title !== "CSE Semester Exams Schedule" || testNotif.priority !== "Urgent" || testNotif.type !== "announcement") {
      throw new Error(`Saved notification content mismatch: ${JSON.stringify(testNotif)}`);
    }
    console.log("✅ Announcement successfully received in student notification feed.");
    console.log(`🔔 Received: "${testNotif.title}" | Priority: ${testNotif.priority} | Type: ${testNotif.type}`);

    console.log("\n======================================================================");
    console.log("🎉 ALL NOTIFICATION SYSTEM AUDITS PASSED SUCCESSFULLY!");
    console.log("======================================================================");
  } finally {
    testServer.close();
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  runNotificationValidation().catch(err => {
    console.error("\n❌ AUDIT INTEGRITY FAILURE:", err.message);
    process.exit(1);
  });
}

module.exports = runNotificationValidation;
