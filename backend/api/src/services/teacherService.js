'use strict';

const mongoose = require('mongoose');
const User = require('../models/User');
const Session = require('../models/Session');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Timetable = require('../models/Timetable');
const Holiday = require('../models/Holiday');
const AttendanceDispute = require('../models/AttendanceDispute');
const Notification = require('../models/Notification');
const BiometricProfile = require('../models/BiometricProfile');
const FaceRecognitionMetrics = require('../models/FaceRecognitionMetrics');
const AttendanceAuditLog = require('../models/AttendanceAuditLog');
const InterventionNote = require('../models/InterventionNote');
const Announcement = require('../models/Announcement');
const notificationService = require('./notificationService');
const cache = require('../utils/cache');
const {
  round2,
  classifyAttendanceStatus,
  tallyRecords,
  calculateTargetMetrics,
  evaluateRisk,
} = require('./attendanceCalculator');
const {
  getInstitutionPolicy,
  parseSlotTimes,
  toDateKey,
} = require('./studentAttendanceService');

const SESSION_TRANSITIONS = Object.freeze({
  scheduled: new Set(['ready', 'active', 'cancelled']),
  ready: new Set(['active', 'cancelled']),
  active: new Set(['paused', 'closed', 'under_review', 'cancelled']),
  paused: new Set(['resumed', 'closed', 'cancelled']),
  resumed: new Set(['paused', 'closed', 'under_review', 'cancelled']),
  closed: new Set(['under_review', 'finalised']),
  under_review: new Set(['finalised', 'closed']),
  finalised: new Set([]),
  cancelled: new Set([]),
});

const ACTION_TO_STATUS = Object.freeze({
  ready: 'ready',
  start: 'active',
  activate: 'active',
  pause: 'paused',
  resume: 'resumed',
  close: 'closed',
  stop: 'closed',
  cancel: 'cancelled',
  review: 'under_review',
  under_review: 'under_review',
  finalise: 'finalised',
  finalize: 'finalised',
});

const ALLOWED_MANUAL_STATUSES = new Set([
  'Present',
  'Absent',
  'Late',
  'Excused',
  'Excused absence',
  'Approved leave',
  'Medical leave',
  'Pending verification',
  'Manually recorded',
  'Cancelled session',
]);

function normalizeManualStatus(raw) {
  const s = String(raw || '').trim();
  if (ALLOWED_MANUAL_STATUSES.has(s)) return s;
  const lower = s.toLowerCase();
  for (const allowed of ALLOWED_MANUAL_STATUSES) {
    if (allowed.toLowerCase() === lower) return allowed;
  }
  return null;
}

