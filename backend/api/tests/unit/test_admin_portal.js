'use strict';

process.env.NODE_ENV = 'test';
const assert = require('assert');
const http = require('http');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const User = require('../../src/models/User');
const College = require('../../src/models/College');
const Department = require('../../src/models/Department');
const Course = require('../../src/models/Course');
const SecurityLog = require('../../src/models/SecurityLog');
const CampusDevice = require('../../src/models/CampusDevice');
const UserSession = require('../../src/models/UserSession');
const AttendanceDispute = require('../../src/models/AttendanceDispute');
const Session = require('../../src/models/Session');
const BackupMetadata = require('../../src/models/BackupMetadata');
const AuthService = require('../../src/services/authService');

const { spawn } = require('child_process');
const PORT = process.env.TEST_PORT || '8019';
const BASE_URL = process.env.TEST_BASE_URL || `http://127.0.0.1:${PORT}`;

async function request(method, pathUrl, token, body) {
  const res = await fetch(`${BASE_URL}${pathUrl}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { json = text; }
  return { status: res.status, body: json };
}

async function waitForServer(retries = 120) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(`${BASE_URL}/liveness`);
      if (res.ok) return;
    } catch { }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Server at ${BASE_URL} did not become ready in time`);
}

async function run() {
  const serverProc = spawn(process.execPath, ['src/app.js'], {
    cwd: path.join(__dirname, '../..'),
    env: { ...process.env, NODE_ENV: 'test', PORT },
    stdio: ['ignore', 'ignore', 'pipe'],
  });
  serverProc.stderr.on('data', (d) => process.stderr.write(d));
  try {
    await waitForServer();
    const mongoUrl = process.env.MONGODB_URL || process.env.MONGO_URI;
    await mongoose.connect(mongoUrl, { dbName: process.env.DB_NAME || 'smartface' });
    const ts = Date.now();

    const collegeA = await College.create({ name: `AdminTestCollegeA_${ts}`, code: `ATA${ts}` });
    const collegeB = await College.create({ name: `AdminTestCollegeB_${ts}`, code: `ATB${ts}` });

    const adminAEmail = `admin_a_${ts}@test.edu`;
    const adminBEmail = `admin_b_${ts}@test.edu`;
    const studentAEmail = `stu_a_${ts}@test.edu`;
    const studentBEmail = `stu_b_${ts}@test.edu`;
    const parentAEmail = `par_a_${ts}@test.edu`;

    await User.insertMany([
      { email: adminAEmail, full_name: 'Admin A', role: 'admin', college: collegeA.name, college_id: collegeA._id.toString() },
      { email: adminBEmail, full_name: 'Admin B', role: 'admin', college: collegeB.name, college_id: collegeB._id.toString() },
      { email: studentAEmail, full_name: 'Student A', role: 'student', college: collegeA.name, college_id: collegeA._id.toString(), department: 'CSE', semester: '3', student_id: `SIDA${ts}` },
      { email: studentBEmail, full_name: 'Student B', role: 'student', college: collegeB.name, college_id: collegeB._id.toString(), department: 'ECE', semester: '5', student_id: `SIDB${ts}` },
      { email: parentAEmail, full_name: 'Parent A', role: 'parent', college: collegeA.name, college_id: collegeA._id.toString() },
    ]);

    const tokenA = AuthService.createAccessToken({ sub: adminAEmail, role: 'admin' });
    const tokenStu = AuthService.createAccessToken({ sub: studentAEmail, role: 'student' });

    try {
      console.log('🧪 Running Admin Portal Enterprise Tests...');

      // 1. RBAC: Student blocked from admin endpoints
      const r1 = await request('GET', '/management/stats', tokenStu);
      assert.strictEqual(r1.status, 403, 'Student must be blocked from /management/stats');

      // 2. Command Centre stats (tenant-scoped)
      const r2 = await request('GET', '/management/stats', tokenA);
      assert.strictEqual(r2.status, 200);
      if (r2.body.total_students !== 1) {
        console.error('DEBUG r2.body:', JSON.stringify(r2.body));
      }
      assert.strictEqual(r2.body.total_students, 1, 'Admin A must only see College A students');

      // 3. Calibration persistence
      const r3 = await request('PATCH', '/management/calibration', tokenA, { similarity_threshold: 0.72, liveness_required: true });
      assert.strictEqual(r3.status, 200);
      assert.strictEqual(r3.body.calibration.similarity_threshold, 0.72);

      // 4. Bulk preview validation (duplicate + cross-institution)
      const r4 = await request('POST', '/management/users/bulk/preview', tokenA, {
        users: [
          { email: studentAEmail, full_name: 'Dup Student' },
          { email: `new_${ts}@test.edu`, full_name: 'Cross Inst', college: collegeB.name },
          { email: `valid_${ts}@test.edu`, full_name: 'Valid Student', department: 'CSE' },
        ],
      });
      assert.strictEqual(r4.status, 200);
      assert.strictEqual(r4.body.valid_count, 1);
      assert.strictEqual(r4.body.error_count, 2);

      // 5. Cross-institution user modification blocked
      const stuB = await User.findOne({ email: studentBEmail }).lean();
      const r5 = await request('PATCH', `/management/users/${stuB._id}/status`, tokenA, { status: 'suspended' });
      assert.strictEqual(r5.status, 403, 'Cross-institution status change must be 403');

      // 6. Parent-student linking + cross-institution block
      const r6a = await request('POST', '/management/parents/link', tokenA, { parent_email: parentAEmail, student_email: studentAEmail });
      assert.strictEqual(r6a.status, 200);
      const r6b = await request('POST', '/management/parents/link', tokenA, { parent_email: parentAEmail, student_email: studentBEmail });
      assert.strictEqual(r6b.status, 403, 'Cross-institution parent link must be 403');

      // 7. Academic infra & referential integrity
      const r7a = await request('POST', '/management/departments', tokenA, { name: 'CSE', code: `CSE${ts}` });
      assert.strictEqual(r7a.status, 201);
      const deptId = r7a.body.department.id;
      const r7b = await request('DELETE', `/management/departments/${deptId}`, tokenA);
      assert.strictEqual(r7b.status, 409, 'Department referenced by student must not be deleted');

      // 8. Policy versioning
      const r8 = await request('PUT', '/management/policy', tokenA, { min_percentage: 80, reason: 'Accreditation update' });
      assert.strictEqual(r8.status, 200);
      assert.strictEqual(r8.body.policy.min_percentage, 80);
      assert.strictEqual(r8.body.version, 1);

      // 9. Campus Device registration & credential rotation
      const r9 = await request('POST', '/management/devices', tokenA, { device_id: `KIOSK_${ts}`, name: 'Gate Kiosk', classroom: 'LH-101' });
      assert.strictEqual(r9.status, 201);
      assert.ok(r9.body.device_secret.startsWith('sf_dev_'));

      // 10. Security incident cross-tenant protection
      const secB = await SecurityLog.create({ location: 'Gate B', college_id: collegeB._id.toString(), status: 'Active' });
      const r10 = await request('POST', '/security/acknowledge', tokenA, { log_id: secB._id.toString(), status: 'Resolved' });
      assert.strictEqual(r10.status, 403, 'Cross-institution security incident update must be 403');

      // 11. Audit logs populated
      const r11 = await request('GET', '/management/audit-logs', tokenA);
      assert.strictEqual(r11.status, 200);
      assert.ok(r11.body.system_logs.length >= 3);

      // 12. Tenant-scoped principal summary & bulk import isolation
      const r12a = await request('GET', '/management/principal/summary', tokenA);
      assert.strictEqual(r12a.status, 200);
      assert.strictEqual(r12a.body.total_students, 1, 'Principal summary must only count College A students');
      const r12b = await request('POST', '/management/users/bulk', tokenA, {
        users: [{ email: `cross_bulk_${ts}@test.edu`, full_name: 'Cross Bulk', college: collegeB.name }],
      });
      assert.strictEqual(r12b.status, 201);
      assert.strictEqual(r12b.body.inserted_count, 0, 'Cross-institution bulk import must be blocked');

      // 13. Department update
      const r13 = await request('PATCH', `/management/departments/${deptId}`, tokenA, { name: 'Computer Science' });
      assert.strictEqual(r13.status, 200);
      assert.strictEqual(r13.body.department.name, 'Computer Science');

      // 14. Semester creation & status transition
      const r14a = await request('POST', '/management/semesters', tokenA, { name: `Even ${ts}`, academic_year: '2026-2027', status: 'draft' });
      assert.strictEqual(r14a.status, 201);
      const termId = r14a.body.terms[r14a.body.terms.length - 1]._id;
      const r14b = await request('PATCH', `/management/semesters/${termId}/status`, tokenA, { status: 'active' });
      assert.strictEqual(r14b.status, 200);
      assert.strictEqual(r14b.body.terms.find((t) => t._id === termId).status, 'active');

      // 15. Escalated dispute resolution & cross-tenant block
      const dispA = await AttendanceDispute.create({
        student_email: studentAEmail,
        college_id: collegeA._id.toString(),
        session_id: `sess_${ts}`,
        reason: 'Sensor missed scan',
        status: 'Escalated',
      });
      const dispB = await AttendanceDispute.create({
        student_email: studentBEmail,
        college_id: collegeB._id.toString(),
        session_id: `sess_b_${ts}`,
        reason: 'Cross tenant',
        status: 'Pending',
      });
      const r15a = await request('POST', `/attendance/disputes/${dispA._id}/resolve`, tokenA, { action: 'approve', remarks: 'Verified' });
      assert.strictEqual(r15a.status, 200, 'Admin must be able to resolve Escalated dispute');
      const r15b = await request('POST', `/attendance/disputes/${dispB._id}/resolve`, tokenA, { action: 'approve', remarks: 'Cross' });
      assert.strictEqual(r15b.status, 403, 'Cross-institution dispute resolution must be 403');

      // 16. Session oversight (close/reopen with mandatory reason)
      const facAEmail = `fac_a_${ts}@test.edu`;
      await User.create({ email: facAEmail, full_name: 'Faculty A', role: 'teacher', college: collegeA.name, college_id: collegeA._id.toString() });
      const sessA = await Session.create({ subject: 'Algorithms', teacher_id: facAEmail, qr_code: `QR_${ts}`, is_active: true, college_id: collegeA._id.toString() });
      const r16a = await request('PATCH', `/management/sessions/${sessA._id}/status`, tokenA, { is_active: false });
      assert.strictEqual(r16a.status, 400, 'Session status change without reason must be 400');
      const r16b = await request('PATCH', `/management/sessions/${sessA._id}/status`, tokenA, { is_active: false, reason: 'End of class' });
      assert.strictEqual(r16b.status, 200);
      assert.strictEqual(r16b.body.is_active, false);

      // 17. Backup verification
      const r17 = await request('POST', '/management/backups/verify', tokenA);
      assert.strictEqual(r17.status, 201);
      assert.strictEqual(r17.body.backup.status, 'SUCCESS');

      console.log('✅ All 17 Admin Portal security, isolation, and operations tests passed!');
    } finally {
      await User.deleteMany({ email: { $in: [adminAEmail, adminBEmail, studentAEmail, studentBEmail, parentAEmail, `fac_a_${ts}@test.edu`] } });
      await UserSession.deleteMany({ userId: { $in: [adminAEmail, studentAEmail] } });
      await Department.deleteMany({ college_id: { $in: [collegeA._id, collegeB._id] } });
      await CampusDevice.deleteMany({ college_id: { $in: [collegeA._id.toString(), collegeB._id.toString()] } });
      await SecurityLog.deleteMany({ college_id: collegeB._id.toString() });
      await AttendanceDispute.deleteMany({ student_email: { $in: [studentAEmail, studentBEmail] } });
      await Session.deleteMany({ teacher_id: `fac_a_${ts}@test.edu` });
      await BackupMetadata.deleteMany({ notes: { $regex: adminAEmail } });
      await College.deleteMany({ _id: { $in: [collegeA._id, collegeB._id] } });
      await mongoose.disconnect();
    }
  } finally {
    serverProc.kill('SIGTERM');
  }
}

run().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
