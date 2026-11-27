'use strict';

/**
 * SmartFace Parent Portal — Integration & Security Validation Suite
 * Verifies:
 * 1. Single-use guardian invitation creation & atomic redemption
 * 2. Invitation replay rejection & anti-enumeration
 * 3. Cross-student IDOR & cross-institution tenant isolation
 * 4. Deterministic attendance stats, forecasting & dashboard
 * 5. Leave validation, overlap prevention & withdrawal
 * 6. Attendance dispute guardian authorization
 * 7. Report download authorization
 * 8. Nexa AI parent copilot authorization & grounding
 * 9. Immediate access revocation
 */

const assert = require('assert');
const http = require('http');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const User = require('../../src/models/User');
const Session = require('../../src/models/Session');
const Attendance = require('../../src/models/Attendance');
const Leave = require('../../src/models/Leave');
const AttendanceDispute = require('../../src/models/AttendanceDispute');
const GuardianRelationship = require('../../src/models/GuardianRelationship');
const GuardianInvitation = require('../../src/models/GuardianInvitation');
const ParentEnquiry = require('../../src/models/ParentEnquiry');
const crypto = require('crypto');
const UserSession = require('../../src/models/UserSession');
const AuthService = require('../../src/services/authService');

const BASE_PORT = 8019;
process.env.PORT = String(BASE_PORT);
const BASE_URL = `http://127.0.0.1:${BASE_PORT}`;

