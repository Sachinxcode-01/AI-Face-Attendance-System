'use strict';

const mongoose = require('mongoose');
const User = require('../models/User');
const College = require('../models/College');
const Session = require('../models/Session');
const Attendance = require('../models/Attendance');
const Timetable = require('../models/Timetable');
const Holiday = require('../models/Holiday');
const Leave = require('../models/Leave');
const AttendanceDispute = require('../models/AttendanceDispute');
const Notification = require('../models/Notification');
const BiometricProfile = require('../models/BiometricProfile');
const FaceRecognitionMetrics = require('../models/FaceRecognitionMetrics');
const {
  DEFAULT_POLICY,
  round2,
  classifyAttendanceStatus,
  tallyRecords,
  calculateTargetMetrics,
  estimateRecoveryDate,
  evaluateRisk,
} = require('./attendanceCalculator');

const SUBJECT_PALETTE = ['#10B981', '#6366F1', '#F59E0B', '#3B82F6', '#EC4899', '#8B5CF6', '#14B8A6'];

function toDateKey(date) {
  try {
    const d = new Date(date);
    return Number.isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
  } catch {
    return null;
  }
}

function buildTimetableKey(user) {
  if (!user) return null;
  if (user.department && user.semester) {
    return `${String(user.department).trim().toUpperCase()}_${String(user.semester).trim().toUpperCase()}_${String(user.section || 'A').trim().toUpperCase()}`;
  }
  return null;
}

async function getInstitutionPolicy(user) {
  let collegeDoc = null;
  const collegeRef = user?.college_id || user?.college;
  if (collegeRef && mongoose.connection.readyState === 1) {
    const orQuery = [{ code: String(collegeRef).toUpperCase() }, { name: String(collegeRef) }];
    if (mongoose.Types.ObjectId.isValid(collegeRef)) {
      orQuery.unshift({ _id: collegeRef });
    }
    collegeDoc = await College.findOne({ $or: orQuery }).lean().catch(() => null);
  }
  const p = collegeDoc?.attendance_policy || {};
  return {
    collegeName: collegeDoc?.name || user?.college || null,
    collegeCode: collegeDoc?.code || user?.college_id || null,
    minPercentage: typeof p.min_percentage === 'number' ? p.min_percentage : DEFAULT_POLICY.minPercentage,
    approvedLeaveCountsAsPresent: Boolean(p.approved_leave_counts_as_present),
    excusedCountsAsPresent: p.excused_counts_as_present !== undefined ? Boolean(p.excused_counts_as_present) : DEFAULT_POLICY.excusedCountsAsPresent,
    lateCountsAsPresent: p.late_counts_as_present !== undefined ? Boolean(p.late_counts_as_present) : DEFAULT_POLICY.lateCountsAsPresent,
    disputeDeadlineDays: typeof p.dispute_deadline_days === 'number' ? p.dispute_deadline_days : 14,
    allowLeaveWithdrawal: p.allow_leave_withdrawal !== undefined ? Boolean(p.allow_leave_withdrawal) : true,
    timezone: p.timezone || 'Asia/Kolkata',
    academicYear: user?.academic_year || p.academic_year || '2026-2027',
    currentSemester: user?.semester || p.current_semester || 'Current Semester',
    semesterEndDate: p.semester_end_date ? new Date(p.semester_end_date).toISOString().split('T')[0] : null,
  };
}

function countRemainingScheduledClasses(timetableSlots, holidayDates, semesterEndDateStr) {
  if (!semesterEndDateStr || !Array.isArray(timetableSlots) || timetableSlots.length === 0) return null;
  const end = new Date(semesterEndDateStr);
  if (Number.isNaN(end.getTime())) return null;
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);
  if (end <= now) return 0;

  const dayMap = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
  const perDow = {};
  for (const s of timetableSlots) {
    if (s.is_cancelled) continue;
    const key = String(s.day || '').trim().slice(0, 3).toLowerCase();
    if (key in dayMap) {
      perDow[dayMap[key]] = (perDow[dayMap[key]] || 0) + 1;
    }
  }
  const holidays = new Set(holidayDates || []);
  let total = 0;
  const cursor = new Date(now);
  const maxDays = Math.min(200, Math.ceil((end - now) / 86400000));
  for (let i = 1; i <= maxDays; i++) {
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    const iso = cursor.toISOString().slice(0, 10);
    if (holidays.has(iso)) continue;
    total += perDow[cursor.getUTCDay()] || 0;
  }
  return total;
}

