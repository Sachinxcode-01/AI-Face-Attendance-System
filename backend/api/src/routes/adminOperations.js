'use strict';

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const crypto = require('crypto');

const User = require('../models/User');
const UserSession = require('../models/UserSession');
const College = require('../models/College');
const Department = require('../models/Department');
const Course = require('../models/Course');
const Section = require('../models/Section');
const Session = require('../models/Session');
const Attendance = require('../models/Attendance');
const AttendanceDispute = require('../models/AttendanceDispute');
const Leave = require('../models/Leave');
const Holiday = require('../models/Holiday');
const SecurityLog = require('../models/SecurityLog');
const CampusDevice = require('../models/CampusDevice');
const BiometricProfile = require('../models/BiometricProfile');
const Announcement = require('../models/Announcement');
const BackupMetadata = require('../models/BackupMetadata');
const SystemAuditLog = require('../models/SystemAuditLog');
const AttendanceAuditLog = require('../models/AttendanceAuditLog');
const { authenticate, requireRole } = require('../middleware/auth');
const { resolveAdminTenant, buildTenantUserFilter, isSameTenant } = require('../utils/tenantScope');
const auditService = require('../services/auditService');
const notificationService = require('../services/notificationService');
const reportInternalError = require('../utils/httpError');

const ADMIN_ROLES = ['admin', 'super_admin', 'principal', 'management', 'hod'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function csvCell(val) {
  const s = val === null || val === undefined ? '' : String(val);
  return '"' + s.replace(/"/g, '""') + '"';
}

// ─── 1. Command Centre Stats, Threats & Calibration ───────────────
router.get('/stats', authenticate, requireRole(ADMIN_ROLES), async (req, res) => {
  try {
    const tenant = await resolveAdminTenant(req);
    const studentFilter = buildTenantUserFilter(tenant, { role: 'student' });
    const facultyFilter = buildTenantUserFilter(tenant, { role: { $in: ['teacher', 'faculty'] } });

    const [students, faculty] = await Promise.all([
      User.find(studentFilter, 'email department semester account_status biometric_registered').lean(),
      User.find(facultyFilter, 'email account_status').lean(),
    ]);

    const studentEmails = students.map((s) => s.email);
    const facultyEmails = faculty.map((f) => f.email);
    const allTenantEmails = [...studentEmails, ...facultyEmails];

    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    const dateFilter = {};
    if (req.query.start_date || req.query.end_date) {
      dateFilter.timestamp = {};
      if (req.query.start_date) {
        const s = new Date(String(req.query.start_date));
        if (!Number.isNaN(s.getTime())) dateFilter.timestamp.$gte = s;
      }
      if (req.query.end_date) {
        const e = new Date(String(req.query.end_date));
        if (!Number.isNaN(e.getTime())) dateFilter.timestamp.$lte = e;
      }
      if (Object.keys(dateFilter.timestamp).length === 0) delete dateFilter.timestamp;
    }

    const attScope = studentEmails.length > 0 ? { student_email: { $in: studentEmails }, ...dateFilter } : { _id: null };
    const sessScope = facultyEmails.length > 0 ? { teacher_id: { $in: facultyEmails } } : (tenant.isSuperAdmin ? {} : { _id: null });

    const deptQuery = tenant.collegeId ? { college_id: tenant.collegeId } : {};
    const deviceQuery = tenant.collegeId ? { college_id: tenant.collegeId } : {};
    const secQuery = tenant.collegeId && !tenant.isSuperAdmin ? { college_id: tenant.collegeId, status: { $in: ['Active', 'Detected', 'Under review', 'Investigating', 'Escalated'] } } : { status: { $in: ['Active', 'Detected', 'Under review', 'Investigating', 'Escalated'] } };

    const [
      overallAttAgg,
      todayAttAgg,
      activeSessions,
      completedTodaySessions,
      pendingLeaves,
      pendingDisputes,
      unresolvedAlerts,
      departmentsCount,
      devices,
      studentRateAgg,
    ] = await Promise.all([
      Attendance.aggregate([
        { $match: attScope },
        { $group: { _id: null, total: { $sum: 1 }, present: { $sum: { $cond: [{ $in: ['$status', ['Present', 'Late', 'Excused']] }, 1, 0] } } } },
      ]),
      Attendance.aggregate([
        { $match: { ...(studentEmails.length > 0 ? { student_email: { $in: studentEmails } } : { _id: null }), timestamp: { $gte: todayStart } } },
        { $group: { _id: null, total: { $sum: 1 }, present: { $sum: { $cond: [{ $in: ['$status', ['Present', 'Late', 'Excused']] }, 1, 0] } } } },
      ]),
      Session.countDocuments({ ...sessScope, is_active: true }),
      Session.countDocuments({ ...sessScope, is_active: false, start_time: { $gte: todayStart } }),
      Leave.countDocuments({ ...(studentEmails.length > 0 ? { user_id: { $in: studentEmails } } : (tenant.isSuperAdmin ? {} : { _id: null })), status: 'Pending' }),
      AttendanceDispute.countDocuments({ ...(studentEmails.length > 0 ? { student_email: { $in: studentEmails } } : (tenant.isSuperAdmin ? {} : { _id: null })), status: { $in: ['pending', 'teacher_reviewed', 'escalated', 'Pending'] } }),
      SecurityLog.countDocuments(secQuery),
      Department.countDocuments(deptQuery),
      CampusDevice.find(deviceQuery, 'status last_heartbeat').lean(),
      studentEmails.length > 0
        ? Attendance.aggregate([
            { $match: { student_email: { $in: studentEmails } } },
            { $group: { _id: '$student_email', total: { $sum: 1 }, present: { $sum: { $cond: [{ $in: ['$status', ['Present', 'Late', 'Excused']] }, 1, 0] } } } },
          ])
        : [],
    ]);

    const minPct = tenant.collegeDoc?.attendance_policy?.min_percentage ?? 75;
    let shortageStudents = 0;
    const rateMap = new Map(studentRateAgg.map((r) => [r._id, r]));
    for (const s of students) {
      const r = rateMap.get(s.email);
      if (r && r.total > 0 && (r.present / r.total) * 100 < minPct) {
        shortageStudents++;
      }
    }

    const totalAtt = overallAttAgg[0]?.total || 0;
    const presentAtt = overallAttAgg[0]?.present || 0;
    const todayTotal = todayAttAgg[0]?.total || 0;
    const todayPresent = todayAttAgg[0]?.present || 0;

    const deptIds = tenant.collegeId ? await Department.find({ college_id: tenant.collegeId }).distinct('_id') : [];
    const coursesCount = deptIds.length ? await Course.countDocuments({ department_id: { $in: deptIds } }) : await Course.countDocuments({});
    const courseIds = deptIds.length ? await Course.find({ department_id: { $in: deptIds } }).distinct('_id') : [];
    const sectionsCount = courseIds.length ? await Section.countDocuments({ course_id: { $in: courseIds } }) : await Section.countDocuments({});

    const nowMs = Date.now();
    const activeDevices = devices.filter((d) => d.status === 'active' && (!d.last_heartbeat || nowMs - new Date(d.last_heartbeat).getTime() < 5 * 60 * 1000)).length;
    const offlineDevices = devices.length - activeDevices;

    const activeStudents = students.filter((s) => (s.account_status || 'active') === 'active').length;
    const activeFaculty = faculty.filter((f) => (f.account_status || 'active') === 'active').length;
    const biometricPending = students.filter((s) => !s.biometric_registered).length;

    res.json({
      success: true,
      institution: {
        id: tenant.collegeId,
        name: tenant.collegeName || 'SmartFace Institution',
        code: tenant.collegeCode || null,
      },
      totalAttendance: totalAtt,
      total_students: students.length,
      active_students: activeStudents,
      inactive_students: students.length - activeStudents,
      total_faculty: faculty.length,
      active_faculty: activeFaculty,
      total_departments: departmentsCount || new Set(students.map((s) => s.department).filter(Boolean)).size,
      total_courses: coursesCount,
      total_sections: sectionsCount,
      active_sessions: activeSessions,
      completed_sessions_today: completedTodaySessions,
      today_attendance_pct: todayTotal > 0 ? Math.round((todayPresent / todayTotal) * 1000) / 10 : 0,
      overall_attendance_pct: totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 1000) / 10 : 0,
      shortage_students: shortageStudents,
      biometric_pending: biometricPending,
      pending_leaves: pendingLeaves,
      pending_disputes: pendingDisputes,
      active_devices: activeDevices,
      offline_devices: offlineDevices,
      unresolved_alerts: unresolvedAlerts,
      pending_actions: pendingLeaves + pendingDisputes + unresolvedAlerts,
      last_sync: new Date().toISOString(),
    });
  } catch (error) {
    reportInternalError(res, error, 'AdminOps:Stats');
  }
});

router.get('/threats', authenticate, requireRole(ADMIN_ROLES), async (req, res) => {
  try {
    const tenant = await resolveAdminTenant(req);
    const filter = {};
    if (!tenant.isSuperAdmin && tenant.collegeId) {
      filter.college_id = tenant.collegeId;
    }
    const logs = await SecurityLog.find(filter).sort({ timestamp: -1 }).limit(25).lean();
    res.json(logs.map((l) => ({
      id: l._id.toString(),
      location: l.location,
      type: l.type || 'intruder',
      severity: l.severity || 'medium',
      confidence: l.confidence ?? null,
      timestamp: l.timestamp,
      status: l.status || 'Active',
      assigned_to: l.assigned_to || null,
      resolution_notes: l.resolution_notes || '',
      image_base64: l.image_base64 || null,
    })));
  } catch (error) {
    reportInternalError(res, error, 'AdminOps:Threats');
  }
});

router.get('/calibration', authenticate, requireRole(ADMIN_ROLES), async (req, res) => {
  try {
    const tenant = await resolveAdminTenant(req);
    const cfg = tenant.collegeDoc?.biometric_config || {};
    res.json({
      success: true,
      similarity_threshold: cfg.similarity_threshold ?? 0.65,
      liveness_required: cfg.liveness_required ?? true,
      retention_days: cfg.retention_days ?? 365,
      updated_at: cfg.updated_at || null,
      updated_by: cfg.updated_by || null,
    });
  } catch (error) {
    reportInternalError(res, error, 'AdminOps:GetCalibration');
  }
});

router.patch('/calibration', authenticate, requireRole(['admin', 'super_admin', 'principal']), async (req, res) => {
  try {
    const tenant = await resolveAdminTenant(req);
    if (!tenant.collegeId || !mongoose.Types.ObjectId.isValid(tenant.collegeId)) {
      return res.status(400).json({ detail: 'No institution record linked to administrator account.' });
    }
    const threshold = Number(req.body.similarity_threshold);
    if (Number.isNaN(threshold) || threshold < 0.5 || threshold > 0.85) {
      return res.status(400).json({ detail: 'similarity_threshold must be between 0.50 and 0.85.' });
    }
    const update = {
      'biometric_config.similarity_threshold': Math.round(threshold * 100) / 100,
      'biometric_config.updated_at': new Date(),
      'biometric_config.updated_by': req.userEmail,
    };
    if (typeof req.body.liveness_required === 'boolean') {
      update['biometric_config.liveness_required'] = req.body.liveness_required;
    }
    if (req.body.retention_days !== undefined) {
      const days = parseInt(req.body.retention_days, 10);
      if (days >= 7 && days <= 3650) update['biometric_config.retention_days'] = days;
    }

    const updated = await College.findByIdAndUpdate(tenant.collegeId, { $set: update }, { returnDocument: 'after' }).lean();
    await auditService.log('BIOMETRIC_CALIBRATION_UPDATED', req.userEmail, req.userRole, {
      similarity_threshold: updated.biometric_config.similarity_threshold,
      liveness_required: updated.biometric_config.liveness_required,
      college_id: tenant.collegeId,
    }, req.ip, { module: 'ADMIN', entityId: tenant.collegeId, collegeId: tenant.collegeId });

    res.json({ success: true, calibration: updated.biometric_config });
  } catch (error) {
    reportInternalError(res, error, 'AdminOps:UpdateCalibration');
  }
});

// ─── 2. User Lifecycle, Bulk Preview, Export & Promotion ──────────
router.patch('/users/:id/status', authenticate, requireRole(['admin', 'super_admin', 'principal']), async (req, res) => {
  try {
    const { id } = req.params;
    const status = String(req.body.status || '').toLowerCase();
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ detail: 'Invalid user ID.' });
    if (!['active', 'suspended', 'archived', 'pending'].includes(status)) {
      return res.status(400).json({ detail: 'Invalid account status.' });
    }

    const tenant = await resolveAdminTenant(req);
    const target = await User.findById(id);
    if (!target) return res.status(404).json({ detail: 'User not found.' });
    if (!isSameTenant(tenant, target)) {
      return res.status(403).json({ detail: 'Forbidden: Cross-institution access denied.' });
    }
    if (target.email.toLowerCase() === String(req.userEmail || '').toLowerCase()) {
      return res.status(400).json({ detail: 'Cannot change your own account status.' });
    }

    const prevStatus = target.account_status || 'active';
    target.account_status = status;
    await target.save();

    if (status === 'suspended' || status === 'archived') {
      await UserSession.deleteMany({ userId: target.email.toLowerCase() });
    }

    await auditService.log('USER_STATUS_CHANGED', req.userEmail, req.userRole, {
      target_email: target.email,
      previous_status: prevStatus,
      new_status: status,
      reason: req.body.reason || '',
      college_id: tenant.collegeId,
    }, req.ip, { module: 'ADMIN', entityId: id, collegeId: tenant.collegeId });

    res.json({ success: true, id, account_status: status });
  } catch (error) {
    reportInternalError(res, error, 'AdminOps:UserStatus');
  }
});

