const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const User = require('../models/User');
const College = require('../models/College');
const Leave = require('../models/Leave');
const Timetable = require('../models/Timetable');
const Holiday = require('../models/Holiday');
const Announcement = require('../models/Announcement');
const AttendanceDispute = require('../models/AttendanceDispute');
const GuardianRelationship = require('../models/GuardianRelationship');
const ParentEnquiry = require('../models/ParentEnquiry');
const { authenticate, requireRole } = require('../middleware/auth');
const { MemoryRateLimiter } = require('../middleware/rateLimiter');
const reportInternalError = require('../utils/httpError');
const notificationService = require('../services/notificationService');
const { trackJob } = require('../utils/jobTracker');
const {
  getStudentAttendanceSummary,
  getStudentAttendanceHistory,
  getInstitutionPolicy,
  buildTimetableKeys,
  parseSlotTimes,
  toDateKey,
} = require('../services/studentAttendanceService');
const {
  getAuthorizedWards,
  authorizeWardAccess,
  createInvitation,
  redeemInvitation,
  syncLegacyUserLinks,
  invalidateParentCaches,
} = require('../services/guardianService');

const ALLOWED_REL_TYPES = ['father', 'mother', 'legal_guardian', 'authorized_guardian'];
const ALLOWED_LEAVE_CATEGORIES = ['Medical', 'Personal', 'Emergency', 'Family', 'Academic', 'Other'];

const linkRateLimiter = new MemoryRateLimiter(10, 900, 'parent-link');
const enquiryRateLimiter = new MemoryRateLimiter(10, 3600, 'parent-enquiry');

async function enforceLimiter(limiter, req, res) {
  const key = `${req.userEmail || req.ip}`;
  const check = await limiter.check(key);
  if (!check.allowed) {
    res.set('Retry-After', String(check.remainingSeconds || 60));
    res.status(429).json({ detail: 'Too many requests. Please wait before trying again.' });
    return false;
  }
  return true;
}

// ─── GET /parent/children - list active authorized wards ─────────────────────
router.get('/children', authenticate, requireRole(['parent', 'admin', 'super_admin']), async (req, res) => {
  try {
    const wards = await getAuthorizedWards(req.userEmail);
    res.json(wards);
  } catch (error) {
    reportInternalError(res, error, 'Parent:Children');
  }
});

// ─── GET /parent/relationships - list all guardian relationships & statuses ──
router.get('/relationships', authenticate, requireRole(['parent', 'student', 'admin', 'super_admin']), async (req, res) => {
  try {
    const role = (req.userRole || '').toLowerCase();
    const cleanEmail = String(req.userEmail || '').trim().toLowerCase();
    let filter = {};
    if (role === 'parent') {
      filter = { parent_email: cleanEmail };
    } else if (role === 'student') {
      filter = { student_email: cleanEmail };
    } else if (role !== 'super_admin') {
      const actor = await User.findOne({ email: cleanEmail }, 'college_id').lean();
      if (actor?.college_id) filter = { college_id: actor.college_id };
    }

    const rels = await GuardianRelationship.find(filter).sort({ updated_at: -1 }).limit(100).lean();
    const studentEmails = [...new Set(rels.map((r) => r.student_email))];
    const students = studentEmails.length
      ? await User.find(
          { email: { $in: studentEmails } },
          'email full_name student_id roll_number department semester college'
        ).lean()
      : [];
    const stMap = new Map(students.map((s) => [s.email.toLowerCase(), s]));

    res.json({
      relationships: rels.map((r) => {
        const st = stMap.get(r.student_email);
        return {
          id: r._id.toString(),
          parent_email: r.parent_email,
          student_email: r.student_email,
          student_name: st?.full_name || r.student_email,
          student_id: st?.student_id || st?.roll_number || '',
          department: st?.department || '',
          relationship_type: r.relationship_type,
          status: r.status,
          verification_method: r.verification_method,
          consent_granted: Boolean(r.consent_granted),
          permissions: r.permissions,
          approved_at: r.approved_at,
          revoked_at: r.revoked_at,
          expires_at: r.expires_at,
          created_at: r.created_at,
        };
      }),
    });
  } catch (error) {
    reportInternalError(res, error, 'Parent:Relationships');
  }
});