function parseSlotTimes(timeStr, baseDate = new Date()) {
  if (!timeStr || typeof timeStr !== 'string') return { start: null, end: null };
  const parts = timeStr.split('-').map((s) => s.trim());
  if (parts.length < 2) return { start: null, end: null };
  const parsePart = (tStr) => {
    const m12 = tStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (m12) {
      let hrs = parseInt(m12[1], 10);
      const mins = parseInt(m12[2], 10);
      const mer = m12[3].toUpperCase();
      if (mer === 'PM' && hrs < 12) hrs += 12;
      if (mer === 'AM' && hrs === 12) hrs = 0;
      const d = new Date(baseDate);
      d.setHours(hrs, mins, 0, 0);
      return d;
    }
    const m24 = tStr.match(/^(\d{1,2}):(\d{2})$/);
    if (m24) {
      const d = new Date(baseDate);
      d.setHours(parseInt(m24[1], 10), parseInt(m24[2], 10), 0, 0);
      return d;
    }
    return null;
  };
  return { start: parsePart(parts[0]), end: parsePart(parts[1]) };
}

function computeStreak(records, policy) {
  const presentDates = new Set();
  for (const r of records) {
    const cls = classifyAttendanceStatus(r.status, policy);
    if (cls.conducted && cls.attended && r.timestamp) {
      const key = toDateKey(r.timestamp);
      if (key) presentDates.add(key);
    }
  }
  if (presentDates.size === 0) return 0;

  const sortedDates = [...presentDates].sort((a, b) => (a < b ? 1 : -1));
  const todayKey = toDateKey(new Date());
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayKey = toDateKey(yesterday);

  if (sortedDates[0] !== todayKey && sortedDates[0] !== yesterdayKey) {
    return 0;
  }

  let streak = 0;
  let expected = new Date(`${sortedDates[0]}T00:00:00.000Z`);
  for (let i = 0; i < 60; i++) {
    const dow = expected.getUTCDay();
    if (dow === 0 || dow === 6) {
      expected.setUTCDate(expected.getUTCDate() - 1);
      continue;
    }
    const key = toDateKey(expected);
    if (presentDates.has(key)) {
      streak++;
      expected.setUTCDate(expected.getUTCDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

async function getStudentAttendanceSummary(email, { targetPercentage } = {}) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  const user = await User.findOne({ email: cleanEmail }, '-password').lean();
  if (!user) return null;

  const policy = await getInstitutionPolicy(user);
  const effectiveTarget = targetPercentage != null ? Number(targetPercentage) : policy.minPercentage;
  const ttKey = buildTimetableKey(user);

  const ttQuery = ttKey
    ? { $or: [{ user_id: ttKey }, { user_id: cleanEmail.toUpperCase() }] }
    : { user_id: cleanEmail.toUpperCase() };

  const [
    records,
    disputes,
    leaves,
    unreadNotifications,
    timetableSlots,
    holidays,
    bioProfile,
    recentFaceMetrics,
  ] = await Promise.all([
    Attendance.find({ student_email: cleanEmail }).sort({ timestamp: -1 }).lean(),
    AttendanceDispute.find({ student_email: cleanEmail }).sort({ created_at: -1 }).lean(),
    Leave.find({ user_id: cleanEmail }).sort({ created_at: -1 }).lean(),
    Notification.countDocuments({ user_id: cleanEmail, is_read: { $ne: true } }),
    Timetable.find(ttQuery).lean(),
    Holiday.find({}).sort({ date: 1 }).lean(),
    BiometricProfile.findOne({ user_email: cleanEmail }, '-embedding').lean(),
    FaceRecognitionMetrics.findOne(user.college_id ? { college_id: user.college_id } : {}).sort({ created_at: -1 }).lean().catch(() => null),
  ]);

  const sessionIds = [...new Set(records.map((r) => r.session_id).filter((id) => mongoose.Types.ObjectId.isValid(id)))];
  const sessions = sessionIds.length
    ? await Session.find({ _id: { $in: sessionIds } }).lean()
    : [];
  const sessionById = new Map(sessions.map((s) => [s._id.toString(), s]));

  const teacherEmails = [...new Set(sessions.map((s) => s.teacher_id).filter(Boolean))];
  const teachers = teacherEmails.length
    ? await User.find({ email: { $in: teacherEmails } }, 'email full_name').lean()
    : [];
  const teacherNameByEmail = new Map(teachers.map((t) => [t.email.toLowerCase(), t.full_name]));

  const disputeBySession = new Map();
  for (const d of disputes) {
    if (!disputeBySession.has(d.session_id)) {
      disputeBySession.set(d.session_id, d);
    }
  }

  const holidayDates = holidays.map((h) => toDateKey(h.date)).filter(Boolean);
  const holidaySet = new Set(holidayDates);

  // Enrich records and group by subject
  const subjectGroups = new Map();
  const enrichedRecords = records.map((r, idx) => {
    const sess = sessionById.get(String(r.session_id));
    const subjectName = r.subject || sess?.subject || 'Class Session';
    const facultyEmail = sess?.teacher_id || '';
    const facultyName = (facultyEmail && teacherNameByEmail.get(facultyEmail.toLowerCase())) || facultyEmail || 'Faculty';
    const dispute = disputeBySession.get(String(r.session_id));
    const ts = r.timestamp ? new Date(r.timestamp) : new Date();

    if (!subjectGroups.has(subjectName)) {
      subjectGroups.set(subjectName, {
        subject: subjectName,
        records: [],
        facultyName,
        subjectCode: '',
      });
    }
    subjectGroups.get(subjectName).records.push(r);

    return {
      id: r._id.toString(),
      receipt_id: r.receipt_id || `ATT-${r._id.toString().slice(-6).toUpperCase()}`,
      session_id: String(r.session_id),
      subject: subjectName,
      subject_code: '',
      faculty_name: facultyName,
      room: sess?.room || 'Campus Room',
      date: toDateKey(ts),
      time: ts.toISOString().slice(11, 16),
      scheduled_time: sess?.duration || null,
      registration_time: ts.toISOString(),
      status: r.status || 'Present',
      verified_by: r.verified_by || 'qr',
      confidence: typeof r.confidence === 'number' ? r.confidence : null,
      correction_status: dispute ? dispute.status : null,
      remarks: r.remarks || dispute?.remarks || null,
      semester: r.semester || policy.currentSemester,
      updated_at: (r.updated_at || ts).toISOString(),
    };
  });

  // Match subject_code from timetable if available
  const ttBySubject = new Map();
  for (const slot of timetableSlots) {
    if (slot.subject && !ttBySubject.has(slot.subject)) {
      ttBySubject.set(slot.subject, slot);
    }
  }
  for (const rec of enrichedRecords) {
    const slot = ttBySubject.get(rec.subject);
    if (slot) {
      rec.subject_code = slot.subject_code || '';
      if (rec.faculty_name === 'Faculty' && slot.faculty_name) {
        rec.faculty_name = slot.faculty_name;
      }
    }
  }

  // Overall tally & subject breakdown
  const overallTally = tallyRecords(records, policy);
  const remainingTotal = countRemainingScheduledClasses(timetableSlots, holidayDates, policy.semesterEndDate);
  const overallForecast = calculateTargetMetrics({
    attended: overallTally.attended,
    conducted: overallTally.conducted,
    target: effectiveTarget,
    remainingClasses: remainingTotal,
  });

  const subjects = [];
  let colorIdx = 0;
  for (const [subjectName, group] of subjectGroups.entries()) {
    const t = tallyRecords(group.records, policy);
    const slotMeta = ttBySubject.get(subjectName);
    const subDays = timetableSlots.filter((s) => s.subject === subjectName && !s.is_cancelled).map((s) => s.day);
    const subRemaining = countRemainingScheduledClasses(
      timetableSlots.filter((s) => s.subject === subjectName),
      holidayDates,
      policy.semesterEndDate
    );
    const metrics = calculateTargetMetrics({
      attended: t.attended,
      conducted: t.conducted,
      target: effectiveTarget,
      remainingClasses: subRemaining,
    });
    const recoveryDate = metrics.classesNeeded && metrics.classesNeeded > 0
      ? estimateRecoveryDate({
          classesNeeded: metrics.classesNeeded,
          scheduledDays: subDays,
          holidayDates,
        })
      : null;

    subjects.push({
      subject: subjectName,
      subject_code: slotMeta?.subject_code || '',
      faculty_name: slotMeta?.faculty_name || group.facultyName,
      attended: t.attended,
      present: t.attended,
      conducted: t.conducted,
      total: t.conducted,
      missed: t.missed,
      late: t.late,
      excused: t.excused,
      cancelled: t.cancelled,
      percentage: t.percentage !== null ? t.percentage : 0,
      has_records: t.conducted > 0,
      eligible: metrics.eligible,
      classes_needed: metrics.classesNeeded,
      allowable_absences: metrics.allowableAbsences,
      possible: metrics.possible,
      achievable_before_semester_end: metrics.achievableBeforeSemesterEnd,
      estimated_recovery_date: recoveryDate,
      status_note: metrics.statusNote,
      color: SUBJECT_PALETTE[colorIdx++ % SUBJECT_PALETTE.length],
    });
  }

  const allScheduledDays = timetableSlots.filter((s) => !s.is_cancelled).map((s) => s.day);
  const overallRecoveryDate = overallForecast.classesNeeded && overallForecast.classesNeeded > 0
    ? estimateRecoveryDate({
        classesNeeded: overallForecast.classesNeeded,
        scheduledDays: allScheduledDays,
        holidayDates,
      })
    : null;

  const risk = evaluateRisk({
    attended: overallTally.attended,
    conducted: overallTally.conducted,
    target: effectiveTarget,
    recentRecords: records,
    subjects: subjects.map((s) => ({
      subject: s.subject,
      conducted: s.conducted,
      percentage: s.has_records ? s.percentage : null,
      classesNeeded: s.classes_needed,
    })),
    remainingClasses: remainingTotal,
  });

  // Weekly & Monthly trends from real records
  const now = new Date();
  const weeklyTrends = [];
  for (let i = 6; i >= 0; i--) {
    const startOfWeek = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    startOfWeek.setUTCHours(0, 0, 0, 0);
    startOfWeek.setUTCDate(startOfWeek.getUTCDate() - startOfWeek.getUTCDay());
    const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000);
    const weekRecs = records.filter((r) => {
      const ts = new Date(r.timestamp);
      return ts >= startOfWeek && ts < endOfWeek;
    });
    const t = tallyRecords(weekRecs, policy);
    weeklyTrends.push({
      label: `Wk ${7 - i}`,
      week: `Wk ${7 - i}`,
      attended: t.attended,
      present: t.attended,
      total: t.conducted,
      percentage: t.percentage ?? 0,
      rate: t.percentage ?? 0,
    });
  }

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyTrends = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i + 1, 1));
    const mRecs = records.filter((r) => {
      const ts = new Date(r.timestamp);
      return ts >= d && ts < end;
    });
    const t = tallyRecords(mRecs, policy);
    monthlyTrends.push({
      label: monthNames[d.getUTCMonth()],
      month: monthNames[d.getUTCMonth()],
      attended: t.attended,
      total: t.conducted,
      percentage: t.percentage ?? 0,
      rate: t.percentage ?? 0,
    });
  }

  // Today's timetable & status
  const todayIso = toDateKey(now);
  const isTodayHoliday = holidaySet.has(todayIso);
  const todayDayLong = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()];
  const todayDayShort = todayDayLong.slice(0, 3);
  const todaySlots = timetableSlots
    .filter((s) => {
      const sDay = String(s.day || '').trim().toLowerCase();
      return sDay === todayDayLong.toLowerCase() || sDay.slice(0, 3) === todayDayShort.toLowerCase();
    })
    .map((s) => {
      const { start, end } = parseSlotTimes(s.time, now);
      let computedStatus = 'upcoming';
      if (s.is_cancelled) computedStatus = 'cancelled';
      else if (start && end) {
        if (now >= start && now <= end) computedStatus = 'live';
        else if (now > end) computedStatus = 'completed';
      }
      const todayRec = enrichedRecords.find((r) => r.date === todayIso && r.subject === s.subject);
      return {
        id: s._id.toString(),
        subject: s.subject,
        subject_code: s.subject_code || '',
        day: s.day,
        time: s.time,
        room: s.room || 'TBA',
        professor: s.substitute_faculty || s.faculty_name || s.teacher_email || 'Faculty',
        session_type: s.session_type || 'lecture',
        status: computedStatus,
        is_cancelled: Boolean(s.is_cancelled),
        cancellation_reason: s.cancellation_reason || '',
        rescheduled_to: s.rescheduled_to || '',
        today_attendance_status: todayRec ? todayRec.status : (isTodayHoliday ? 'Holiday' : null),
      };
    });

  const todayRecords = enrichedRecords.filter((r) => r.date === todayIso);
  const todayTally = tallyRecords(records.filter((r) => toDateKey(r.timestamp) === todayIso), policy);

  const pendingLeaves = leaves.filter((l) => ['Pending', 'Under Review', 'Clarification'].includes(l.status)).length;
  const pendingDisputes = disputes.filter((d) => ['Pending', 'Under Review'].includes(d.status)).length;

  const streak = computeStreak(records, policy);

  // Determine standing & health score from real data
  let standing = 'No Records';
  let healthScore = 100;
  if (overallTally.conducted > 0) {
    const pct = overallTally.percentage;
    healthScore = Math.max(0, Math.min(100, Math.round(pct - overallTally.late * 1.5 - risk.consecutiveAbsences * 4)));
    if (pct >= 90) standing = 'Excellent';
    else if (pct >= policy.minPercentage) standing = 'Good';
    else if (pct >= Math.max(0, policy.minPercentage - 15)) standing = 'Warning';
    else standing = 'Critical';
  }

  const faceRecords = records.filter((r) => r.verified_by === 'face' && typeof r.confidence === 'number');
  const studentFaceAvg = faceRecords.length > 0
    ? round2((faceRecords.reduce((s, r) => s + r.confidence, 0) / faceRecords.length) * 100)
    : null;
  const biometricAccuracy = recentFaceMetrics?.accuracy != null
    ? round2(recentFaceMetrics.accuracy <= 1 ? recentFaceMetrics.accuracy * 100 : recentFaceMetrics.accuracy)
    : studentFaceAvg;

  const riskAlerts = [];
  if (overallTally.conducted === 0) {
    riskAlerts.push({
      type: 'info',
      message: 'No conducted classes recorded yet. Check in when your first session begins.',
    });
  } else {
    for (const reason of risk.reasons) {
      riskAlerts.push({
        type: risk.riskLevel === 'Critical shortage' ? 'critical' : risk.riskLevel === 'At risk' || risk.riskLevel === 'Attention required' ? 'warning' : 'info',
        message: reason,
      });
    }
  }

  return {
    student: {
      id: user._id.toString(),
      name: user.full_name,
      email: user.email,
      student_id: user.student_id || user.roll_number || user.usn || null,
      roll_number: user.roll_number || user.student_id || null,
      usn: user.usn || null,
      department: user.department || null,
      course: user.course || null,
      semester: policy.currentSemester,
      section: user.section || null,
      academic_year: policy.academicYear,
      college: policy.collegeName,
      college_id: policy.collegeCode,
      biometric_registered: Boolean(user.biometric_registered || bioProfile),
    },
    policy,
    overall_attendance: overallTally.percentage,
    percentage: overallTally.percentage,
    total_percentage: overallTally.percentage ?? 0,
    total_present: overallTally.attended,
    total_conducted: overallTally.conducted,
    total_classes: overallTally.conducted,
    total_missed: overallTally.missed,
    total_late: overallTally.late,
    total_excused: overallTally.excused,
    total_cancelled: overallTally.cancelled,
    total_pending: overallTally.pending,
    streak,
    health_score: healthScore,
    standing,
    eligible: overallForecast.eligible,
    biometric_accuracy: biometricAccuracy,
    subjects,
    recent_logs: enrichedRecords.slice(0, 10),
    weekly_trends: weeklyTrends,
    monthly_trends: monthlyTrends,
    today_status: {
      date: todayIso,
      is_holiday: isTodayHoliday,
      scheduled_count: todaySlots.length,
      attended_count: todayTally.attended,
      missed_count: todayTally.missed,
      records: todayRecords,
    },
    today_classes: todaySlots,
    upcoming_classes: todaySlots.filter((s) => s.status === 'upcoming' || s.status === 'live'),
    counts: {
      pending_leaves: pendingLeaves,
      pending_disputes: pendingDisputes,
      unread_notifications: unreadNotifications,
    },
    forecast: {
      ...overallForecast,
      estimated_recovery_date: overallRecoveryDate,
    },
    risk,
    risk_alerts: riskAlerts,
    last_synced_at: new Date().toISOString(),
  };
}

