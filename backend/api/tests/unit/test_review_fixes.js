'use strict';

const assert = require('assert');
const crypto = require('crypto');
const http = require('http');
const express = require('express');
const mongoose = require('mongoose');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'smartface-test-secret-2024';

const Session = require('../../src/models/Session');
const User = require('../../src/models/User');
const Attendance = require('../../src/models/Attendance');
const Leave = require('../../src/models/Leave');
const AttendanceAuditLog = require('../../src/models/AttendanceAuditLog');
const UserSession = require('../../src/models/UserSession');
const Notification = require('../../src/models/Notification');
const Timetable = require('../../src/models/Timetable');
const College = require('../../src/models/College');
const BiometricProfile = require('../../src/models/BiometricProfile');
const AuthService = require('../../src/services/authService');
const notificationService = require('../../src/services/notificationService');
const {
  issueAttendanceQrToken,
  verifyAttendanceQrToken,
  isSessionAcceptingQr,
} = require('../../src/utils/attendanceQr');
const teacherService = require('../../src/services/teacherService');

const apiCompatRoutes = require('../../src/routes/apiCompat');
const analyticsRoutes = require('../../src/routes/analytics');
const leaveRoutes = require('../../src/routes/leave');
const notificationsRoutes = require('../../src/routes/notifications');
const sessionsRoutes = require('../../src/routes/sessions');
const attendanceRoutes = require('../../src/routes/attendance');

function makeChain(value) {
  const chain = {
    _val: value,
    select() { return chain; },
    sort() { return chain; },
    limit() { return chain; },
    skip() { return chain; },
    session() { return chain; },
    lean() { return Promise.resolve(value); },
    then(resolve, reject) { return Promise.resolve(value).then(resolve, reject); },
  };
  return chain;
}

class StubManager {
  constructor() {
    this.restores = [];
  }
  stub(obj, key, fn) {
    const orig = obj[key];
    obj[key] = fn;
    this.restores.push(() => { obj[key] = orig; });
  }
  restoreAll() {
    while (this.restores.length) {
      this.restores.pop()();
    }
  }
}