// ─── POST /parent/invitations - student/admin generates single-use code ──────
router.post('/invitations', authenticate, requireRole(['student', 'admin', 'super_admin', 'teacher', 'hod']), async (req, res) => {
  try {
    const role = (req.userRole || '').toLowerCase();
    const targetStudentEmail = role === 'student'
      ? req.userEmail
      : String(req.body?.student_email || '').trim().toLowerCase();

    if (!targetStudentEmail) {
      return res.status(400).json({ detail: 'student_email is required.' });
    }
    if (role !== 'student') {
      const authz = await authorizeWardAccess(req, targetStudentEmail);
      if (!authz.allowed) return res.status(403).json({ detail: authz.reason });
    }

    const relType = ALLOWED_REL_TYPES.includes(req.body?.relationship_type)
      ? req.body.relationship_type
      : 'legal_guardian';

    const inv = await createInvitation({
      studentEmail: targetStudentEmail,
      createdBy: req.userEmail,
      createdByRole: role,
      intendedParentEmail: req.body?.intended_parent_email,
      relationshipType: relType,
      ttlHours: Number(req.body?.ttl_hours) || 72,
    });

    res.status(201).json({ success: true, ...inv });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ detail: error.message });
    reportInternalError(res, error, 'Parent:CreateInvitation');
  }
});

// ─── POST /parent/invitations/redeem - parent redeems single-use code ────────
router.post('/invitations/redeem', authenticate, requireRole(['parent']), async (req, res) => {
  try {
    if (!(await enforceLimiter(linkRateLimiter, req, res))) return;
    const code = String(req.body?.code || '').trim();
    if (!code || code.length < 6 || code.length > 32) {
      return res.status(400).json({ detail: 'A valid guardian invitation code is required.' });
    }
    const relType = ALLOWED_REL_TYPES.includes(req.body?.relationship_type)
      ? req.body.relationship_type
      : undefined;

    const result = await redeemInvitation({
      parentEmail: req.userEmail,
      code,
      relationshipType: relType,
    });

    if (!result.ok) {
      return res.status(result.status || 400).json({ detail: result.detail });
    }

    res.json({
      success: true,
      message: `Guardian relationship verified for ${result.student.full_name}.`,
      student: {
        email: result.student.email,
        full_name: result.student.full_name,
        student_id: result.student.student_id || result.student.roll_number || '',
        department: result.student.department || '',
      },
    });
  } catch (error) {
    reportInternalError(res, error, 'Parent:RedeemInvitation');
  }
});

// ─── POST /parent/link-student - secure linking (code or verified request) ──
router.post('/link-student', authenticate, requireRole(['parent', 'admin', 'super_admin']), async (req, res) => {
  try {
    if (!(await enforceLimiter(linkRateLimiter, req, res))) return;

    const { invitation_code, student_email, student_id, relationship_type } = req.body || {};
    const relType = ALLOWED_REL_TYPES.includes(relationship_type) ? relationship_type : 'legal_guardian';

    if (invitation_code && String(invitation_code).trim()) {
      const redeemed = await redeemInvitation({
        parentEmail: req.userEmail,
        code: String(invitation_code).trim(),
        relationshipType: relType,
      });
      if (!redeemed.ok) {
        return res.status(redeemed.status || 400).json({ detail: redeemed.detail });
      }
      return res.json({
        success: true,
        status: 'active',
        message: `Ward ${redeemed.student.full_name} linked successfully via invitation code.`,
        student: {
          email: redeemed.student.email,
          full_name: redeemed.student.full_name,
          student_id: redeemed.student.student_id || redeemed.student.roll_number || '',
          department: redeemed.student.department || '',
        },
      });
    }

    if (!student_email && !student_id) {
      return res.status(400).json({ detail: 'An invitation code or student email is required.' });
    }

    const cleanParent = String(req.userEmail || '').trim().toLowerCase();
    const isAdmin = ['admin', 'super_admin'].includes(String(req.userRole || '').toLowerCase());

    const query = student_email
      ? { email: String(student_email).trim().toLowerCase(), role: 'student' }
      : { $or: [{ student_id: String(student_id).trim() }, { roll_number: String(student_id).trim() }], role: 'student' };

    const student = await User.findOne(query).lean();

    if (!student) {
      if (isAdmin) {
        return res.status(404).json({ detail: 'Student not found in institutional directory.' });
      }
      return res.status(202).json({
        success: true,
        status: 'pending_verification',
        message: 'Guardian verification request recorded. If the student record matches institutional records, an invitation or approval will be processed.',
      });
    }

    const parentUser = await User.findOne({ email: cleanParent }, 'college_id').lean();
    if (!isAdmin && parentUser?.college_id && student.college_id && parentUser.college_id !== student.college_id) {
      return res.status(202).json({
        success: true,
        status: 'pending_verification',
        message: 'Guardian verification request recorded. Institutional verification is required.',
      });
    }

    const studentConfirmsParent = Boolean(
      student.parent_details &&
      student.parent_details.trim().toLowerCase() === cleanParent
    );

    if (!isAdmin && !studentConfirmsParent) {
      const now = new Date();
      await GuardianRelationship.findOneAndUpdate(
        { parent_email: cleanParent, student_email: student.email.toLowerCase() },
        {
          $setOnInsert: {
            parent_email: cleanParent,
            student_email: student.email.toLowerCase(),
            college_id: student.college_id || parentUser?.college_id || undefined,
            relationship_type: relType,
            status: 'pending_approval',
            verification_method: 'admin_approval',
            consent_granted: false,
            created_at: now,
          },
          $set: { updated_at: now },
          $push: {
            audit_trail: {
              action: 'requested_link',
              actor: cleanParent,
              role: 'parent',
              note: 'Parent requested guardian relationship verification',
              timestamp: now,
            },
          },
        },
        { upsert: true }
      );

      return res.status(202).json({
        success: true,
        status: 'pending_approval',
        message: 'Guardian link request submitted for student or administrator approval.',
      });
    }

    const now = new Date();
    await GuardianRelationship.findOneAndUpdate(
      { parent_email: cleanParent, student_email: student.email.toLowerCase() },
      {
        $set: {
          college_id: student.college_id || parentUser?.college_id || undefined,
          relationship_type: relType,
          status: 'active',
          verification_method: isAdmin ? 'admin_approval' : 'student_confirmation',
          consent_granted: true,
          consent_granted_at: now,
          consent_granted_by: isAdmin ? cleanParent : student.email.toLowerCase(),
          approved_by: isAdmin ? cleanParent : student.email.toLowerCase(),
          approved_at: now,
          updated_at: now,
        },
        $unset: { revoked_at: '', revoked_by: '', revocation_reason: '' },
        $push: {
          audit_trail: {
            action: isAdmin ? 'admin_linked' : 'student_confirmed_link',
            actor: cleanParent,
            role: req.userRole,
            note: 'Guardian relationship activated',
            timestamp: now,
          },
        },
      },
      { upsert: true }
    );

    await syncLegacyUserLinks(cleanParent, student, true);
    invalidateParentCaches(cleanParent, student.email);

    return res.json({
      success: true,
      status: 'active',
      message: `Ward ${student.full_name} linked successfully.`,
      student: {
        email: student.email,
        full_name: student.full_name,
        student_id: student.student_id || student.roll_number || '',
        department: student.department || '',
      },
    });
  } catch (error) {
    reportInternalError(res, error, 'Parent:LinkStudent');
  }
});