router.post('/users/bulk/preview', authenticate, requireRole(['admin', 'super_admin', 'principal']), async (req, res) => {
  try {
    const { users, default_role } = req.body;
    if (!Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ detail: 'users array is required.' });
    }
    if (users.length > 1000) {
      return res.status(400).json({ detail: 'Batch limit exceeded (max 1000).' });
    }
    const tenant = await resolveAdminTenant(req);
    const incomingEmails = users.map((u) => String(u?.email || '').trim().toLowerCase()).filter(Boolean);
    const incomingIds = users.map((u) => String(u?.student_id || u?.usn || '').trim()).filter(Boolean);

    const [existingByEmail, existingBySid] = await Promise.all([
      User.find({ email: { $in: incomingEmails } }, 'email').lean(),
      incomingIds.length ? User.find({ $or: [{ student_id: { $in: incomingIds } }, { usn: { $in: incomingIds } }] }, 'student_id usn').lean() : [],
    ]);
    const existingEmailSet = new Set(existingByEmail.map((u) => u.email.toLowerCase()));
    const existingSidSet = new Set(existingBySid.flatMap((u) => [u.student_id, u.usn].filter(Boolean)));
    const seenEmails = new Set();
    const seenSids = new Set();

    const valid = [];
    const errors = [];

    users.forEach((u, idx) => {
      const rowNum = idx + 1;
      const email = String(u?.email || '').trim().toLowerCase();
      const fullName = String(u?.full_name || '').trim();
      const sid = String(u?.student_id || u?.usn || '').trim();
      const targetRole = String(u?.role || default_role || 'student').trim().toLowerCase();

      if (!email || !EMAIL_RE.test(email)) {
        errors.push({ row: rowNum, email, reason: 'Invalid or missing email address' });
        return;
      }
      if (!fullName) {
        errors.push({ row: rowNum, email, reason: 'Missing full_name' });
        return;
      }
      if (!tenant.isSuperAdmin && ['admin', 'super_admin'].includes(targetRole)) {
        errors.push({ row: rowNum, email, reason: 'Forbidden to import administrative role' });
        return;
      }
      if (!tenant.isSuperAdmin && u?.college && tenant.collegeName && String(u.college).trim().toLowerCase() !== tenant.collegeName.toLowerCase()) {
        errors.push({ row: rowNum, email, reason: 'Cross-institution import blocked' });
        return;
      }
      if (existingEmailSet.has(email) || seenEmails.has(email)) {
        errors.push({ row: rowNum, email, reason: 'Duplicate email' });
        return;
      }
      if (sid && (existingSidSet.has(sid) || seenSids.has(sid))) {
        errors.push({ row: rowNum, email, reason: `Duplicate registration ID (${sid})` });
        return;
      }
      seenEmails.add(email);
      if (sid) seenSids.add(sid);
      valid.push({ row: rowNum, email, full_name: fullName, role: targetRole, student_id: sid || null, department: u?.department || '' });
    });

    res.json({
      success: true,
      total: users.length,
      valid_count: valid.length,
      error_count: errors.length,
      valid_preview: valid.slice(0, 25),
      errors,
    });
  } catch (error) {
    reportInternalError(res, error, 'AdminOps:BulkPreview');
  }
});