function escapeRegex(val) {
  return String(val || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildTenantStudentFilter(teacher, extra = {}) {
  if (!teacher?.college_id) return null;
  const filter = { role: 'student', college_id: teacher.college_id, ...extra };
  if (teacher?.department) {
    filter.department = teacher.department;
  }
  return filter;
}

async function resolveTeacherContext(teacherEmail) {
  const cleanEmail = String(teacherEmail || '').trim().toLowerCase();
  const teacher = await User.findOne(
    { email: cleanEmail },
    'email full_name role department college college_id designation specialization qualification experience employee_id email_verified biometric_registered notification_preferences privacy_preferences academic_year'
  ).lean();
  if (!teacher) return null;

  const [policy, timetableSlots, teacherSessions] = await Promise.all([
    getInstitutionPolicy(teacher),
    Timetable.find({
      $or: [
        { teacher_email: cleanEmail },
        { teacher_email: new RegExp(`^${escapeRegex(cleanEmail)}$`, 'i') },
        { user_id: cleanEmail.toUpperCase() },
      ],
    }).lean(),
    Session.find({ teacher_id: new RegExp(`^${escapeRegex(cleanEmail)}$`, 'i') })
      .sort({ start_time: -1 })
      .lean(),
  ]);

  const subjects = [...new Set([
    ...timetableSlots.map((s) => s.subject).filter(Boolean),
    ...teacherSessions.map((s) => s.subject).filter(Boolean),
  ])];
  const classKeys = [...new Set(timetableSlots.map((s) => s.user_id).filter((id) => id && !id.includes('@')))];
  const rooms = [...new Set([
    ...timetableSlots.map((s) => s.room).filter(Boolean),
    ...teacherSessions.map((s) => s.room).filter(Boolean),
  ])];

  return {
    teacher,
    cleanEmail,
    policy,
    timetableSlots,
    teacherSessions,
    subjects,
    classKeys,
    rooms,
  };
}

async function getAuthorisedStudentsForTeacher(ctx, filters = {}) {
  const { teacher, teacherSessions } = ctx;
  const sessionIds = filters.sessionId
    ? [String(filters.sessionId)]
    : (Array.isArray(filters.sessionIds)
      ? filters.sessionIds.map(String)
      : teacherSessions.map((s) => s._id.toString()));

  // Combine students in the teacher's college+department with any student who has checked into the scoped sessions (same college)
  const studentFilter = buildTenantStudentFilter(teacher);
  if (studentFilter) {
    if (filters.section) studentFilter.section = String(filters.section).trim();
    if (filters.semester) studentFilter.semester = String(filters.semester).trim();
    if (filters.search) {
      const escaped = escapeRegex(filters.search.trim());
      studentFilter.$or = [
        { full_name: { $regex: escaped, $options: 'i' } },
        { email: { $regex: escaped, $options: 'i' } },
        { student_id: { $regex: escaped, $options: 'i' } },
        { usn: { $regex: escaped, $options: 'i' } },
        { roll_number: { $regex: escaped, $options: 'i' } },
      ];
    }
  }

  const deptStudents = studentFilter
    ? await User.find(
      studentFilter,
      'email full_name student_id usn roll_number department semester section college_id avatar_url profilePhotoUrl biometric_registered parent_details'
    ).lean()
    : [];

  const attendeeEmails = sessionIds.length
    ? await Attendance.distinct('student_email', { session_id: { $in: sessionIds } })
    : [];

  const knownEmails = new Set(deptStudents.map((s) => s.email.toLowerCase()));
  const missingAttendeeEmails = attendeeEmails
    .map((e) => String(e).toLowerCase())
    .filter((e) => !knownEmails.has(e));

  let extraStudents = [];
  if (missingAttendeeEmails.length > 0) {
    const extraFilter = {
      role: 'student',
      email: { $in: missingAttendeeEmails },
      ...(teacher.college_id ? { college_id: teacher.college_id } : {}),
    };
    if (filters.section) extraFilter.section = String(filters.section).trim();
    if (filters.semester) extraFilter.semester = String(filters.semester).trim();
    extraStudents = await User.find(
      extraFilter,
      'email full_name student_id usn roll_number department semester section college_id avatar_url profilePhotoUrl biometric_registered parent_details'
    ).lean();
  }

  let combined = [...deptStudents, ...extraStudents];
  if (filters.search && extraStudents.length > 0) {
    const q = filters.search.trim().toLowerCase();
    combined = combined.filter((s) =>
      (s.full_name || '').toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q) ||
      (s.student_id || '').toLowerCase().includes(q) ||
      (s.usn || '').toLowerCase().includes(q) ||
      (s.roll_number || '').toLowerCase().includes(q)
    );
  }
  return combined;
}

function getEffectiveSessionStatus(session) {
  if (!session) return 'closed';
  if (session.status) return session.status;
  return session.is_active ? 'active' : 'closed';
}

function computeRemainingSeconds(session, now = Date.now()) {
  const status = getEffectiveSessionStatus(session);
  if (!['active', 'resumed', 'paused'].includes(status)) return 0;
  const durMins = Number(session.duration_minutes || 60) + Number(session.extended_minutes || 0);
  const expiresMs = session.expires_at
    ? new Date(session.expires_at).getTime()
    : (new Date(session.start_time).getTime() + durMins * 60 * 1000);
  return Math.max(0, Math.round((expiresMs - now) / 1000));
}

async function getTeacherDashboard(teacherEmail) {
  const ctx = await resolveTeacherContext(teacherEmail);
  if (!ctx) return null;

  const { teacher, cleanEmail, policy, timetableSlots, teacherSessions, subjects, classKeys } = ctx;
  const sessionIds = teacherSessions.map((s) => s._id.toString());
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const students = await getAuthorisedStudentsForTeacher(ctx);
  const studentEmails = students.map((s) => s.email.toLowerCase());

  const [
    attendanceRecords,
    pendingLeaves,
    pendingDisputes,
    unreadNotifications,
    holidays,
  ] = await Promise.all([
    sessionIds.length
      ? Attendance.find({ session_id: { $in: sessionIds } }).sort({ timestamp: -1 }).lean()
      : Promise.resolve([]),
    studentEmails.length
      ? Leave.countDocuments({
        status: { $in: ['Pending', 'Under Review', 'Clarification'] },
        user_id: { $in: studentEmails },
      })
      : Promise.resolve(0),
    sessionIds.length
      ? AttendanceDispute.countDocuments({
        status: { $in: ['Pending', 'Under Review', 'Clarification'] },
        ...(teacher.college_id ? { college_id: teacher.college_id } : {}),
        $or: [
          { session_id: { $in: sessionIds } },
          ...(subjects.length ? [{ subject: { $in: subjects } }] : []),
        ],
      })
      : Promise.resolve(0),
    Notification.countDocuments({ user_id: cleanEmail, is_read: { $ne: true } }),
    cache.getOrLoad('academic:holidays:all', () => Holiday.find().sort({ date: 1 }).lean(), 60 * 1000),
  ]);

  const activeSessions = teacherSessions.filter((s) => s.is_active && ['active', 'resumed', 'paused'].includes(getEffectiveSessionStatus(s)));
  const todayRecords = attendanceRecords.filter((r) => r.timestamp && new Date(r.timestamp) >= startOfDay);

  // Overall + subject-wise tally using deterministic policy engine
  const overallTally = tallyRecords(attendanceRecords, policy);
  const sessionById = new Map(teacherSessions.map((s) => [s._id.toString(), s]));

  const subjectMap = new Map();
  for (const s of teacherSessions) {
    if (!subjectMap.has(s.subject)) {
      subjectMap.set(s.subject, { subject: s.subject, sessions_count: 0, records: [] });
    }
    if (getEffectiveSessionStatus(s) !== 'cancelled') {
      subjectMap.get(s.subject).sessions_count += 1;
    }
  }
  for (const r of attendanceRecords) {
    const sess = sessionById.get(String(r.session_id));
    const subName = r.subject || sess?.subject;
    if (!subName) continue;
    if (!subjectMap.has(subName)) {
      subjectMap.set(subName, { subject: subName, sessions_count: 0, records: [] });
    }
    subjectMap.get(subName).records.push(r);
  }
  const subjectWise = [...subjectMap.values()].map((item) => {
    const t = tallyRecords(item.records, policy);
    return {
      subject: item.subject,
      sessions_count: item.sessions_count,
      present_count: t.attended,
      conducted_marks: t.conducted,
      attendance_rate: t.percentage ?? 0,
    };
  });

  // Shortage count per authorised student
  const recordsByStudent = new Map();
  for (const r of attendanceRecords) {
    const em = String(r.student_email || '').toLowerCase();
    if (!recordsByStudent.has(em)) recordsByStudent.set(em, []);
    recordsByStudent.get(em).push(r);
  }
  let shortageCount = 0;
  let criticalCount = 0;
  for (const st of students) {
    const recs = recordsByStudent.get(st.email.toLowerCase()) || [];
    if (recs.length === 0) continue;
    const t = tallyRecords(recs, policy);
    if (t.percentage !== null && t.percentage < policy.minPercentage) {
      shortageCount++;
      if (t.percentage < Math.max(0, policy.minPercentage - 10)) criticalCount++;
    }
  }

  // Today's teaching schedule
  const todayLong = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()];
  const todayShort = todayLong.slice(0, 3).toLowerCase();
  const todayIso = toDateKey(now);
  const isTodayHoliday = holidays.some((h) => toDateKey(h.date) === todayIso);

  const todaySchedule = timetableSlots
    .filter((slot) => {
      const d = String(slot.day || '').trim().toLowerCase();
      return d === todayLong.toLowerCase() || d.slice(0, 3) === todayShort;
    })
    .map((slot) => {
      const { start, end } = parseSlotTimes(slot.time, now);
      let status = 'upcoming';
      let minutesUntilStart = null;
      if (slot.is_cancelled) status = 'cancelled';
      else if (start && end) {
        if (now >= start && now <= end) status = 'live';
        else if (now > end) status = 'completed';
        else minutesUntilStart = Math.max(0, Math.round((start.getTime() - now.getTime()) / 60000));
      }
      return {
        id: slot._id.toString(),
        subject: slot.subject,
        subject_code: slot.subject_code || '',
        class_key: slot.user_id,
        day: slot.day,
        time: slot.time,
        room: slot.room || 'TBA',
        session_type: slot.session_type || 'lecture',
        substitute_faculty: slot.substitute_faculty || '',
        is_cancelled: Boolean(slot.is_cancelled),
        cancellation_reason: slot.cancellation_reason || '',
        status,
        minutes_until_start: minutesUntilStart,
      };
    });

  // Monthly attendance trends (last 6 months)
  const monthlyMap = new Map();
  for (let offset = 5; offset >= 0; offset--) {
    const dt = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1));
    const key = dt.toISOString().slice(0, 7);
    monthlyMap.set(key, {
      month: key,
      label: dt.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }),
      records: [],
    });
  }
  for (const r of attendanceRecords) {
    if (!r.timestamp) continue;
    const key = new Date(r.timestamp).toISOString().slice(0, 7);
    if (monthlyMap.has(key)) monthlyMap.get(key).records.push(r);
  }
  const monthlyTrends = [...monthlyMap.values()].map((m) => {
    const t = tallyRecords(m.records, policy);
    return {
      month: m.month,
      label: m.label,
      present: t.attended,
      conducted: t.conducted,
      rate: t.percentage ?? 0,
    };
  });

  const studentNameByEmail = new Map(students.map((s) => [s.email.toLowerCase(), s]));
  const recentActivity = attendanceRecords.slice(0, 10).map((r) => {
    const st = studentNameByEmail.get(String(r.student_email).toLowerCase());
    const sess = sessionById.get(String(r.session_id));
    return {
      id: r._id.toString(),
      student_email: r.student_email,
      student_name: st?.full_name || r.student_email.split('@')[0],
      roll_number: st?.student_id || st?.roll_number || st?.usn || null,
      subject: r.subject || sess?.subject || 'Class',
      status: r.status,
      verified_by: r.verified_by,
      confidence: r.confidence ?? null,
      timestamp: r.timestamp,
    };
  });

  return {
    // Legacy / Mobile-compatible keys
    teacher_name: teacher.full_name,
    department: teacher.department || null,
    active_sessions: activeSessions.length,
    total_sessions: teacherSessions.length,
    attendance_today: todayRecords.length,
    students_monitored: Math.max(students.length, recordsByStudent.size),
    pending_leaves: pendingLeaves,
    // Enterprise Teacher Dashboard keys
    assigned_classes_count: classKeys.length || subjects.length,
    assigned_subjects: subjects,
    assigned_classes: classKeys,
    total_assigned_students: students.length,
    overall_attendance_rate: overallTally.percentage ?? 0,
    subject_wise_attendance: subjectWise,
    shortage_students_count: shortageCount,
    critical_students_count: criticalCount,
    pending_disputes: pendingDisputes,
    unread_notifications: unreadNotifications,
    today_schedule: todaySchedule,
    completed_lectures_today: todaySchedule.filter((s) => s.status === 'completed').length,
    upcoming_lectures_today: todaySchedule.filter((s) => s.status === 'upcoming' || s.status === 'live').length,
    cancelled_lectures_today: todaySchedule.filter((s) => s.status === 'cancelled').length,
    is_today_holiday: isTodayHoliday,
    weekly_schedule_count: timetableSlots.length,
    monthly_trends: monthlyTrends,
    recent_activity: recentActivity,
    academic_info: {
      college_name: policy.collegeName,
      college_code: policy.collegeCode,
      department: teacher.department || null,
      designation: teacher.designation || null,
      semester: policy.currentSemester,
      academic_year: policy.academicYear,
      timezone: policy.timezone,
      min_percentage: policy.minPercentage,
    },
    last_synced_at: new Date().toISOString(),
  };
}