async function getStudentAttendanceHistory(email, query = {}) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  const summaryData = await getStudentAttendanceSummary(cleanEmail);
  if (!summaryData) return null;

  // Fetch all enriched records using summary helper logic
  const user = await User.findOne({ email: cleanEmail }, '-password').lean();
  const policy = summaryData.policy;
  const records = await Attendance.find({ student_email: cleanEmail }).sort({ timestamp: -1 }).lean();

  const sessionIds = [...new Set(records.map((r) => r.session_id).filter((id) => mongoose.Types.ObjectId.isValid(id)))];
  const sessions = sessionIds.length ? await Session.find({ _id: { $in: sessionIds } }).lean() : [];
  const sessionById = new Map(sessions.map((s) => [s._id.toString(), s]));

  const teacherEmails = [...new Set(sessions.map((s) => s.teacher_id).filter(Boolean))];
  const teachers = teacherEmails.length ? await User.find({ email: { $in: teacherEmails } }, 'email full_name').lean() : [];
  const teacherNameByEmail = new Map(teachers.map((t) => [t.email.toLowerCase(), t.full_name]));

  const disputes = await AttendanceDispute.find({ student_email: cleanEmail }).sort({ created_at: -1 }).lean();
  const disputeBySession = new Map();
  for (const d of disputes) {
    if (!disputeBySession.has(d.session_id)) disputeBySession.set(d.session_id, d);
  }

  const ttKey = buildTimetableKey(user);
  const ttSlots = ttKey ? await Timetable.find({ user_id: ttKey }).lean() : [];
  const ttBySubject = new Map(ttSlots.map((s) => [s.subject, s]));

  let mapped = records.map((r) => {
    const sess = sessionById.get(String(r.session_id));
    const subjectName = r.subject || sess?.subject || 'Class Session';
    const slotMeta = ttBySubject.get(subjectName);
    const facultyEmail = sess?.teacher_id || slotMeta?.teacher_email || '';
    const facultyName = (facultyEmail && teacherNameByEmail.get(facultyEmail.toLowerCase())) || slotMeta?.faculty_name || facultyEmail || 'Faculty';
    const dispute = disputeBySession.get(String(r.session_id));
    const ts = r.timestamp ? new Date(r.timestamp) : new Date();

    return {
      id: r._id.toString(),
      receipt_id: r.receipt_id || `ATT-${r._id.toString().slice(-6).toUpperCase()}`,
      session_id: String(r.session_id),
      subject: subjectName,
      subject_code: slotMeta?.subject_code || '',
      faculty_name: facultyName,
      room: sess?.room || slotMeta?.room || 'Campus Room',
      date: toDateKey(ts),
      time: ts.toISOString().slice(11, 16),
      scheduled_time: slotMeta?.time || sess?.duration || null,
      registration_time: ts.toISOString(),
      status: r.status || 'Present',
      verified_by: r.verified_by || 'qr',
      confidence: typeof r.confidence === 'number' ? r.confidence : null,
      correction_status: dispute ? dispute.status : null,
      correction_id: dispute ? dispute._id.toString() : null,
      remarks: r.remarks || dispute?.remarks || null,
      semester: r.semester || policy.currentSemester,
      updated_at: (r.updated_at || ts).toISOString(),
    };
  });

  // Apply filters
  const { status, subject, semester, start_date, end_date, month, search } = query;
  if (status && status !== 'all') {
    const target = String(status).toLowerCase();
    mapped = mapped.filter((r) => {
      const s = (r.status || '').toLowerCase();
      const m = (r.verified_by || '').toLowerCase();
      if (target === 'verified_face') return m === 'face' && s !== 'absent';
      if (target === 'verified_qr') return m === 'qr' && s !== 'absent';
      return s === target;
    });
  }
  if (subject && subject !== 'all') {
    const subLower = String(subject).toLowerCase();
    mapped = mapped.filter((r) => r.subject.toLowerCase() === subLower);
  }
  if (semester && semester !== 'all') {
    const semLower = String(semester).toLowerCase();
    mapped = mapped.filter((r) => (r.semester || '').toLowerCase() === semLower);
  }
  if (month) {
    mapped = mapped.filter((r) => r.date && r.date.startsWith(String(month)));
  }
  if (start_date) {
    mapped = mapped.filter((r) => r.date && r.date >= String(start_date));
  }
  if (end_date) {
    mapped = mapped.filter((r) => r.date && r.date <= String(end_date));
  }
  if (search) {
    const q = String(search).toLowerCase();
    mapped = mapped.filter((r) =>
      r.subject.toLowerCase().includes(q) ||
      r.subject_code.toLowerCase().includes(q) ||
      r.faculty_name.toLowerCase().includes(q) ||
      r.room.toLowerCase().includes(q) ||
      r.receipt_id.toLowerCase().includes(q)
    );
  }

  const page = Math.max(1, parseInt(query.page || '1', 10));
  const limit = Math.min(200, Math.max(1, parseInt(query.limit || '20', 10)));
  const total = mapped.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const paginated = mapped.slice((page - 1) * limit, page * limit);

  return {
    total,
    page,
    limit,
    total_pages: totalPages,
    logs: paginated,
    records: paginated,
    all_subjects: [...new Set(summaryData.subjects.map((s) => s.subject))],
    all_semesters: [...new Set([policy.currentSemester, ...mapped.map((m) => m.semester).filter(Boolean)])],
    summary: {
      attended: summaryData.total_present,
      conducted: summaryData.total_conducted,
      missed: summaryData.total_missed,
      late: summaryData.total_late,
      excused: summaryData.total_excused,
      cancelled: summaryData.total_cancelled,
      percentage: summaryData.overall_attendance,
    },
    last_synced_at: new Date().toISOString(),
  };
}

module.exports = {
  getInstitutionPolicy,
  getStudentAttendanceSummary,
  getStudentAttendanceHistory,
  toDateKey,
  buildTimetableKey,
  parseSlotTimes,
};