// ─── POST /parent/relationships/:id/approve ──────────────────────────────────
router.post('/relationships/:id/approve', authenticate, requireRole(['student', 'admin', 'super_admin']), async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ detail: 'Invalid relationship ID.' });
    }
    const rel = await GuardianRelationship.findById(id);
    if (!rel) return res.status(404).json({ detail: 'Relationship not found.' });

    const role = (req.userRole || '').toLowerCase();
    const actorEmail = String(req.userEmail || '').toLowerCase();
    if (role === 'student' && rel.student_email !== actorEmail) {
      return res.status(403).json({ detail: 'Forbidden: you can only approve requests for your own account.' });
    }
    if (role === 'admin') {
      const actor = await User.findOne({ email: actorEmail }, 'college_id').lean();
      if (actor?.college_id && rel.college_id && actor.college_id !== rel.college_id) {
        return res.status(403).json({ detail: 'Cross-institution approval denied.' });
      }
    }

    const now = new Date();
    rel.status = 'active';
    rel.consent_granted = true;
    rel.consent_granted_at = now;
    rel.consent_granted_by = actorEmail;
    rel.approved_by = actorEmail;
    rel.approved_at = now;
    rel.updated_at = now;
    rel.audit_trail.push({
      action: 'approved',
      actor: actorEmail,
      role,
      note: 'Guardian relationship approved',
      timestamp: now,
    });
    await rel.save();

    const student = await User.findOne({ email: rel.student_email }, 'email full_name student_id roll_number').lean();
    if (student) await syncLegacyUserLinks(rel.parent_email, student, true);
    invalidateParentCaches(rel.parent_email, rel.student_email);

    res.json({ success: true, status: 'active' });
  } catch (error) {
    reportInternalError(res, error, 'Parent:ApproveRelationship');
  }
});