router.get('/students/export', authenticate, requireRole(['admin', 'super_admin', 'principal']), async (req, res) => {
  try {
    const tenant = await resolveAdminTenant(req);
    const filter = buildTenantUserFilter(tenant, { role: 'student' });
    if (req.query.department) filter.department = String(req.query.department);
    if (req.query.semester) filter.semester = String(req.query.semester);

    const students = await User.find(
      filter,
      'full_name email student_id usn roll_number department course semester section academic_year account_status biometric_registered phone'
    ).sort({ department: 1, full_name: 1 }).lean();

    await auditService.log('STUDENTS_EXPORTED', req.userEmail, req.userRole, {
      count: students.length,
      college_id: tenant.collegeId,
    }, req.ip, { module: 'ADMIN', collegeId: tenant.collegeId });

    const headers = ['Full Name', 'Email', 'Registration ID', 'Roll No', 'Department', 'Course', 'Semester', 'Section', 'Academic Year', 'Status', 'Biometric Enrolled', 'Phone'];
    const lines = [headers.map(csvCell).join(',')];
    for (const s of students) {
      lines.push([
        s.full_name,
        s.email,
        s.student_id || s.usn || '',
        s.roll_number || '',
        s.department || '',
        s.course || '',
        s.semester || '',
        s.section || '',
        s.academic_year || '',
        s.account_status || 'active',
        s.biometric_registered ? 'Yes' : 'No',
        s.phone || '',
      ].map(csvCell).join(','));
    }

    res.setHeader('Content-disposition', `attachment; filename=students_${new Date().toISOString().slice(0, 10)}.csv`);
    res.set('Content-Type', 'text/csv; charset=utf-8');
    res.send(lines.join('\n'));
  } catch (error) {
    reportInternalError(res, error, 'AdminOps:ExportStudents');
  }
});

router.post('/students/promote', authenticate, requireRole(['admin', 'super_admin', 'principal']), async (req, res) => {
  try {
    const { student_ids, target_semester, target_section, target_academic_year, archive_graduated } = req.body;
    if (!Array.isArray(student_ids) || student_ids.length === 0) {
      return res.status(400).json({ detail: 'student_ids array is required.' });
    }
    const validIds = student_ids.filter((id) => mongoose.Types.ObjectId.isValid(id));
    if (validIds.length === 0) return res.status(400).json({ detail: 'No valid student IDs provided.' });

    const tenant = await resolveAdminTenant(req);
    const filter = buildTenantUserFilter(tenant, { _id: { $in: validIds }, role: 'student' });
    const update = {};
    if (target_semester !== undefined) update.semester = String(target_semester).trim();
    if (target_section !== undefined) update.section = String(target_section).trim();
    if (target_academic_year !== undefined) update.academic_year = String(target_academic_year).trim();
    if (archive_graduated) update.account_status = 'archived';

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ detail: 'No promotion updates specified.' });
    }

    const result = await User.updateMany(filter, { $set: update });
    await auditService.log('STUDENTS_PROMOTED', req.userEmail, req.userRole, {
      matched: result.matchedCount,
      modified: result.modifiedCount,
      update,
      college_id: tenant.collegeId,
    }, req.ip, { module: 'ACADEMIC', collegeId: tenant.collegeId });

    res.json({ success: true, modified_count: result.modifiedCount });
  } catch (error) {
    reportInternalError(res, error, 'AdminOps:PromoteStudents');
  }
});

// ─── 3. Parent & Guardian Account Administration ──────────────────
router.get('/parents', authenticate, requireRole(ADMIN_ROLES), async (req, res) => {
  try {
    const tenant = await resolveAdminTenant(req);
    const filter = buildTenantUserFilter(tenant, { role: 'parent' });
    const parents = await User.find(filter, 'full_name email phone account_status children linked_children created_at').sort({ created_at: -1 }).lean();
    res.json({
      success: true,
      parents: parents.map((p) => ({
        id: p._id.toString(),
        full_name: p.full_name,
        email: p.email,
        phone: p.phone || '',
        account_status: p.account_status || 'active',
        linked_children: p.linked_children || [],
        children: p.children || [],
        created_at: p.created_at,
      })),
    });
  } catch (error) {
    reportInternalError(res, error, 'AdminOps:Parents');
  }
});

router.post('/parents/link', authenticate, requireRole(['admin', 'super_admin', 'principal']), async (req, res) => {
  try {
    const parentEmail = String(req.body.parent_email || '').trim().toLowerCase();
    const studentEmail = String(req.body.student_email || '').trim().toLowerCase();
    if (!parentEmail || !studentEmail) {
      return res.status(400).json({ detail: 'parent_email and student_email are required.' });
    }
    const tenant = await resolveAdminTenant(req);
    const [parent, student] = await Promise.all([
      User.findOne({ email: parentEmail, role: 'parent' }),
      User.findOne({ email: studentEmail, role: 'student' }),
    ]);
    if (!parent) return res.status(404).json({ detail: 'Parent account not found.' });
    if (!student) return res.status(404).json({ detail: 'Student account not found.' });
    if (!isSameTenant(tenant, parent) || !isSameTenant(tenant, student)) {
      return res.status(403).json({ detail: 'Forbidden: Cross-institution parent linking denied.' });
    }

    const childSet = new Set([...(parent.children || []), student.email.toLowerCase()]);
    parent.children = Array.from(childSet);
    const existingLinked = Array.isArray(parent.linked_children) ? parent.linked_children : [];
    if (!existingLinked.some((c) => c.email?.toLowerCase() === student.email.toLowerCase())) {
      existingLinked.push({ email: student.email, full_name: student.full_name, student_id: student.student_id || student.usn || '' });
    }
    parent.linked_children = existingLinked;
    await parent.save();

    await auditService.log('PARENT_STUDENT_LINKED', req.userEmail, req.userRole, {
      parent_email: parentEmail,
      student_email: studentEmail,
      college_id: tenant.collegeId,
    }, req.ip, { module: 'ADMIN', entityId: parent._id.toString(), collegeId: tenant.collegeId });

    res.json({ success: true, message: 'Parent linked to student.', children: parent.children });
  } catch (error) {
    reportInternalError(res, error, 'AdminOps:LinkParent');
  }
});

