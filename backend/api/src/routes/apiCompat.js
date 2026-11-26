const express = require('express');

const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const studentProfileKeys = new Set([
  'full_name',
  'phone',
  'dob',
  'gender',
  'address',
  'parent_details',
  'language_preference',
  'theme_preference',
  'setup_completed',
]);

const parentProfileKeys = new Set([
  ...studentProfileKeys,
  'linked_children',
]);

const teacherProfileKeys = new Set([
  ...studentProfileKeys,
  'designation',
  'specialization',
  'qualification',
  'experience',
]);

const staffProfileKeys = new Set([
  ...teacherProfileKeys,
  'department',
  'college',
  'semester',
  'student_id',
  'employee_id',
  'usn',
  'course',
  'section',
  'roll_number',
  'linked_children',
]);

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
    const role = (req.userRole || '').toLowerCase();
    const allowed = ['admin', 'super_admin'].includes(role)
      ? staffProfileKeys
      : (role === 'teacher'
        ? teacherProfileKeys
        : (role === 'parent' ? parentProfileKeys : studentProfileKeys));
    const updateFields = {};
    allowed.forEach((key) => {
      if (req.body[key] !== undefined && req.body[key] !== null) {
        updateFields[key] = typeof req.body[key] === 'string' ? req.body[key].trim().slice(0, 500) : req.body[key];
      }
    });

    await User.updateOne({ email: req.userEmail }, { $set: updateFields });
    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ detail: 'Unable to update profile.' });
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