// ─── POST /parent/relationships/:id/revoke ───────────────────────────────────
router.post('/relationships/:id/revoke', authenticate, requireRole(['parent', 'student', 'admin', 'super_admin']), async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ detail: 'Invalid relationship ID.' });
    }
    const rel = await GuardianRelationship.findById(id);
    if (!rel) return res.status(404).json({ detail: 'Relationship not found.' });

    const role = (req.userRole || '').toLowerCase();
    const actorEmail = String(req.userEmail || '').toLowerCase();
    const isParentOwner = role === 'parent' && rel.parent_email === actorEmail;
    const isStudentOwner = role === 'student' && rel.student_email === actorEmail;
    const isAdmin = ['admin', 'super_admin'].includes(role);

    if (!isParentOwner && !isStudentOwner && !isAdmin) {
      return res.status(403).json({ detail: 'Forbidden: cannot revoke this relationship.' });
    }

    const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim().slice(0, 300) : 'Revoked by user';
    const now = new Date();
    rel.status = 'revoked';
    rel.revoked_by = actorEmail;
    rel.revoked_at = now;
    rel.revocation_reason = reason;
    rel.updated_at = now;
    rel.audit_trail.push({
      action: 'revoked',
      actor: actorEmail,
      role,
      note: reason,
      timestamp: now,
    });
    await rel.save();

    await syncLegacyUserLinks(rel.parent_email, { email: rel.student_email }, false);
    invalidateParentCaches(rel.parent_email, rel.student_email);

    trackJob(notificationService.sendRealTime(rel.parent_email, {
      event: 'guardian_relationship_revoked',
      student_email: rel.student_email,
      revoked_at: now.toISOString(),
    }));

    res.json({ success: true, status: 'revoked', student_email: rel.student_email });
  } catch (error) {
    reportInternalError(res, error, 'Parent:RevokeRelationship');
  }
});

// ─── GET /parent/child/dashboard/:email - unified real-time ward dashboard ───
router.get('/child/dashboard/:email', authenticate, requireRole(['parent', 'admin', 'super_admin']), async (req, res) => {
  try {
    const email = String(req.params.email || '').trim().toLowerCase();
    const authz = await authorizeWardAccess(req, email, 'view_attendance');
    if (!authz.allowed) {
      return res.status(403).json({ detail: authz.reason });
    }

    const [summary, history, leaves, disputes, studentUser] = await Promise.all([
      getStudentAttendanceSummary(email),
      getStudentAttendanceHistory(email, { limit: 15, page: 1 }),
      Leave.find({ user_id: email }).sort({ created_at: -1 }).limit(15).lean(),
      AttendanceDispute.find({ student_email: email }).sort({ created_at: -1 }).limit(15).lean(),
      User.findOne(
        { email, role: 'student' },
        'email full_name student_id usn roll_number college college_id department course semester section academic_year'
      ).lean(),
    ]);

    if (!summary || !studentUser) {
      return res.status(404).json({ detail: 'Linked student record not found.' });
    }

    const policy = await getInstitutionPolicy(studentUser);
    const keys = buildTimetableKeys(studentUser);
    const [slots, holidays] = await Promise.all([
      Timetable.find({ user_id: { $in: keys } }).lean(),
      Holiday.find().sort({ date: 1 }).lean(),
    ]);

    const now = new Date();
    const todayIso = toDateKey(now);
    const todayLong = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()];
    const todayShort = todayLong.slice(0, 3).toLowerCase();
    const holidayToday = holidays.find((h) => toDateKey(h.date) === todayIso) || null;

    const todaySchedule = slots
      .filter((s) => {
        const d = String(s.day || '').trim().toLowerCase();
        return d === todayLong.toLowerCase() || d.slice(0, 3) === todayShort;
      })
      .map((s) => {
        const { start, end } = parseSlotTimes(s.time, now);
        let status = 'upcoming';
        if (s.is_cancelled) status = 'cancelled';
        else if (start && end) {
          if (now >= start && now <= end) status = 'live';
          else if (now > end) status = 'completed';
        }
        return {
          id: s._id.toString(),
          subject: s.subject,
          subject_code: s.subject_code || '',
          time: s.time,
          room: s.room || 'TBA',
          session_type: s.session_type || 'lecture',
          is_cancelled: Boolean(s.is_cancelled),
          cancellation_reason: s.cancellation_reason || '',
          rescheduled_to: s.rescheduled_to || '',
          status,
        };
      });

    const annFilter = {
      status: 'published',
      $or: [{ expires_at: { $exists: false } }, { expires_at: null }, { expires_at: { $gt: now } }],
    };
    if (studentUser.college_id) annFilter.college_id = studentUser.college_id;
    const announcementsRaw = await Announcement.find(annFilter).sort({ pinned: -1, created_at: -1 }).limit(10).lean();
    const announcements = announcementsRaw.filter((a) => {
      if (a.department && studentUser.department && a.department.toLowerCase() !== studentUser.department.toLowerCase()) return false;
      if (a.target_section && studentUser.section && a.target_section.toLowerCase() !== studentUser.section.toLowerCase()) return false;
      return true;
    }).map((a) => ({
      id: a._id.toString(),
      title: a.title,
      message: a.message,
      category: a.category,
      priority: a.priority,
      pinned: Boolean(a.pinned),
      author_name: a.author_name || 'Institution',
      created_at: a.created_at,
    }));

    const recentRecords = history?.records || [];
    const todayRecords = recentRecords.filter((r) => r.date === todayIso);

    res.json({
      synced_at: now.toISOString(),
      student: summary.student,
      policy,
      today: {
        date: todayIso,
        is_holiday: Boolean(holidayToday),
        holiday_name: holidayToday?.name || holidayToday?.title || null,
        records: todayRecords,
        schedule: todaySchedule,
      },
      summary: {
        overall_attendance: summary.overall_attendance,
        standing: summary.standing,
        risk: summary.risk,
        forecast: summary.forecast,
        total_conducted: summary.total_conducted,
        total_present: summary.total_present,
        total_missed: summary.total_missed,
        total_late: summary.total_late,
        total_excused: summary.total_excused,
        total_leave: summary.total_leave,
        total_cancelled: summary.total_cancelled,
        consecutive_absences: summary.consecutive_absences,
        subjects: summary.subjects,
        weekly_trend: summary.weekly_trend || [],
        monthly_trend: summary.monthly_trend || [],
      },
      recent_activity: recentRecords.slice(0, 10),
      leaves: {
        pending_count: leaves.filter((l) => ['Pending', 'Under Review', 'Clarification'].includes(l.status)).length,
        approved_count: leaves.filter((l) => l.status === 'Approved').length,
        items: leaves.map((l) => ({ ...l, id: l._id.toString(), _id: undefined })),
      },
      disputes: disputes.map((d) => ({ ...d, id: d._id.toString(), _id: undefined })),
      announcements,
      upcoming_holidays: holidays.filter((h) => toDateKey(h.date) >= todayIso).slice(0, 5),
    });
  } catch (error) {
    reportInternalError(res, error, 'Parent:Dashboard');
  }
});