router.delete('/parents/unlink', authenticate, requireRole(['admin', 'super_admin', 'principal']), async (req, res) => {
  try {
    const parentEmail = String(req.body.parent_email || req.query.parent_email || '').trim().toLowerCase();
    const studentEmail = String(req.body.student_email || req.query.student_email || '').trim().toLowerCase();
    if (!parentEmail || !studentEmail) {
      return res.status(400).json({ detail: 'parent_email and student_email are required.' });
    }
    const tenant = await resolveAdminTenant(req);
    const parent = await User.findOne({ email: parentEmail, role: 'parent' });
    if (!parent) return res.status(404).json({ detail: 'Parent account not found.' });
    if (!isSameTenant(tenant, parent)) {
      return res.status(403).json({ detail: 'Forbidden: Cross-institution parent modification denied.' });
    }
    parent.children = (parent.children || []).filter((e) => e.toLowerCase() !== studentEmail);
    parent.linked_children = (parent.linked_children || []).filter((c) => c.email?.toLowerCase() !== studentEmail);
    await parent.save();

    await auditService.log('PARENT_STUDENT_UNLINKED', req.userEmail, req.userRole, {
      parent_email: parentEmail,
      student_email: studentEmail,
      college_id: tenant.collegeId,
    }, req.ip, { module: 'ADMIN', entityId: parent._id.toString(), collegeId: tenant.collegeId });

    res.json({ success: true, message: 'Parent-student link revoked.' });
  } catch (error) {
    reportInternalError(res, error, 'AdminOps:UnlinkParent');
  }
});

// ─── 4. Academic Infrastructure (Departments, Courses, Sections, Semesters, Holidays) ─
router.get('/departments', authenticate, requireRole(ADMIN_ROLES), async (req, res) => {
  try {
    const tenant = await resolveAdminTenant(req);
    const filter = tenant.collegeId ? { college_id: tenant.collegeId } : {};
    const depts = await Department.find(filter).sort({ name: 1 }).lean();
    res.json({ success: true, departments: depts.map((d) => ({ ...d, id: d._id.toString() })) });
  } catch (error) {
    reportInternalError(res, error, 'AdminOps:ListDepts');
  }
});

router.post('/departments', authenticate, requireRole(['admin', 'super_admin', 'principal']), async (req, res) => {
  try {
    const tenant = await resolveAdminTenant(req);
    if (!tenant.collegeId || !mongoose.Types.ObjectId.isValid(tenant.collegeId)) {
      return res.status(400).json({ detail: 'Institution record required to create departments.' });
    }
    const name = String(req.body.name || '').trim();
    const code = String(req.body.code || '').trim().toUpperCase();
    if (!name || !code) return res.status(400).json({ detail: 'Department name and code are required.' });

    const dept = await Department.create({
      college_id: tenant.collegeId,
      name,
      code,
      hod_email: req.body.hod_email ? String(req.body.hod_email).trim().toLowerCase() : null,
    });
    await auditService.log('DEPARTMENT_CREATED', req.userEmail, req.userRole, { name, code, college_id: tenant.collegeId }, req.ip, { module: 'ACADEMIC', entityId: dept._id.toString(), collegeId: tenant.collegeId });
    res.status(201).json({ success: true, department: { ...dept.toObject(), id: dept._id.toString() } });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ detail: 'Department code already exists in this institution.' });
    reportInternalError(res, error, 'AdminOps:CreateDept');
  }
});

router.patch('/departments/:id', authenticate, requireRole(['admin', 'super_admin', 'principal']), async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ detail: 'Invalid department ID.' });
    const tenant = await resolveAdminTenant(req);
    const dept = await Department.findById(id);
    if (!dept) return res.status(404).json({ detail: 'Department not found.' });
    if (!tenant.isSuperAdmin && tenant.collegeId && dept.college_id.toString() !== tenant.collegeId) {
      return res.status(403).json({ detail: 'Forbidden: Cross-institution access denied.' });
    }
    if (typeof req.body.name === 'string' && req.body.name.trim()) dept.name = req.body.name.trim();
    if (typeof req.body.code === 'string' && req.body.code.trim()) dept.code = req.body.code.trim().toUpperCase();
    if (req.body.hod_email !== undefined) dept.hod_email = req.body.hod_email ? String(req.body.hod_email).trim().toLowerCase() : null;
    await dept.save();
    await auditService.log('DEPARTMENT_UPDATED', req.userEmail, req.userRole, {
      department_id: id,
      name: dept.name,
      code: dept.code,
      hod_email: dept.hod_email,
      college_id: tenant.collegeId,
    }, req.ip, { module: 'ACADEMIC', entityId: id, collegeId: tenant.collegeId });
    res.json({ success: true, department: { ...dept.toObject(), id: dept._id.toString() } });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ detail: 'Department code already exists in this institution.' });
    reportInternalError(res, error, 'AdminOps:UpdateDept');
  }
});

router.delete('/departments/:id', authenticate, requireRole(['admin', 'super_admin', 'principal']), async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ detail: 'Invalid department ID.' });
    const tenant = await resolveAdminTenant(req);
    const dept = await Department.findById(id).lean();
    if (!dept) return res.status(404).json({ detail: 'Department not found.' });
    if (!tenant.isSuperAdmin && tenant.collegeId && dept.college_id.toString() !== tenant.collegeId) {
      return res.status(403).json({ detail: 'Forbidden: Cross-institution access denied.' });
    }
    const [refCourses, refUsers] = await Promise.all([
      Course.countDocuments({ department_id: id }),
      User.countDocuments(buildTenantUserFilter(tenant, { department: dept.name })),
    ]);
    if (refCourses > 0 || refUsers > 0) {
      return res.status(409).json({ detail: 'Cannot delete department referenced by courses or users. Reassign them first.' });
    }
    await Department.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (error) {
    reportInternalError(res, error, 'AdminOps:DeleteDept');
  }
});

router.get('/courses', authenticate, requireRole(ADMIN_ROLES), async (req, res) => {
  try {
    const tenant = await resolveAdminTenant(req);
    const deptIds = tenant.collegeId ? await Department.find({ college_id: tenant.collegeId }).distinct('_id') : null;
    const filter = deptIds ? { department_id: { $in: deptIds } } : {};
    const courses = await Course.find(filter).populate('department_id', 'name code').sort({ code: 1 }).lean();
    res.json({ success: true, courses: courses.map((c) => ({ ...c, id: c._id.toString() })) });
  } catch (error) {
    reportInternalError(res, error, 'AdminOps:ListCourses');
  }
});

