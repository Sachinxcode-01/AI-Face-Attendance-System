const express = require('express');
const router = express.Router();

const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Session = require('../models/Session');
const Leave = require('../models/Leave');
const { authenticate, requireRole } = require('../middleware/auth');

// Resolve the authenticated parent's linked children emails.
async function getLinkedChildren(parentEmail) {
  const parent = await User.findOne({ email: parentEmail }).lean();
  const directChildren = parent && Array.isArray(parent.children) ? parent.children : [];
  const linkedChildren = parent && Array.isArray(parent.linked_children) ? parent.linked_children.map((c) => c.email) : [];
  
  // Also discover students who list this parent's email as their parent_details
  const reverseStudents = await User.find({
    role: 'student',
    parent_details: { $regex: new RegExp(`^${parentEmail}$`, 'i') }
  }).select('email').lean();
  const reverseEmails = reverseStudents.map(s => s.email);

  const combined = Array.from(new Set([...directChildren, ...linkedChildren, ...reverseEmails].filter(Boolean)));
  return combined;
}

// Guard: ensure the requested child belongs to the parent (admins bypass).
async function authorizeChildAccess(req, childEmail) {
  if (req.userRole && req.userRole.toLowerCase() === 'admin') return true;
  const children = await getLinkedChildren(req.userEmail);
  return children.map((c) => c.toLowerCase()).includes(childEmail.toLowerCase());
}

// GET /parent/children - list linked wards
router.get('/children', authenticate, requireRole(['parent', 'admin']), async (req, res) => {
  try {
    const childEmails = await getLinkedChildren(req.userEmail);
    if (childEmails.length === 0) return res.json([]);
    const students = await User.find({ email: { $in: childEmails } }).lean();
    const result = students.map((s) => ({
      email: s.email,
      full_name: s.full_name,
      student_id: s.student_id || s.usn || '',
      department: s.department || '',
      semester: s.semester || '',
    }));
    res.json(result);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// GET /parent/child/stats/:email - attendance summary for a ward
router.get('/child/stats/:email', authenticate, requireRole(['parent', 'admin']), async (req, res) => {
  try {
    const { email } = req.params;
    if (!(await authorizeChildAccess(req, email))) {
      return res.status(403).json({ detail: 'Forbidden: This student is not linked to your account.' });
    }
    const records = await Attendance.find({ student_email: email }).lean();
    const totalSessions = await Session.countDocuments({});
    const total = Math.max(totalSessions, records.length, 1);
    const present = records.filter((r) => r.status === 'Present').length;
    const overall = Math.min(1, present / total);
    res.json({
      overall_percentage: overall,
      standing: overall >= 0.75 ? 'Good' : 'At Risk',
      subjects: [{ subject: 'Overall', present, total }],
    });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// GET /parent/child/attendance-logs/:email - recent check-ins for a ward
router.get('/child/attendance-logs/:email', authenticate, requireRole(['parent', 'admin']), async (req, res) => {
  try {
    const { email } = req.params;
    if (!(await authorizeChildAccess(req, email))) {
      return res.status(403).json({ detail: 'Forbidden: This student is not linked to your account.' });
    }
    const records = await Attendance.find({ student_email: email })
      .sort({ timestamp: -1 })
      .limit(10)
      .lean();
    const result = records.map((r) => ({
      date: new Date(r.timestamp).toISOString().split('T')[0],
      subject: 'Class Session',
      status: r.status,
      verifiedBy: r.verified_by,
    }));
    res.json(result);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// GET /parent/child/leaves/:email - leave history for a ward
router.get('/child/leaves/:email', authenticate, requireRole(['parent', 'admin']), async (req, res) => {
  try {
    const { email } = req.params;
    if (!(await authorizeChildAccess(req, email))) {
      return res.status(403).json({ detail: 'Forbidden: This student is not linked to your account.' });
    }
    const leaves = await Leave.find({ user_id: email }).sort({ created_at: -1 }).lean();
    const result = leaves.map((l) => {
      l.id = l._id.toString();
      delete l._id;
      return l;
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// POST /parent/child/absence-notice - submit absence note for a ward
router.post('/child/absence-notice', authenticate, requireRole(['parent', 'admin']), async (req, res) => {
  try {
    const { childEmail, reason, date } = req.body;
    if (!childEmail || !reason) {
      return res.status(400).json({ detail: 'Child email and reason are required.' });
    }
    if (!(await authorizeChildAccess(req, childEmail))) {
      return res.status(403).json({ detail: 'Forbidden: This student is not linked to your account.' });
    }
    const targetDate = date || new Date().toISOString().split('T')[0];
    const leave = await Leave.create({
      user_id: childEmail,
      reason: `[Parent Notice: ${req.userEmail}] ${reason}`,
      start_date: targetDate,
      end_date: targetDate,
      status: 'Pending',
      remarks: 'Submitted by parent'
    });
    res.status(201).json({ success: true, message: 'Absence notice recorded successfully.', leaveId: leave._id });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// POST /parent/link-student - Link a student ward to parent account
router.post('/link-student', authenticate, requireRole(['parent', 'admin']), async (req, res) => {
  try {
    const { student_email, student_id } = req.body;
    if (!student_email && !student_id) {
      return res.status(400).json({ detail: 'Student email or student ID is required.' });
    }

    const query = student_email
      ? { email: student_email.trim().toLowerCase(), role: 'student' }
      : { $or: [{ student_id: student_id.trim() }, { roll_number: student_id.trim() }], role: 'student' };

    const student = await User.findOne(query);
    if (!student) {
      return res.status(404).json({ detail: 'Student not found in institutional directory.' });
    }

    await User.findOneAndUpdate(
      { email: req.userEmail },
      {
        $addToSet: {
          children: student.email,
          linked_children: {
            email: student.email,
            full_name: student.full_name,
            student_id: student.student_id || student.roll_number || ''
          }
        }
      }
    );

    // Also update student's parent_details
    await User.findOneAndUpdate(
      { email: student.email },
      { $set: { parent_details: req.userEmail } }
    );

    res.json({
      success: true,
      message: `Ward ${student.full_name} (${student.email}) linked successfully.`,
      student: {
        email: student.email,
        full_name: student.full_name,
        student_id: student.student_id || student.roll_number,
        department: student.department
      }
    });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

module.exports = router;