// ─── GET /parent/child/stats/:email - deterministic summary (backward-compatible)
router.get('/child/stats/:email', authenticate, requireRole(['parent', 'admin', 'super_admin']), async (req, res) => {
  try {
    const email = String(req.params.email || '').trim().toLowerCase();
    const authz = await authorizeWardAccess(req, email, 'view_attendance');
    if (!authz.allowed) {
      return res.status(403).json({ detail: authz.reason });
    }
    const summary = await getStudentAttendanceSummary(email);
    if (!summary) {
      return res.status(404).json({ detail: 'Student not found.' });
    }
    const overallRatio = summary.overall_attendance !== null ? Number((summary.overall_attendance / 100).toFixed(4)) : 0;
    const subjects = (summary.subjects || []).map((s) => ({
      subject: s.subject,
      subject_code: s.subject_code || '',
      present: s.attended,
      total: s.conducted,
      percentage: s.percentage,
      eligible: s.eligible,
      classes_needed: s.classes_needed,
      allowable_absences: s.allowable_absences,
      risk_level: s.risk_level,
    }));

    res.json({
      overall_percentage: overallRatio,
      overall_attendance: summary.overall_attendance,
      standing: summary.standing,
      risk: summary.risk,
      forecast: summary.forecast,
      total_conducted: summary.total_conducted,
      total_present: summary.total_present,
      total_missed: summary.total_missed,
      consecutive_absences: summary.consecutive_absences,
      subjects,
    });
  } catch (error) {
    reportInternalError(res, error, 'Parent:ChildStats');
  }
});

// ─── GET /parent/child/attendance-logs/:email - filtered & paginated logs ────
router.get('/child/attendance-logs/:email', authenticate, requireRole(['parent', 'admin', 'super_admin']), async (req, res) => {
  try {
    const email = String(req.params.email || '').trim().toLowerCase();
    const authz = await authorizeWardAccess(req, email, 'view_attendance');
    if (!authz.allowed) {
      return res.status(403).json({ detail: authz.reason });
    }

    const hasPaginationOrFilter = Boolean(
      req.query.page || req.query.subject || req.query.status || req.query.from || req.query.to || req.query.search || req.query.paginated
    );
    const history = await getStudentAttendanceHistory(email, req.query);
    if (!history) {
      return res.status(404).json({ detail: 'Student not found.' });
    }

    if (hasPaginationOrFilter) {
      return res.json(history);
    }

    const result = (history.records || []).slice(0, 20).map((r) => ({
      id: r.id,
      session_id: r.session_id,
      date: r.date,
      time: r.time,
      subject: r.subject,
      subject_code: r.subject_code,
      status: r.status,
      verifiedBy: r.verified_by,
      correction_status: r.correction_status,
      remarks: r.remarks,
    }));
    res.json(result);
  } catch (error) {
    reportInternalError(res, error, 'Parent:AttendanceLogs');
  }
});