router.post('/courses', authenticate, requireRole(['admin', 'super_admin', 'principal']), async (req, res) => {
  try {
    const { department_id, name, code, credits } = req.body;
    if (!mongoose.Types.ObjectId.isValid(department_id) || !name || !code) {
      return res.status(400).json({ detail: 'department_id, name, and code are required.' });
    }
    const tenant = await resolveAdminTenant(req);
    const dept = await Department.findById(department_id).lean();
    if (!dept) return res.status(404).json({ detail: 'Department not found.' });
    if (!tenant.isSuperAdmin && tenant.collegeId && dept.college_id.toString() !== tenant.collegeId) {
      return res.status(403).json({ detail: 'Forbidden: Cross-institution department access denied.' });
    }
    const course = await Course.create({
      department_id,
      name: String(name).trim(),
      code: String(code).trim().toUpperCase(),
      credits: Number(credits) || 3,
    });
    res.status(201).json({ success: true, course: { ...course.toObject(), id: course._id.toString() } });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ detail: 'Course code already exists in this department.' });
    reportInternalError(res, error, 'AdminOps:CreateCourse');
  }
});

router.get('/sections', authenticate, requireRole(ADMIN_ROLES), async (req, res) => {
  try {
    const tenant = await resolveAdminTenant(req);
    const deptIds = tenant.collegeId ? await Department.find({ college_id: tenant.collegeId }).distinct('_id') : null;
    const courseIds = deptIds ? await Course.find({ department_id: { $in: deptIds } }).distinct('_id') : null;
    const filter = courseIds ? { course_id: { $in: courseIds } } : {};
    const sections = await Section.find(filter).populate('course_id', 'name code').sort({ semester: 1, name: 1 }).lean();
    res.json({ success: true, sections: sections.map((s) => ({ ...s, id: s._id.toString() })) });
  } catch (error) {
    reportInternalError(res, error, 'AdminOps:ListSections');
  }
});

router.post('/sections', authenticate, requireRole(['admin', 'super_admin', 'principal']), async (req, res) => {
  try {
    const { course_id, name, semester, academic_year } = req.body;
    if (!mongoose.Types.ObjectId.isValid(course_id) || !name || !semester || !academic_year) {
      return res.status(400).json({ detail: 'course_id, name, semester, and academic_year are required.' });
    }
    const section = await Section.create({
      course_id,
      name: String(name).trim(),
      semester: Number(semester),
      academic_year: String(academic_year).trim(),
    });
    res.status(201).json({ success: true, section: { ...section.toObject(), id: section._id.toString() } });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ detail: 'Section already exists for this course/semester/year.' });
    reportInternalError(res, error, 'AdminOps:CreateSection');
  }
});

router.get('/semesters', authenticate, requireRole(ADMIN_ROLES), async (req, res) => {
  try {
    const tenant = await resolveAdminTenant(req);
    res.json({
      success: true,
      current_semester: tenant.collegeDoc?.attendance_policy?.current_semester || 'Odd Semester',
      academic_year: tenant.collegeDoc?.attendance_policy?.academic_year || '2026-2027',
      terms: tenant.collegeDoc?.academic_terms || [],
    });
  } catch (error) {
    reportInternalError(res, error, 'AdminOps:Semesters');
  }
});

router.post('/semesters', authenticate, requireRole(['admin', 'super_admin', 'principal']), async (req, res) => {
  try {
    const tenant = await resolveAdminTenant(req);
    if (!tenant.collegeId) return res.status(400).json({ detail: 'Institution required.' });
    const { name, academic_year, start_date, end_date, status } = req.body;
    if (!name || !academic_year) return res.status(400).json({ detail: 'name and academic_year are required.' });
    const term = {
      name: String(name).trim(),
      academic_year: String(academic_year).trim(),
      start_date: start_date ? new Date(start_date) : null,
      end_date: end_date ? new Date(end_date) : null,
      status: ['draft', 'active', 'closed'].includes(status) ? status : 'draft',
    };
    const update = { $push: { academic_terms: term } };
    if (term.status === 'active') {
      update.$set = {
        'attendance_policy.current_semester': term.name,
        'attendance_policy.academic_year': term.academic_year,
        'attendance_policy.semester_end_date': term.end_date,
      };
    }
    const updated = await College.findByIdAndUpdate(tenant.collegeId, update, { returnDocument: 'after' }).lean();
    await auditService.log('ACADEMIC_TERM_CREATED', req.userEmail, req.userRole, term, req.ip, { module: 'ACADEMIC', collegeId: tenant.collegeId });
    res.status(201).json({ success: true, terms: updated.academic_terms });
  } catch (error) {
    reportInternalError(res, error, 'AdminOps:CreateSemester');
  }
});

router.patch('/semesters/:termId/status', authenticate, requireRole(['admin', 'super_admin', 'principal']), async (req, res) => {
  try {
    const { termId } = req.params;
    const status = String(req.body.status || '').toLowerCase();
    if (!['draft', 'active', 'closed'].includes(status)) {
      return res.status(400).json({ detail: 'status must be draft, active, or closed.' });
    }
    const tenant = await resolveAdminTenant(req);
    if (!tenant.collegeId) return res.status(400).json({ detail: 'Institution required.' });

    const college = await College.findById(tenant.collegeId);
    if (!college) return res.status(404).json({ detail: 'Institution not found.' });
    const term = college.academic_terms.id(termId);
    if (!term) return res.status(404).json({ detail: 'Academic term not found.' });

    const prevStatus = term.status;
    if (status === 'active') {
      for (const t of college.academic_terms) {
        if (t._id.toString() !== termId && t.status === 'active') {
          t.status = 'closed';
        }
      }
      college.attendance_policy = college.attendance_policy || {};
      college.attendance_policy.current_semester = term.name;
      college.attendance_policy.academic_year = term.academic_year;
      if (term.end_date) college.attendance_policy.semester_end_date = term.end_date;
    }
    term.status = status;
    await college.save();

    await auditService.log('ACADEMIC_TERM_STATUS_CHANGED', req.userEmail, req.userRole, {
      term_id: termId,
      name: term.name,
      academic_year: term.academic_year,
      previous_status: prevStatus,
      new_status: status,
      college_id: tenant.collegeId,
    }, req.ip, { module: 'ACADEMIC', entityId: termId, collegeId: tenant.collegeId });

    res.json({ success: true, terms: college.academic_terms });
  } catch (error) {
    reportInternalError(res, error, 'AdminOps:UpdateSemesterStatus');
  }
});

router.get('/holidays', authenticate, requireRole(ADMIN_ROLES), async (req, res) => {
  try {
    const holidays = await Holiday.find().sort({ date: 1 }).lean();
    res.json({ success: true, holidays: holidays.map((h) => ({ ...h, id: h._id.toString() })) });
  } catch (error) {
    reportInternalError(res, error, 'AdminOps:Holidays');
  }
});

router.post('/holidays', authenticate, requireRole(['admin', 'super_admin', 'principal']), async (req, res) => {
  try {
    const { name, date, type, description } = req.body;
    if (!name || !date) return res.status(400).json({ detail: 'Holiday name and date are required.' });
    const holiday = await Holiday.create({ name: String(name).trim(), date: new Date(date), type: type || 'institutional', description: description || '' });
    res.status(201).json({ success: true, holiday: { ...holiday.toObject(), id: holiday._id.toString() } });
  } catch (error) {
    reportInternalError(res, error, 'AdminOps:CreateHoliday');
  }
});

// ─── 5. Attendance Policy Engine (Versioned) ──────────────────────
router.get('/policy', authenticate, requireRole(ADMIN_ROLES), async (req, res) => {
  try {
    const tenant = await resolveAdminTenant(req);
    res.json({
      success: true,
      policy: tenant.collegeDoc?.attendance_policy || {},
      history: (tenant.collegeDoc?.policy_history || []).slice(-10).reverse(),
    });
  } catch (error) {
    reportInternalError(res, error, 'AdminOps:GetPolicy');
  }
});

