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
const Announcement = require('../../src/models/Announcement');
const InterventionNote = require('../../src/models/InterventionNote');
const AttendanceAuditLog = require('../../src/models/AttendanceAuditLog');
const Timetable = require('../../src/models/Timetable');
const NexaConversation = require('../../src/models/NexaConversation');
const AuthService = require('../../src/services/authService');
const { awaitPendingJobs } = require('../../src/utils/jobTracker');

async function runTeacherPortalValidation() {
  console.log('======================================================================');
  console.log('🧪 SMARTFACE TEACHER PORTAL — END-TO-END INTEGRATION & SECURITY SUITE');
  console.log('======================================================================');

  await mongoose.connect(MONGODB_URL, { dbName: 'smartface' });

  const ts = Date.now();
  const collegeA = `ALPHA_INST_${ts}`;
  const collegeB = `BETA_INST_${ts}`;
  const teacherAEmail = `t_alpha_${ts}@smartface.pro`;
  const teacherBEmail = `t_beta_${ts}@smartface.pro`;
  const stuA1Email = `stu_a1_${ts}@smartface.pro`;
  const stuA2Email = `stu_a2_${ts}@smartface.pro`;
  const stuB1Email = `stu_b1_${ts}@smartface.pro`;
  const parentA1Email = `parent_a1_${ts}@smartface.pro`;
  const pw = 'Teacher@2026!';

  const app = express();
  app.use(express.json());
  app.use('/auth', require('../../src/routes/auth'));
  app.use('/api', require('../../src/routes/apiCompat'));
  app.use('/teacher', require('../../src/routes/teacher'));
  app.use('/sessions', require('../../src/routes/sessions'));
  app.use('/attendance', require('../../src/routes/attendance'));
  app.use('/leave', require('../../src/routes/leave'));
  app.use('/academic', require('../../src/routes/academic'));
  app.use('/notifications', require('../../src/routes/notifications'));
  app.use('/analytics', require('../../src/routes/analytics'));
  app.use('/', require('../../src/routes/ai'));

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  const createdSessionIds = [];

  try {
    const hashed = await AuthService.hashPassword(pw);
    await User.insertMany([
      {
        email: teacherAEmail,
        password: hashed,
        full_name: 'Prof. Alpha',
        role: 'teacher',
        department: 'Computer Science',
        college_id: collegeA,
        college: 'Alpha Institute',
        employee_id: `EMP-A-${ts}`,
        designation: 'Associate Professor',
        is_verified: true,
        is_active: true,
      },
      {
        email: teacherBEmail,
        password: hashed,
        full_name: 'Prof. Beta',
        role: 'teacher',
        department: 'Computer Science',
        college_id: collegeB,
        college: 'Beta Institute',
        employee_id: `EMP-B-${ts}`,
        is_verified: true,
        is_active: true,
      },
      {
        email: stuA1Email,
        password: hashed,
        full_name: 'Alice Alpha',
        role: 'student',
        student_id: `A1-${ts}`,
        roll_number: 'CS101',
        department: 'Computer Science',
        semester: '5',
        section: 'A',
        college_id: collegeA,
        parent_details: parentA1Email,
        is_verified: true,
        is_active: true,
      },
      {
        email: stuA2Email,
        password: hashed,
        full_name: 'Bob Alpha',
        role: 'student',
        student_id: `A2-${ts}`,
        roll_number: 'CS102',
        department: 'Computer Science',
        semester: '5',
        section: 'A',
        college_id: collegeA,
        is_verified: true,
        is_active: true,
      },
      {
        email: stuB1Email,
        password: hashed,
        full_name: 'Zara Beta',
        role: 'student',
        student_id: `B1-${ts}`,
        roll_number: 'CS201',
        department: 'Computer Science',
        semester: '5',
        section: 'A',
        college_id: collegeB,
        is_verified: true,
        is_active: true,
      },
      {
        email: parentA1Email,
        password: hashed,
        full_name: 'Parent Alpha',
        role: 'parent',
        college_id: collegeA,
        children: [stuA1Email],
        linked_children: [{ email: stuA1Email, full_name: 'Alice Alpha', student_id: `A1-${ts}` }],
        is_verified: true,
        is_active: true,
      },
    ]);

    const login = async (email) => {
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pw }),
      });
      const json = await res.json();
      assert.strictEqual(res.status, 200, `Login failed for ${email}: ${JSON.stringify(json)}`);
      return json.access_token;
    };

    const tokenTeacherA = await login(teacherAEmail);
    const tokenTeacherB = await login(teacherBEmail);
    const tokenStudentA1 = await login(stuA1Email);

    const api = async (pathUrl, token, options = {}) => {
      const t0 = Date.now();
      const res = await fetch(`${baseUrl}${pathUrl}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          ...(options.headers || {}),
        },
      });
      const ms = Date.now() - t0;
      const text = await res.text();
      let data = null;
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
      return { status: res.status, data, ms, headers: res.headers };
    };

    // 1. RBAC checks: student blocked from teacher endpoints; teacher blocked from admin audit logs
    const rStuDash = await api('/teacher/dashboard', tokenStudentA1);
    assert.strictEqual(rStuDash.status, 403, 'Student must be blocked from /teacher/dashboard');
    const rAdminLogs = await api('/attendance/audit-logs', tokenTeacherA);
    assert.strictEqual(rAdminLogs.status, 403, 'Teacher must be blocked from admin-only /attendance/audit-logs');
    console.log('  ✅ 1. RBAC enforcement verified (student blocked, admin-only logs blocked)');

    // 2. Profile privilege escalation block
    const rEscalate = await api('/auth/update-profile', tokenTeacherA, {
      method: 'POST',
      body: JSON.stringify({
        designation: 'Senior Professor',
        department: 'HACKED_DEPT',
        college_id: 'HACKED_COLLEGE',
        employee_id: 'HACKED_EMP',
      }),
    });
    assert.strictEqual(rEscalate.status, 200);
    const reloadedTeacher = await User.findOne({ email: teacherAEmail }).lean();
    assert.strictEqual(reloadedTeacher.designation, 'Senior Professor');
    assert.strictEqual(reloadedTeacher.department, 'Computer Science', 'Teacher must not change department');
    assert.strictEqual(reloadedTeacher.college_id, collegeA, 'Teacher must not change college_id');
    assert.strictEqual(reloadedTeacher.employee_id, `EMP-A-${ts}`, 'Teacher must not change employee_id');
    console.log('  ✅ 2. Teacher profile institutional lock verified');

    // 3. 9-state Session Lifecycle + Invalid Transition Blocking
    const rCreateSched = await api('/sessions/start', tokenTeacherA, {
      method: 'POST',
      body: JSON.stringify({
        subject: 'CS301 Operating Systems',
        subject_code: 'CS301',
        room: 'LH-402',
        section: 'A',
        semester: '5',
        duration_minutes: 45,
        qr_rotation_seconds: 15,
        status: 'scheduled',
      }),
    });
    assert.strictEqual(rCreateSched.status, 200);
    assert.strictEqual(rCreateSched.data.status, 'scheduled');
    const sid = rCreateSched.data.session_id;
    createdSessionIds.push(sid);

    // Invalid direct transition scheduled -> finalise must fail (409)
    const rBadTrans = await api(`/sessions/${sid}/transition`, tokenTeacherA, {
      method: 'POST',
      body: JSON.stringify({ action: 'finalise' }),
    });
    assert.strictEqual(rBadTrans.status, 409, 'scheduled -> finalise must be rejected');

    // scheduled -> ready -> active -> paused -> resumed -> extend
    for (const [action, expectedStatus] of [
      ['ready', 'ready'],
      ['start', 'active'],
      ['pause', 'paused'],
    ]) {
      const tr = await api(`/sessions/${sid}/transition`, tokenTeacherA, {
        method: 'POST',
        body: JSON.stringify({ action }),
      });
      assert.strictEqual(tr.status, 200, `Transition ${action} failed: ${JSON.stringify(tr.data)}`);
      assert.strictEqual(tr.data.status, expectedStatus);
    }

    // Dynamic QR blocked while paused
    const rQrPaused = await api(`/sessions/${sid}/qr-token`, tokenTeacherA);
    assert.strictEqual(rQrPaused.status, 409, 'QR token must not be issued while session is paused');

    // Resume + Extend
    const rResume = await api(`/sessions/${sid}/transition`, tokenTeacherA, {
      method: 'POST',
      body: JSON.stringify({ action: 'resume' }),
    });
    assert.strictEqual(rResume.status, 200);
    assert.strictEqual(rResume.data.status, 'resumed');

    const rExtend = await api(`/sessions/${sid}/transition`, tokenTeacherA, {
      method: 'POST',
      body: JSON.stringify({ action: 'extend', extend_minutes: 15 }),
    });
    assert.strictEqual(rExtend.status, 200);
    console.log('  ✅ 3. 9-state session lifecycle, pause guard, and extend verified');

    // 4. Dynamic QR generation, Epoch Regeneration, & Concurrent Duplicate Protection
    const rQr1 = await api(`/sessions/${sid}/qr-token`, tokenTeacherA);
    assert.strictEqual(rQr1.status, 200);
    const oldToken = rQr1.data.token;
    assert.ok(oldToken && oldToken.split('.').length === 4);

    // Regenerate epoch -> oldToken invalid, newToken valid
    const rRegen = await api(`/sessions/${sid}/qr-regenerate`, tokenTeacherA, {
      method: 'POST',
      body: JSON.stringify({ rotation_seconds: 20 }),
    });
    assert.strictEqual(rRegen.status, 200);
    const newToken = rRegen.data.token;
    assert.notStrictEqual(newToken, oldToken);

    const rOldMark = await api('/attendance/mark', tokenStudentA1, {
      method: 'POST',
      body: JSON.stringify({ session_id: sid, qr_code: oldToken }),
    });
    assert.strictEqual(rOldMark.status, 400, 'Old QR epoch token must be rejected after regeneration');

    // Concurrent duplicate mark race check (3 simultaneous requests)
    const concurrentMarks = await Promise.all([
      api('/attendance/mark', tokenStudentA1, {
        method: 'POST',
        body: JSON.stringify({ session_id: sid, qr_code: newToken }),
      }),
      api('/attendance/mark', tokenStudentA1, {
        method: 'POST',
        body: JSON.stringify({ session_id: sid, qr_code: newToken }),
      }),
      api('/attendance/mark', tokenStudentA1, {
        method: 'POST',
        body: JSON.stringify({ session_id: sid, qr_code: newToken }),
      }),
    ]);
    const markCount = await Attendance.countDocuments({ session_id: sid, student_email: stuA1Email });
    assert.strictEqual(markCount, 1, 'Concurrent QR submissions must never create duplicate attendance records');
    assert.ok(concurrentMarks.some((m) => m.status === 200));
    console.log('  ✅ 4. Dynamic QR regeneration & concurrent anti-duplicate race protection verified');

    // 5. Cross-Institution Isolation (Teacher B vs College A)
    const rCrossRoster = await api(`/teacher/sessions/${sid}/roster`, tokenTeacherB);
    assert.strictEqual(rCrossRoster.status, 403, 'Teacher B must not access Teacher A session roster');

    const rCrossHistory = await api(`/teacher/students/${encodeURIComponent(stuA1Email)}/history`, tokenTeacherB);
    assert.strictEqual(rCrossHistory.status, 403, 'Teacher B must not access College A student history');

    const rBetaStudents = await api('/teacher/students/meta', tokenTeacherB);
    assert.strictEqual(rBetaStudents.status, 200);
    assert.ok(rBetaStudents.data.students.every((s) => s.email !== stuA1Email && s.email !== stuA2Email));

    const rCrossVelocity = await api(`/analytics/student-velocity/${encodeURIComponent(stuA1Email)}`, tokenTeacherB);
    assert.strictEqual(rCrossVelocity.status, 403, 'Teacher B must not access College A student velocity');
    console.log('  ✅ 5. Cross-institution tenant isolation verified');

    // 6. Manual Attendance Batch Marking + Audit Trail + Finalise Lock
    const rBatchOk = await api('/attendance/mark/batch', tokenTeacherA, {
      method: 'POST',
      body: JSON.stringify({
        session_id: sid,
        reason: 'Hardware camera disconnected in rear row',
        records: [{ student_email: stuA2Email, status: 'Present' }],
      }),
    });
    assert.strictEqual(rBatchOk.status, 200);
    assert.strictEqual(rBatchOk.data.updated_count, 1);

    // Sensitive override on existing record (Present -> Excused) without reason must be rejected
    const rOverrideNoReason = await api('/attendance/mark/batch', tokenTeacherA, {
      method: 'POST',
      body: JSON.stringify({
        session_id: sid,
        records: [{ student_email: stuA2Email, status: 'Excused' }],
      }),
    });
    assert.strictEqual(rOverrideNoReason.status, 200);
    assert.strictEqual(rOverrideNoReason.data.failed_count, 1, 'Sensitive override without reason must be rejected');
    const a2AfterBlocked = await Attendance.findOne({ session_id: sid, student_email: stuA2Email }).lean();
    assert.strictEqual(a2AfterBlocked.status, 'Present');

    // Sensitive override WITH explicit reason succeeds & appends edit_history
    const rOverrideWithReason = await api('/attendance/mark/batch', tokenTeacherA, {
      method: 'POST',
      body: JSON.stringify({
        session_id: sid,
        reason: 'Approved department hackathon participation',
        records: [{ student_email: stuA2Email, status: 'Excused' }],
      }),
    });
    assert.strictEqual(rOverrideWithReason.status, 200);
    assert.strictEqual(rOverrideWithReason.data.updated_count, 1);
    const a2Updated = await Attendance.findOne({ session_id: sid, student_email: stuA2Email }).lean();
    assert.strictEqual(a2Updated.status, 'Excused');
    assert.ok(Array.isArray(a2Updated.edit_history) && a2Updated.edit_history.length >= 2);

    // Close -> Review -> Finalise -> Lock check
    for (const action of ['close', 'review', 'finalise']) {
      const tr = await api(`/sessions/${sid}/transition`, tokenTeacherA, {
        method: 'POST',
        body: JSON.stringify({ action }),
      });
      assert.strictEqual(tr.status, 200, `Transition ${action} failed`);
    }
    const rEditAfterFinalise = await api('/attendance/mark/batch', tokenTeacherA, {
      method: 'POST',
      body: JSON.stringify({
        session_id: sid,
        reason: 'Late edit attempt',
        records: [{ student_email: stuA2Email, status: 'Absent' }],
      }),
    });
    assert.strictEqual(rEditAfterFinalise.status, 409, 'Finalised session must block manual edits');
    console.log('  ✅ 6. Manual batch overrides, reason enforcement, and finalise lock verified');

    // 7. Leave & Dispute Atomic Resolution (No duplicate resolution)
    const todayStr = new Date().toISOString().slice(0, 10);
    const leaveDoc = await Leave.create({
      user_id: stuA1Email,
      college_id: collegeA,
      department: 'Computer Science',
      category: 'Medical',
      reason: 'Fever documentation attached',
      start_date: todayStr,
      end_date: todayStr,
      status: 'Pending',
    });

    const rLeaveListB = await api('/leave/teacher?status=Pending', tokenTeacherB);
    assert.strictEqual(rLeaveListB.status, 200);
    assert.ok(rLeaveListB.data.leaves.every((l) => l.user_id !== stuA1Email));

    const rLeaveApprove = await api('/leave/action', tokenTeacherA, {
      method: 'PATCH',
      body: JSON.stringify({ leave_id: leaveDoc._id.toString(), status: 'Approved', remarks: 'Approved' }),
    });
    assert.strictEqual(rLeaveApprove.status, 200);
    const rLeaveDup = await api('/leave/action', tokenTeacherA, {
      method: 'PATCH',
      body: JSON.stringify({ leave_id: leaveDoc._id.toString(), status: 'Rejected', remarks: 'Dup' }),
    });
    assert.strictEqual(rLeaveDup.status, 409, 'Duplicate leave decision must be rejected');

    const disputeDoc = await AttendanceDispute.create({
      student_email: stuA2Email,
      college_id: collegeA,
      session_id: sid,
      subject: 'CS301 Operating Systems',
      original_status: 'Absent',
      requested_status: 'Present',
      reason_category: 'technical_issue',
      reason: 'Wi-Fi dropped during QR scan',
      status: 'Pending',
    });

    const rDispClarify = await api(`/attendance/disputes/${disputeDoc._id}/resolve`, tokenTeacherA, {
      method: 'POST',
      body: JSON.stringify({ action: 'clarification', remarks: 'Please confirm seat row' }),
    });
    assert.strictEqual(rDispClarify.status, 200);
    assert.strictEqual(rDispClarify.data.status, 'Clarification');

    const rDispApprove = await api(`/attendance/disputes/${disputeDoc._id}/resolve`, tokenTeacherA, {
      method: 'POST',
      body: JSON.stringify({ action: 'approve', remarks: 'Verified seat' }),
    });
    assert.strictEqual(rDispApprove.status, 200);
    assert.strictEqual(rDispApprove.data.status, 'Approved');

    const rDispDup = await api(`/attendance/disputes/${disputeDoc._id}/resolve`, tokenTeacherA, {
      method: 'POST',
      body: JSON.stringify({ action: 'reject', remarks: 'Dup' }),
    });
    assert.strictEqual(rDispDup.status, 409, 'Duplicate dispute resolution must fail cleanly');
    console.log('  ✅ 7. Leave & dispute atomic resolution and cross-college filtering verified');

    // 8. Dashboard, Analytics, Risk Interventions, Reports, Announcements, Timetable, Nexa AI
    const rDash = await api('/teacher/dashboard', tokenTeacherA);
    assert.strictEqual(rDash.status, 200);
    assert.ok(rDash.data.total_sessions >= 1);
    assert.ok(rDash.ms < 2000, `Dashboard latency ${rDash.ms}ms exceeded 2000ms budget`);

    const rAnalytics = await api('/teacher/analytics', tokenTeacherA);
    assert.strictEqual(rAnalytics.status, 200);
    assert.ok(Array.isArray(rAnalytics.data.risk_students));

    const rIntervention = await api('/teacher/interventions', tokenTeacherA, {
      method: 'POST',
      body: JSON.stringify({
        student_email: stuA1Email,
        subject: 'CS301 Operating Systems',
        risk_level: 'warning',
        action_taken: 'reminder_sent',
        note: 'Follow up on lab attendance',
      }),
    });
    assert.strictEqual(rIntervention.status, 201);

    const rAlert = await api('/notifications/send', tokenTeacherA, {
      method: 'POST',
      body: JSON.stringify({
        student_email: stuA1Email,
        title: 'Attendance Reminder',
        message: 'Please attend upcoming lab.',
        priority: 'High',
      }),
    });
    assert.strictEqual(rAlert.status, 200);
    assert.strictEqual(rAlert.data.parent_notified, true);

    const rAnnCreate = await api('/teacher/announcements', tokenTeacherA, {
      method: 'POST',
      body: JSON.stringify({
        title: 'Midterm Syllabus Notice',
        message: 'Modules 1-3 will be covered next Monday.',
        category: 'exam',
        priority: 'High',
        target_scope: 'subject',
        target_subject: 'CS301 Operating Systems',
      }),
    });
    assert.strictEqual(rAnnCreate.status, 201);

    const rCsv = await api('/teacher/reports/export?format=csv&report_type=monthly', tokenTeacherA);
    assert.strictEqual(rCsv.status, 200);
    assert.ok(String(rCsv.data).includes('Student Name,Student ID'), 'CSV header missing');

    const rHtml = await api('/teacher/reports/export?format=html&report_type=monthly', tokenTeacherA);
    assert.strictEqual(rHtml.status, 200);
    assert.ok(String(rHtml.data).includes('SmartFace Faculty Attendance Report'));

    const rSlot = await api('/teacher/timetable', tokenTeacherA, {
      method: 'POST',
      body: JSON.stringify({
        day: 'Monday',
        time: '10:00 AM',
        subject: 'CS301 Operating Systems',
        subject_code: 'CS301',
        room: 'LH-402',
        session_type: 'lecture',
      }),
    });
    assert.strictEqual(rSlot.status, 201);

    const rIcs = await api('/academic/timetable/export.ics', tokenTeacherA);
    assert.strictEqual(rIcs.status, 200);
    assert.ok(String(rIcs.data).includes('BEGIN:VCALENDAR'));

    const rNexa = await api('/ai/chat', tokenTeacherA, {
      method: 'POST',
      body: JSON.stringify({
        message: 'Summarize my attendance and risk alerts today',
        language: 'English',
        currentRoute: '/teacher/ai-chat',
      }),
    });
    assert.strictEqual(rNexa.status, 200);
    assert.ok(typeof rNexa.data.reply === 'string' && rNexa.data.reply.length > 20);
    console.log(`  ✅ 8. Dashboard (${rDash.ms}ms), analytics, notifications, reports, timetable, & Nexa AI verified`);

    await awaitPendingJobs();
    console.log('✅ ALL TEACHER PORTAL INTEGRATION & SECURITY CHECKS PASSED!\n');
  } finally {
    await awaitPendingJobs();
    const emails = [teacherAEmail, teacherBEmail, stuA1Email, stuA2Email, stuB1Email, parentA1Email];
    await Promise.all([
      User.deleteMany({ email: { $in: emails } }),
      Session.deleteMany({ teacher_id: { $in: [teacherAEmail, teacherBEmail] } }),
      Attendance.deleteMany({ session_id: { $in: createdSessionIds } }),
      Leave.deleteMany({ user_id: { $in: emails } }),
      AttendanceDispute.deleteMany({ student_email: { $in: emails } }),
      Notification.deleteMany({ $or: [{ user_id: { $in: emails } }, { user_email: { $in: emails } }] }),
      Announcement.deleteMany({ author_email: { $in: emails } }),
      InterventionNote.deleteMany({ teacher_email: { $in: emails } }),
      AttendanceAuditLog.deleteMany({ actor_email: { $in: emails } }),
      Timetable.deleteMany({ teacher_email: { $in: emails } }),
      NexaConversation.deleteMany({ user_email: { $in: emails } }),
    ]);
    await new Promise((resolve) => server.close(resolve));
    await mongoose.disconnect();
  }
}

runTeacherPortalValidation().catch((err) => {
  console.error('❌ Teacher portal validation failed:', err);
  process.exit(1);
});