// ─── GET /parent/child/timetable/:email - dynamic ward timetable ─────────────
router.get('/child/timetable/:email', authenticate, requireRole(['parent', 'admin', 'super_admin']), async (req, res) => {
  try {
    const email = String(req.params.email || '').trim().toLowerCase();
    const authz = await authorizeWardAccess(req, email, 'view_timetable');
    if (!authz.allowed) return res.status(403).json({ detail: authz.reason });

    const student = await User.findOne({ email, role: 'student' }, 'email college college_id department semester section').lean();
    if (!student) return res.status(404).json({ detail: 'Student not found.' });

    const policy = await getInstitutionPolicy(student);
    const keys = buildTimetableKeys(student);
    const [slots, holidays] = await Promise.all([
      Timetable.find({ user_id: { $in: keys } }).lean(),
      Holiday.find().sort({ date: 1 }).lean(),
    ]);

    res.json({
      timezone: policy.timezone,
      semester: policy.currentSemester,
      slots: slots.map((s) => ({
        id: s._id.toString(),
        day: s.day,
        time: s.time,
        subject: s.subject,
        subject_code: s.subject_code || '',
        room: s.room || 'TBA',
        session_type: s.session_type || 'lecture',
        is_cancelled: Boolean(s.is_cancelled),
        cancellation_reason: s.cancellation_reason || '',
        rescheduled_to: s.rescheduled_to || '',
      })),
      holidays: holidays.map((h) => ({
        id: h._id.toString(),
        date: toDateKey(h.date),
        name: h.name || h.title || 'Institutional Holiday',
      })),
    });
  } catch (error) {
    reportInternalError(res, error, 'Parent:Timetable');
  }
});

// ─── GET /parent/child/leaves/:email - leave history for a ward ──────────────
router.get('/child/leaves/:email', authenticate, requireRole(['parent', 'admin', 'super_admin']), async (req, res) => {
  try {
    const email = String(req.params.email || '').trim().toLowerCase();
    const authz = await authorizeWardAccess(req, email, 'view_leaves');
    if (!authz.allowed) {
      return res.status(403).json({ detail: authz.reason });
    }
    const leaves = await Leave.find({ user_id: email }).sort({ created_at: -1 }).lean();
    const result = leaves.map((l) => ({ ...l, id: l._id.toString(), _id: undefined }));
    res.json(result);
  } catch (error) {
    reportInternalError(res, error, 'Parent:Leaves');
  }
});

// ─── POST /parent/child/absence-notice - submit validated guardian leave ─────
router.post('/child/absence-notice', authenticate, requireRole(['parent', 'admin', 'super_admin']), async (req, res) => {
  try {
    const { childEmail, reason, date, start_date, end_date, category, document_url, document_name } = req.body || {};
    const cleanChild = String(childEmail || '').trim().toLowerCase();
    if (!cleanChild || typeof reason !== 'string' || reason.trim().length < 5 || reason.trim().length > 1000) {
      return res.status(400).json({ detail: 'Child email and a valid reason (5-1000 chars) are required.' });
    }
    const authz = await authorizeWardAccess(req, cleanChild, 'submit_leave');
    if (!authz.allowed) {
      return res.status(403).json({ detail: authz.reason });
    }

    const startDate = String(start_date || date || new Date().toISOString().split('T')[0]).trim();
    const endDate = String(end_date || startDate).trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      return res.status(400).json({ detail: 'Dates must be in YYYY-MM-DD format.' });
    }
    if (endDate < startDate) {
      return res.status(400).json({ detail: 'End date cannot be earlier than start date.' });
    }

    const overlapping = await Leave.findOne({
      user_id: cleanChild,
      status: { $in: ['Pending', 'Under Review', 'Clarification', 'Approved'] },
      start_date: { $lte: endDate },
      end_date: { $gte: startDate },
    }).lean();
    if (overlapping) {
      return res.status(409).json({
        detail: `An active leave application (${overlapping.start_date} to ${overlapping.end_date}) already overlaps these dates.`,
      });
    }

    const student = await User.findOne({ email: cleanChild }, 'college_id full_name').lean();
    const cleanCategory = ALLOWED_LEAVE_CATEGORIES.includes(category) ? category : 'Personal';

    const leave = await Leave.create({
      user_id: cleanChild,
      college_id: student?.college_id || undefined,
      category: cleanCategory,
      reason: `[Guardian Notice: ${req.userEmail}] ${reason.trim()}`,
      start_date: startDate,
      end_date: endDate,
      status: 'Pending',
      document_url: typeof document_url === 'string' && document_url.startsWith('/leave/document/') ? document_url : undefined,
      document_name: typeof document_name === 'string' ? document_name.slice(0, 120) : undefined,
      remarks: 'Submitted by authorized guardian',
      status_history: [{
        status: 'Pending',
        actor: req.userEmail,
        note: `Submitted by guardian (${cleanCategory})`,
      }],
    });

    trackJob(notificationService.createNotification(
      cleanChild,
      'Guardian Leave Application Submitted',
      `Your guardian submitted a ${cleanCategory} leave request for ${startDate}${endDate !== startDate ? ` to ${endDate}` : ''}.`,
      'leave',
      'Info',
      { leave_id: leave._id.toString() }
    ).catch(console.error));

    res.status(201).json({
      success: true,
      message: 'Absence notice recorded successfully.',
      leaveId: leave._id.toString(),
      leave: { ...leave.toObject(), id: leave._id.toString(), _id: undefined },
    });
  } catch (error) {
    reportInternalError(res, error, 'Parent:AbsenceNotice');
  }
});

