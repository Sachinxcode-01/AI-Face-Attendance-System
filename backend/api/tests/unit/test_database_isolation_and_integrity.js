'use strict';

const assert = require('assert');
const http = require('http');
const crypto = require('crypto');
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../../.env') });
process.env.NODE_ENV = 'test';

const AuthService = require('../../src/services/authService');
const User = require('../../src/models/User');
const College = require('../../src/models/College');
const Session = require('../../src/models/Session');
const Attendance = require('../../src/models/Attendance');
const AttendanceAnalytics = require('../../src/models/AttendanceAnalytics');
const AttendanceAuditLog = require('../../src/models/AttendanceAuditLog');
const AttendanceDispute = require('../../src/models/AttendanceDispute');
const Notification = require('../../src/models/Notification');
const UserSession = require('../../src/models/UserSession');

async function main() {
  const mongoUrl = process.env.MONGODB_URL || process.env.MONGO_URI;
  await mongoose.connect(mongoUrl, { dbName: process.env.DATABASE_NAME || 'smartface' });

  const suffix = crypto.randomBytes(4).toString('hex');
  const colACode = `ALPHA_${suffix.toUpperCase()}`;
  const colBCode = `BETA_${suffix.toUpperCase()}`;
  const adminAEmail = `admin_a_${suffix}@alpha.test`;
  const teacherBEmail = `teacher_b_${suffix}@beta.test`;
  const stuAEmail = `stu_a_${suffix}@alpha.test`;
  const stuBEmail = `stu_b_${suffix}@beta.test`;

  const app = express();
  app.use(express.json());
  app.use('/attendance', require('../../src/routes/attendance'));
  app.use('/analytics', require('../../src/routes/analytics'));
  app.use('/notifications', require('../../src/routes/notifications'));
  app.use('/sessions', require('../../src/routes/sessions'));
  app.use('/reports', require('../../src/routes/reports'));

  const server = http.createServer(app);
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  let sessB = null;
  let sessA = null;

  try {
    const [colA, colB] = await College.create([
      { name: `Alpha College ${suffix}`, code: colACode, is_active: true },
      { name: `Beta College ${suffix}`, code: colBCode, is_active: true },
    ]);

    await User.create([
      { email: adminAEmail, full_name: 'Admin Alpha', role: 'admin', college_id: colA._id.toString(), college: colA.name, account_status: 'active' },
      { email: teacherBEmail, full_name: 'Teacher Beta', role: 'teacher', college_id: colB._id.toString(), college: colB.name, account_status: 'active' },
      { email: stuAEmail, full_name: '=CMD|calc', role: 'student', college_id: colA._id.toString(), college: colA.name, department: 'CSE', account_status: 'active' },
      { email: stuBEmail, full_name: 'Student Beta', role: 'student', college_id: colB._id.toString(), college: colB.name, department: 'CSE', account_status: 'active' },
    ]);

    sessA = await Session.create({
      teacher_id: adminAEmail,
      college_id: colA._id.toString(),
      subject: `CS101_${suffix}`,
      is_active: true,
      status: 'active',
      qr_code: crypto.randomBytes(32).toString('hex'),
    });

    sessB = await Session.create({
      teacher_id: teacherBEmail,
      college_id: colB._id.toString(),
      subject: `BIO202_${suffix}`,
      is_active: true,
      status: 'active',
      qr_code: crypto.randomBytes(32).toString('hex'),
    });

    await Attendance.create([
      { student_email: stuAEmail, session_id: sessA._id.toString(), college_id: colA._id.toString(), subject: sessA.subject, status: 'Absent', verified_by: 'manual' },
      { student_email: stuBEmail, session_id: sessB._id.toString(), college_id: colB._id.toString(), subject: sessB.subject, status: 'Absent', verified_by: 'manual' },
    ]);

    await AttendanceAnalytics.create([
      { student_email: stuAEmail, college_id: colA._id.toString(), health_score: 40, standing: 'Critical' },
      { student_email: stuBEmail, college_id: colB._id.toString(), health_score: 45, standing: 'Critical' },
    ]);

    await AttendanceAuditLog.create({
      actor_email: teacherBEmail,
      college_id: colB._id.toString(),
      role: 'teacher',
      action: 'SESSION_STARTED',
      target_resource: `session:${sessB._id.toString()}`,
    });

    await AttendanceDispute.create({
      student_email: stuBEmail,
      session_id: sessB._id.toString(),
      college_id: colB._id.toString(),
      reason: 'Cross-tenant isolation check dispute',
      status: 'Pending',
    });

    const adminAToken = AuthService.createAccessToken({ sub: adminAEmail, role: 'admin', college_id: colA._id.toString() });
    const stuAToken = AuthService.createAccessToken({ sub: stuAEmail, role: 'student', college_id: colA._id.toString() });
    const adminAHeaders = { Authorization: `Bearer ${adminAToken}`, 'Content-Type': 'application/json' };
    const stuAHeaders = { Authorization: `Bearer ${stuAToken}`, 'Content-Type': 'application/json' };

    // 1. Cross-tenant student attendance, analytics, and report read
    const rHist = await fetch(`${baseUrl}/attendance/history/${encodeURIComponent(stuBEmail)}`, { headers: adminAHeaders });
    assert.strictEqual(rHist.status, 403, `Expected 403 for cross-tenant history, got ${rHist.status}`);

    const rStuAn = await fetch(`${baseUrl}/attendance/analytics/${encodeURIComponent(stuBEmail)}`, { headers: adminAHeaders });
    assert.strictEqual(rStuAn.status, 403, `Expected 403 for cross-tenant student analytics, got ${rStuAn.status}`);

    const rRpt = await fetch(`${baseUrl}/reports/student/${encodeURIComponent(stuBEmail)}`, { headers: adminAHeaders });
    assert.strictEqual(rRpt.status, 403, `Expected 403 for cross-tenant student report, got ${rRpt.status}`);

    // 2. Cross-tenant analytics isolation + CSV formula injection neutralization
    const rRisk = await fetch(`${baseUrl}/analytics/risk-students?threshold=0.9`, { headers: adminAHeaders });
    assert.strictEqual(rRisk.status, 200);
    const riskData = await rRisk.json();
    assert.ok(!riskData.riskStudents.some((s) => s.email === stuBEmail), 'Tenant B student leaked in /analytics/risk-students');

    const rExport = await fetch(`${baseUrl}/analytics/export`, { headers: adminAHeaders });
    assert.strictEqual(rExport.status, 200);
    const csvBody = await rExport.text();
    assert.ok(!csvBody.includes(stuBEmail), 'Tenant B student leaked in /analytics/export');
    assert.ok(csvBody.includes("'=CMD|calc"), 'CSV formula injection was not neutralized in /analytics/export');

    // 3. Cross-tenant notification broadcast isolation
    const rAnn = await fetch(`${baseUrl}/notifications/announcement`, {
      method: 'POST',
      headers: adminAHeaders,
      body: JSON.stringify({ title: 'Alpha Notice', message: 'Tenant A only' }),
    });
    assert.strictEqual(rAnn.status, 201);
    const betaNotif = await Notification.findOne({ user_id: stuBEmail, title: 'Alpha Notice' }).lean();
    assert.strictEqual(betaNotif, null, 'Tenant B student received Tenant A announcement');

    // 4. Cross-tenant live-monitor, audit-logs, and disputes isolation
    const rLive = await fetch(`${baseUrl}/attendance/live-monitor`, { headers: adminAHeaders });
    assert.strictEqual(rLive.status, 200);
    const liveData = await rLive.json();
    assert.ok(!liveData.some((s) => s.session_id === sessB._id.toString()), 'Tenant B session leaked in /attendance/live-monitor');

    const rAudit = await fetch(`${baseUrl}/attendance/audit-logs`, { headers: adminAHeaders });
    assert.strictEqual(rAudit.status, 200);
    const auditData = await rAudit.json();
    assert.ok(!auditData.some((l) => l.actor_email === teacherBEmail), 'Tenant B audit log leaked in /attendance/audit-logs');

    const rDisp = await fetch(`${baseUrl}/attendance/disputes`, { headers: adminAHeaders });
    assert.strictEqual(rDisp.status, 200);
    const dispData = await rDisp.json();
    assert.ok(!dispData.disputes.some((d) => d.student_email === stuBEmail), 'Tenant B dispute leaked in /attendance/disputes');

    // 5. Cross-tenant QR token & regeneration isolation
    const rQrGet = await fetch(`${baseUrl}/sessions/${sessB._id.toString()}/qr-token`, { headers: adminAHeaders });
    assert.strictEqual(rQrGet.status, 403, `Expected 403 for cross-tenant QR token, got ${rQrGet.status}`);

    const rQrRegen = await fetch(`${baseUrl}/sessions/${sessB._id.toString()}/qr-regenerate`, { method: 'POST', headers: adminAHeaders });
    assert.strictEqual(rQrRegen.status, 403, `Expected 403 for cross-tenant QR regenerate, got ${rQrRegen.status}`);

    // 6. Concurrent duplicate attendance protection (unique index + atomic admission)
    await Attendance.deleteOne({ student_email: stuAEmail, session_id: sessA._id.toString() });
    const { issueAttendanceQrToken } = require('../../src/utils/attendanceQr');
    const qrPayload = issueAttendanceQrToken(sessA);
    const markResults = await Promise.all(
      Array.from({ length: 5 }, () =>
        fetch(`${baseUrl}/attendance/mark`, {
          method: 'POST',
          headers: stuAHeaders,
          body: JSON.stringify({ session_id: sessA._id.toString(), qr_code: qrPayload.token }),
        }).then((r) => r.status)
      )
    );
    const okCount = markResults.filter((s) => s === 200).length;
    assert.strictEqual(okCount, 1, `Expected exactly 1 concurrent attendance success, got ${markResults.join(',')}`);
    const attCount = await Attendance.countDocuments({ student_email: stuAEmail, session_id: sessA._id.toString() });
    assert.strictEqual(attCount, 1, `Expected 1 attendance doc in DB, got ${attCount}`);

    console.log('🎉 ALL DATABASE ISOLATION, FORMULA INJECTION & CONCURRENCY TESTS PASSED!');
  } finally {
    await Promise.all([
      College.deleteMany({ code: { $in: [colACode, colBCode] } }),
      User.deleteMany({ email: { $in: [adminAEmail, teacherBEmail, stuAEmail, stuBEmail] } }),
      Session.deleteMany({ _id: { $in: [sessA?._id, sessB?._id].filter(Boolean) } }),
      Attendance.deleteMany({ student_email: { $in: [stuAEmail, stuBEmail] } }),
      AttendanceAnalytics.deleteMany({ student_email: { $in: [stuAEmail, stuBEmail] } }),
      AttendanceAuditLog.deleteMany({ actor_email: { $in: [adminAEmail, teacherBEmail, stuAEmail] } }),
      AttendanceDispute.deleteMany({ student_email: { $in: [stuAEmail, stuBEmail] } }),
      Notification.deleteMany({ user_id: { $in: [stuAEmail, stuBEmail, adminAEmail, teacherBEmail] } }),
      UserSession.deleteMany({ userId: { $in: [adminAEmail, stuAEmail] } }),
    ]);
    server.close();
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error('❌ Database isolation & integrity test failed:', err);
  process.exit(1);
});
