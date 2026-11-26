'use strict';

const assert = require('assert');
const path = require('path');
const http = require('http');
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../../.env') });
process.env.NODE_ENV = 'test';

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017/smartface';

const User = require('../../src/models/User');
const Session = require('../../src/models/Session');
const Attendance = require('../../src/models/Attendance');
const Leave = require('../../src/models/Leave');
const AttendanceDispute = require('../../src/models/AttendanceDispute');
const Notification = require('../../src/models/Notification');
const NexaConversation = require('../../src/models/NexaConversation');
const BiometricProfile = require('../../src/models/BiometricProfile');
const Timetable = require('../../src/models/Timetable');
const AuthService = require('../../src/services/authService');
const { issueAttendanceQrToken } = require('../../src/utils/attendanceQr');
const { awaitPendingJobs } = require('../../src/utils/jobTracker');

async function runStudentPortalValidation() {
  console.log('======================================================================');
  console.log('🧪 SMARTFACE STUDENT PORTAL — END-TO-END INTEGRATION & SECURITY SUITE');
  console.log('======================================================================');

  await mongoose.connect(MONGODB_URL, { dbName: 'smartface' });

  const ts = Date.now();
  const studentAEmail = `e2e_student_a_${ts}@smartface.pro`;
  const studentBEmail = `e2e_student_b_${ts}@smartface.pro`;
  const teacherEmail = `e2e_teacher_${ts}@smartface.pro`;
  const otherCollegeTeacher = `e2e_teacher_other_${ts}@smartface.pro`;
  const pw = 'Student@2026!';
  const newPw = 'StudentNew@2026!';

  const app = express();
  app.use(express.json());
  app.use('/auth', require('../../src/routes/auth'));
  app.use('/api', require('../../src/routes/apiCompat'));
  app.use('/sessions', require('../../src/routes/sessions'));
  app.use('/attendance', require('../../src/routes/attendance'));
  app.use('/leave', require('../../src/routes/leave'));
  app.use('/academic', require('../../src/routes/academic'));
  app.use('/notifications', require('../../src/routes/notifications'));
  app.use('/reports', require('../../src/routes/reports'));
  app.use('/', require('../../src/routes/ai'));

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  try {
    const hashed = await AuthService.hashPassword(pw);
    await User.create([
      {
        email: studentAEmail,
        full_name: 'E2E Student Alpha',
        role: 'student',
        password: hashed,
        college_id: 'COL_ALPHA',
        department: 'CSE',
        semester: '6',
        section: 'A',
        student_id: `CS-${ts}`,
      },
      {
        email: studentBEmail,
        full_name: 'E2E Student Beta',
        role: 'student',
        password: hashed,
        college_id: 'COL_BETA',
        department: 'ECE',
        semester: '4',
        section: 'B',
        student_id: `EC-${ts}`,
      },
      {
        email: teacherEmail,
        full_name: 'E2E Prof Alpha',
        role: 'teacher',
        password: hashed,
        college_id: 'COL_ALPHA',
        department: 'CSE',
      },
      {
        email: otherCollegeTeacher,
        full_name: 'E2E Prof Beta',
        role: 'teacher',
        password: hashed,
        college_id: 'COL_BETA',
        department: 'ECE',
      },
    ]);

    await Timetable.create({
      user_id: 'CSE_6_A',
      subject: 'Algorithms & Complexity',
      subject_code: 'CS601',
      day: 'Monday',
      time: '09:00 AM - 10:00 AM',
      room: 'LH-101',
      college_id: 'COL_ALPHA',
      teacher_email: teacherEmail,
      faculty_name: 'E2E Prof Alpha',
    });

    // 1. Login Student A & Student B + Teacher
    const login = async (email, password) => {
      const res = await fetch(`${baseUrl}/auth/login-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      assert.strictEqual(res.status, 200, `Login failed for ${email}`);
      return res.json();
    };

    const authA = await login(studentAEmail, pw);
    const authB = await login(studentBEmail, pw);
    const authT = await login(teacherEmail, pw);
    const headersA = { Authorization: `Bearer ${authA.access_token}`, 'Content-Type': 'application/json' };
    const headersB = { Authorization: `Bearer ${authB.access_token}`, 'Content-Type': 'application/json' };
    const headersT = { Authorization: `Bearer ${authT.access_token}`, 'Content-Type': 'application/json' };
    console.log('  ✅ 1. Student & Teacher authentication succeeded');

    // 2. Newly registered student with 0 attendance records
    const dashEmptyRes = await fetch(`${baseUrl}/attendance/dashboard`, { headers: headersA });
    assert.strictEqual(dashEmptyRes.status, 200);
    const dashEmpty = await dashEmptyRes.json();
    assert.strictEqual(dashEmpty.total_conducted, 0);
    assert.strictEqual(dashEmpty.total_present, 0);
    assert.strictEqual(dashEmpty.overall_attendance, null);
    assert.strictEqual(dashEmpty.standing, 'No Records');
    console.log('  ✅ 2. Zero-record student dashboard returns accurate empty state (no mock fallback)');

    // 3. Student profile mass-assignment protection
    const updRes = await fetch(`${baseUrl}/auth/update-profile`, {
      method: 'POST',
      headers: headersA,
      body: JSON.stringify({
        full_name: 'E2E Student Alpha Updated',
        department: 'HACKED_DEPT',
        semester: '99',
        student_id: 'HACKED_ID',
        role: 'admin',
      }),
    });
    assert.strictEqual(updRes.status, 200);
    const compatUpdRes = await fetch(`${baseUrl}/api/profile`, {
      method: 'PATCH',
      headers: headersA,
      body: JSON.stringify({ department: 'HACKED_DEPT', semester: '99' }),
    });
    assert.strictEqual(compatUpdRes.status, 200);
    const freshA = await User.findOne({ email: studentAEmail }).lean();
    assert.strictEqual(freshA.full_name, 'E2E Student Alpha Updated');
    assert.strictEqual(freshA.department, 'CSE');
    assert.strictEqual(freshA.semester, '6');
    assert.strictEqual(freshA.role, 'student');
    console.log('  ✅ 3. Institution-controlled fields & role protected against student tampering');

    // 4. Cross-student access blocked (403)
    const crossAtt = await fetch(`${baseUrl}/attendance/student/${encodeURIComponent(studentBEmail)}`, { headers: headersA });
    assert.strictEqual(crossAtt.status, 403);
    const crossAnalytics = await fetch(`${baseUrl}/attendance/analytics/${encodeURIComponent(studentBEmail)}`, { headers: headersA });
    assert.strictEqual(crossAnalytics.status, 403);
    const crossLeave = await fetch(`${baseUrl}/leave/student/${encodeURIComponent(studentBEmail)}`, { headers: headersA });
    assert.strictEqual(crossLeave.status, 403);
    const crossReport = await fetch(`${baseUrl}/reports/student/${encodeURIComponent(studentBEmail)}`, { headers: headersA });
    assert.strictEqual(crossReport.status, 403);
    const crossNotif = await fetch(`${baseUrl}/notifications/${encodeURIComponent(studentBEmail)}`, { headers: headersA });
    assert.strictEqual(crossNotif.status, 403);
    console.log('  ✅ 4. Cross-student data access blocked with 403 across all endpoints');

    // 5. QR session creation, expired QR rejection, cross-institution rejection, valid QR + duplicate/concurrency prevention
    const crypto = require('crypto');
    const sessionAlpha = await Session.create({
      teacher_id: teacherEmail,
      college_id: 'COL_ALPHA',
      subject: 'Algorithms & Complexity',
      room: 'LH-101',
      is_active: true,
      qr_code: crypto.randomBytes(32).toString('hex'),
    });
    const sessionBeta = await Session.create({
      teacher_id: otherCollegeTeacher,
      college_id: 'COL_BETA',
      subject: 'Signals & Systems',
      room: 'EC-201',
      is_active: true,
      qr_code: crypto.randomBytes(32).toString('hex'),
    });

    // Expired token rejected
    const expiredQr = issueAttendanceQrToken(sessionAlpha, Date.now() - 60_000);
    const expRes = await fetch(`${baseUrl}/attendance/mark`, {
      method: 'POST',
      headers: headersA,
      body: JSON.stringify({ session_id: sessionAlpha._id.toString(), qr_code: expiredQr.token }),
    });
    assert.strictEqual(expRes.status, 400);

    // Cross-institution QR rejected with 403
    const betaQr = issueAttendanceQrToken(sessionBeta);
    const crossInstRes = await fetch(`${baseUrl}/attendance/mark`, {
      method: 'POST',
      headers: headersA,
      body: JSON.stringify({ session_id: sessionBeta._id.toString(), qr_code: betaQr.token }),
    });
    assert.strictEqual(crossInstRes.status, 403);

    // Concurrent valid QR check-ins: only 1 succeeds, second gets 409
    const validQr = issueAttendanceQrToken(sessionAlpha);
    const [qrRes1, qrRes2] = await Promise.all([
      fetch(`${baseUrl}/attendance/mark`, {
        method: 'POST',
        headers: headersA,
        body: JSON.stringify({ session_id: sessionAlpha._id.toString(), qr_code: validQr.token }),
      }),
      fetch(`${baseUrl}/attendance/mark`, {
        method: 'POST',
        headers: headersA,
        body: JSON.stringify({ session_id: sessionAlpha._id.toString(), qr_code: validQr.token }),
      }),
    ]);
    const qrStatuses = [qrRes1.status, qrRes2.status].sort();
    assert.deepStrictEqual(qrStatuses, [200, 409], `Expected [200, 409], got ${JSON.stringify(qrStatuses)}`);
    const successQrBody = qrRes1.status === 200 ? await qrRes1.json() : await qrRes2.json();
    assert.ok(successQrBody.receipt_id && successQrBody.receipt_id.startsWith('SF-QR-'));
    console.log('  ✅ 5. QR expiry, cross-institution block, and concurrent duplicate prevention passed');

    // 6. Verify dashboard & cancelled session exclusion
    const cancelledSession = await Session.create({
      teacher_id: teacherEmail,
      college_id: 'COL_ALPHA',
      subject: 'Algorithms & Complexity',
      is_active: false,
      qr_code: crypto.randomBytes(32).toString('hex'),
    });
    await Attendance.create({
      student_email: studentAEmail,
      session_id: cancelledSession._id.toString(),
      status: 'Cancelled session',
      verified_by: 'manual',
    });

    const dashLiveRes = await fetch(`${baseUrl}/attendance/dashboard`, { headers: headersA });
    const dashLive = await dashLiveRes.json();
    assert.strictEqual(dashLive.total_conducted, 1);
    assert.strictEqual(dashLive.total_present, 1);
    assert.strictEqual(dashLive.total_cancelled, 1);
    assert.strictEqual(dashLive.overall_attendance, 100);
    console.log('  ✅ 6. Dashboard reflects real attendance & excludes cancelled sessions');

    // 7. Forecasting simulation
    const simRes = await fetch(`${baseUrl}/attendance/forecast/simulate`, {
      method: 'POST',
      headers: headersA,
      body: JSON.stringify({ target: 75, attend_upcoming: 0, miss_upcoming: 1 }),
    });
    assert.strictEqual(simRes.status, 200);
    const simData = await simRes.json();
    assert.strictEqual(simData.simulation.currentPercentage, 50);
    assert.strictEqual(simData.simulation.eligible, false);
    console.log('  ✅ 7. Deterministic forecasting simulation verified (1/2 -> 50%)');

    // 8. Leave workflow: invalid range -> valid apply -> overlap rejected -> withdraw
    const badLeaveRes = await fetch(`${baseUrl}/leave/apply`, {
      method: 'POST',
      headers: headersA,
      body: JSON.stringify({ user_id: studentAEmail, category: 'Medical', reason: 'Clinic checkup', start_date: '2026-12-10', end_date: '2026-12-08' }),
    });
    assert.strictEqual(badLeaveRes.status, 400);

    const goodLeaveRes = await fetch(`${baseUrl}/leave/apply`, {
      method: 'POST',
      headers: headersA,
      body: JSON.stringify({ user_id: studentAEmail, category: 'Medical', reason: 'Clinic checkup', start_date: '2026-12-10', end_date: '2026-12-12' }),
    });
    assert.strictEqual(goodLeaveRes.status, 200);
    const goodLeave = await goodLeaveRes.json();

    const overlapRes = await fetch(`${baseUrl}/leave/apply`, {
      method: 'POST',
      headers: headersA,
      body: JSON.stringify({ user_id: studentAEmail, category: 'Personal', reason: 'Family travel', start_date: '2026-12-11', end_date: '2026-12-13' }),
    });
    assert.strictEqual(overlapRes.status, 409);

    const withdrawRes = await fetch(`${baseUrl}/leave/${goodLeave.id}/withdraw`, {
      method: 'PATCH',
      headers: headersA,
    });
    assert.strictEqual(withdrawRes.status, 200);
    const withdrawBody = await withdrawRes.json();
    assert.strictEqual(withdrawBody.status, 'Withdrawn');
    console.log('  ✅ 8. Leave validation, overlap rejection, and withdrawal passed');

    // 9. Attendance correction request + teacher approval + stats update
    const absentSession = await Session.create({
      teacher_id: teacherEmail,
      college_id: 'COL_ALPHA',
      subject: 'Algorithms & Complexity',
      is_active: false,
      qr_code: crypto.randomBytes(32).toString('hex'),
    });
    await Attendance.create({
      student_email: studentAEmail,
      session_id: absentSession._id.toString(),
      status: 'Absent',
      verified_by: 'manual',
    });

    const dispRes = await fetch(`${baseUrl}/attendance/disputes`, {
      method: 'POST',
      headers: headersA,
      body: JSON.stringify({
        session_id: absentSession._id.toString(),
        subject: 'Algorithms & Complexity',
        reason_category: 'network_failure',
        requested_status: 'Present',
        reason: 'Campus Wi-Fi dropped while scanning QR code in lecture hall',
      }),
    });
    assert.strictEqual(dispRes.status, 201);
    const dispBody = await dispRes.json();

    const resolveRes = await fetch(`${baseUrl}/attendance/disputes/${dispBody.id}/resolve`, {
      method: 'POST',
      headers: headersT,
      body: JSON.stringify({ action: 'approve', remarks: 'Confirmed present in lecture' }),
    });
    assert.strictEqual(resolveRes.status, 200);

    const dashAfterResolve = await (await fetch(`${baseUrl}/attendance/dashboard`, { headers: headersA })).json();
    assert.strictEqual(dashAfterResolve.total_conducted, 2);
    assert.strictEqual(dashAfterResolve.total_present, 2);
    assert.strictEqual(dashAfterResolve.overall_attendance, 100);
    console.log('  ✅ 9. Correction dispute approval updated attendance and recalculated dashboard');

    // 10. Notifications, Timetable ICS, Reports, Nexa AI, Privacy & Password Change
    const notifListRes = await fetch(`${baseUrl}/notifications`, { headers: headersA });
    assert.strictEqual(notifListRes.status, 200);
    const notifList = await notifListRes.json();
    assert.ok(notifList.notifications.length >= 1);

    const markAllRes = await fetch(`${baseUrl}/notifications/read-all`, { method: 'PATCH', headers: headersA });
    assert.strictEqual(markAllRes.status, 200);

    const icsRes = await fetch(`${baseUrl}/academic/timetable/export.ics`, { headers: headersA });
    assert.strictEqual(icsRes.status, 200);
    const icsText = await icsRes.text();
    assert.ok(icsText.includes('BEGIN:VCALENDAR') && icsText.includes('Algorithms & Complexity'));

    const rptRes = await fetch(`${baseUrl}/reports/student/${encodeURIComponent(studentAEmail)}?format=json`, { headers: headersA });
    assert.strictEqual(rptRes.status, 200);
    const rptData = await rptRes.json();
    assert.ok(rptData.report_id && rptData.disclaimer.includes('not an institution-certified'));

    const nexaRes = await fetch(`${baseUrl}/ai/chat`, {
      method: 'POST',
      headers: headersA,
      body: JSON.stringify({ message: 'What is my current attendance?' }),
    });
    assert.strictEqual(nexaRes.status, 200);
    const nexaData = await nexaRes.json();
    assert.ok(nexaData.reply.includes('100%') || nexaData.reply.includes('2/2'), `Expected real attendance in Nexa reply, got: ${nexaData.reply}`);

    // Privacy export excludes password & embeddings
    await BiometricProfile.create({ user_email: studentAEmail, embedding: [0.1, 0.2, 0.3], consent_given: true });
    const privRes = await fetch(`${baseUrl}/auth/privacy/export`, { headers: headersA });
    assert.strictEqual(privRes.status, 200);
    const privData = await privRes.json();
    assert.strictEqual(privData.profile.password, undefined);
    assert.strictEqual(privData.biometric_metadata.embedding, undefined);

    const bioStatusRes = await fetch(`${baseUrl}/auth/biometric-status`, { headers: headersA });
    const bioStatus = await bioStatusRes.json();
    assert.strictEqual(bioStatus.enrolled, true);
    assert.strictEqual(bioStatus.embedding, undefined);

    // Password change & re-login
    const pwRes = await fetch(`${baseUrl}/auth/change-password`, {
      method: 'POST',
      headers: headersA,
      body: JSON.stringify({ current_password: pw, new_password: newPw }),
    });
    assert.strictEqual(pwRes.status, 200);
    await login(studentAEmail, newPw);
    console.log('  ✅ 10. Notifications, ICS export, reports, Nexa AI, privacy export & password change passed');

    console.log('\n🎉 ALL STUDENT PORTAL END-TO-END TESTS PASSED (10/10)!');
  } finally {
    await awaitPendingJobs();
    await Promise.all([
      User.deleteMany({ email: { $in: [studentAEmail, studentBEmail, teacherEmail, otherCollegeTeacher] } }),
      Session.deleteMany({ teacher_id: { $in: [teacherEmail, otherCollegeTeacher] } }),
      Attendance.deleteMany({ student_email: { $in: [studentAEmail, studentBEmail] } }),
      Leave.deleteMany({ user_id: { $in: [studentAEmail, studentBEmail] } }),
      AttendanceDispute.deleteMany({ student_email: { $in: [studentAEmail, studentBEmail] } }),
      Notification.deleteMany({ user_id: { $in: [studentAEmail, studentBEmail] } }),
      NexaConversation.deleteMany({ user_email: { $in: [studentAEmail, studentBEmail] } }),
      BiometricProfile.deleteMany({ user_email: { $in: [studentAEmail, studentBEmail] } }),
      Timetable.deleteMany({ teacher_email: teacherEmail }),
    ]);
    server.close();
    await mongoose.disconnect();
  }
}

runStudentPortalValidation()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ STUDENT PORTAL VALIDATION FAILED:', err);
    process.exit(1);
  });