async function getTeacherSessions(teacherEmail) {
  const ctx = await resolveTeacherContext(teacherEmail);
  if (!ctx) return [];
  const { teacher, teacherSessions, policy } = ctx;
  if (teacherSessions.length === 0) return [];

  const sessionIds = teacherSessions.map((s) => s._id.toString());
  const tenantFilter = buildTenantStudentFilter(teacher);
  const [allAttendance, deptStudents] = await Promise.all([
    Attendance.find({ session_id: { $in: sessionIds } }).lean(),
    tenantFilter
      ? User.find(tenantFilter, 'email section semester').lean()
      : Promise.resolve([]),
  ]);
  const recordsBySession = new Map();
  for (const r of allAttendance) {
    const sid = String(r.session_id);
    if (!recordsBySession.has(sid)) recordsBySession.set(sid, []);
    recordsBySession.get(sid).push(r);
  }

  return teacherSessions.map((session) => {
    const sid = session._id.toString();
    const recs = recordsBySession.get(sid) || [];
    const t = tallyRecords(recs, policy);
    const faceCount = recs.filter((r) => r.verified_by === 'face' || r.verified_by === 'kiosk').length;
    const qrCount = recs.filter((r) => r.verified_by === 'qr').length;
    const manualCount = recs.filter((r) => r.verified_by === 'manual').length;
    const secFilter = session.section ? String(session.section).trim() : null;
    const semFilter = session.semester ? String(session.semester).trim() : null;
    const rosterEmails = new Set();
    for (const st of deptStudents) {
      if (secFilter && String(st.section || '').trim() !== secFilter) continue;
      if (semFilter && String(st.semester || '').trim() !== semFilter) continue;
      rosterEmails.add(st.email.toLowerCase());
    }
    for (const r of recs) {
      rosterEmails.add(String(r.student_email).toLowerCase());
    }
    const denom = rosterEmails.size;
    const status = getEffectiveSessionStatus(session);

    return {
      id: sid,
      subject: session.subject,
      subject_code: session.subject_code || null,
      section: session.section || null,
      semester: session.semester || null,
      department: session.department || null,
      room: session.room || null,
      duration: session.duration,
      duration_minutes: session.duration_minutes || 60,
      extended_minutes: session.extended_minutes || 0,
      start_time: session.start_time,
      expires_at: session.expires_at || null,
      remaining_seconds: computeRemainingSeconds(session),
      status,
      is_active: Boolean(session.is_active),
      qr_rotation_seconds: session.qr_rotation_seconds || 15,
      qr_epoch: session.qr_epoch || 1,
      verification_methods: session.verification_methods || ['qr', 'face', 'manual'],
      geofence_enabled: session.latitude != null && session.longitude != null,
      present_count: t.attended,
      absent_count: Math.max(0, denom - t.attended - t.pending),
      late_count: t.late,
      excused_count: t.excused,
      leave_count: t.leave,
      pending_count: t.pending,
      face_count: faceCount,
      qr_count: qrCount,
      manual_count: manualCount,
      duplicate_attempts: session.telemetry?.duplicate_attempts || 0,
      failed_verifications: session.telemetry?.failed_verifications || 0,
      students_checked_in: t.attended,
      total_enrolled_seen: denom,
      attendance_rate: denom ? Math.round((t.attended / denom) * 100) : 0,
      finalised_at: session.finalised_at || null,
      closed_at: session.closed_at || null,
      cancellation_reason: session.cancellation_reason || null,
    };
  });
}

