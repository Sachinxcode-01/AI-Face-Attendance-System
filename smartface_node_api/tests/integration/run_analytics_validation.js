/**
 * run_analytics_validation.js
 * ----------------------------
 * Integration tests for the Advanced Analytics API endpoints (Phase 4).
 *
 * Tests:
 *  1. GET /analytics/trends          – returns monthly attendance trend data
 *  2. GET /analytics/risk-students   – returns list of at-risk students
 *  3. GET /analytics/department-comparison – returns dept-wise averages
 *  4. GET /analytics/subject-wise    – returns subject-wise averages
 *  5. GET /analytics/heatmap         – returns 30-day check-in heatmap
 *  6. GET /analytics/export          – returns CSV content
 *  7. Auth guard check               – 401 without token
 *  8. Role guard check               – 403 for student on admin-only routes
 */

'use strict';

const path        = require('path');
const dotenv      = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const express     = require('express');
const mongoose    = require('mongoose');
const http        = require('http');
const jwt         = require('jsonwebtoken');

// ---------------------------------------------------------------------------
// Environment & constants
// ---------------------------------------------------------------------------
const JWT_SECRET = process.env.JWT_SECRET || 'smartface-test-secret-2024';
const TEST_PORT  = 14321;
const TEST_URL   = `http://localhost:${TEST_PORT}`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const makeToken = (email, role) =>
  jwt.sign({ email, role }, JWT_SECRET, { expiresIn: '1h' });

const fetch = (...args) =>
  import('node-fetch').then(({ default: f }) => f(...args));

let passed = 0;
let failed = 0;

const assert = (label, condition, actual = '') => {
  if (condition) {
    console.log(`  ✅ PASS: ${label}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${label}${actual ? ` — Got: ${actual}` : ''}`);
    failed++;
  }
};

// ---------------------------------------------------------------------------
// Bootstrap a minimal Express + Mongoose app
// ---------------------------------------------------------------------------
async function buildTestApp() {
  const MONGO_URI =
    process.env.MONGODB_URL || 'mongodb://localhost:27017/smartface';
  await mongoose.connect(MONGO_URI, { dbName: 'smartface' });

  const testApp = express();
  testApp.use(express.json());

  // Wire up auth middleware (uses JWT_SECRET from env)
  process.env.JWT_SECRET = JWT_SECRET;
  testApp.use('/analytics', require('../../src/routes/analytics'));

  return testApp;
}

