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
  if (!parent) return [];
  return Array.isArray(parent.children) ? parent.children : [];
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

module.exports = router;