async function getSessionDetailAndRoster(teacherEmail, actorRole, sessionId) {
  if (!mongoose.Types.ObjectId.isValid(sessionId)) {
    return { errorStatus: 400, detail: 'Invalid session ID.' };
  }
  const session = await Session.findById(sessionId).lean();
  if (!session) return { errorStatus: 404, detail: 'Session not found.' };
  const canonicalSessionId = session._id.toString();

  const normalizedRole = String(actorRole || '').toLowerCase();
  const isSuperAdmin = normalizedRole === 'super_admin';
  const isAdmin = ['admin', 'super_admin', 'principal', 'hod'].includes(normalizedRole);
  const cleanEmail = String(teacherEmail || '').trim().toLowerCase();
  const isOwner = String(session.teacher_id || '').toLowerCase() === cleanEmail;
  if (!isAdmin && !isOwner) {
    return { errorStatus: 403, detail: 'Forbidden: you do not have access to this session.' };
  }

  const ctx = await resolveTeacherContext(session.teacher_id);
  if (!ctx) return { errorStatus: 404, detail: 'Session owner not found.' };

  if (session.college_id && ctx.teacher.college_id && session.college_id !== ctx.teacher.college_id) {
    return { errorStatus: 403, detail: 'Forbidden: cross-institution access denied.' };
  }

  if (!isSuperAdmin && isAdmin && !isOwner) {
    const actor = await User.findOne({ email: cleanEmail }, 'college_id').lean();
    const targetCollege = session.college_id || ctx.teacher.college_id;
    if (targetCollege && (!actor?.college_id || actor.college_id !== targetCollege)) {
      return { errorStatus: 403, detail: 'Forbidden: cross-institution access denied.' };
    }
  }

  const sessionOccurrenceKey = toDateKey(session.start_time || session.scheduled_start || new Date());
  const [students, records, activeLeaves] = await Promise.all([
    getAuthorisedStudentsForTeacher(ctx, {
      sessionId: canonicalSessionId,
      section: session.section || undefined,
      semester: session.semester || undefined,
    }),
    Attendance.find({ session_id: canonicalSessionId }).lean(),
    Leave.find({
      status: 'Approved',
      start_date: { $lte: sessionOccurrenceKey },
      end_date: { $gte: sessionOccurrenceKey },
    }).lean(),
  ]);

  const recordByEmail = new Map(records.map((r) => [String(r.student_email).toLowerCase(), r]));
  const leaveByEmail = new Map(activeLeaves.map((l) => [String(l.user_id).toLowerCase(), l]));
  const studentMap = new Map(students.map((s) => [s.email.toLowerCase(), s]));

  // Ensure any student who checked in appears even if section filter differed
  for (const r of records) {
    const em = String(r.student_email).toLowerCase();
    if (!studentMap.has(em)) {
      const u = await User.findOne(
        { email: em, ...(ctx.teacher.college_id ? { college_id: ctx.teacher.college_id } : {}) },
        'email full_name student_id usn roll_number department semester section avatar_url profilePhotoUrl biometric_registered'
      ).lean();
      if (u) studentMap.set(em, u);
      else studentMap.set(em, { email: em, full_name: em.split('@')[0] });
    }
  }

  const allEmails = [...studentMap.keys()];
  const bioProfiles = allEmails.length
    ? await BiometricProfile.find({ user_email: { $in: allEmails } }, 'user_email consent_given').lean()
    : [];
  const bioSet = new Set(bioProfiles.map((b) => b.user_email.toLowerCase()));

  const roster = allEmails.map((em) => {
    const st = studentMap.get(em);
    const rec = recordByEmail.get(em);
    const lv = leaveByEmail.get(em);
    const defaultStatus = lv ? 'Approved leave' : 'Absent';
    return {
      id: st._id ? st._id.toString() : em,
      email: em,
      name: st.full_name || em.split('@')[0],
      full_name: st.full_name || em.split('@')[0],
      usn: st.usn || st.student_id || st.roll_number || '',
      student_id: st.student_id || st.roll_number || st.usn || null,
      roll_number: st.roll_number || st.student_id || null,
      department: st.department || null,
      semester: st.semester || null,
      section: st.section || null,
      avatar_url: st.profilePhotoUrl || st.avatar_url || null,
      status: rec ? rec.status : defaultStatus,
      recorded: Boolean(rec),
      verified_by: rec ? rec.verified_by : (lv ? 'leave' : 'unmarked'),
      confidence: rec?.confidence ?? null,
      timestamp: rec?.timestamp || null,
      verification_time: rec?.timestamp ? new Date(rec.timestamp).toISOString() : null,
      reason: rec?.reason || rec?.remarks || null,
      marked_by: rec?.marked_by || null,
      is_finalised: Boolean(rec?.is_finalised || session.status === 'finalised'),
      biometric_enrolled: Boolean(st.biometric_registered || bioSet.has(em)),
      approved_leave: lv ? { id: lv._id.toString(), category: lv.category, start_date: lv.start_date, end_date: lv.end_date } : null,
      edit_history: rec?.edit_history || [],
    };
  }).sort((a, b) => a.full_name.localeCompare(b.full_name));

  const tally = tallyRecords(records, ctx.policy);
  const status = getEffectiveSessionStatus(session);

  return {
    session: {
      id: session._id.toString(),
      subject: session.subject,
      subject_code: session.subject_code || null,
      section: session.section || null,
      semester: session.semester || null,
      room: session.room || null,
      status,
      is_active: Boolean(session.is_active),
      start_time: session.start_time,
      expires_at: session.expires_at || null,
      remaining_seconds: computeRemainingSeconds(session),
      duration: session.duration,
      duration_minutes: session.duration_minutes || 60,
      extended_minutes: session.extended_minutes || 0,
      qr_rotation_seconds: session.qr_rotation_seconds || 15,
      qr_epoch: session.qr_epoch || 1,
      verification_methods: session.verification_methods || ['qr', 'face', 'manual'],
      finalised_at: session.finalised_at || null,
      closed_at: session.closed_at || null,
      cancellation_reason: session.cancellation_reason || null,
    },
    counts: {
      enrolled: roster.length,
      present: tally.attended,
      absent: roster.filter((r) => r.status.toLowerCase() === 'absent').length,
      late: tally.late,
      excused: tally.excused,
      leave: tally.leave,
      pending: tally.pending,
      manual: records.filter((r) => r.verified_by === 'manual').length,
      face: records.filter((r) => r.verified_by === 'face' || r.verified_by === 'kiosk').length,
      qr: records.filter((r) => r.verified_by === 'qr').length,
      duplicate_attempts: session.telemetry?.duplicate_attempts || 0,
      failed_verifications: session.telemetry?.failed_verifications || 0,
    },
    students: roster,
  };
}