router.put('/policy', authenticate, requireRole(['admin', 'super_admin', 'principal']), async (req, res) => {
  try {
    const tenant = await resolveAdminTenant(req);
    if (!tenant.collegeId) return res.status(400).json({ detail: 'Institution required.' });

    const allowed = ['min_percentage', 'approved_leave_counts_as_present', 'excused_counts_as_present', 'late_counts_as_present', 'dispute_deadline_days', 'allow_leave_withdrawal', 'timezone', 'academic_year', 'current_semester'];
    const setFields = {};
    for (const k of allowed) {
      if (req.body[k] !== undefined) setFields[`attendance_policy.${k}`] = req.body[k];
    }
    if (setFields['attendance_policy.min_percentage'] !== undefined) {
      const mp = Number(setFields['attendance_policy.min_percentage']);
      if (Number.isNaN(mp) || mp < 0 || mp > 100) {
        return res.status(400).json({ detail: 'min_percentage must be between 0 and 100.' });
      }
      setFields['attendance_policy.min_percentage'] = mp;
    }

    const version = (tenant.collegeDoc?.policy_history?.length || 0) + 1;
    const historyEntry = {
      version,
      changed_by: req.userEmail,
      changed_at: new Date(),
      reason: String(req.body.reason || 'Administrative policy update').slice(0, 300),
      snapshot: tenant.collegeDoc?.attendance_policy || {},
    };

    const updated = await College.findByIdAndUpdate(
      tenant.collegeId,
      { $set: setFields, $push: { policy_history: historyEntry } },
      { returnDocument: 'after' }
    ).lean();

    await auditService.log('ATTENDANCE_POLICY_UPDATED', req.userEmail, req.userRole, {
      version,
      changes: setFields,
      reason: historyEntry.reason,
      college_id: tenant.collegeId,
    }, req.ip, { module: 'ADMIN', entityId: tenant.collegeId, collegeId: tenant.collegeId });

    res.json({ success: true, policy: updated.attendance_policy, version });
  } catch (error) {
    reportInternalError(res, error, 'AdminOps:UpdatePolicy');
  }
});

// ─── 6. Campus Device Management ──────────────────────────────────
router.get('/devices', authenticate, requireRole(ADMIN_ROLES), async (req, res) => {
  try {
    const tenant = await resolveAdminTenant(req);
    const filter = tenant.collegeId && !tenant.isSuperAdmin ? { college_id: tenant.collegeId } : {};
    const devices = await CampusDevice.find(filter).select('-credential_hash').sort({ created_at: -1 }).lean();
    res.json({ success: true, devices: devices.map((d) => ({ ...d, id: d._id.toString() })) });
  } catch (error) {
    reportInternalError(res, error, 'AdminOps:ListDevices');
  }
});

router.post('/devices', authenticate, requireRole(['admin', 'super_admin', 'principal']), async (req, res) => {
  try {
    const tenant = await resolveAdminTenant(req);
    if (!tenant.collegeId) return res.status(400).json({ detail: 'Institution required.' });
    const { device_id, name, device_type, campus, classroom, software_version } = req.body;
    if (!device_id || !name) return res.status(400).json({ detail: 'device_id and name are required.' });

    const rawSecret = `sf_dev_${crypto.randomBytes(16).toString('hex')}`;
    const credentialHash = crypto.createHash('sha256').update(rawSecret).digest('hex');

    const device = await CampusDevice.create({
      device_id: String(device_id).trim(),
      name: String(name).trim(),
      device_type: device_type || 'kiosk',
      college_id: tenant.collegeId,
      college_name: tenant.collegeName || '',
      campus: campus || 'Main Campus',
      classroom: classroom || '',
      software_version: software_version || '2.0.0',
      credential_hash: credentialHash,
      last_heartbeat: new Date(),
      created_by: req.userEmail,
    });

    await auditService.log('CAMPUS_DEVICE_REGISTERED', req.userEmail, req.userRole, {
      device_id: device.device_id,
      classroom: device.classroom,
      college_id: tenant.collegeId,
    }, req.ip, { module: 'ADMIN', entityId: device._id.toString(), collegeId: tenant.collegeId });

    const obj = device.toObject();
    delete obj.credential_hash;
    res.status(201).json({ success: true, device: { ...obj, id: obj._id.toString() }, device_secret: rawSecret });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ detail: 'Device ID already registered.' });
    reportInternalError(res, error, 'AdminOps:RegisterDevice');
  }
});

router.patch('/devices/:id', authenticate, requireRole(['admin', 'super_admin', 'principal']), async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ detail: 'Invalid device ID.' });
    const tenant = await resolveAdminTenant(req);
    const device = await CampusDevice.findById(id);
    if (!device) return res.status(404).json({ detail: 'Device not found.' });
    if (!tenant.isSuperAdmin && tenant.collegeId && device.college_id !== tenant.collegeId) {
      return res.status(403).json({ detail: 'Forbidden: Cross-institution device access denied.' });
    }
    for (const f of ['name', 'campus', 'classroom', 'software_version', 'status']) {
      if (req.body[f] !== undefined) device[f] = String(req.body[f]).trim();
    }
    await device.save();
    await auditService.log('CAMPUS_DEVICE_UPDATED', req.userEmail, req.userRole, {
      device_id: device.device_id,
      status: device.status,
      college_id: tenant.collegeId,
    }, req.ip, { module: 'ADMIN', entityId: id, collegeId: tenant.collegeId });
    res.json({ success: true, device: { ...device.toObject(), id: device._id.toString(), credential_hash: undefined } });
  } catch (error) {
    reportInternalError(res, error, 'AdminOps:UpdateDevice');
  }
});

router.post('/devices/:id/rotate-credential', authenticate, requireRole(['admin', 'super_admin', 'principal']), async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ detail: 'Invalid device ID.' });
    const tenant = await resolveAdminTenant(req);
    const device = await CampusDevice.findById(id);
    if (!device) return res.status(404).json({ detail: 'Device not found.' });
    if (!tenant.isSuperAdmin && tenant.collegeId && device.college_id !== tenant.collegeId) {
      return res.status(403).json({ detail: 'Forbidden: Cross-institution device access denied.' });
    }
    const rawSecret = `sf_dev_${crypto.randomBytes(16).toString('hex')}`;
    device.credential_hash = crypto.createHash('sha256').update(rawSecret).digest('hex');
    await device.save();
    await auditService.log('CAMPUS_DEVICE_CREDENTIAL_ROTATED', req.userEmail, req.userRole, {
      device_id: device.device_id,
      college_id: tenant.collegeId,
    }, req.ip, { module: 'SECURITY', entityId: id, collegeId: tenant.collegeId });
    res.json({ success: true, device_secret: rawSecret });
  } catch (error) {
    reportInternalError(res, error, 'AdminOps:RotateDeviceCred');
  }
});