// ─── POST /parent/child/leaves/:leaveId/withdraw ─────────────────────────────
router.post('/child/leaves/:leaveId/withdraw', authenticate, requireRole(['parent', 'admin', 'super_admin']), async (req, res) => {
  try {
    const { leaveId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(leaveId)) {
      return res.status(400).json({ detail: 'Invalid leave ID.' });
    }
    const leave = await Leave.findById(leaveId);
    if (!leave) return res.status(404).json({ detail: 'Leave application not found.' });

    const authz = await authorizeWardAccess(req, leave.user_id, 'submit_leave');
    if (!authz.allowed) return res.status(403).json({ detail: authz.reason });

    if (!['Pending', 'Under Review', 'Clarification'].includes(leave.status)) {
      return res.status(409).json({ detail: `Cannot withdraw a leave application in '${leave.status}' status.` });
    }

    leave.status = 'Withdrawn';
    leave.updated_at = new Date();
    leave.status_history.push({
      status: 'Withdrawn',
      actor: req.userEmail,
      note: 'Withdrawn by authorized guardian',
    });
    await leave.save();

    res.json({ success: true, status: 'Withdrawn' });
  } catch (error) {
    reportInternalError(res, error, 'Parent:WithdrawLeave');
  }
});

// ─── GET /parent/child/disputes/:email - ward correction requests ────────────
router.get('/child/disputes/:email', authenticate, requireRole(['parent', 'admin', 'super_admin']), async (req, res) => {
  try {
    const email = String(req.params.email || '').trim().toLowerCase();
    const authz = await authorizeWardAccess(req, email, 'view_attendance');
    if (!authz.allowed) return res.status(403).json({ detail: authz.reason });

    const disputes = await AttendanceDispute.find({ student_email: email }).sort({ created_at: -1 }).limit(50).lean();
    res.json({ disputes: disputes.map((d) => ({ ...d, id: d._id.toString(), _id: undefined })) });
  } catch (error) {
    reportInternalError(res, error, 'Parent:Disputes');
  }
});

// ─── GET /parent/contacts/:email - institutional support contacts ────────────
router.get('/contacts/:email', authenticate, requireRole(['parent', 'admin', 'super_admin']), async (req, res) => {
  try {
    const email = String(req.params.email || '').trim().toLowerCase();
    const authz = await authorizeWardAccess(req, email);
    if (!authz.allowed) return res.status(403).json({ detail: authz.reason });

    const student = await User.findOne({ email, role: 'student' }, 'college college_id department').lean();
    if (!student) return res.status(404).json({ detail: 'Student not found.' });

    const contacts = [];
    if (student.college_id) {
      const college = await College.findOne(
        mongoose.Types.ObjectId.isValid(student.college_id) ? { _id: student.college_id } : { code: student.college_id },
        'name contact_email support_email phone'
      ).lean();
      if (college) {
        contacts.push({
          title: `${college.name} Academic Office`,
          role: 'Institutional Administration',
          channel: college.support_email || college.contact_email || 'Use Institutional Enquiry below',
        });
      }
    }

    if (student.department) {
      const hod = await User.findOne(
        {
          role: { $in: ['hod', 'admin'] },
          department: student.department,
          ...(student.college_id ? { college_id: student.college_id } : {}),
          account_status: 'active',
        },
        'full_name designation department'
      ).lean();
      if (hod) {
        contacts.push({
          title: `${hod.full_name} (${hod.designation || 'Department Coordinator'})`,
          role: `${student.department} Department`,
          channel: 'Submit an Institutional Enquiry for routed response',
        });
      }
    }

    res.json({ contacts });
  } catch (error) {
    reportInternalError(res, error, 'Parent:Contacts');
  }
});