async function transitionSessionState({ sessionId, actorEmail, actorRole, action, reason, extendMinutes, autoMarkAbsent = false, reqIp = '127.0.0.1' }) {
  if (!mongoose.Types.ObjectId.isValid(sessionId)) {
    return { errorStatus: 400, detail: 'Invalid session ID.' };
  }
  const session = await Session.findById(sessionId);
  if (!session) return { errorStatus: 404, detail: 'Session not found.' };
  const canonicalSessionId = session._id.toString();

  const normalizedRole = String(actorRole || '').toLowerCase();
  const isSuperAdmin = normalizedRole === 'super_admin';
  const isAdmin = ['admin', 'super_admin'].includes(normalizedRole);
  const isOwner = String(session.teacher_id || '').toLowerCase() === String(actorEmail || '').toLowerCase();

  let crossInstitution = false;
  if (!isSuperAdmin && isAdmin && !isOwner) {
    const actor = await User.findOne({ email: String(actorEmail || '').trim().toLowerCase() }, 'college_id').lean();
    if (session.college_id && (!actor?.college_id || actor.college_id !== session.college_id)) {
      crossInstitution = true;
    }
  }

  if (crossInstitution || (!isAdmin && !isOwner)) {
    await AttendanceAuditLog.create({
      actor_email: actorEmail,
      college_id: session.college_id,
      role: actorRole,
      action: 'PERMISSION_DENIED',
      target_resource: `session:${canonicalSessionId}`,
      details: { attempted_action: action, ...(crossInstitution ? { reason: 'cross_institution' } : {}) },
      ip_address: reqIp,
    }).catch(() => {});
    return {
      errorStatus: 403,
      detail: crossInstitution
        ? 'Forbidden: cross-institution session control denied.'
        : 'Forbidden: you can only control your own sessions.',
    };
  }

  const currentStatus = getEffectiveSessionStatus(session);

  // Handle window extension separately with optimistic CAS retries to keep concurrent extensions atomic
  if (action === 'extend') {
    if (!['active', 'paused', 'resumed'].includes(currentStatus)) {
      return { errorStatus: 409, detail: `Cannot extend session in "${currentStatus}" state.` };
    }
    const mins = Math.min(120, Math.max(5, parseInt(extendMinutes || '15', 10) || 15));
    let extendedSession = null;
    let latestStatus = currentStatus;

    for (let attempt = 0; attempt < 5; attempt++) {
      const latest = attempt === 0 ? session : await Session.findById(canonicalSessionId);
      if (!latest) return { errorStatus: 404, detail: 'Session not found.' };
      latestStatus = getEffectiveSessionStatus(latest);
      if (!['active', 'paused', 'resumed'].includes(latestStatus)) {
        return { errorStatus: 409, detail: `Cannot extend session in "${latestStatus}" state.` };
      }

      const currentExpiry = latest.expires_at
        ? new Date(latest.expires_at)
        : new Date(new Date(latest.start_time || Date.now()).getTime() + (latest.duration_minutes || 60) * 60000);
      const nextExpiry = new Date(Math.max(Date.now(), currentExpiry.getTime()) + mins * 60000);
      const nextExtended = (latest.extended_minutes || 0) + mins;
      const nextDuration = `${(latest.duration_minutes || 60) + nextExtended} min`;

      const condFilter = {
        _id: latest._id,
        is_active: true,
        ...(latest.status
          ? { status: latest.status }
          : { $or: [{ status: { $exists: false } }, { status: null }] }),
        ...(latest.extended_minutes != null
          ? { extended_minutes: latest.extended_minutes }
          : { $or: [{ extended_minutes: { $exists: false } }, { extended_minutes: null }] }),
        ...(latest.expires_at
          ? { expires_at: latest.expires_at }
          : { $or: [{ expires_at: { $exists: false } }, { expires_at: null }] }),
      };

      extendedSession = await Session.findOneAndUpdate(
        condFilter,
        {
          $set: {
            expires_at: nextExpiry,
            extended_minutes: nextExtended,
            duration: nextDuration,
          },
        },
        { new: true }
      );
      if (extendedSession) break;
    }

    if (!extendedSession) {
      return { errorStatus: 409, detail: 'Concurrent session modification conflict. Please retry.' };
    }

    await AttendanceAuditLog.create({
      actor_email: actorEmail,
      college_id: extendedSession.college_id,
      role: actorRole,
      action: 'SESSION_EXTENDED',
      target_resource: `session:${canonicalSessionId}`,
      details: { added_minutes: mins, expires_at: extendedSession.expires_at.toISOString() },
      ip_address: reqIp,
    }).catch(() => {});

    return {
      success: true,
      session_id: canonicalSessionId,
      status: latestStatus,
      expires_at: extendedSession.expires_at.toISOString(),
      remaining_seconds: computeRemainingSeconds(extendedSession),
      message: `Session window extended by ${mins} minutes.`,
    };
  }

  const nextStatus = ACTION_TO_STATUS[String(action || '').toLowerCase()];
  if (!nextStatus) {
    return { errorStatus: 400, detail: `Unsupported session action: ${action}` };
  }

  const allowed = SESSION_TRANSITIONS[currentStatus] || new Set();
  if (!allowed.has(nextStatus)) {
    return {
      errorStatus: 409,
      detail: `Invalid session state transition from "${currentStatus}" to "${nextStatus}".`,
    };
  }

  const now = new Date();
  const sourceCondition = session.status
    ? { _id: session._id, status: session.status }
    : {
        _id: session._id,
        is_active: Boolean(session.is_active),
        $or: [{ status: { $exists: false } }, { status: null }],
      };

  const updateFields = {
    status: nextStatus,
    is_active: ['active', 'paused', 'resumed'].includes(nextStatus),
  };

  if (nextStatus === 'active') {
    const startingFromPreLive = ['scheduled', 'ready'].includes(currentStatus);
    const scheduledTime = session.scheduled_start ? new Date(session.scheduled_start) : null;
    const shouldRefreshStart = !session.start_time || (startingFromPreLive && (!scheduledTime || now.getTime() >= scheduledTime.getTime()));
    if (shouldRefreshStart) {
      updateFields.start_time = now;
      updateFields.expires_at = new Date(now.getTime() + (session.duration_minutes || 60) * 60000);
    } else if (!session.expires_at) {
      updateFields.expires_at = new Date(new Date(session.start_time).getTime() + (session.duration_minutes || 60) * 60000);
    }
  }
  if (nextStatus === 'paused') updateFields.paused_at = now;
  if (nextStatus === 'resumed') updateFields.resumed_at = now;
  if (nextStatus === 'closed') updateFields.closed_at = now;
  if (nextStatus === 'cancelled') {
    updateFields.cancelled_at = now;
    updateFields.cancellation_reason = typeof reason === 'string' && reason.trim()
      ? reason.trim().slice(0, 300)
      : 'Cancelled by instructor';
  }

  let savedSession = null;

  if (nextStatus === 'finalised') {
    // Move to recoverable 'under_review' intermediate state before running attendance writes
    const intermediateSession = await Session.findOneAndUpdate(
      sourceCondition,
      {
        $set: {
          status: 'under_review',
          is_active: false,
          closed_at: session.closed_at || now,
        },
      },
      { new: true }
    );
    if (!intermediateSession) {
      return { errorStatus: 409, detail: 'Session state changed concurrently; transition rejected.' };
    }

    if (autoMarkAbsent) {
      const detail = await getSessionDetailAndRoster(intermediateSession.teacher_id, 'admin', canonicalSessionId);
      if (!detail || detail.errorStatus || !Array.isArray(detail.students)) {
        return {
          errorStatus: detail?.errorStatus || 500,
          detail: detail?.detail || 'Failed to resolve session roster during finalisation.',
        };
      }
      const unrecorded = detail.students.filter((s) => !s.recorded);
      if (unrecorded.length > 0) {
        const occurrenceTimestamp = intermediateSession.start_time || intermediateSession.scheduled_start || now;
        const ops = unrecorded.map((s) => ({
          updateOne: {
            filter: { student_email: s.email, session_id: canonicalSessionId },
            update: {
              $setOnInsert: {
                student_email: s.email,
                session_id: canonicalSessionId,
                college_id: intermediateSession.college_id || undefined,
                subject: intermediateSession.subject,
                semester: intermediateSession.semester || undefined,
                status: s.approved_leave ? 'Approved leave' : 'Absent',
                verified_by: 'manual',
                marked_by: actorEmail,
                reason: s.approved_leave ? 'Approved leave auto-applied at finalisation' : 'Marked absent upon session finalisation',
                is_finalised: true,
                timestamp: occurrenceTimestamp,
                updated_at: now,
              },
            },
            upsert: true,
          },
        }));
        const bulkResult = await Attendance.bulkWrite(ops, { ordered: false });
        if (bulkResult && typeof bulkResult.hasWriteErrors === 'function' && bulkResult.hasWriteErrors()) {
          throw new Error('Partial failure while marking unrecorded students during session finalisation.');
        }
      }
    }

    await Attendance.updateMany(
      { session_id: canonicalSessionId },
      { $set: { is_finalised: true, updated_at: now } }
    );

    savedSession = await Session.findOneAndUpdate(
      { _id: intermediateSession._id, status: 'under_review' },
      {
        $set: {
          status: 'finalised',
          is_active: false,
          finalised_at: now,
          finalised_by: actorEmail,
          closed_at: intermediateSession.closed_at || now,
        },
      },
      { new: true }
    );
    if (!savedSession) {
      return { errorStatus: 409, detail: 'Session state changed concurrently; finalisation rejected.' };
    }
  } else {
    savedSession = await Session.findOneAndUpdate(
      sourceCondition,
      { $set: updateFields },
      { new: true }
    );
    if (!savedSession) {
      return { errorStatus: 409, detail: 'Session state changed concurrently; transition rejected.' };
    }
  }

  const auditActionMap = {
    ready: 'SESSION_READY',
    active: 'SESSION_STARTED',
    paused: 'SESSION_PAUSED',
    resumed: 'SESSION_RESUMED',
    closed: 'SESSION_CLOSED',
    cancelled: 'SESSION_CANCELLED',
    under_review: 'SESSION_UNDER_REVIEW',
    finalised: 'SESSION_FINALISED',
  };
  await AttendanceAuditLog.create({
    actor_email: actorEmail,
    college_id: savedSession.college_id,
    role: actorRole,
    action: auditActionMap[nextStatus] || 'SESSION_STATUS_UPDATED',
    target_resource: `session:${canonicalSessionId}`,
    details: { from: currentStatus, to: nextStatus, reason: reason || null },
    ip_address: reqIp,
  }).catch(() => {});

  // Real-time notify teacher socket
  notificationService.sendPersonalMessage(String(savedSession.teacher_id).toLowerCase(), {
    type: 'session_status',
    session_id: canonicalSessionId,
    status: nextStatus,
    is_active: savedSession.is_active,
    timestamp: now.toISOString(),
  }).catch(() => {});

  cache.invalidate('http:/analytics');
  cache.invalidate('http:/api/analytics');

  return {
    success: true,
    session_id: canonicalSessionId,
    previous_status: currentStatus,
    status: nextStatus,
    is_active: savedSession.is_active,
    remaining_seconds: computeRemainingSeconds(savedSession),
    message: `Session transitioned to ${nextStatus}.`,
  };
}