async function runTests() {
  console.log('=== RUNNING TARGETED REVIEW FIXES UNIT TESTS ===');

  // 1. Session schema defaults & legacy hydration
  {
    const friday = new Date('2026-11-27T09:00:00.000Z');
    const legacyInactive = Session.hydrate({ _id: new mongoose.Types.ObjectId(), is_active: false }).toObject();
    assert.strictEqual(legacyInactive.status, 'closed');

    const legacyActive = Session.hydrate({ _id: new mongoose.Types.ObjectId(), is_active: true }).toObject();
    assert.strictEqual(legacyActive.status, 'active');

    const scheduledWithDate = new Session({
      teacher_id: 't@col.edu',
      subject: 'Math',
      qr_code: 'a'.repeat(64),
      status: 'scheduled',
      scheduled_start: friday,
    });
    assert.strictEqual(scheduledWithDate.status, 'scheduled');
    assert.strictEqual(scheduledWithDate.is_active, false);
    assert.strictEqual(scheduledWithDate.start_time, undefined);
    assert.strictEqual(scheduledWithDate.scheduled_start.toISOString(), friday.toISOString());

    const scheduledNoDate = new Session({
      teacher_id: 't@col.edu',
      subject: 'Math',
      qr_code: 'a'.repeat(64),
      status: 'scheduled',
    });
    assert.strictEqual(scheduledNoDate.is_active, false);
    assert.strictEqual(scheduledNoDate.start_time, undefined);

    const liveDefault = new Session({
      teacher_id: 't@col.edu',
      subject: 'Math',
      qr_code: 'a'.repeat(64),
    });
    assert.strictEqual(liveDefault.status, 'active');
    assert.strictEqual(liveDefault.is_active, true);
    assert.ok(liveDefault.start_time instanceof Date);
    console.log('  ✅ 1. Session defaults and legacy hydration passed');
  }

  // 2. Attendance QR fractional rotation & legacy cutoff
  {
    const qrSecret = 'b'.repeat(64);
    const t0 = new Date('2026-11-26T09:00:00.000Z').getTime();
    const fracSession = {
      _id: new mongoose.Types.ObjectId(),
      is_active: true,
      status: 'active',
      qr_code: qrSecret,
      qr_epoch: 1,
      qr_rotation_seconds: 10.4,
      start_time: new Date(t0),
      expires_at: new Date(t0 + 60 * 60 * 1000),
    };
    const issued = issueAttendanceQrToken(fracSession, t0);
    assert.strictEqual(issued.rotation_seconds, 10.4);
    assert.strictEqual(new Date(issued.expires_at).getTime() - t0, 15400);
    assert.strictEqual(issued.token.split('.').length, 4);

    const legacyNoExpiry = {
      _id: new mongoose.Types.ObjectId(),
      is_active: true,
      status: 'active',
      qr_code: qrSecret,
      qr_epoch: 1,
      start_time: new Date('2026-11-26T09:00:00.000Z'),
      duration_minutes: 60,
    };
    const at0930 = new Date('2026-11-26T09:30:00.000Z').getTime();
    const at1001 = new Date('2026-11-26T10:01:00.000Z').getTime();
    assert.strictEqual(isSessionAcceptingQr(legacyNoExpiry, at0930), true);
    assert.strictEqual(isSessionAcceptingQr(legacyNoExpiry, at1001), false);
    const tok0930 = issueAttendanceQrToken(legacyNoExpiry, at0930);
    assert.strictEqual(verifyAttendanceQrToken(legacyNoExpiry, tok0930.token, at0930), true);
    assert.strictEqual(verifyAttendanceQrToken(legacyNoExpiry, tok0930.token, at1001), false);
    console.log('  ✅ 2. Attendance QR fractional interval & legacy cutoff passed');
  }

  // 3. Audit enum check
  {
    const actionEnum = AttendanceAuditLog.schema.path('action').enumValues;
    assert.ok(actionEnum.includes('SESSION_READY'));
    assert.ok(actionEnum.includes('SESSION_STATUS_UPDATED'));
    console.log('  ✅ 3. Audit log enum includes SESSION_READY and SESSION_STATUS_UPDATED');
  }

  // Set up Mongoose connection state mock & Express test server for route/service tests
  const stubs = new StubManager();
  const origReadyState = Object.getOwnPropertyDescriptor(mongoose.connection, 'readyState');
  Object.defineProperty(mongoose.connection, 'readyState', { configurable: true, get: () => 1 });

  const makeAuthHeaders = (email, role) => {
    const token = AuthService.createAccessToken({ sub: email, role });
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  };

  try {
    // Common auth/user stubs
    const validSessionStub = async ({ tokenHash }) => ({
      _id: new mongoose.Types.ObjectId(),
      userId: 'actor@test.edu',
      tokenHash,
      expiry: new Date(Date.now() + 3600_000),
    });

    const app = express();
    app.use(express.json());
    app.use('/api', apiCompatRoutes);
    app.use('/analytics', analyticsRoutes);
    app.use('/leave', leaveRoutes);
    app.use('/notifications', notificationsRoutes);
    app.use('/sessions', sessionsRoutes);
    app.use('/attendance', attendanceRoutes);

    const server = http.createServer(app);
    await new Promise((r) => server.listen(0, r));
    const baseUrl = `http://127.0.0.1:${server.address().port}`;

    try {
      // 4. apiCompat PATCH /profile for parent, teacher, student
      {
        const updates = [];
        stubs.stub(UserSession, 'findOne', async (q) => ({
          _id: new mongoose.Types.ObjectId(),
          userId: q.tokenHash ? undefined : 'x',
          expiry: new Date(Date.now() + 3600_000),
          // authenticate checks userId === emailVal; create dynamically from token
        }));
        // Let's stub UserSession.findOne cleanly by decoding token or storing map
        const sessionByHash = new Map();
        const authFor = (email, role) => {
          const token = AuthService.createAccessToken({ sub: email, role });
          const hash = crypto.createHash('sha256').update(token).digest('hex');
          sessionByHash.set(hash, {
            _id: new mongoose.Types.ObjectId(),
            userId: email,
            tokenHash: hash,
            expiry: new Date(Date.now() + 3600_000),
          });
          return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
        };
        stubs.stub(UserSession, 'findOne', async (q) => sessionByHash.get(q.tokenHash) || null);
        stubs.stub(User, 'updateOne', async (filter, update) => {
          updates.push({ filter, set: update.$set });
          return { modifiedCount: 1 };
        });
        // Stub findOne for parent profile lookup (already-linked check) + find for student lookup
        // Must use makeChain so .lean() works (route calls User.findOne(...).lean())
        stubs.stub(User, 'findOne', (q) => {
          if (q && q.email === 'parent@col.edu') return makeChain({ children: [], linked_children: [] });
          return makeChain(null);
        });
        stubs.stub(User, 'find', (q) => {
          if (q.email?.$in?.includes('kid@col.edu')) {
            return makeChain([{ email: 'kid@col.edu', role: 'student', parent_details: 'parent@col.edu' }]);
          }
          return makeChain([]);
        });

        await fetch(`${baseUrl}/api/profile`, {
          method: 'PATCH',
          headers: authFor('parent@col.edu', 'parent'),
          body: JSON.stringify({
            full_name: 'Parent A',
            linked_children: [{ email: 'kid@col.edu' }],
            department: 'HACK',
          }),
        });
        assert.deepStrictEqual(updates[0].set.linked_children, [{ email: 'kid@col.edu' }]);
        assert.strictEqual(updates[0].set.department, undefined);

        await fetch(`${baseUrl}/api/profile`, {
          method: 'PATCH',
          headers: authFor('student@col.edu', 'student'),
          body: JSON.stringify({ full_name: 'Student A', linked_children: [{ email: 'x@y.com' }] }),
        });
        assert.strictEqual(updates[1].set.linked_children, undefined);

        await fetch(`${baseUrl}/api/profile`, {
          method: 'PATCH',
          headers: authFor('teacher@col.edu', 'teacher'),
          body: JSON.stringify({ designation: 'Prof', linked_children: [{ email: 'x@y.com' }] }),
        });
        assert.strictEqual(updates[2].set.designation, 'Prof');
        assert.strictEqual(updates[2].set.linked_children, undefined);
        stubs.restoreAll();
        console.log('  ✅ 4. apiCompat PATCH /profile parent/teacher/student allowlists passed');
      }

      // 5. analytics /trends case-insensitive teacher_id query
      {
        const sessionByHash = new Map();
        const token = AuthService.createAccessToken({ sub: 'Prof.Case@Col.EDU', role: 'teacher' });
        sessionByHash.set(crypto.createHash('sha256').update(token).digest('hex'), {
          _id: new mongoose.Types.ObjectId(),
          userId: 'Prof.Case@Col.EDU',
          expiry: new Date(Date.now() + 3600_000),
        });
        stubs.stub(UserSession, 'findOne', async (q) => sessionByHash.get(q.tokenHash) || null);
        let capturedQuery = null;
        stubs.stub(Session, 'find', (q) => {
          capturedQuery = q;
          return makeChain([{ _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011') }]);
        });
        stubs.stub(Attendance, 'aggregate', async () => []);

        const res = await fetch(`${baseUrl}/analytics/trends`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        assert.strictEqual(res.status, 200);
        assert.ok(capturedQuery.teacher_id instanceof RegExp);
        assert.strictEqual(capturedQuery.teacher_id.test('prof.case@col.edu'), true);
        assert.strictEqual(capturedQuery.teacher_id.test('Prof.Case@Col.EDU'), true);
        stubs.restoreAll();
        console.log('  ✅ 5. analytics /trends case-insensitive teacher_id match passed');
      }

      // 6. leave.js fixes: dept-less teacher scope, end_date lower bound, search before limit(200), overlap outside filter
      {
        const sessionByHash = new Map();
        const authFor = (email, role) => {
          const token = AuthService.createAccessToken({ sub: email, role });
          const hash = crypto.createHash('sha256').update(token).digest('hex');
          sessionByHash.set(hash, {
            _id: new mongoose.Types.ObjectId(),
            userId: email,
            expiry: new Date(Date.now() + 3600_000),
          });
          return { Authorization: `Bearer ${token}` };
        };
        stubs.stub(UserSession, 'findOne', async (q) => sessionByHash.get(q.tokenHash) || null);

        // 6a. teacher without department gets empty scope (cannot list college-wide students)
        stubs.stub(User, 'findOne', () => makeChain({ email: 'nodept@col.edu', college_id: 'COL_A', department: '' }));
        let leaveFindCalled = false;
        stubs.stub(Leave, 'find', (q) => {
          leaveFindCalled = true;
          assert.deepStrictEqual(q.user_id, { $in: [] });
          return makeChain([]);
        });
        const noDeptRes = await fetch(`${baseUrl}/leave/teacher`, { headers: authFor('nodept@col.edu', 'teacher') });
        assert.strictEqual(noDeptRes.status, 200);
        assert.strictEqual(leaveFindCalled, true);
        const noDeptBody = await noDeptRes.json();
        assert.strictEqual(noDeptBody.leaves.length, 0);

        // 6b. upcoming_approved + earlier start_date keeps todayIso; search applies before limit(200); overlap queries separate set
        const todayIso = new Date().toISOString().slice(0, 10);
        const targetLeaveId = new mongoose.Types.ObjectId();
        const otherLeaveId = new mongoose.Types.ObjectId();
        const capturedFilters = [];
        stubs.stub(User, 'findOne', () => makeChain({ email: 'dept@col.edu', college_id: 'COL_A', department: 'CSE' }));
        stubs.stub(User, 'find', (q) => {
          if (q.$or) {
            return makeChain([{ email: 'alice@col.edu' }]);
          }
          return makeChain([{ email: 'alice@col.edu', full_name: 'Alice Wonder', student_id: 'CS01', department: 'CSE' }]);
        });
        stubs.stub(Leave, 'find', (q) => {
          capturedFilters.push(q);
          if (capturedFilters.length === 1) {
            return makeChain([{
              _id: targetLeaveId,
              user_id: 'alice@col.edu',
              college_id: 'COL_A',
              status: 'Approved',
              category: 'Medical',
              start_date: '2026-12-10',
              end_date: '2026-12-15',
              reason: 'Flu',
            }]);
          }
          // Second Leave.find is overlapCandidates (e.g., Pending Academic leave excluded by status=upcoming_approved & category=Medical)
          return makeChain([
            {
              _id: targetLeaveId,
              user_id: 'alice@col.edu',
              status: 'Approved',
              start_date: '2026-12-10',
              end_date: '2026-12-15',
            },
            {
              _id: otherLeaveId,
              user_id: 'alice@col.edu',
              status: 'Pending',
              start_date: '2026-12-12',
              end_date: '2026-12-14',
            },
          ]);
        });

        const listRes = await fetch(
          `${baseUrl}/leave/teacher?status=upcoming_approved&category=Medical&start_date=2020-01-01&search=Alice`,
          { headers: authFor('dept@col.edu', 'teacher') }
        );
        assert.strictEqual(listRes.status, 200);
        const listBody = await listRes.json();
        assert.strictEqual(capturedFilters[0].end_date.$gte, todayIso, 'Stricter todayIso lower bound must be retained');
        assert.ok(Array.isArray(capturedFilters[0].$or), 'Search criteria must be applied in DB query before limit(200)');
        assert.strictEqual(capturedFilters[1].status.$in.includes('Pending'), true);
        assert.strictEqual(capturedFilters[1].category, undefined);
        assert.strictEqual(listBody.leaves[0].has_overlap, true);
        stubs.restoreAll();
        console.log('  ✅ 6. leave.js scoping, lower bound, pre-limit search, and overlap fixes passed');
      }

      // 7. notifications.js: hod/principal cross-institution block, parent_email override blocked, non-string parent_details guarded
      {
        const sessionByHash = new Map();
        const authFor = (email, role) => {
          const token = AuthService.createAccessToken({ sub: email, role });
          const hash = crypto.createHash('sha256').update(token).digest('hex');
          sessionByHash.set(hash, {
            _id: new mongoose.Types.ObjectId(),
            userId: email,
            expiry: new Date(Date.now() + 3600_000),
          });
          return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
        };
        stubs.stub(UserSession, 'findOne', async (q) => sessionByHash.get(q.tokenHash) || null);
        stubs.stub(User, 'findOne', (q) => {
          if (q.email === 'stu@col_a.edu') {
            return makeChain({
              email: 'stu@col_a.edu',
              full_name: 'Stu A',
              college_id: 'COL_A',
              parent_details: { email: 'legacy-obj@parent.com' }, // non-string legacy value
            });
          }
          if (q.email === 'hod@col_b.edu' || q.email === 'principal@col_b.edu') {
            return makeChain({ email: q.email, college_id: 'COL_B' });
          }
          return makeChain({ email: q.email, college_id: 'COL_A' });
        });
        stubs.stub(User, 'exists', async () => null);
        const sentTo = [];
        stubs.stub(notificationService, 'createNotification', async (userId) => {
          sentTo.push(userId);
          return { id: 'notif-1' };
        });

        const hodCross = await fetch(`${baseUrl}/notifications/send`, {
          method: 'POST',
          headers: authFor('hod@col_b.edu', 'hod'),
          body: JSON.stringify({ student_email: 'stu@col_a.edu', message: 'Alert' }),
        });
        assert.strictEqual(hodCross.status, 403);

        const prinCross = await fetch(`${baseUrl}/notifications/send`, {
          method: 'POST',
          headers: authFor('principal@col_b.edu', 'principal'),
          body: JSON.stringify({ student_email: 'stu@col_a.edu', message: 'Alert' }),
        });
        assert.strictEqual(prinCross.status, 403);

        // Unlinked parent_email is now hard-blocked (403) per hardened route
        const unlinkedParentRes = await fetch(`${baseUrl}/notifications/send`, {
          method: 'POST',
          headers: authFor('hod@col_a.edu', 'hod'),
          body: JSON.stringify({
            student_email: 'stu@col_a.edu',
            message: 'Alert',
            parent_email: 'unlinked@evil.com',
          }),
        });
        assert.strictEqual(unlinkedParentRes.status, 403);

        // Without parent_email: succeeds, parent_notified=false (non-string parent_details → no registered parent)
        const sameColRes = await fetch(`${baseUrl}/notifications/send`, {
          method: 'POST',
          headers: authFor('hod@col_a.edu', 'hod'),
          body: JSON.stringify({ student_email: 'stu@col_a.edu', message: 'Alert' }),
        });
        assert.strictEqual(sameColRes.status, 201);
        const sameColBody = await sameColRes.json();
        assert.strictEqual(sameColBody.parent_notified, false);
        assert.deepStrictEqual(sentTo, ['stu@col_a.edu']);
        stubs.restoreAll();
        console.log('  ✅ 7. notifications.js institution scope, parent_email guard, and non-string parent_details passed');
      }

      // 8. sessions.js: /start active vs scheduled dates, expired session cleanup, /stop lifecycle reuse
      {
        const sessionByHash = new Map();
        const authFor = (email, role) => {
          const token = AuthService.createAccessToken({ sub: email, role });
          const hash = crypto.createHash('sha256').update(token).digest('hex');
          sessionByHash.set(hash, {
            _id: new mongoose.Types.ObjectId(),
            userId: email,
            expiry: new Date(Date.now() + 3600_000),
          });
          return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
        };
        stubs.stub(UserSession, 'findOne', async (q) => sessionByHash.get(q.tokenHash) || null);
        stubs.stub(User, 'findOne', () => makeChain({ email: 't@col_a.edu', role: 'teacher', college_id: 'COL_A', department: 'CSE' }));
        stubs.stub(User, 'find', () => makeChain([]));
        stubs.stub(AttendanceAuditLog, 'create', async () => ({}));

        const expiredId = new mongoose.Types.ObjectId();
        let closedExpired = false;
        let savedSessions = [];
        stubs.stub(Session, 'findOne', () => makeChain({
          _id: expiredId,
          teacher_id: 't@col_a.edu',
          subject: 'Math',
          is_active: true,
          status: 'active',
          start_time: new Date(Date.now() - 3 * 3600_000),
          expires_at: new Date(Date.now() - 2 * 3600_000),
        }));
        stubs.stub(Session, 'updateOne', async (q, u) => {
          if (String(q._id) === expiredId.toString() && u.$set?.status === 'closed') closedExpired = true;
          return { modifiedCount: 1 };
        });
        stubs.stub(Session.prototype, 'save', async function () {
          savedSessions.push(this.toObject());
          return this;
        });

        const monday = new Date('2026-11-23T09:00:00.000Z');
        const beforeNow = Date.now();
        const startActiveRes = await fetch(`${baseUrl}/sessions/start`, {
          method: 'POST',
          headers: authFor('t@col_a.edu', 'teacher'),
          body: JSON.stringify({
            subject: 'Math',
            duration_minutes: 60,
            status: 'active',
            scheduled_start: monday.toISOString(),
          }),
        });
        assert.strictEqual(startActiveRes.status, 200);
        const startActiveBody = await startActiveRes.json();
        assert.strictEqual(closedExpired, true, 'Expired existingSession must be closed');
        assert.strictEqual(startActiveBody.already_active, undefined);
        assert.ok(savedSessions[0].start_time.getTime() >= beforeNow - 1000);
        assert.strictEqual(
          savedSessions[0].expires_at.getTime() - savedSessions[0].start_time.getTime(),
          60 * 60000
        );

        const friday = new Date('2026-11-27T09:00:00.000Z');
        const startSchedRes = await fetch(`${baseUrl}/sessions/start`, {
          method: 'POST',
          headers: authFor('t@col_a.edu', 'teacher'),
          body: JSON.stringify({
            subject: 'Math',
            duration_minutes: 45,
            status: 'scheduled',
            scheduled_start: friday.toISOString(),
          }),
        });
        assert.strictEqual(startSchedRes.status, 200);
        assert.strictEqual(savedSessions[1].is_active, false);
        assert.strictEqual(savedSessions[1].start_time, undefined);
        assert.strictEqual(savedSessions[1].scheduled_start.toISOString(), friday.toISOString());
        assert.strictEqual(savedSessions[1].expires_at, undefined);
        stubs.restoreAll();
        console.log('  ✅ 8. sessions.js /start active-vs-scheduled and expired cleanup passed');
      }

      // 9. attendance.js /mark rejects stale admission commit when QR regenerated / session closed
      {
        const sessionByHash = new Map();
        const token = AuthService.createAccessToken({ sub: 'stu@col_a.edu', role: 'student' });
        sessionByHash.set(crypto.createHash('sha256').update(token).digest('hex'), {
          _id: new mongoose.Types.ObjectId(),
          userId: 'stu@col_a.edu',
          expiry: new Date(Date.now() + 3600_000),
        });
        stubs.stub(UserSession, 'findOne', async (q) => sessionByHash.get(q.tokenHash) || null);

        const sessId = new mongoose.Types.ObjectId();
        const liveSess = {
          _id: sessId,
          teacher_id: 't@col_a.edu',
          college_id: 'COL_A',
          subject: 'Math',
          is_active: true,
          status: 'active',
          qr_code: 'c'.repeat(64),
          qr_epoch: 1,
          start_time: new Date(),
          expires_at: new Date(Date.now() + 3600_000),
        };
        const qr = issueAttendanceQrToken(liveSess);

        stubs.stub(Session, 'findOne', (q) => {
          // Initial findOne returns liveSess; commit-time condition check sees closed session!
          if (q.qr_code) return makeChain(null);
          return makeChain(liveSess);
        });
        stubs.stub(Session, 'findById', () => makeChain({ ...liveSess, is_active: false, status: 'closed' }));
        stubs.stub(User, 'findOne', () => makeChain({ email: 'stu@col_a.edu', role: 'student', college_id: 'COL_A' }));
        stubs.stub(mongoose, 'startSession', async () => ({
          withTransaction: async (fn) => {
            const err = new Error('Transaction numbers are only allowed on a replica set member');
            err.code = 20;
            throw err;
          },
          endSession: async () => { },
        }));
        let attSaved = false;
        stubs.stub(Attendance.prototype, 'save', async () => {
          attSaved = true;
        });

        const markRes = await fetch(`${baseUrl}/attendance/mark`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessId.toString(), qr_code: qr.token }),
        });
        assert.strictEqual(markRes.status, 409);
        assert.strictEqual(attSaved, false);
        stubs.restoreAll();
        console.log('  ✅ 9. attendance.js /mark rejects stale admission commit passed');
      }
    } finally {
      await new Promise((r) => server.close(r));
    }

    // 10. teacherService.js fixes
    {
      // 10a. Teacher with department & no college_id gets 0 dept students (cannot cross-college leak)
      const ctxNoCol = {
        teacher: { email: 't@x.edu', department: 'CSE' }, // no college_id
        teacherSessions: [],
      };
      let userFindCalled = false;
      stubs.stub(User, 'find', () => {
        userFindCalled = true;
        return makeChain([]);
      });
      const noColStudents = await teacherService.getAuthorisedStudentsForTeacher(ctxNoCol);
      assert.strictEqual(noColStudents.length, 0);
      assert.strictEqual(userFindCalled, false);
      stubs.restoreAll();

      // 10b. getAuthorisedStudentsForTeacher scoped by sessionId excludes History attendee from Math
      const mathId = new mongoose.Types.ObjectId().toString();
      const histId = new mongoose.Types.ObjectId().toString();
      stubs.stub(User, 'find', (q) => {
        if (q.department === 'Math') return makeChain([{ email: 'math_kid@col.edu', full_name: 'Math Kid', section: 'A', semester: '4' }]);
        return makeChain([]);
      });
      let distinctFilter = null;
      stubs.stub(Attendance, 'distinct', async (_field, filter) => {
        distinctFilter = filter;
        return [];
      });
      const mathRoster = await teacherService.getAuthorisedStudentsForTeacher(
        {
          teacher: { email: 't@col.edu', college_id: 'COL_A', department: 'Math' },
          teacherSessions: [{ _id: mathId }, { _id: histId }],
        },
        { sessionId: mathId, section: 'A', semester: '4' }
      );
      assert.deepStrictEqual(distinctFilter, { session_id: { $in: [mathId] } });
      assert.strictEqual(mathRoster.length, 1);
      assert.strictEqual(mathRoster[0].email, 'math_kid@col.edu');
      stubs.restoreAll();

      // 10c. getTeacherSessions section-filtered denominator + recorded attendee outside roster
      const s1Id = new mongoose.Types.ObjectId();
      stubs.stub(User, 'findOne', () => makeChain({ email: 't@col.edu', role: 'teacher', college_id: 'COL_A', department: 'CSE' }));
      stubs.stub(College, 'findOne', () => makeChain(null));
      stubs.stub(Timetable, 'find', () => makeChain([]));
      stubs.stub(Session, 'find', () => makeChain([]));
      stubs.stub(Session, 'find', () => makeChain([
        { _id: s1Id, teacher_id: 't@col.edu', subject: 'DSA', section: 'A', semester: '4', is_active: true, status: 'active', start_time: new Date() },
      ]));
      stubs.stub(Attendance, 'find', () => makeChain([
        { session_id: s1Id.toString(), student_email: 'a1@col.edu', status: 'Present', verified_by: 'qr' },
        { session_id: s1Id.toString(), student_email: 'guest@col.edu', status: 'Present', verified_by: 'qr' },
      ]));
      stubs.stub(User, 'find', () => makeChain([
        { email: 'a1@col.edu', section: 'A', semester: '4' },
        { email: 'a2@col.edu', section: 'A', semester: '4' },
        { email: 'b1@col.edu', section: 'B', semester: '4' },
      ]));
      const sessList = await teacherService.getTeacherSessions('t@col.edu');
      assert.strictEqual(sessList[0].total_enrolled_seen, 3); // {a1, a2, guest}, NOT b1
      assert.strictEqual(sessList[0].attendance_rate, 67); // 2/3
      stubs.restoreAll();

      // 10d. getSessionDetailAndRoster: cross-campus admin rejected, uppercase sessionId canonicalized, Friday scheduled_start leave lookup
      const sessObjId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439011');
      const upperSessId = sessObjId.toString().toUpperCase();
      const friday = new Date('2026-11-27T09:00:00.000Z');
      stubs.stub(Session, 'findById', () => makeChain({
        _id: sessObjId,
        teacher_id: 'owner@col_a.edu',
        college_id: 'COL_A',
        subject: 'DSA',
        status: 'scheduled',
        is_active: false,
        scheduled_start: friday,
        start_time: friday,
      }));
      stubs.stub(User, 'findOne', (q) => {
        if (q.email === 'admin@col_b.edu') return makeChain({ email: 'admin@col_b.edu', college_id: 'COL_B' });
        return makeChain({ email: 'owner@col_a.edu', role: 'teacher', college_id: 'COL_A', department: 'CSE' });
      });
      stubs.stub(College, 'findOne', () => makeChain(null));
      stubs.stub(Timetable, 'find', () => makeChain([]));
      stubs.stub(Session, 'find', () => makeChain([]));

      const crossDetail = await teacherService.getSessionDetailAndRoster('admin@col_b.edu', 'admin', upperSessId);
      assert.strictEqual(crossDetail.errorStatus, 403);

      let attQueryId = null;
      let leaveQuery = null;
      stubs.stub(User, 'find', () => makeChain([{ email: 's1@col_a.edu', full_name: 'S1', college_id: 'COL_A', department: 'CSE' }]));
      stubs.stub(Attendance, 'distinct', async () => []);
      stubs.stub(Attendance, 'find', (q) => {
        attQueryId = q.session_id;
        return makeChain([]);
      });
      stubs.stub(Leave, 'find', (q) => {
        leaveQuery = q;
        return makeChain([{ _id: new mongoose.Types.ObjectId(), user_id: 's1@col_a.edu', category: 'Medical', start_date: '2026-11-27', end_date: '2026-11-27' }]);
      });
      stubs.stub(BiometricProfile, 'find', () => makeChain([]));
      const okDetail = await teacherService.getSessionDetailAndRoster('owner@col_a.edu', 'teacher', upperSessId);
      assert.strictEqual(attQueryId, sessObjId.toString());
      assert.strictEqual(leaveQuery.start_date.$lte, '2026-11-27');
      assert.strictEqual(okDetail.students[0].status, 'Approved leave');
      stubs.restoreAll();

      // 10e. transitionSessionState: cross-institution admin, concurrent CAS extend, conflict on stale source state, recoverable finalisation + occurrence timestamp + ready audit action
      const tSessId = new mongoose.Types.ObjectId();
      stubs.stub(Session, 'findById', async () => ({
        _id: tSessId,
        teacher_id: 'owner@col_a.edu',
        college_id: 'COL_A',
        subject: 'DSA',
        status: 'active',
        is_active: true,
        duration_minutes: 60,
        extended_minutes: 0,
        start_time: new Date('2026-11-20T09:00:00.000Z'),
        expires_at: new Date(Date.now() + 30 * 60000),
      }));
      stubs.stub(User, 'findOne', () => makeChain({ email: 'admin@col_b.edu', college_id: 'COL_B' }));
      stubs.stub(AttendanceAuditLog, 'create', async () => ({}));
      const crossTrans = await teacherService.transitionSessionState({
        sessionId: tSessId.toString(),
        actorEmail: 'admin@col_b.edu',
        actorRole: 'admin',
        action: 'pause',
      });
      assert.strictEqual(crossTrans.errorStatus, 403);

      // Concurrent transition conflict (findOneAndUpdate returns null)
      stubs.stub(Session, 'findOneAndUpdate', async () => null);
      const conflictTrans = await teacherService.transitionSessionState({
        sessionId: tSessId.toString(),
        actorEmail: 'owner@col_a.edu',
        actorRole: 'teacher',
        action: 'pause',
      });
      assert.strictEqual(conflictTrans.errorStatus, 409);

      // Concurrent extend CAS retry adds both extensions atomically
      const baseExp = new Date(Date.now() + 30 * 60000);
      let dbSessState = {
        _id: tSessId,
        teacher_id: 'owner@col_a.edu',
        college_id: 'COL_A',
        subject: 'DSA',
        status: 'active',
        is_active: true,
        duration_minutes: 60,
        extended_minutes: 0,
        start_time: new Date(),
        expires_at: baseExp,
      };
      let extendAttempts = 0;
      stubs.stub(Session, 'findById', async () => ({ ...dbSessState }));
      stubs.stub(Session, 'findOneAndUpdate', async (q, u) => {
        extendAttempts++;
        if (extendAttempts === 1) {
          // Simulate concurrent extension winning first
          dbSessState = {
            ...dbSessState,
            extended_minutes: 15,
            expires_at: new Date(baseExp.getTime() + 15 * 60000),
            duration: '75 min',
          };
          return null;
        }
        assert.strictEqual(q.extended_minutes, 15);
        dbSessState = { ...dbSessState, ...u.$set };
        return { ...dbSessState };
      });
      const extRes = await teacherService.transitionSessionState({
        sessionId: tSessId.toString(),
        actorEmail: 'owner@col_a.edu',
        actorRole: 'teacher',
        action: 'extend',
        extendMinutes: 15,
      });
      assert.strictEqual(extRes.success, true);
      assert.strictEqual(extendAttempts, 2);
      assert.strictEqual(dbSessState.extended_minutes, 30);
      assert.strictEqual(dbSessState.duration, '90 min');
      assert.strictEqual(new Date(extRes.expires_at).getTime(), baseExp.getTime() + 30 * 60000);

      // Ready transition writes SESSION_READY
      let createdAuditAction = null;
      stubs.stub(Session, 'findById', async () => ({
        _id: tSessId,
        teacher_id: 'owner@col_a.edu',
        college_id: 'COL_A',
        subject: 'DSA',
        status: 'scheduled',
        is_active: false,
      }));
      stubs.stub(Session, 'findOneAndUpdate', async (_q, u) => ({
        _id: tSessId,
        teacher_id: 'owner@col_a.edu',
        college_id: 'COL_A',
        subject: 'DSA',
        ...u.$set,
      }));
      stubs.stub(AttendanceAuditLog, 'create', async (doc) => {
        createdAuditAction = doc.action;
        return doc;
      });
      stubs.stub(notificationService, 'sendPersonalMessage', async () => { });
      const readyRes = await teacherService.transitionSessionState({
        sessionId: tSessId.toString(),
        actorEmail: 'owner@col_a.edu',
        actorRole: 'teacher',
        action: 'ready',
      });
      assert.strictEqual(readyRes.status, 'ready');
      assert.strictEqual(createdAuditAction, 'SESSION_READY');

      // Recoverable finalisation: if Attendance.updateMany fails, session stays under_review (not finalised); retry succeeds with occurrence timestamp
      let currentDbStatus = 'closed';
      const occDate = new Date('2026-11-20T09:00:00.000Z');
      stubs.stub(Session, 'findById', () => makeChain({
        _id: tSessId,
        teacher_id: 'owner@col_a.edu',
        college_id: 'COL_A',
        subject: 'DSA',
        status: currentDbStatus,
        is_active: false,
        start_time: occDate,
      }));
      stubs.stub(Session, 'findOneAndUpdate', async (q, u) => {
        if (q.status && q.status !== currentDbStatus) return null;
        currentDbStatus = u.$set.status;
        return {
          _id: tSessId,
          teacher_id: 'owner@col_a.edu',
          college_id: 'COL_A',
          subject: 'DSA',
          start_time: occDate,
          ...u.$set,
        };
      });
      stubs.stub(User, 'findOne', () => makeChain({ email: 'owner@col_a.edu', role: 'teacher', college_id: 'COL_A', department: 'CSE' }));
      stubs.stub(College, 'findOne', () => makeChain(null));
      stubs.stub(Timetable, 'find', () => makeChain([]));
      stubs.stub(Session, 'find', () => makeChain([]));
      stubs.stub(User, 'find', () => makeChain([{ email: 's1@col_a.edu', full_name: 'S1', college_id: 'COL_A', department: 'CSE' }]));
      stubs.stub(Attendance, 'distinct', async () => []);
      stubs.stub(Attendance, 'find', () => makeChain([]));
      stubs.stub(Leave, 'find', () => makeChain([]));
      stubs.stub(BiometricProfile, 'find', () => makeChain([]));
      let insertedOps = null;
      stubs.stub(Attendance, 'bulkWrite', async (ops) => {
        insertedOps = ops;
        return { hasWriteErrors: () => false };
      });
      let failUpdateMany = true;
      stubs.stub(Attendance, 'updateMany', async () => {
        if (failUpdateMany) throw new Error('Transient DB error');
        return { modifiedCount: 1 };
      });

      await assert.rejects(() => teacherService.transitionSessionState({
        sessionId: tSessId.toString(),
        actorEmail: 'owner@col_a.edu',
        actorRole: 'teacher',
        action: 'finalise',
        autoMarkAbsent: true,
      }), /Transient DB error/);
      assert.strictEqual(currentDbStatus, 'under_review', 'Session must remain in recoverable under_review state');

      failUpdateMany = false;
      const retryFin = await teacherService.transitionSessionState({
        sessionId: tSessId.toString(),
        actorEmail: 'owner@col_a.edu',
        actorRole: 'teacher',
        action: 'finalise',
        autoMarkAbsent: true,
      });
      assert.strictEqual(retryFin.status, 'finalised');
      assert.strictEqual(currentDbStatus, 'finalised');
      assert.strictEqual(
        insertedOps[0].updateOne.update.$setOnInsert.timestamp.toISOString(),
        occDate.toISOString(),
        'Auto-absence timestamp must match session occurrence date'
      );
      stubs.restoreAll();

      // 10f. generateTeacherReport total_sessions within selected period (including 0-mark sessions) vs all-time
      stubs.stub(User, 'findOne', () => makeChain({ email: 't@col.edu', full_name: 'Prof T', role: 'teacher', college_id: 'COL_A', department: 'CSE' }));
      stubs.stub(College, 'findOne', () => makeChain(null));
      stubs.stub(Timetable, 'find', () => makeChain([]));
      stubs.stub(Session, 'find', () => makeChain([]));
      stubs.stub(Session, 'find', () => makeChain([
        { _id: new mongoose.Types.ObjectId(), teacher_id: 't@col.edu', subject: 'DSA', start_time: new Date('2026-11-10T09:00:00Z') },
        { _id: new mongoose.Types.ObjectId(), teacher_id: 't@col.edu', subject: 'DSA', start_time: new Date('2026-11-20T09:00:00Z') },
        { _id: new mongoose.Types.ObjectId(), teacher_id: 't@col.edu', subject: 'DSA', start_time: new Date('2026-11-22T09:00:00Z') },
      ]));
      stubs.stub(Attendance, 'find', () => makeChain([]));
      stubs.stub(User, 'find', () => makeChain([]));
      stubs.stub(Attendance, 'distinct', async () => []);

      const periodRpt = await teacherService.generateTeacherReport('t@col.edu', {
        start_date: '2026-11-19',
        end_date: '2026-11-25',
      });
      assert.strictEqual(periodRpt.summary.total_sessions, 2);

      const allTimeRpt = await teacherService.generateTeacherReport('t@col.edu', {});
      assert.strictEqual(allTimeRpt.summary.total_sessions, 3);
      stubs.restoreAll();
      console.log('  ✅ 10. teacherService.js scoping, roster, transitions, finalisation, and report fixes passed');
    }

    console.log('\n🎉 ALL TARGETED REVIEW FIX UNIT TESTS PASSED!');
  } finally {
    stubs.restoreAll();
    if (origReadyState) {
      Object.defineProperty(mongoose.connection, 'readyState', origReadyState);
    }
  }
}

runTests().catch((err) => {
  console.error('❌ REVIEW FIX TESTS FAILED:', err);
  process.exit(1);
});
