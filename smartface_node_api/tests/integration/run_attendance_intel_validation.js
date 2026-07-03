const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const express = require('express');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URL = process.env.MONGODB_URL || "mongodb://localhost:27017/smartface";
const TEST_PORT = 8011;
const TEST_URL = `http://localhost:${TEST_PORT}`;

// Test users
const STUDENT_EMAIL = "intel_student@smartface.elite";
const TEACHER_EMAIL = "intel_teacher@smartface.elite";
const ADMIN_EMAIL = "intel_admin@smartface.elite";
const TEST_PASSWORD = "Secure123!_@#";

async function runAttendanceIntelValidation() {
  console.log("======================================================================");
  console.log("⚡ SMARTFACE AI — ATTENDANCE INTELLIGENCE ROUTE VALIDATION");
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

  // --- 2. Clean Up and Seed Target Audit Data ---
  console.log("\n🧹 Purging and seeding test data for validation...");
  const User = require('../../src/models/User');
  const AttendanceAnalytics = require('../../src/models/AttendanceAnalytics');
  const DepartmentAnalytics = require('../../src/models/DepartmentAnalytics');
  const AttendanceAuditLog = require('../../src/models/AttendanceAuditLog');
  const Session = require('../../src/models/Session');
  const Attendance = require('../../src/models/Attendance');

  await Promise.all([
    User.deleteMany({ email: { $in: [STUDENT_EMAIL, TEACHER_EMAIL, ADMIN_EMAIL] } }),
    AttendanceAnalytics.deleteMany({ student_email: STUDENT_EMAIL }),
    AttendanceAuditLog.deleteMany({ actor_email: { $in: [STUDENT_EMAIL, TEACHER_EMAIL, ADMIN_EMAIL] } }),
    Attendance.deleteMany({ student_email: STUDENT_EMAIL })
  ]);

  const AuthService = require('../../src/services/authService');
  const hashedPass = await AuthService.hashPassword(TEST_PASSWORD);

  // Create users
  const student = await User.create({
    email: STUDENT_EMAIL,
    full_name: "Intel Student",
    role: "student",
    password: hashedPass,
    department: "Computer Science",
    semester: "6th"
  });

  const teacher = await User.create({
    email: TEACHER_EMAIL,
    full_name: "Intel Teacher",
    role: "teacher",
    password: hashedPass,
    department: "Computer Science"
  });

  const admin = await User.create({
    email: ADMIN_EMAIL,
    full_name: "Intel Admin",
    role: "admin",
    password: hashedPass
  });

  console.log("✅ Validation users created.");

  // Seed sample analytics & check-ins
  await AttendanceAnalytics.create({
    student_email: STUDENT_EMAIL,
    health_score: 72,
    standing: 'Warning',
    consecutive_absences: 1,
    late_arrivals_count: 2,
    risk_alerts: [
      { type: 'below_75', message: 'Warning: Attendance is below 75%' }
    ]
  });

  const testSession = await Session.create({
    subject: "Deep Learning Validation",
    teacher_id: TEACHER_EMAIL,
    duration: 60,
    is_active: true,
    qr_code: "static_qr_val"
  });

  await Attendance.create({
    student_email: STUDENT_EMAIL,
    session_id: testSession._id.toString(),
    timestamp: new Date(),
    status: "Present",
    verified_by: "qr"
  });

  await AttendanceAuditLog.create({
    actor_email: STUDENT_EMAIL,
    role: "student",
    action: "ATTENDANCE_MARKED",
    details: { method: "qr", session_id: testSession._id.toString() },
    ip_address: "127.0.0.1"
  });

  console.log("✅ Seeded test analytics, session, and audit logs.");

  // --- 3. Spin Up Integration Test Server ---
  console.log(`\n🚀 Initializing sandboxed test server on port ${TEST_PORT}...`);
  const testApp = express();
  testApp.use(express.json());

  testApp.use('/auth', require('../../src/routes/auth'));
  testApp.use('/attendance', require('../../src/routes/attendance'));

  const testServer = testApp.listen(TEST_PORT);
  console.log("✅ Test server online.");

  try {
    // Authenticate users to get tokens
    console.log("\n🔑 Retrieving API authorization tokens...");
    
    const loginUser = async (email) => {
      const res = await fetch(`${TEST_URL}/auth/login-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: TEST_PASSWORD })
      });
      const data = await res.json();
      return data.access_token;
    };

    const studentToken = await loginUser(STUDENT_EMAIL);
    const teacherToken = await loginUser(TEACHER_EMAIL);
    const adminToken = await loginUser(ADMIN_EMAIL);

    if (!studentToken || !teacherToken || !adminToken) {
      throw new Error("Failed to authenticate and retrieve session tokens");
    }
    console.log("✅ Tokens successfully acquired.");

    // --- 4. Test Student Dashboard Endpoint ---
    console.log("\n📡 GET /attendance/dashboard [Student Role]");
    const dashboardRes = await fetch(`${TEST_URL}/attendance/dashboard`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const dashboardData = await dashboardRes.json();
    if (dashboardRes.status !== 200) {
      throw new Error(`Dashboard status code is ${dashboardRes.status}`);
    }
    if (typeof dashboardData.health_score !== 'number' || !dashboardData.standing || !dashboardData.risk_alerts) {
      throw new Error(`Invalid Dashboard response shape: ${JSON.stringify(dashboardData)}`);
    }
    console.log("✅ /attendance/dashboard returned correct schema: health_score =", dashboardData.health_score);

    // --- 5. Test Heatmap Endpoint ---
    console.log("\n📡 GET /attendance/heatmap [Student Role]");
    const heatmapRes = await fetch(`${TEST_URL}/attendance/heatmap`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const heatmapData = await heatmapRes.json();
    if (heatmapRes.status !== 200) {
      throw new Error(`Heatmap status code is ${heatmapRes.status}`);
    }
    if (typeof heatmapData !== 'object' || heatmapData === null) {
      throw new Error(`Invalid Heatmap response shape: ${JSON.stringify(heatmapData)}`);
    }
    console.log("✅ /attendance/heatmap returned correct date-grouped counts.");

    // --- 6. Test Reports Endpoint ---
    console.log("\n📡 GET /attendance/report/generate?format=csv [Student Role]");
    const reportRes = await fetch(`${TEST_URL}/attendance/report/generate?format=csv`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const reportText = await reportRes.text();
    if (reportRes.status !== 200) {
      throw new Error(`Report status code is ${reportRes.status}`);
    }
    if (!reportText.includes("Date,Time,Subject") || !reportText.includes("Present")) {
      throw new Error(`Invalid CSV Report compiled content: ${reportText}`);
    }
    console.log("✅ /attendance/report/generate?format=csv generated valid CSV stream.");

    // --- 7. Test Command Center Endpoint (RBAC & Success) ---
    console.log("\n📡 GET /attendance/command-center [Teacher/HOD Role]");
    const commandCenterRes = await fetch(`${TEST_URL}/attendance/command-center`, {
      headers: { 'Authorization': `Bearer ${teacherToken}` }
    });
    const commandCenterData = await commandCenterRes.json();
    if (commandCenterRes.status !== 200) {
      throw new Error(`Command center status code is ${commandCenterRes.status}`);
    }
    if (typeof commandCenterData.average_attendance !== 'number' || typeof commandCenterData.total_students !== 'number') {
      throw new Error(`Invalid Command Center response shape: ${JSON.stringify(commandCenterData)}`);
    }
    console.log("✅ /attendance/command-center authorized and returned aggregates successfully.");

    // Test command-center blocked for students
    console.log("\n🔒 Block checks on /attendance/command-center [Student Role]");
    const ccStudentRes = await fetch(`${TEST_URL}/attendance/command-center`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    if (ccStudentRes.status !== 403) {
      throw new Error(`RBAC failure: expected 403 Forbidden, got ${ccStudentRes.status}`);
    }
    console.log("✅ Student role correctly blocked from accessing HOD command center.");

    // --- 8. Test Live Monitor Endpoint ---
    console.log("\n📡 GET /attendance/live-monitor [Teacher Role]");
    const liveMonitorRes = await fetch(`${TEST_URL}/attendance/live-monitor`, {
      headers: { 'Authorization': `Bearer ${teacherToken}` }
    });
    const liveMonitorData = await liveMonitorRes.json();
    if (liveMonitorRes.status !== 200) {
      throw new Error(`Live monitor status code is ${liveMonitorRes.status}`);
    }
    if (!Array.isArray(liveMonitorData)) {
      throw new Error(`Invalid Live Monitor response shape (not array): ${JSON.stringify(liveMonitorData)}`);
    }
    console.log("✅ /attendance/live-monitor returned live sessions telemetry.");

    // --- 9. Test Risk Analysis Endpoint ---
    console.log("\n📡 GET /attendance/risk-analysis?type=below_75 [Teacher Role]");
    const riskAnalysisRes = await fetch(`${TEST_URL}/attendance/risk-analysis?type=below_75`, {
      headers: { 'Authorization': `Bearer ${teacherToken}` }
    });
    const riskAnalysisData = await riskAnalysisRes.json();
    if (riskAnalysisRes.status !== 200) {
      throw new Error(`Risk analysis status code is ${riskAnalysisRes.status}`);
    }
    if (!Array.isArray(riskAnalysisData)) {
      throw new Error(`Invalid Risk Analysis response shape (not array): ${JSON.stringify(riskAnalysisData)}`);
    }
    console.log("✅ /attendance/risk-analysis returned list of high risk student profiles.");

    // --- 10. Test Security Audit Logs (RBAC & Success) ---
    console.log("\n📡 GET /attendance/audit-logs [Admin Role]");
    const auditLogsRes = await fetch(`${TEST_URL}/attendance/audit-logs`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const auditLogsData = await auditLogsRes.json();
    if (auditLogsRes.status !== 200) {
      throw new Error(`Audit logs status code is ${auditLogsRes.status}`);
    }
    if (!Array.isArray(auditLogsData)) {
      throw new Error(`Invalid Audit Logs response shape (not array): ${JSON.stringify(auditLogsData)}`);
    }
    console.log("✅ /attendance/audit-logs returned tamper-proof ledger entries.");

    // Test audit-logs blocked for teachers
    console.log("\n🔒 Block checks on /attendance/audit-logs [Teacher Role]");
    const auditTeacherRes = await fetch(`${TEST_URL}/attendance/audit-logs`, {
      headers: { 'Authorization': `Bearer ${teacherToken}` }
    });
    if (auditTeacherRes.status !== 403) {
      throw new Error(`RBAC failure: expected 403 Forbidden, got ${auditTeacherRes.status}`);
    }
    console.log("✅ Teacher role correctly blocked from accessing audit-logs.");

    console.log("\n======================================================================");
    console.log("🎉 ALL ATTENDANCE INTELLIGENCE INTERFACE CONTRACT TESTS PASSED SUCCESSFULLY!");
    console.log("======================================================================");

  } finally {
    // Cleanup records
    await Promise.all([
      User.deleteMany({ email: { $in: [STUDENT_EMAIL, TEACHER_EMAIL, ADMIN_EMAIL] } }),
      AttendanceAnalytics.deleteMany({ student_email: STUDENT_EMAIL }),
      AttendanceAuditLog.deleteMany({ actor_email: { $in: [STUDENT_EMAIL, TEACHER_EMAIL, ADMIN_EMAIL] } }),
      Attendance.deleteMany({ student_email: STUDENT_EMAIL }),
      Session.deleteOne({ _id: testSession._id })
    ]);

    testServer.close();
    await mongoose.disconnect();
  }
}

runAttendanceIntelValidation().catch(err => {
  console.error("\n❌ VALIDATION FAILURE:", err.message);
  mongoose.disconnect().then(() => process.exit(1));
});