// ---------------------------------------------------------------------------
// Main test runner
// ---------------------------------------------------------------------------
async function runTests() {
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║     SmartFace AI v1.1 — Analytics Validation        ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  let server;

  try {
    const testApp = await buildTestApp();
    server = http.createServer(testApp);
    await new Promise((res) => server.listen(TEST_PORT, res));
    console.log(`🌐  Test server running on ${TEST_URL}\n`);

    const adminToken   = makeToken('admin@smartface.ai', 'admin');
    const teacherToken = makeToken('teacher@smartface.ai', 'teacher');
    const studentToken = makeToken('student@smartface.ai', 'student');
    const headers      = { Authorization: `Bearer ${adminToken}` };

    // ── Test 1: Auth guard ─────────────────────────────────────────────────
    console.log('📡  Test 1: Auth guard — 401 without token');
    const noAuthRes = await fetch(`${TEST_URL}/analytics/trends`);
    assert('Unauthenticated request returns 401', noAuthRes.status === 401);

    // ── Test 2: Trends ─────────────────────────────────────────────────────
    console.log('\n📡  Test 2: GET /analytics/trends');
    const trendsRes  = await fetch(`${TEST_URL}/analytics/trends`, { headers });
    const trendsBody = await trendsRes.json();
    assert('Trends status is 200', trendsRes.status === 200, trendsRes.status);
    assert('Trends response has "trends" array', Array.isArray(trendsBody.trends));

    // ── Test 3: Risk students — admin ──────────────────────────────────────
    console.log('\n📡  Test 3: GET /analytics/risk-students (admin)');
    const riskRes  = await fetch(`${TEST_URL}/analytics/risk-students`, { headers });
    const riskBody = await riskRes.json();
    assert('Risk-students status is 200', riskRes.status === 200, riskRes.status);
    assert('Risk-students has "riskStudents" array', Array.isArray(riskBody.riskStudents));

    // ── Test 4: Risk students — student should get 403 ─────────────────────
    console.log('\n📡  Test 4: Role guard — student cannot access /analytics/risk-students');
    const studentRiskRes = await fetch(`${TEST_URL}/analytics/risk-students`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert('Student gets 403 on risk-students', studentRiskRes.status === 403, studentRiskRes.status);

    // ── Test 5: Department comparison ──────────────────────────────────────
    console.log('\n📡  Test 5: GET /analytics/department-comparison');
    const deptRes  = await fetch(`${TEST_URL}/analytics/department-comparison`, { headers });
    const deptBody = await deptRes.json();
    assert('Dept-comparison status is 200', deptRes.status === 200, deptRes.status);
    assert('Dept-comparison has "departments" array', Array.isArray(deptBody.departments));

    // ── Test 6: Subject-wise ───────────────────────────────────────────────
    console.log('\n📡  Test 6: GET /analytics/subject-wise');
    const subRes  = await fetch(`${TEST_URL}/analytics/subject-wise`, {
      headers: { Authorization: `Bearer ${teacherToken}` },
    });
    const subBody = await subRes.json();
    assert('Subject-wise status is 200', subRes.status === 200, subRes.status);
    assert('Subject-wise has "subjects" array', Array.isArray(subBody.subjects));

    // ── Test 7: Heatmap ───────────────────────────────────────────────────
    console.log('\n📡  Test 7: GET /analytics/heatmap');
    const heatRes  = await fetch(`${TEST_URL}/analytics/heatmap`, { headers });
    const heatBody = await heatRes.json();
    assert('Heatmap status is 200', heatRes.status === 200, heatRes.status);
    assert('Heatmap has "heatmap" array', Array.isArray(heatBody.heatmap));

    // ── Test 8: CSV export ────────────────────────────────────────────────
    console.log('\n📡  Test 8: GET /analytics/export (CSV)');
    const exportRes = await fetch(`${TEST_URL}/analytics/export`, { headers });
    const exportText = await exportRes.text();
    assert('Export status is 200', exportRes.status === 200, exportRes.status);
    assert(
      'Export Content-Type is text/csv',
      (exportRes.headers.get('content-type') || '').includes('text/csv'),
      exportRes.headers.get('content-type'),
    );
    assert('CSV has header row', exportText.startsWith('email,name,department'));

    // ── Test 9: Export — student forbidden ────────────────────────────────
    console.log('\n📡  Test 9: Role guard — student cannot access /analytics/export');
    const studentExportRes = await fetch(`${TEST_URL}/analytics/export`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert('Student gets 403 on export', studentExportRes.status === 403, studentExportRes.status);

    // ── Test 10: Student can access heatmap (own data) ────────────────────
    console.log('\n📡  Test 10: Student GET /analytics/heatmap (own data)');
    const studentHeatRes  = await fetch(`${TEST_URL}/analytics/heatmap`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const studentHeatBody = await studentHeatRes.json();
    assert('Student heatmap status is 200', studentHeatRes.status === 200, studentHeatRes.status);
    assert('Student heatmap has "heatmap" array', Array.isArray(studentHeatBody.heatmap));

  } catch (err) {
    console.error('\n💥  Unexpected test error:', err.message || err);
    failed++;
  } finally {
    const { awaitPendingJobs } = require('../../src/utils/jobTracker');
    await awaitPendingJobs();
    if (server) await new Promise((res) => server.close(res));
    await mongoose.disconnect();

    console.log('\n══════════════════════════════════════════════════════');
    console.log(`📊  Results: ${passed} passed, ${failed} failed`);
    if (failed === 0) {
      console.log('🎉  All analytics validation tests PASSED!');
    } else {
      console.error(`⚠️   ${failed} test(s) FAILED.`);
      process.exit(1);
    }
  }
}

runTests();