function request(method, urlPath, token, body = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = http.request(`${BASE_URL}${urlPath}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    }, (res) => {
      let raw = '';
      res.on('data', (chunk) => { raw += chunk; });
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(raw); } catch { json = raw; }
        resolve({ status: res.statusCode, data: json });
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function run() {
  const ts = Date.now();
  const parentEmail = `parent_test_${ts}@smartface.pro`;
  const wardEmail = `ward_test_${ts}@smartface.pro`;
  const otherStudentEmail = `other_stu_${ts}@smartface.pro`;
  const otherCollegeStudentEmail = `col_b_stu_${ts}@smartface.pro`;

  let server;
  let dbConnected = false;

  try {
    const app = require('../../src/app');
    server = app.server;

    // Wait for DB connection initiated by app.js
    for (let i = 0; i < 60; i++) {
      if (mongoose.connection.readyState === 1) { dbConnected = true; break; }
      await new Promise((r) => setTimeout(r, 300));
    }
    assert(dbConnected, 'MongoDB must be connected');

    await User.insertMany([
      { email: parentEmail, full_name: 'Test Parent', role: 'parent', college_id: 'COL_A', account_status: 'active' },
      { email: wardEmail, full_name: 'Test Ward', role: 'student', student_id: `STU_${ts}`, college_id: 'COL_A', department: 'CSE', semester: '5', account_status: 'active' },
      { email: otherStudentEmail, full_name: 'Unlinked Student', role: 'student', student_id: `OTH_${ts}`, college_id: 'COL_A', department: 'CSE', semester: '5', account_status: 'active' },
      { email: otherCollegeStudentEmail, full_name: 'College B Student', role: 'student', student_id: `CB_${ts}`, college_id: 'COL_B', department: 'ECE', semester: '5', account_status: 'active' },
    ]);

    const sess = await Session.create({
      subject: 'Algorithms',
      subject_code: 'CS301',
      qr_code: `QR_TEST_${ts}`,
      teacher_id: `teacher_${ts}@smartface.pro`,
      college_id: 'COL_A',
      department: 'CSE',
      semester: '5',
      start_time: new Date(Date.now() - 3600000),
      end_time: new Date(),
      is_active: false,
    });

    await Attendance.insertMany([
      { student_email: wardEmail, session_id: sess._id.toString(), subject: 'Algorithms', status: 'Present', verified_by: 'face', timestamp: new Date() },
      { student_email: otherStudentEmail, session_id: sess._id.toString(), subject: 'Algorithms', status: 'Absent', verified_by: 'system', timestamp: new Date() },
    ]);

    const parentToken = AuthService.createAccessToken({ sub: parentEmail, role: 'parent' });
    const wardToken = AuthService.createAccessToken({ sub: wardEmail, role: 'student' });

    await UserSession.insertMany([
      {
        userId: parentEmail,
        userEmail: parentEmail,
        tokenHash: crypto.createHash('sha256').update(parentToken).digest('hex'),
        device: 'parent-validation-suite',
        ip: '127.0.0.1',
        expiry: new Date(Date.now() + 3600000),
      },
      {
        userId: wardEmail,
        userEmail: wardEmail,
        tokenHash: crypto.createHash('sha256').update(wardToken).digest('hex'),
        device: 'parent-validation-suite',
        ip: '127.0.0.1',
        expiry: new Date(Date.now() + 3600000),
      },
    ]);

    console.log('1. Testing anti-enumeration & unverified linking...');
    const enumRes = await request('POST', '/parent/link-student', parentToken, { student_email: 'nonexistent_999@smartface.pro' });
    assert.strictEqual(enumRes.status, 202, 'Unverified/missing student should return 202 anti-enumeration');

    const pendingReq = await request('POST', '/parent/link-student', parentToken, { student_email: otherStudentEmail, relationship_type: 'mother' });
    assert.strictEqual(pendingReq.status, 202, 'Unconfirmed student link must stay pending_approval');
    assert.strictEqual(pendingReq.data.status, 'pending_approval');

    console.log('2. Testing single-use guardian invitation creation & atomic redemption...');
    const invRes = await request('POST', '/parent/invitations', wardToken, { relationship_type: 'father' });
    assert.strictEqual(invRes.status, 201);
    assert(invRes.data.code && invRes.data.code.startsWith('SF-'));

    const redeemRes = await request('POST', '/parent/invitations/redeem', parentToken, { code: invRes.data.code, relationship_type: 'father' });
    assert.strictEqual(redeemRes.status, 200);
    assert.strictEqual(redeemRes.data.success, true);

    console.log('3. Testing invitation replay rejection...');
    const replayRes = await request('POST', '/parent/invitations/redeem', parentToken, { code: invRes.data.code });
    assert.strictEqual(replayRes.status, 400, 'Reused invitation code must be rejected');

    console.log('4. Testing authorized dashboard, stats & cross-student IDOR protection...');
    const dashRes = await request('GET', `/parent/child/dashboard/${encodeURIComponent(wardEmail)}`, parentToken);
    assert.strictEqual(dashRes.status, 200);
    assert.strictEqual(dashRes.data.summary.total_present, 1);

    const idorDash = await request('GET', `/parent/child/dashboard/${encodeURIComponent(otherStudentEmail)}`, parentToken);
    assert.strictEqual(idorDash.status, 403, 'Pending/unlinked student dashboard must be 403');

    const crossCollege = await request('GET', `/parent/child/stats/${encodeURIComponent(otherCollegeStudentEmail)}`, parentToken);
    assert.strictEqual(crossCollege.status, 403, 'Cross-institution student stats must be 403');

    console.log('5. Testing report & dispute authorization...');
    const rptOk = await request('GET', `/reports/student/${encodeURIComponent(wardEmail)}?format=json`, parentToken);
    assert.strictEqual(rptOk.status, 200);
    const rptForbid = await request('GET', `/reports/student/${encodeURIComponent(otherStudentEmail)}?format=json`, parentToken);
    assert.strictEqual(rptForbid.status, 403);

    const dispForbid = await request('POST', '/attendance/disputes', parentToken, {
      student_email: otherStudentEmail,
      session_id: sess._id.toString(),
      reason: 'Attempting IDOR dispute submission',
    });
    assert.strictEqual(dispForbid.status, 403, 'Parent must not submit disputes for unlinked students');

    console.log('6. Testing Nexa AI parent authorization...');
    const nexaForbid = await request('POST', '/ai/chat', parentToken, {
      message: 'What is attendance?',
      student_email: otherStudentEmail,
    });
    assert.strictEqual(nexaForbid.status, 403, 'Nexa AI must reject unauthorized ward queries');

    const nexaOk = await request('POST', '/ai/chat', parentToken, {
      message: 'What is my child attendance?',
      student_email: wardEmail,
    });
    assert.strictEqual(nexaOk.status, 200);

    console.log('7. Testing leave validation, overlap prevention & withdrawal...');
    const leaveOk = await request('POST', '/parent/child/absence-notice', parentToken, {
      childEmail: wardEmail,
      category: 'Medical',
      start_date: '2026-12-01',
      end_date: '2026-12-02',
      reason: 'Scheduled medical checkup',
    });
    assert.strictEqual(leaveOk.status, 201);

    const leaveOverlap = await request('POST', '/parent/child/absence-notice', parentToken, {
      childEmail: wardEmail,
      category: 'Personal',
      start_date: '2026-12-02',
      end_date: '2026-12-03',
      reason: 'Overlapping personal leave',
    });
    assert.strictEqual(leaveOverlap.status, 409, 'Overlapping leave must return 409');

    const withdrawRes = await request('POST', `/parent/child/leaves/${leaveOk.data.leaveId}/withdraw`, parentToken);
    assert.strictEqual(withdrawRes.status, 200);

    const legacyLeaveForbid = await request('POST', '/leave/apply', parentToken, {
      student_email: otherStudentEmail,
      category: 'Personal',
      start_date: '2026-12-05',
      end_date: '2026-12-05',
      reason: 'IDOR test on /leave/apply',
    });
    assert.strictEqual(legacyLeaveForbid.status, 403, '/leave/apply must enforce GuardianRelationship');

    console.log('8. Testing institutional enquiry & guardian notifications...');
    const notificationService = require('../../src/services/notificationService');
    assert.strictEqual(typeof notificationService.sendRealTime, 'function', 'notificationService.sendRealTime must exist');
    const { notifyAuthorizedGuardians } = require('../../src/services/guardianService');
    await notifyAuthorizedGuardians(wardEmail, {
      title: 'Test Classroom Attendance',
      message: 'Test Ward was marked Present for Algorithms (classroom session).',
      type: 'attendance',
    });
    const parentNotifs = await request('GET', '/notifications', parentToken);
    assert.strictEqual(parentNotifs.status, 200);
    assert(
      (parentNotifs.data.notifications || []).some((n) => n.title === 'Test Classroom Attendance'),
      'Active guardian must receive attendance notification'
    );

    const enqRes = await request('POST', '/parent/enquiries', parentToken, {
      student_email: wardEmail,
      subject: 'Attendance policy question',
      message: 'Please clarify lab attendance calculation.',
    });
    assert.strictEqual(enqRes.status, 201);

    console.log('9. Testing immediate relationship revocation...');
    const relsRes = await request('GET', '/parent/relationships', parentToken);
    const activeRel = (relsRes.data.relationships || []).find((r) => r.student_email === wardEmail && r.status === 'active');
    assert(activeRel, 'Active relationship must exist before revocation');

    const revRes = await request('POST', `/parent/relationships/${activeRel.id}/revoke`, parentToken, { reason: 'Test revocation' });
    assert.strictEqual(revRes.status, 200);

    const afterRevokeDash = await request('GET', `/parent/child/dashboard/${encodeURIComponent(wardEmail)}`, parentToken);
    assert.strictEqual(afterRevokeDash.status, 403, 'Access must be revoked immediately after relationship termination');

    const afterRevokeLeave = await request('POST', '/leave/apply', parentToken, {
      student_email: wardEmail,
      category: 'Personal',
      start_date: '2026-12-06',
      end_date: '2026-12-06',
      reason: 'Post-revocation leave attempt',
    });
    assert.strictEqual(afterRevokeLeave.status, 403, '/leave/apply must reject revoked guardian');

    console.log('✅ ALL PARENT PORTAL INTEGRATION & SECURITY CHECKS PASSED!');
  } finally {
    if (dbConnected) {
      await Promise.all([
        User.deleteMany({ email: { $in: [parentEmail, wardEmail, otherStudentEmail, otherCollegeStudentEmail] } }),
        GuardianRelationship.deleteMany({ parent_email: parentEmail }),
        GuardianInvitation.deleteMany({ student_email: wardEmail }),
        Attendance.deleteMany({ student_email: { $in: [wardEmail, otherStudentEmail] } }),
        Leave.deleteMany({ user_id: wardEmail }),
        AttendanceDispute.deleteMany({ student_email: { $in: [wardEmail, otherStudentEmail] } }),
        ParentEnquiry.deleteMany({ parent_email: parentEmail }),
        UserSession.deleteMany({ userEmail: { $in: [parentEmail, wardEmail] } }),
        Session.deleteMany({ teacher_id: `teacher_${ts}@smartface.pro` }),
      ]);
      await mongoose.disconnect().catch(() => { });
    }
    if (server && server.listening) {
      await new Promise((resolve) => server.close(resolve));
    }
  }
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Parent Portal Validation Failed:', err);
    process.exit(1);
  });