async function getTeacherStudentsRoster(teacherEmail, query = {}) {
  const ctx = await resolveTeacherContext(teacherEmail);
  if (!ctx) return { students: [], total: 0, page: 1, limit: 50, subjects: [], sections: [] };

  const { teacher, policy, teacherSessions, subjects } = ctx;
  const sessionIds = teacherSessions
    .filter((s) => !query.subject || String(s.subject).toLowerCase() === String(query.subject).toLowerCase())
    .map((s) => s._id.toString());

  const students = await getAuthorisedStudentsForTeacher(ctx, {
    search: query.search,
    section: query.section,
    semester: query.semester,
  });

  const emails = students.map((s) => s.email.toLowerCase());
  const todayIso = toDateKey(new Date());

  const [attendanceRecords, activeLeaves, pendingDisputes, bioProfiles] = await Promise.all([
    sessionIds.length && emails.length
      ? Attendance.find({ session_id: { $in: sessionIds }, student_email: { $in: emails } }).sort({ timestamp: -1 }).lean()
      : Promise.resolve([]),
    emails.length
      ? Leave.find({ user_id: { $in: emails }, status: 'Approved' }).lean()
      : Promise.resolve([]),
    emails.length
      ? AttendanceDispute.find({
        student_email: { $in: emails },
        status: { $in: ['Pending', 'Under Review', 'Clarification'] },
      }).lean()
      : Promise.resolve([]),
    emails.length
      ? BiometricProfile.find({ user_email: { $in: emails } }, 'user_email').lean()
      : Promise.resolve([]),
  ]);

  const recordsByStudent = new Map();
  for (const r of attendanceRecords) {
    const em = String(r.student_email).toLowerCase();
    if (!recordsByStudent.has(em)) recordsByStudent.set(em, []);
    recordsByStudent.get(em).push(r);
  }

  const leavesByStudent = new Map();
  for (const l of activeLeaves) {
    const em = String(l.user_id).toLowerCase();
    if (!leavesByStudent.has(em)) leavesByStudent.set(em, []);
    leavesByStudent.get(em).push(l);
  }

  const disputesByStudent = new Map();
  for (const d of pendingDisputes) {
    const em = String(d.student_email).toLowerCase();
    disputesByStudent.set(em, (disputesByStudent.get(em) || 0) + 1);
  }
  const bioSet = new Set(bioProfiles.map((b) => b.user_email.toLowerCase()));

  let rows = students.map((st) => {
    const em = st.email.toLowerCase();
    const recs = recordsByStudent.get(em) || [];
    const tally = tallyRecords(recs, policy);
    const targetMetrics = calculateTargetMetrics({
      attended: tally.attended,
      conducted: tally.conducted,
      target: policy.minPercentage,
    });
    const risk = evaluateRisk({
      attended: tally.attended,
      conducted: tally.conducted,
      target: policy.minPercentage,
      recentRecords: recs,
    });
    const stLeaves = leavesByStudent.get(em) || [];
    const activeLeaveToday = stLeaves.some((l) => l.start_date <= todayIso && l.end_date >= todayIso);
    const rate = tally.percentage ?? 0;

    return {
      id: st._id.toString(),
      email: em,
      full_name: st.full_name,
      student_id: st.student_id || st.roll_number || st.usn || null,
      roll_number: st.roll_number || st.student_id || null,
      department: st.department || null,
      semester: st.semester || null,
      section: st.section || null,
      avatar_url: st.profilePhotoUrl || st.avatar_url || null,
      present_count: tally.attended,
      total_count: tally.conducted,
      absent_count: tally.missed,
      late_count: tally.late,
      excused_count: tally.excused,
      attendance_rate: Math.round(rate),
      exact_rate: rate,
      last_seen: recs[0]?.timestamp ? new Date(recs[0].timestamp).toISOString() : null,
      risk_level: risk.riskLevel,
      consecutive_absences: risk.consecutiveAbsences,
      classes_needed: targetMetrics.classesNeeded,
      allowable_absences: targetMetrics.allowableAbsences,
      approved_leaves_count: stLeaves.length,
      has_active_leave: activeLeaveToday,
      pending_corrections: disputesByStudent.get(em) || 0,
      biometric_enrolled: Boolean(st.biometric_registered || bioSet.has(em)),
    };
  });

  if (query.status === 'at_risk') {
    rows = rows.filter((r) => r.total_count > 0 && r.exact_rate < policy.minPercentage);
  } else if (query.status === 'critical') {
    rows = rows.filter((r) => r.risk_level === 'Critical shortage');
  } else if (query.status === 'safe') {
    rows = rows.filter((r) => r.total_count === 0 || r.exact_rate >= policy.minPercentage);
  }

  const sortBy = String(query.sort || 'name');
  if (sortBy === 'rate') {
    rows.sort((a, b) => b.exact_rate - a.exact_rate);
  } else if (sortBy === 'rate_asc') {
    rows.sort((a, b) => a.exact_rate - b.exact_rate);
  } else if (sortBy === 'absences') {
    rows.sort((a, b) => b.consecutive_absences - a.consecutive_absences || b.absent_count - a.absent_count);
  } else {
    rows.sort((a, b) => a.full_name.localeCompare(b.full_name));
  }

  const sections = [...new Set(students.map((s) => s.section).filter(Boolean))];
  const semesters = [...new Set(students.map((s) => s.semester).filter(Boolean))];

  return {
    students: rows,
    total: rows.length,
    subjects,
    sections,
    semesters,
    policy_min_percentage: policy.minPercentage,
  };
}

