'use strict';

const assert = require('assert');
const path = require('path');
const http = require('http');
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../../.env') });
process.env.NODE_ENV = 'test';

const AuthService = require('../../src/services/authService');
const analyticsRouter = require('../../src/routes/analytics');
const User = require('../../src/models/User');
const Attendance = require('../../src/models/Attendance');

async function runPredictiveAnalyticsTests() {
  console.log('\n=============================================================');
  console.log('🧪 RUNNING PREDICTIVE ATTENDANCE RISK & VELOCITY TESTS');
  console.log('=============================================================');

  let selfConnected = false;
  if (mongoose.connection.readyState !== 1) {
    const mongoUrl = process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017/smartface';
    await mongoose.connect(mongoUrl, { dbName: 'smartface' });
    selfConnected = true;
  }

  // Set up sandboxed Express test app
  const app = express();
  app.use(express.json());
  app.use('/analytics', analyticsRouter);

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(14589, resolve));
  const baseUrl = 'http://127.0.0.1:14589';

  try {
    const studentEmail = 'pred_student_01@smartface.ai';
    const otherStudentEmail = 'pred_student_02@smartface.ai';
    const adminEmail = 'pred_admin@smartface.ai';

    const studentToken = AuthService.createAccessToken({ sub: studentEmail, role: 'student' });
    const otherToken = AuthService.createAccessToken({ sub: otherStudentEmail, role: 'student' });
    const adminToken = AuthService.createAccessToken({ sub: adminEmail, role: 'admin' });

    // Seed test records
    await User.deleteMany({ email: { $in: [studentEmail, otherStudentEmail, adminEmail] } });
    await Attendance.deleteMany({ student_email: { $in: [studentEmail, otherStudentEmail] } });

      await User.create([
        {
          full_name: 'Predictive Test Student',
          email: studentEmail,
          password_hash: 'hashed_pw',
          role: 'student',
          department: 'Computer Science',
        },
        {
          full_name: 'Other Student',
          email: otherStudentEmail,
          password_hash: 'hashed_pw',
          role: 'student',
          department: 'Information Science',
        },
        {
          full_name: 'Predictive Admin',
          email: adminEmail,
          password_hash: 'hashed_pw',
          role: 'admin',
          department: 'Management',
        },
      ]);

      // Seed 20 historical attendances: 14 Present, 6 Absent (70% current rate)
      const now = new Date();
      const records = [];
      for (let i = 1; i <= 20; i++) {
        const isPresent = i <= 14;
        const ts = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        records.push({
          student_email: studentEmail,
          session_id: new mongoose.Types.ObjectId(),
          timestamp: ts,
          status: isPresent ? 'Present' : 'Absent',
          verification_method: 'face',
        });
      }
      await Attendance.insertMany(records);

    // ─── Test 1: 401 without authentication ────────────────────────────────
    console.log('\n[TEST 1] Auth Guard — 401 on unauthenticated request...');
    const res1 = await fetch(`${baseUrl}/analytics/predictive-risk`);
    assert.strictEqual(res1.status, 401, 'Unauthenticated request must return 401');
    console.log('  ✅ Unauthenticated access correctly rejected with 401');

    // ─── Test 2: Student Predictive Risk Trajectory ────────────────────────
    console.log('\n[TEST 2] Student Predictive Risk Trajectory...');
    const res2 = await fetch(`${baseUrl}/analytics/predictive-risk`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert.strictEqual(res2.status, 200, 'Student predictive risk request must return 200');
    const data2 = await res2.json();
    assert.strictEqual(data2.success, true);
    assert.strictEqual(data2.isStudentView, true);
    assert.ok(data2.prediction, 'Response must contain prediction object');
    assert.ok(typeof data2.prediction.projectedRate === 'number', 'projectedRate must be a number');
    assert.ok(typeof data2.prediction.velocity === 'number', 'velocity must be a number');
    assert.ok(['critical', 'warning', 'safe'].includes(data2.prediction.riskLevel), 'riskLevel must be valid tier');
    assert.ok(data2.prediction.recovery.target75, 'Must contain target75 recovery calculations');
    console.log(`  ✅ Student forecast verified (Projected: ${(data2.prediction.projectedRate * 100).toFixed(1)}%, Risk: ${data2.prediction.riskLevel})`);

    // ─── Test 3: Admin / Staff Institutional Risk Roster ────────────────────
    console.log('\n[TEST 3] Admin Institutional Predictive Risk Overview...');
    const res3 = await fetch(`${baseUrl}/analytics/predictive-risk`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(res3.status, 200);
    const data3 = await res3.json();
    assert.strictEqual(data3.success, true);
    assert.ok(data3.summary, 'Admin view must contain summary metrics');
    assert.ok(typeof data3.summary.criticalCount === 'number');
    assert.ok(typeof data3.summary.warningCount === 'number');
    assert.ok(typeof data3.summary.safeCount === 'number');
    assert.ok(Array.isArray(data3.predictions), 'Admin view must contain predictions array');
    console.log(`  ✅ Institutional summary verified (Evaluated: ${data3.summary.totalEvaluated}, Critical: ${data3.summary.criticalCount}, Safe: ${data3.summary.safeCount})`);

    // ─── Test 4: Timetable Insights & Absenteeism Pattern AI ───────────────
    console.log('\n[TEST 4] Timetable Insights & Anomaly Detection...');
    const res4 = await fetch(`${baseUrl}/analytics/timetable-insights`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(res4.status, 200);
    const data4 = await res4.json();
    assert.strictEqual(data4.success, true);
    assert.ok(Array.isArray(data4.grid), 'Timetable insights must contain day-slot grid');
    assert.ok(Array.isArray(data4.anomalies), 'Must return detected anomaly list');
    assert.ok(Array.isArray(data4.recommendations), 'Must return AI optimization recommendations');
    assert.ok(data4.recommendations.length > 0, 'Must have at least 1 recommendation');
    console.log(`  ✅ Timetable pattern AI verified (Grid items: ${data4.grid.length}, Recommendations: ${data4.recommendations.length})`);

    // ─── Test 5: Student Velocity Trajectory ────────────────────────────────
    console.log('\n[TEST 5] Student Weekly Velocity Trajectory...');
    const res5 = await fetch(`${baseUrl}/analytics/student-velocity/${studentEmail}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert.strictEqual(res5.status, 200);
    const data5 = await res5.json();
    assert.strictEqual(data5.success, true);
    assert.ok(Array.isArray(data5.weeklyData), 'Must return 4-week attendance breakdown');
    assert.strictEqual(data5.weeklyData.length, 4, 'Must return exactly 4 weekly intervals');
    assert.ok(data5.velocityTrend, 'Must return velocityTrend metrics');
    console.log(`  ✅ Weekly trajectory verified (Velocity: ${data5.velocityTrend.velocityPercent}%, Direction: ${data5.velocityTrend.trendDirection})`);

    // ─── Test 6: RBAC Isolation on Student Velocity ─────────────────────────
    console.log('\n[TEST 6] RBAC Data Isolation Guard on Student Velocity...');
    const res6 = await fetch(`${baseUrl}/analytics/student-velocity/${studentEmail}`, {
      headers: { Authorization: `Bearer ${otherToken}` },
    });
    assert.strictEqual(res6.status, 403, 'A student cannot access another student velocity profile');
    console.log('  ✅ Cross-student unauthorized data access correctly blocked with 403');

    // Clean up test records
    if (mongoose.connection.readyState === 1) {
      await User.deleteMany({ email: { $in: [studentEmail, otherStudentEmail, adminEmail] } });
      await Attendance.deleteMany({ student_email: { $in: [studentEmail, otherStudentEmail] } });
    }

    console.log('\n=============================================================');
    console.log('🎉 ALL PREDICTIVE ATTENDANCE RISK & VELOCITY TESTS PASSED (6/6)');
    console.log('=============================================================\n');
  } finally {
    server.close();
    if (selfConnected && mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  }
}

if (require.main === module) {
  runPredictiveAnalyticsTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Test failed:', err);
      process.exit(1);
    });
}

module.exports = runPredictiveAnalyticsTests;
