const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const express = require('express');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URL = process.env.MONGODB_URL || "mongodb://localhost:27017/smartface";
const TEST_PORT = 8010;
const TEST_URL = `http://localhost:${TEST_PORT}`;

// Seeded test student email
const STUDENT_EMAIL = "alice@smartface.pro";

async function runAcademicValidation() {
  console.log("======================================================================");
  console.log("⚡ SMARTFACE AI ACADEMIC HUB — INTEGRITY AUDIT SEQUENCE");
  console.log("======================================================================\n");

  // --- 1. Database Connection ---
  console.log("🔋 Connecting to MongoDB Cluster...");
  try {
    await mongoose.connect(MONGODB_URL, { dbName: 'smartface' });
    console.log("✅ MongoDB Connection Successful.");
  } catch (err) {
    console.error("❌ Database Connection Failed:", err.message);
    process.exit(1);
  }

  // --- 2. Generate Authentication Tokens ---
  console.log("\n🔑 Generating security session tokens for student...");
  const AuthService = require('../../src/services/authService');
  const tokenPayload = { sub: STUDENT_EMAIL, role: 'student' };
  const studentToken = AuthService.createAccessToken(tokenPayload);
  
  if (!studentToken) {
    throw new Error("JWT Session Token generation failed!");
  }
  console.log("✅ Student JWT session token compiled successfully.");

  // --- 3. Spin Up Integration Test Server ---
  console.log(`\n🚀 Initializing sandboxed test server on port ${TEST_PORT}...`);
  const testApp = express();
  testApp.use(express.json());

  // Mount backend API endpoints
  testApp.use('/academic', require('../../src/routes/academic'));

  const testServer = testApp.listen(TEST_PORT);
  console.log("✅ Test server online.");

  try {
    const headers = {
      'Authorization': `Bearer ${studentToken}`,
      'Content-Type': 'application/json'
    };

    // --- 4. Audit /academic/dashboard ---
    console.log("\n📡 Auditing route /academic/dashboard...");
    const dashRes = await fetch(`${TEST_URL}/academic/dashboard`, { headers });
    const dashData = await dashRes.json();
    
    if (dashRes.status !== 200) {
      throw new Error(`Dashboard request failed: ${JSON.stringify(dashData)}`);
    }
    if (!dashData.student || dashData.student.email !== STUDENT_EMAIL) {
      throw new Error("Dashboard payload mismatch: incorrect student info returned.");
    }
    if (!Array.isArray(dashData.ai_insights) || dashData.ai_insights.length === 0) {
      throw new Error("Dashboard payload mismatch: AI insights missing or empty.");
    }
    console.log(`✅ Dashboard validated successfully. Welcome, ${dashData.student.name}!`);
    console.log(`🤖 AI insights parsed: "${dashData.ai_insights[0]}"`);

    // --- 5. Audit /academic/timetable ---
    console.log("\n📡 Auditing route /academic/timetable...");
    const timeRes = await fetch(`${TEST_URL}/academic/timetable`, { headers });
    const timeData = await timeRes.json();
    
    if (timeRes.status !== 200) {
      throw new Error(`Timetable request failed: ${JSON.stringify(timeData)}`);
    }
    if (!Array.isArray(timeData) || timeData.length === 0) {
      throw new Error("Timetable payload empty: no lecture slots found.");
    }
    console.log(`✅ Timetable verified: ${timeData.length} lecture slots returned.`);

    // --- 6. Audit /academic/assignments ---
    console.log("\n📡 Auditing route /academic/assignments...");
    const assignRes = await fetch(`${TEST_URL}/academic/assignments`, { headers });
    const assignData = await assignRes.json();
    
    if (assignRes.status !== 200) {
      throw new Error(`Assignments request failed: ${JSON.stringify(assignData)}`);
    }
    if (!Array.isArray(assignData) || assignData.length === 0) {
      throw new Error("Assignments list empty: no homework items found.");
    }
    
    // Check if the submission seeded is correctly resolved
    const seededSub = assignData.find(a => a.course_code === "CSE-302");
    if (!seededSub || !seededSub.submission || seededSub.submission.grade !== 46) {
      throw new Error("Assignment submission resolver failure: seeded submission not found or incorrect grade.");
    }
    console.log(`✅ Assignments stream verified. Alice Cooper's SRS grade found: ${seededSub.submission.grade}/${seededSub.max_points}`);

    // --- 7. Audit /academic/exams ---
    console.log("\n📡 Auditing route /academic/exams...");
    const examRes = await fetch(`${TEST_URL}/academic/exams`, { headers });
    const examData = await examRes.json();
    
    if (examRes.status !== 200) {
      throw new Error(`Exams request failed: ${JSON.stringify(examData)}`);
    }
    if (!Array.isArray(examData) || examData.length === 0) {
      throw new Error("Exams list empty: no scheduled exams found.");
    }
    console.log(`✅ Exam schedules verified: ${examData.length} assessment entries found.`);

    // --- 8. Audit /academic/results ---
    console.log("\n📡 Auditing route /academic/results...");
    const resultsRes = await fetch(`${TEST_URL}/academic/results`, { headers });
    const resultsData = await resultsRes.json();
    
    if (resultsRes.status !== 200) {
      throw new Error(`Results request failed: ${JSON.stringify(resultsData)}`);
    }
    if (!resultsData.cgpa || !resultsData.results || resultsData.results.length === 0) {
      throw new Error("Results payload missing CGPA or course grade listings.");
    }
    console.log(`✅ Results center verified. CGPA calculated: ${resultsData.cgpa} | SGPA: ${resultsData.sgpa}`);

    // --- 9. Audit /academic/success-score ---
    console.log("\n📡 Auditing route /academic/success-score...");
    const scoreRes = await fetch(`${TEST_URL}/academic/success-score`, { headers });
    const scoreData = await scoreRes.json();
    
    if (scoreRes.status !== 200) {
      throw new Error(`Success Score request failed: ${JSON.stringify(scoreData)}`);
    }
    if (!scoreData.success_score || scoreData.success_score < 0 || scoreData.success_score > 100) {
      throw new Error("Success Score algorithm error: returned invalid success index.");
    }
    console.log(`✅ Success Score Engine validated. Student index computed: ${scoreData.success_score}/100.`);

    // --- 10. Audit /academic/documents ---
    console.log("\n📡 Auditing route /academic/documents...");
    const docRes = await fetch(`${TEST_URL}/academic/documents`, { headers });
    const docData = await docRes.json();
    
    if (docRes.status !== 200) {
      throw new Error(`Documents request failed: ${JSON.stringify(docData)}`);
    }
    if (!Array.isArray(docData) || docData.length === 0) {
      throw new Error("Documents list empty.");
    }
    console.log(`✅ Digital Documents verified: ID Card & Hall Ticket approved lockers online.`);

    console.log("\n======================================================================");
    console.log("🎉 ALL ACADEMIC HUB INTEGRATION TESTS COMPLETED SUCCESSFULLY!");
    console.log("======================================================================");
  } finally {
    // Shutdown test server
    const { awaitPendingJobs } = require('../../src/utils/jobTracker');
    await awaitPendingJobs();
    testServer.close();
    await mongoose.disconnect();
  }
}

runAcademicValidation().catch(err => {
  console.error("\n❌ ACADEMIC INTEGRITY TESTING FAILURE:", err.message);
  const { awaitPendingJobs } = require('../../src/utils/jobTracker');
  awaitPendingJobs().then(() => mongoose.disconnect().then(() => process.exit(1)));
});
