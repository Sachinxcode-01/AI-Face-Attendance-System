const express = require('express');

const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const profileKeys = [
  'full_name',
  'phone',
  'department',
  'dob',
  'college',
  'semester',
  'student_id',
  'employee_id',
  'designation',
  'specialization',
  'qualification',
  'experience',
  'gender',
  'address',
  'usn',
  'course',
  'section',
  'roll_number',
  'parent_details',
  'language_preference',
  'linked_children',
  'setup_completed',
];

router.get('/health', async (req, res) => {
  res.json({
    success: true,
    message: 'Server running',
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

router.patch('/profile', authenticate, async (req, res) => {
  try {
    const updateFields = {};
    profileKeys.forEach((key) => {
      if (req.body[key] !== undefined && req.body[key] !== null) {
        updateFields[key] = req.body[key];
      }
    });

    await User.updateOne({ email: req.userEmail }, { $set: updateFields });
    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

router.patch('/settings', authenticate, async (req, res) => {
  try {
    const updateFields = {};
    if (req.body.language_preference !== undefined) {
      updateFields.language_preference = req.body.language_preference;
    }
    if (req.body.setup_completed !== undefined) {
      updateFields.setup_completed = req.body.setup_completed;
    }

    if (Object.keys(updateFields).length > 0) {
      await User.updateOne({ email: req.userEmail }, { $set: updateFields });
    }

    res.json({ success: true, message: 'Settings updated successfully' });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

router.get('/parent/wards', authenticate, async (req, res) => {
  try {
    const parent = await User.findOne({ email: req.userEmail }).lean();
    if (!parent) {
      return res.status(404).json({ detail: 'User not found' });
    }

    const linkedChildren = Array.isArray(parent.linked_children)
      ? parent.linked_children
      : [];
    const linkedEmails = linkedChildren
      .map((child) => (typeof child === 'string' ? child : child.email))
      .filter(Boolean);

    const students = linkedEmails.length
      ? await User.find({ email: { $in: linkedEmails }, role: 'student' }).lean()
      : [];

    const wards = students.map((student) => ({
      email: student.email,
      full_name: student.full_name,
      student_id: student.student_id || student.usn || '',
      department: student.department || '',
      attendance_percentage: student.attendance_percentage || null,
    }));

    res.json({ success: true, wards });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

module.exports = router;