async function getTeacherAnalyticsAndRisk(teacherEmail, filters = {}) {
  const ctx = await resolveTeacherContext(teacherEmail);
  if (!ctx) return null;

  const { teacher, policy, teacherSessions, subjects } = ctx;
  const filteredSessions = filters.subject
    ? teacherSessions.filter((s) => String(s.subject).toLowerCase() === String(filters.subject).toLowerCase())
    : teacherSessions;
  const sessionIds = filteredSessions.map((s) => s._id.toString());

  if (sessionIds.length === 0) {
    return {
      total_sessions: 0,
      present_marks: 0,
      face_scans: 0,
      qr_scans: 0,
      manual_scans: 0,
      avg_confidence: null,
      attendance_rate: 0,
      weekly_trends: [],
      monthly_trends: [],
      daily_trends: [],
      subject_breakdown: [],
      distribution: { excellent: 0, safe: 0, warning: 0, critical: 0 },
      month_comparison: { current_month: 0, previous_month: 0, delta: 0 },
      verification_failures: 0,
      leave_count: 0,
      dispute_count: 0,
      risk_students: [],
      subjects,
      policy_min_percentage: policy.minPercentage,
    };
  }

  const students = await getAuthorisedStudentsForTeacher(ctx);
  const studentMap = new Map(students.map((s) => [s.email.toLowerCase(), s]));
  const studentEmails = [...studentMap.keys()];

  const [records, notes, leavesCount, disputesCount, faceFailuresCount] = await Promise.all([
    Attendance.find({ session_id: { $in: sessionIds } }).sort({ timestamp: -1 }).lean(),
    InterventionNote.find({ teacher_email: ctx.cleanEmail }).sort({ created_at: -1 }).limit(200).lean(),
    studentEmails.length ? Leave.countDocuments({ user_id: { $in: studentEmails }, status: 'Approved' }) : 0,
    AttendanceDispute.countDocuments({ session_id: { $in: sessionIds } }),
    studentEmails.length
      ? FaceRecognitionMetrics.countDocuments({
        user_email: { $in: studentEmails },
        recognition_result: { $in: ['MISMATCH', 'NO_FACE', 'MULTIPLE_FACES', 'ERROR'] },
      })
      : 0,
  ]);

  const tally = tallyRecords(records, policy);
  const faceScans = records.filter((r) => r.verified_by === 'face' || r.verified_by === 'kiosk').length;
  const qrScans = records.filter((r) => r.verified_by === 'qr').length;
  const manualScans = records.filter((r) => r.verified_by === 'manual').length;
  const confList = records.map((r) => r.confidence).filter((c) => typeof c === 'number' && Number.isFinite(c));
  const avgConf = confList.length ? round2((confList.reduce((a, b) => a + b, 0) / confList.length) * 100) : null;

  // Weekly trends (8 weeks)
  const now = new Date();
  const weekBuckets = new Map();
  for (let w = 7; w >= 0; w--) {
    const start = new Date(now.getTime() - w * 7 * 86400000);
    const startIso = toDateKey(start);
    weekBuckets.set(w, { label: `W-${w === 0 ? 'Now' : w}`, startMs: start.getTime() - 7 * 86400000, endMs: start.getTime(), date: startIso, records: [] });
  }
  const dailyMap = new Map();
  for (let d = 13; d >= 0; d--) {
    const dt = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - d));
    const key = dt.toISOString().slice(0, 10);
    dailyMap.set(key, { date: key, records: [] });
  }
  const monthlyMap = new Map();
  for (let m = 5; m >= 0; m--) {
    const dt = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - m, 1));
    const key = dt.toISOString().slice(0, 7);
    monthlyMap.set(key, { month: key, label: dt.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }), records: [] });
  }

  const sessionById = new Map(filteredSessions.map((s) => [s._id.toString(), s]));
  const subjectBuckets = new Map();
  const recordsByStudent = new Map();

  for (const r of records) {
    const ts = r.timestamp ? new Date(r.timestamp) : null;
    if (ts) {
      const ms = ts.getTime();
      const dayKey = ts.toISOString().slice(0, 10);
      const monKey = ts.toISOString().slice(0, 7);
      if (dailyMap.has(dayKey)) dailyMap.get(dayKey).records.push(r);
      if (monthlyMap.has(monKey)) monthlyMap.get(monKey).records.push(r);
      for (const b of weekBuckets.values()) {
        if (ms > b.startMs && ms <= b.endMs) {
          b.records.push(r);
          break;
        }
      }
    }
    const sub = r.subject || sessionById.get(String(r.session_id))?.subject || 'Class';
    if (!subjectBuckets.has(sub)) subjectBuckets.set(sub, []);
    subjectBuckets.get(sub).push(r);

    const em = String(r.student_email).toLowerCase();
    if (!recordsByStudent.has(em)) recordsByStudent.set(em, []);
    recordsByStudent.get(em).push(r);
  }

  const weeklyTrends = [...weekBuckets.entries()].map(([idx, b]) => {
    const t = tallyRecords(b.records, policy);
    return {
      year: now.getUTCFullYear(),
      week: 8 - idx,
      label: b.label,
      present: t.attended,
      total: t.conducted,
      rate: t.percentage ?? 0,
    };
  });

  const dailyTrends = [...dailyMap.values()].map((d) => {
    const t = tallyRecords(d.records, policy);
    return { date: d.date, present: t.attended, total: t.conducted, rate: t.percentage ?? 0 };
  });

  const monthlyTrends = [...monthlyMap.values()].map((m) => {
    const t = tallyRecords(m.records, policy);
    return { month: m.month, label: m.label, present: t.attended, total: t.conducted, rate: t.percentage ?? 0 };
  });

  const curMon = monthlyTrends[monthlyTrends.length - 1]?.rate ?? 0;
  const prevMon = monthlyTrends[monthlyTrends.length - 2]?.rate ?? 0;

  const subjectBreakdown = [...subjectBuckets.entries()].map(([subject, recs]) => {
    const t = tallyRecords(recs, policy);
    return {
      subject,
      present: t.attended,
      conducted: t.conducted,
      absent: t.missed,
      late: t.late,
      rate: t.percentage ?? 0,
    };
  });

  // Risk intelligence & distribution
  const distribution = { excellent: 0, safe: 0, warning: 0, critical: 0 };
  const notesByStudent = new Map();
  for (const n of notes) {
    const em = n.student_email.toLowerCase();
    if (!notesByStudent.has(em)) notesByStudent.set(em, []);
    notesByStudent.get(em).push({
      id: n._id.toString(),
      action_taken: n.action_taken,
      note: n.note,
      subject: n.subject || null,
      created_at: n.created_at,
    });
  }

  const riskStudents = [];
  for (const [em, recs] of recordsByStudent.entries()) {
    const t = tallyRecords(recs, policy);
    const pct = t.percentage ?? 0;
    if (pct >= 90) distribution.excellent++;
    else if (pct >= policy.minPercentage) distribution.safe++;
    else if (pct >= Math.max(0, policy.minPercentage - 10)) distribution.warning++;
    else distribution.critical++;

    // Subject-wise breakdown for this student
    const subMap = new Map();
    for (const r of recs) {
      const sub = r.subject || sessionById.get(String(r.session_id))?.subject || 'Class';
      if (!subMap.has(sub)) subMap.set(sub, []);
      subMap.get(sub).push(r);
    }
    const studentSubjects = [...subMap.entries()].map(([subject, sRecs]) => {
      const stTally = tallyRecords(sRecs, policy);
      const tm = calculateTargetMetrics({
        attended: stTally.attended,
        conducted: stTally.conducted,
        target: policy.minPercentage,
      });
      return {
        subject,
        attended: stTally.attended,
        conducted: stTally.conducted,
        percentage: stTally.percentage,
        classesNeeded: tm.classesNeeded,
      };
    });

    const targetMetrics = calculateTargetMetrics({
      attended: t.attended,
      conducted: t.conducted,
      target: policy.minPercentage,
    });
    const risk = evaluateRisk({
      attended: t.attended,
      conducted: t.conducted,
      target: policy.minPercentage,
      recentRecords: recs,
      subjects: studentSubjects,
    });

    const st = studentMap.get(em);
    riskStudents.push({
      email: em,
      full_name: st?.full_name || em.split('@')[0],
      student_id: st?.student_id || st?.roll_number || st?.usn || null,
      department: st?.department || teacher.department || null,
      semester: st?.semester || null,
      attended: t.attended,
      conducted: t.conducted,
      attendance_rate: pct,
      risk_level: risk.riskLevel,
      trend_direction: risk.trendDirection,
      consecutive_absences: risk.consecutiveAbsences,
      classes_needed: targetMetrics.classesNeeded,
      allowable_absences: targetMetrics.allowableAbsences,
      possible: targetMetrics.possible,
      reasons: risk.reasons,
      recommendations: risk.recommendations,
      below_threshold_subjects: risk.belowThresholdSubjects,
      interventions: notesByStudent.get(em) || [],
    });
  }

  riskStudents.sort((a, b) => a.attendance_rate - b.attendance_rate);

  return {
    total_sessions: filteredSessions.length,
    present_marks: tally.attended,
    conducted_marks: tally.conducted,
    absent_marks: tally.missed,
    late_marks: tally.late,
    face_scans: faceScans,
    qr_scans: qrScans,
    manual_scans: manualScans,
    avg_confidence: avgConf,
    attendance_rate: tally.percentage ?? 0,
    weekly_trends: weeklyTrends,
    daily_trends: dailyTrends,
    monthly_trends: monthlyTrends,
    subject_breakdown: subjectBreakdown,
    distribution,
    month_comparison: {
      current_month: curMon,
      previous_month: prevMon,
      delta: round2(curMon - prevMon),
    },
    verification_failures: faceFailuresCount,
    leave_count: leavesCount,
    dispute_count: disputesCount,
    risk_students: riskStudents,
    subjects,
    policy_min_percentage: policy.minPercentage,
  };
}