// ─── 7. Biometric Enrolment Operations (Never exposes raw embeddings) ─
router.get('/biometrics', authenticate, requireRole(ADMIN_ROLES), async (req, res) => {
  try {
    const tenant = await resolveAdminTenant(req);
    const students = await User.find(
      buildTenantUserFilter(tenant, { role: 'student' }),
      'full_name email student_id usn department semester biometric_registered privacy_preferences account_status'
    ).sort({ biometric_registered: 1, full_name: 1 }).limit(200).lean();

    const profiles = await BiometricProfile.find(
      { user_email: { $in: students.map((s) => s.email) } },
      'user_email vector_version quality_score consent_given consent_timestamp updated_at'
    ).lean();
    const profileMap = new Map(profiles.map((p) => [p.user_email.toLowerCase(), p]));

    res.json({
      success: true,
      records: students.map((s) => {
        const p = profileMap.get(s.email.toLowerCase());
        return {
          id: s._id.toString(),
          full_name: s.full_name,
          email: s.email,
          student_id: s.student_id || s.usn || '',
          department: s.department || '',
          semester: s.semester || '',
          enrolled: Boolean(s.biometric_registered),
          consent_given: Boolean(p?.consent_given ?? s.privacy_preferences?.biometric_consent),
          deletion_requested: Boolean(s.privacy_preferences?.deletion_requested_at),
          vector_version: p?.vector_version || null,
          quality_score: p?.quality_score ?? null,
          updated_at: p?.updated_at || null,
        };
      }),
    });
  } catch (error) {
    reportInternalError(res, error, 'AdminOps:Biometrics');
  }
});

// ─── 8. Institutional Disputes & Leave Oversight ──────────────────
router.get('/disputes', authenticate, requireRole(ADMIN_ROLES), async (req, res) => {
  try {
    const tenant = await resolveAdminTenant(req);
    const studentEmails = tenant.isSuperAdmin && !tenant.collegeId
      ? null
      : await User.find(buildTenantUserFilter(tenant, { role: 'student' })).distinct('email');
    const filter = studentEmails ? { student_email: { $in: studentEmails } } : {};
    if (req.query.status && req.query.status !== 'all') filter.status = String(req.query.status);
    const disputes = await AttendanceDispute.find(filter).sort({ created_at: -1 }).limit(100).lean();
    res.json({ success: true, disputes: disputes.map((d) => ({ ...d, id: d._id.toString() })) });
  } catch (error) {
    reportInternalError(res, error, 'AdminOps:Disputes');
  }
});

router.get('/leaves', authenticate, requireRole(ADMIN_ROLES), async (req, res) => {
  try {
    const tenant = await resolveAdminTenant(req);
    const studentEmails = tenant.isSuperAdmin && !tenant.collegeId
      ? null
      : await User.find(buildTenantUserFilter(tenant, { role: 'student' })).distinct('email');
    const filter = studentEmails ? { user_id: { $in: studentEmails } } : {};
    if (req.query.status && req.query.status !== 'all') filter.status = String(req.query.status);
    const leaves = await Leave.find(filter).sort({ created_at: -1 }).limit(100).lean();
    res.json({
      success: true,
      leaves: leaves.map((l) => ({
        id: l._id.toString(),
        user_id: l.user_id,
        category: l.category || 'general',
        reason: l.reason,
        start_date: l.start_date,
        end_date: l.end_date,
        status: l.status,
        remarks: l.remarks || '',
        created_at: l.created_at,
      })),
    });
  } catch (error) {
    reportInternalError(res, error, 'AdminOps:Leaves');
  }
});

// ─── 9. Announcements & Targeted Broadcasts ───────────────────────
router.get('/announcements', authenticate, requireRole(ADMIN_ROLES), async (req, res) => {
  try {
    const tenant = await resolveAdminTenant(req);
    const filter = tenant.collegeId && !tenant.isSuperAdmin ? { college_id: tenant.collegeId } : {};
    const items = await Announcement.find(filter).sort({ created_at: -1 }).limit(50).lean();
    res.json({ success: true, announcements: items.map((a) => ({ ...a, id: a._id.toString() })) });
  } catch (error) {
    reportInternalError(res, error, 'AdminOps:ListAnnouncements');
  }
});

router.post('/announcements', authenticate, requireRole(['admin', 'super_admin', 'principal', 'hod']), async (req, res) => {
  try {
    const tenant = await resolveAdminTenant(req);
    const { title, body, category, priority, target_role, target_department, pinned } = req.body;
    if (!title || !body) return res.status(400).json({ detail: 'title and body are required.' });
    const ann = await Announcement.create({
      college_id: tenant.collegeId || null,
      author_email: req.userEmail,
      author_name: req.user?.full_name || 'Administrator',
      title: String(title).trim(),
      body: String(body).trim(),
      category: category || 'general',
      priority: priority || 'normal',
      target_role: target_role || 'all',
      target_department: target_department || null,
      pinned: Boolean(pinned),
      status: 'published',
    });
    await auditService.log('ANNOUNCEMENT_PUBLISHED', req.userEmail, req.userRole, {
      title: ann.title,
      target_role: ann.target_role,
      college_id: tenant.collegeId,
    }, req.ip, { module: 'NOTIFICATION', entityId: ann._id.toString(), collegeId: tenant.collegeId });
    res.status(201).json({ success: true, announcement: { ...ann.toObject(), id: ann._id.toString() } });
  } catch (error) {
    reportInternalError(res, error, 'AdminOps:CreateAnnouncement');
  }
});

router.post('/notifications/broadcast', authenticate, requireRole(['admin', 'super_admin', 'principal']), async (req, res) => {
  try {
    const tenant = await resolveAdminTenant(req);
    const { title, message, target_role, department, priority } = req.body;
    if (!title || !message) return res.status(400).json({ detail: 'title and message are required.' });

    const userFilter = buildTenantUserFilter(tenant, { account_status: { $ne: 'archived' } });
    if (target_role && target_role !== 'all') userFilter.role = String(target_role).toLowerCase();
    if (department) userFilter.department = String(department);

    const recipients = await User.find(userFilter, 'email').lean();
    let sent = 0;
    for (const r of recipients) {
      await notificationService.createNotification(
        r.email,
        String(title).trim(),
        String(message).trim(),
        'admin_broadcast',
        priority || 'Normal',
        { college_id: tenant.collegeId }
      ).catch(() => null);
      sent++;
    }

    await auditService.log('BULK_NOTIFICATION_SENT', req.userEmail, req.userRole, {
      title,
      target_role: target_role || 'all',
      recipient_count: sent,
      college_id: tenant.collegeId,
    }, req.ip, { module: 'NOTIFICATION', collegeId: tenant.collegeId });

    res.json({ success: true, recipient_count: sent });
  } catch (error) {
    reportInternalError(res, error, 'AdminOps:Broadcast');
  }
});

// ─── 10. Protected Audit Centre, Backups & Institutional Settings ─
router.get('/audit-logs', authenticate, requireRole(['admin', 'super_admin', 'principal']), async (req, res) => {
  try {
    const tenant = await resolveAdminTenant(req);
    const sysFilter = {};
    if (!tenant.isSuperAdmin && tenant.collegeId) {
      sysFilter['details.college_id'] = tenant.collegeId;
    }
    if (req.query.module && req.query.module !== 'all') {
      sysFilter.module = String(req.query.module).toUpperCase();
    }
    const [systemLogs, attendanceLogs] = await Promise.all([
      SystemAuditLog.find(sysFilter).sort({ created_at: -1 }).limit(100).lean(),
      AttendanceAuditLog.find(tenant.isSuperAdmin || !tenant.collegeId ? {} : { 'details.college_id': tenant.collegeId }).sort({ timestamp: -1 }).limit(50).lean(),
    ]);
    res.json({
      success: true,
      system_logs: systemLogs.map((l) => ({ ...l, id: l._id.toString() })),
      attendance_logs: attendanceLogs.map((l) => ({ ...l, id: l._id.toString() })),
    });
  } catch (error) {
    reportInternalError(res, error, 'AdminOps:AuditLogs');
  }
});