// ─── GET & POST /parent/enquiries - institutional communication ──────────────
router.get('/enquiries', authenticate, requireRole(['parent', 'admin', 'super_admin']), async (req, res) => {
  try {
    const cleanParent = String(req.userEmail || '').trim().toLowerCase();
    const filter = (req.userRole || '').toLowerCase() === 'parent' ? { parent_email: cleanParent } : {};
    if (req.query.student_email) {
      const cleanStudent = String(req.query.student_email).trim().toLowerCase();
      const authz = await authorizeWardAccess(req, cleanStudent);
      if (!authz.allowed) return res.status(403).json({ detail: authz.reason });
      filter.student_email = cleanStudent;
    }
    const enquiries = await ParentEnquiry.find(filter).sort({ created_at: -1 }).limit(50).lean();
    res.json({ enquiries: enquiries.map((e) => ({ ...e, id: e._id.toString(), _id: undefined })) });
  } catch (error) {
    reportInternalError(res, error, 'Parent:Enquiries');
  }
});

router.post('/enquiries', authenticate, requireRole(['parent']), async (req, res) => {
  try {
    if (!(await enforceLimiter(enquiryRateLimiter, req, res))) return;

    const { student_email, subject, category, message } = req.body || {};
    const cleanStudent = String(student_email || '').trim().toLowerCase();
    if (!cleanStudent || typeof subject !== 'string' || !subject.trim() || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ detail: 'student_email, subject, and message are required.' });
    }
    const authz = await authorizeWardAccess(req, cleanStudent);
    if (!authz.allowed) return res.status(403).json({ detail: authz.reason });

    const student = await User.findOne({ email: cleanStudent }, 'college_id department').lean();
    const enquiry = await ParentEnquiry.create({
      parent_email: req.userEmail.toLowerCase(),
      student_email: cleanStudent,
      college_id: student?.college_id || undefined,
      department: student?.department || undefined,
      subject: subject.trim().slice(0, 160),
      category: ['attendance_enquiry', 'policy_clarification', 'leave_followup', 'correction_followup', 'general'].includes(category)
        ? category
        : 'attendance_enquiry',
      message: message.trim().slice(0, 2000),
      status: 'submitted',
    });

    res.status(201).json({
      success: true,
      enquiry: { ...enquiry.toObject(), id: enquiry._id.toString(), _id: undefined },
    });
  } catch (error) {
    reportInternalError(res, error, 'Parent:CreateEnquiry');
  }
});

// ─── GET & PATCH /parent/profile - parent profile & preferences ──────────────
router.get('/profile', authenticate, requireRole(['parent']), async (req, res) => {
  try {
    const user = await User.findOne(
      { email: req.userEmail.toLowerCase() },
      'email full_name role phone language_preference theme_preference notification_preferences privacy_preferences email_verified account_status created_at'
    ).lean();
    if (!user) return res.status(404).json({ detail: 'Profile not found.' });
    res.json({ profile: user });
  } catch (error) {
    reportInternalError(res, error, 'Parent:GetProfile');
  }
});

router.patch('/profile', authenticate, requireRole(['parent']), async (req, res) => {
  try {
    const allowedUpdates = {};
    const body = req.body || {};
    if (typeof body.full_name === 'string' && body.full_name.trim().length >= 2) {
      allowedUpdates.full_name = body.full_name.trim().slice(0, 100);
    }
    if (typeof body.phone === 'string') {
      allowedUpdates.phone = body.phone.trim().slice(0, 30);
    }
    if (typeof body.language_preference === 'string' && ['English', 'Kannada', 'Hindi'].includes(body.language_preference)) {
      allowedUpdates.language_preference = body.language_preference;
    }
    if (body.notification_preferences && typeof body.notification_preferences === 'object') {
      allowedUpdates.notification_preferences = {
        email: Boolean(body.notification_preferences.email ?? true),
        push: Boolean(body.notification_preferences.push ?? true),
        in_app: Boolean(body.notification_preferences.in_app ?? true),
        shortage_alerts: Boolean(body.notification_preferences.shortage_alerts ?? true),
        quiet_hours: {
          enabled: Boolean(body.notification_preferences.quiet_hours?.enabled ?? false),
          start: String(body.notification_preferences.quiet_hours?.start || '22:00').slice(0, 5),
          end: String(body.notification_preferences.quiet_hours?.end || '07:00').slice(0, 5),
        },
      };
    }

    const updated = await User.findOneAndUpdate(
      { email: req.userEmail.toLowerCase() },
      { $set: allowedUpdates },
      { returnDocument: 'after', projection: 'email full_name role phone language_preference theme_preference notification_preferences privacy_preferences' }
    ).lean();

    res.json({ success: true, profile: updated });
  } catch (error) {
    reportInternalError(res, error, 'Parent:UpdateProfile');
  }
});

module.exports = router;