async function generateTeacherReport(teacherEmail, query = {}) {
  const ctx = await resolveTeacherContext(teacherEmail);
  if (!ctx) return null;

  const { teacher, policy, teacherSessions } = ctx;
  const sessionIdsParam = typeof query.session_ids === 'string' && query.session_ids.trim()
    ? query.session_ids.split(',').filter((id) => mongoose.Types.ObjectId.isValid(id))
    : null;
  const subjectFilter = typeof query.subject === 'string' && query.subject.trim()
    ? query.subject.trim().toLowerCase()
    : null;

  const matchedSessions = teacherSessions.filter((s) => {
    if (sessionIdsParam && !sessionIdsParam.includes(s._id.toString())) return false;
    if (subjectFilter && String(s.subject || '').toLowerCase() !== subjectFilter) return false;
    return true;
  });
  const sessionIds = matchedSessions.map((s) => s._id.toString());
  const sessionById = new Map(matchedSessions.map((s) => [s._id.toString(), s]));

  const dateFilter = {};
  let periodFrom = null;
  let periodTo = null;
  if (query.start_date || query.end_date) {
    const from = query.start_date ? new Date(`${String(query.start_date).slice(0, 10)}T00:00:00.000Z`) : null;
    const to = query.end_date ? new Date(`${String(query.end_date).slice(0, 10)}T23:59:59.999Z`) : null;
    if (from && !Number.isNaN(from.getTime())) {
      dateFilter.$gte = from;
      periodFrom = from;
    }
    if (to && !Number.isNaN(to.getTime())) {
      dateFilter.$lte = to;
      periodTo = to;
    }
  }

  const periodSessions = (periodFrom || periodTo)
    ? matchedSessions.filter((s) => {
        const raw = s.start_time || s.scheduled_start;
        if (!raw) return false;
        const occ = new Date(raw);
        if (Number.isNaN(occ.getTime())) return false;
        if (periodFrom && occ < periodFrom) return false;
        if (periodTo && occ > periodTo) return false;
        return true;
      })
    : matchedSessions;

  const findQuery = { session_id: { $in: sessionIds } };
  if (Object.keys(dateFilter).length > 0) findQuery.timestamp = dateFilter;

  const records = sessionIds.length
    ? await Attendance.find(findQuery).sort({ timestamp: -1 }).lean()
    : [];

  const students = await getAuthorisedStudentsForTeacher(ctx);
  const studentMap = new Map(students.map((s) => [s.email.toLowerCase(), s]));

  const tally = tallyRecords(records, policy);
  const rows = records.map((r) => {
    const sess = sessionById.get(String(r.session_id));
    const st = studentMap.get(String(r.student_email).toLowerCase());
    const ts = r.timestamp ? new Date(r.timestamp) : new Date();
    return {
      date: ts.toISOString().split('T')[0],
      time: ts.toISOString().split('T')[1].slice(0, 5),
      student_email: r.student_email,
      student_name: st?.full_name || r.student_email.split('@')[0],
      student_id: st?.student_id || st?.roll_number || st?.usn || '-',
      subject: r.subject || sess?.subject || 'Class',
      room: sess?.room || '-',
      status: r.status,
      verified_by: r.verified_by,
      confidence: r.confidence != null ? `${Math.round(r.confidence * 100)}%` : '-',
      reason: r.reason || r.remarks || '-',
    };
  });

  return {
    report_type: String(query.type || 'attendance'),
    generated_at: new Date().toISOString(),
    disclaimer: 'Faculty-generated classroom attendance report — requires administrative certification for official institutional transcripts.',
    teacher: {
      name: teacher.full_name,
      email: teacher.email,
      department: teacher.department || null,
      designation: teacher.designation || null,
    },
    institution: {
      name: policy.collegeName || 'SmartFace Campus',
      code: policy.collegeCode || null,
      semester: policy.currentSemester,
      academic_year: policy.academicYear,
      min_percentage: policy.minPercentage,
    },
    period: {
      start_date: query.start_date || 'All time',
      end_date: query.end_date || 'Current',
    },
    summary: {
      total_sessions: periodSessions.length,
      total_marks: records.length,
      conducted_marks: tally.conducted,
      attendance_rate: tally.percentage ?? 0,
      present_count: tally.attended,
      absent_count: tally.missed,
      late_count: tally.late,
      excused_count: tally.excused,
      leave_count: tally.leave,
      face_scans: records.filter((r) => r.verified_by === 'face' || r.verified_by === 'kiosk').length,
      qr_scans: records.filter((r) => r.verified_by === 'qr').length,
      manual_scans: records.filter((r) => r.verified_by === 'manual').length,
    },
    rows,
  };
}

module.exports = {
  SESSION_TRANSITIONS,
  ALLOWED_MANUAL_STATUSES,
  normalizeManualStatus,
  resolveTeacherContext,
  getAuthorisedStudentsForTeacher,
  getEffectiveSessionStatus,
  computeRemainingSeconds,
  getTeacherDashboard,
  getTeacherSessions,
  getSessionDetailAndRoster,
  transitionSessionState,
  getTeacherStudentsRoster,
  getTeacherAnalyticsAndRisk,
  generateTeacherReport,
};