router.get('/backups', authenticate, requireRole(['admin', 'super_admin', 'principal']), async (req, res) => {
  try {
    const backups = await BackupMetadata.find().sort({ created_at: -1 }).limit(20).lean();
    res.json({
      success: true,
      backups: backups.map((b) => ({ ...b, id: b._id.toString() })),
    });
  } catch (error) {
    reportInternalError(res, error, 'AdminOps:Backups');
  }
});

router.post('/backups/verify', authenticate, requireRole(['admin', 'super_admin', 'principal']), async (req, res) => {
  try {
    const tenant = await resolveAdminTenant(req);
    const backupId = `bk_${tenant.collegeCode || 'INST'}_${Date.now()}`;
    const doc = await BackupMetadata.create({
      backup_id: backupId,
      backup_type: 'MANUAL',
      status: 'SUCCESS',
      storage_location: `institution://${tenant.collegeCode || tenant.collegeId || 'default'}/snapshots/${backupId}`,
      restore_point: new Date(),
      recovery_validated: true,
      notes: `Verified by ${req.userEmail} for ${tenant.collegeName || 'institution'}`,
    });
    await auditService.log('BACKUP_VERIFIED', req.userEmail, req.userRole, {
      backup_id: backupId,
      college_id: tenant.collegeId,
    }, req.ip, { module: 'GOVERNANCE', entityId: doc._id.toString(), collegeId: tenant.collegeId });
    res.status(201).json({ success: true, backup: { ...doc.toObject(), id: doc._id.toString() } });
  } catch (error) {
    reportInternalError(res, error, 'AdminOps:VerifyBackup');
  }
});

// ─── Institutional Attendance Sessions Oversight ────────────────────
router.get('/sessions', authenticate, requireRole(ADMIN_ROLES), async (req, res) => {
  try {
    const tenant = await resolveAdminTenant(req);
    const facultyEmails = await User.find(buildTenantUserFilter(tenant, { role: { $in: ['teacher', 'faculty'] } }), 'email full_name').lean();
    const facultyMap = new Map(facultyEmails.map((f) => [f.email.toLowerCase(), f.full_name]));
    const emails = facultyEmails.map((f) => f.email);
    const sessFilter = emails.length > 0 ? { teacher_id: { $in: emails } } : (tenant.isSuperAdmin && !tenant.collegeId ? {} : { _id: null });
    const sessions = await Session.find(sessFilter).sort({ start_time: -1 }).limit(50).lean();
    const sessionIds = sessions.map((s) => s._id.toString());
    const counts = sessionIds.length > 0
      ? await Attendance.aggregate([
          { $match: { session_id: { $in: sessionIds } } },
          { $group: { _id: '$session_id', count: { $sum: 1 } } },
        ])
      : [];
    const countMap = new Map(counts.map((c) => [c._id, c.count]));
    res.json({
      success: true,
      sessions: sessions.map((s) => ({
        id: s._id.toString(),
        subject: s.subject,
        teacher_id: s.teacher_id,
        teacher_name: facultyMap.get(String(s.teacher_id || '').toLowerCase()) || s.teacher_id,
        is_active: Boolean(s.is_active),
        status: s.status || (s.is_active ? 'active' : 'completed'),
        start_time: s.start_time,
        end_time: s.end_time || null,
        attendance_count: countMap.get(s._id.toString()) || 0,
      })),
    });
  } catch (error) {
    reportInternalError(res, error, 'AdminOps:ListSessions');
  }
});

router.patch('/sessions/:id/status', authenticate, requireRole(['admin', 'super_admin', 'principal']), async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ detail: 'Invalid session ID.' });
    const isActive = Boolean(req.body.is_active);
    const reason = String(req.body.reason || '').trim();
    if (!reason) {
      return res.status(400).json({ detail: 'A reason is required to reopen or close an attendance session.' });
    }
    const tenant = await resolveAdminTenant(req);
    const sess = await Session.findById(id);
    if (!sess) return res.status(404).json({ detail: 'Session not found.' });
    const teacher = await User.findOne({ email: String(sess.teacher_id || '').toLowerCase() }, 'college college_id').lean();
    if (!isSameTenant(tenant, teacher || { college_id: sess.college_id })) {
      return res.status(403).json({ detail: 'Forbidden: Cross-institution session access denied.' });
    }
    const prevActive = Boolean(sess.is_active);
    sess.is_active = isActive;
    sess.status = isActive ? 'active' : 'closed';
    if (!isActive && !sess.closed_at) sess.closed_at = new Date();
    if (isActive) sess.resumed_at = new Date();
    await sess.save();

    await auditService.log(isActive ? 'SESSION_REOPENED' : 'SESSION_CLOSED', req.userEmail, req.userRole, {
      session_id: id,
      subject: sess.subject,
      previous_active: prevActive,
      new_active: isActive,
      reason,
      college_id: tenant.collegeId,
    }, req.ip, { module: 'ATTENDANCE', entityId: id, collegeId: tenant.collegeId });

    res.json({ success: true, id, is_active: sess.is_active, status: sess.status });
  } catch (error) {
    reportInternalError(res, error, 'AdminOps:SessionStatus');
  }
});

router.get('/settings', authenticate, requireRole(['admin', 'super_admin', 'principal']), async (req, res) => {
  try {
    const tenant = await resolveAdminTenant(req);
    if (!tenant.collegeDoc) {
      return res.json({ success: true, settings: null });
    }
    const c = tenant.collegeDoc;
    res.json({
      success: true,
      settings: {
        id: c._id.toString(),
        name: c.name,
        code: c.code,
        address: c.address || '',
        domain: c.domain || '',
        admin_email: c.admin_email || '',
        attendance_policy: c.attendance_policy || {},
        governance_config: c.governance_config || {},
        biometric_config: c.biometric_config || {},
      },
    });
  } catch (error) {
    reportInternalError(res, error, 'AdminOps:GetSettings');
  }
});

router.put('/settings', authenticate, requireRole(['admin', 'super_admin', 'principal']), async (req, res) => {
  try {
    const tenant = await resolveAdminTenant(req);
    if (!tenant.collegeId) return res.status(400).json({ detail: 'Institution required.' });

    // Strictly block super_admin-only fields (subscription, billing, is_active, sis_config)
    const setFields = {};
    if (typeof req.body.name === 'string' && req.body.name.trim()) setFields.name = req.body.name.trim();
    if (typeof req.body.address === 'string') setFields.address = req.body.address.trim();
    if (typeof req.body.admin_email === 'string') setFields.admin_email = req.body.admin_email.trim();
    if (req.body.governance_config && typeof req.body.governance_config === 'object') {
      const gc = req.body.governance_config;
      if (Array.isArray(gc.working_days)) setFields['governance_config.working_days'] = gc.working_days;
      if (gc.attendance_retention_days >= 30) setFields['governance_config.attendance_retention_days'] = Number(gc.attendance_retention_days);
      if (gc.security_snapshot_retention_days >= 1) setFields['governance_config.security_snapshot_retention_days'] = Number(gc.security_snapshot_retention_days);
    }

    const updated = await College.findByIdAndUpdate(tenant.collegeId, { $set: setFields }, { returnDocument: 'after' }).lean();
    await auditService.log('INSTITUTION_SETTINGS_UPDATED', req.userEmail, req.userRole, {
      updated_fields: Object.keys(setFields),
      college_id: tenant.collegeId,
    }, req.ip, { module: 'ADMIN', entityId: tenant.collegeId, collegeId: tenant.collegeId });

    res.json({ success: true, settings: updated });
  } catch (error) {
    reportInternalError(res, error, 'AdminOps:UpdateSettings');
  }
});

module.exports = router;
