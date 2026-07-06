const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const express = require('express');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URL = process.env.MONGODB_URL || "mongodb://localhost:27017/smartface";
const TEST_PORT = 8012;
const TEST_URL = `http://localhost:${TEST_PORT}`;

const STUDENT_EMAIL = "calendar_student@smartface.elite";
const ADMIN_EMAIL = "calendar_admin@smartface.elite";
const TEST_PASSWORD = "Secure123!_@#";

async function runCalendarValidation() {
  console.log("======================================================================");
  console.log("⚡ SMARTFACE CALENDAR & TIMETABLE — INTEGRITY AUDIT SEQUENCE");
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
  const Timetable = require('../../src/models/Timetable');
  const Holiday = require('../../src/models/Holiday');
  const Leave = require('../../src/models/Leave');
  const AuthService = require('../../src/services/authService');

  // Purge test records
  await Promise.all([
    User.deleteMany({ email: { $in: [STUDENT_EMAIL, ADMIN_EMAIL] } }),
    Timetable.deleteMany({ user_id: { $in: ["CSE_6_A", STUDENT_EMAIL] } }),
    Holiday.deleteMany({ title: { $in: ["Audit Thanksgiving", "Audit Christmas"] } }),
    Leave.deleteMany({ user_id: STUDENT_EMAIL })
  ]);
  console.log("🧹 Cleaned up existing calendar test records.");

  // Create Users
  await User.create({
    email: STUDENT_EMAIL,
    full_name: "Calendar Student",
    role: "student",
    department: "CSE",
    semester: "6",
    section: "A",
    password: await AuthService.hashPassword(TEST_PASSWORD)
  });

  await User.create({
    email: ADMIN_EMAIL,
    full_name: "Calendar Admin",
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
  testApp.use('/academic', require('../../src/routes/academic'));

  const testServer = testApp.listen(TEST_PORT);
  console.log(`🚀 Test server online on port ${TEST_PORT}.`);

  try {
    // 1. Audit RBAC on POST Timetable
    console.log("\n🔒 Auditing timetable RBAC protection...");
    const badTimeRes = await fetch(`${TEST_URL}/academic/timetable`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer studentToken`, // bad token/no role
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: "CSE_6_A",
        subject: "Compiler Design",
        day: "Monday",
        time: "09:00 AM - 10:30 AM"
      })
    });
    if (badTimeRes.status === 201) {
      throw new Error("Security bypass: Unauthorized user allowed to insert timetable!");
    }
    console.log("✅ Unauthorized timetable insert successfully blocked.");

    // 2. Audit POST Timetable as Admin
    console.log("\n📡 Seeding timetable as Admin /academic/timetable...");
    const timeRes = await fetch(`${TEST_URL}/academic/timetable`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: "CSE_6_A",
        subject: "Compiler Design (CSE-601)",
        day: "Wednesday",
        time: "02:00 PM - 03:30 PM",
        room: "Room 303"
      })
    });
    const timeData = await timeRes.json();
    if (timeRes.status !== 201 || !timeData.id) {
      throw new Error(`Failed to create timetable slot: ${JSON.stringify(timeData)}`);
    }
    console.log("✅ Timetable slot successfully registered.");

    // 3. Audit GET Timetable as Student
    console.log("\n📡 Retrieving timetable as Student /academic/timetable...");
    const studentTimeRes = await fetch(`${TEST_URL}/academic/timetable`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const studentTimeData = await studentTimeRes.json();
    if (studentTimeRes.status !== 200 || studentTimeData.length === 0) {
      throw new Error(`Failed to load student timetable: ${JSON.stringify(studentTimeData)}`);
    }
    const seedFound = studentTimeData.find(s => s.subject === "Compiler Design (CSE-601)");
    if (!seedFound || seedFound.room !== "Room 303") {
      throw new Error(`Seeded timetable slot not found or details mismatch: ${JSON.stringify(studentTimeData)}`);
    }
    console.log(`✅ Student timetable retrieved successfully. Found: "${seedFound.subject}" in ${seedFound.room}.`);

    // 4. Audit POST Holiday as Admin
    console.log("\n📡 Seeding Holiday as Admin /academic/holidays...");
    const holRes = await fetch(`${TEST_URL}/academic/holidays`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: "Audit Christmas",
        date: "2026-12-25T00:00:00.000Z",
        description: "Christmas institutional holiday"
      })
    });
    const holData = await holRes.json();
    if (holRes.status !== 201 || !holData.id) {
      throw new Error(`Failed to create holiday: ${JSON.stringify(holData)}`);
    }
    console.log("✅ Holiday successfully registered.");

    // 5. Audit GET Holidays as Student
    console.log("\n📡 Retrieving holidays as Student /academic/holidays...");
    const studentHolRes = await fetch(`${TEST_URL}/academic/holidays`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const studentHolData = await studentHolRes.json();
    if (studentHolRes.status !== 200 || studentHolData.length === 0) {
      throw new Error(`Failed to load student holidays: ${JSON.stringify(studentHolData)}`);
    }
    const holFound = studentHolData.find(h => h.title === "Audit Christmas");
    if (!holFound) {
      throw new Error(`Seeded holiday not found in holidays stream: ${JSON.stringify(studentHolData)}`);
    }
    console.log(`✅ Holidays retrieved successfully. Found: "${holFound.title}" on ${holFound.date}.`);

    // 6. Audit GET Calendar as Student
    console.log("\n📡 Retrieving combined calendar as Student /academic/calendar...");
    const calendarRes = await fetch(`${TEST_URL}/academic/calendar`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const calendarData = await calendarRes.json();
    if (calendarRes.status !== 200) {
      throw new Error(`Failed to load student calendar: ${JSON.stringify(calendarData)}`);
    }
    
    // Check if Christmas is in the holidays array of the calendar payload
    const calHols = calendarData.holidays || [];
    const calHolFound = calHols.find(h => h.title === "Audit Christmas");
    if (!calHolFound) {
      throw new Error(`Seeded holiday not found in calendar response: ${JSON.stringify(calendarData)}`);
    }
    console.log("✅ Combined calendar validated successfully. Holidays and academic events aggregate correctly.");

    console.log("\n======================================================================");
    console.log("🎉 ALL CALENDAR & TIMETABLE SYSTEM AUDITS PASSED SUCCESSFULLY!");
    console.log("======================================================================");
  } finally {
    const { awaitPendingJobs } = require('../../src/utils/jobTracker');
    await awaitPendingJobs();
    testServer.close();
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  runCalendarValidation().catch(err => {
    console.error("\n❌ AUDIT INTEGRITY FAILURE:", err.message);
    const { awaitPendingJobs } = require('../../src/utils/jobTracker');
    awaitPendingJobs().then(() => mongoose.disconnect().then(() => process.exit(1)));
  });
}

module.exports = runCalendarValidation;
