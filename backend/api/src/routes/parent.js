const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Session = require('../models/Session');
const Leave = require('../models/Leave');
const { authenticate, requireRole } = require('../middleware/auth');

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Resolve the authenticated parent's linked children emails (approved links only).
async function getLinkedChildren(parentEmail) {
  const emailRegex = new RegExp(`^${escapeRegex(parentEmail)}$`, 'i');
  const parent = await User.findOne({ email: emailRegex }).lean();
  const directChildren = parent && Array.isArray(parent.children) ? parent.children : [];
  const linkedChildren = parent && Array.isArray(parent.linked_children) ? parent.linked_children.map((c) => c.email) : [];

  const combined = Array.from(new Set([...directChildren, ...linkedChildren].filter(Boolean)));
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

    const isAdmin = req.userRole && req.userRole.toLowerCase() === 'admin';
            const studentConfirmsParent = Boolean(
              student.parent_details &&
              student.parent_details.trim().toLowerCase() === req.userEmail.toLowerCase()
            );
            if(!isAdmin && !studentConfirmsParent) {
      return res.status(403).json({
        detail: 'Forbidden: Parent-student relationship must be confirmed by the student or an administrator.'
      });
    }

    const parentFilter = { email: new RegExp(`^${escapeRegex(req.userEmail)}$`, 'i') };
    const parentUpdate = {
      $addToSet: {
        children: student.email,
        linked_children: {
          email: student.email,
          full_name: student.full_name,
          student_id: student.student_id || student.roll_number || ''
        }
      }
    };
    const studentFilter = { email: student.email };
    const studentUpdate = { $set: { parent_details: req.userEmail } };

    const dbSession = await mongoose.startSession();
    try {
      await dbSession.withTransaction(async () => {
        await User.findOneAndUpdate(parentFilter, parentUpdate, { session: dbSession });
        await User.findOneAndUpdate(studentFilter, studentUpdate, { session: dbSession });
      });
    } catch (txErr) {
      // Fallback for standalone MongoDB instances without replica-set transactions: manual rollback
      if (txErr && (txErr.code === 20 || /Transaction numbers are only allowed/i.test(txErr.message))) {
        const previousParent = await User.findOne(parentFilter).select('children linked_children').lean();
        await User.findOneAndUpdate(parentFilter, parentUpdate);
        try {
          await User.findOneAndUpdate(studentFilter, studentUpdate);
        } catch (studentErr) {
          if (previousParent) {
            await User.updateOne(parentFilter, {
              $set: {
                children: previousParent.children || [],
                linked_children: previousParent.linked_children || []
              }
            });
          }
          throw studentErr;
        }
      } else {
        throw txErr;
      }
    } finally {
  await dbSession.endSession();
}

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
