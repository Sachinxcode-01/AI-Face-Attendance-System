const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

// GET /academic/dashboard
router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const userEmail = req.userEmail || "alice@smartface.pro";
    const user = await User.findOne({ email: userEmail });
    res.json({
      student: {
        name: user ? user.full_name : "Alice Cooper",
        email: userEmail
      },
      ai_insights: [
        "Your academic standing is strong, with outstanding marks in Software Engineering.",
        "Your biometric verification rate is optimal (100% check-in confidence)."
      ]
    });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// GET /academic/timetable
router.get('/timetable', authenticate, async (req, res) => {
  try {
    res.json([
      { id: "slot-1", subject: "Software Engineering (CSE-302)", day: "Monday", time: "09:00 AM - 10:30 AM" },
      { id: "slot-2", subject: "Machine Learning (CSE-303)", day: "Monday", time: "11:00 AM - 12:30 PM" },
      { id: "slot-3", subject: "Cloud Computing (CSE-304)", day: "Tuesday", time: "10:00 AM - 11:30 AM" }
    ]);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// GET /academic/assignments
router.get('/assignments', authenticate, async (req, res) => {
  try {
    res.json([
      {
        id: "asgn-302",
        course_code: "CSE-302",
        title: "Software Requirement Specification (SRS)",
        max_points: 50,
        submission: {
          grade: 46,
          submitted_at: "2026-06-10T14:30:00Z"
        }
      },
      {
        id: "asgn-303",
        course_code: "CSE-303",
        title: "K-Means Clustering Implementation",
        max_points: 100,
        submission: {
          grade: 90,
          submitted_at: "2026-06-12T10:00:00Z"
        }
      }
    ]);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// GET /academic/exams
router.get('/exams', authenticate, async (req, res) => {
  try {
    res.json([
      { id: "exam-1", subject: "Software Engineering (CSE-302)", date: "2026-06-25", time: "02:00 PM" },
      { id: "exam-2", subject: "Machine Learning (CSE-303)", date: "2026-06-28", time: "09:30 AM" }
    ]);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// GET /academic/results
router.get('/results', authenticate, async (req, res) => {
  try {
    res.json({
      cgpa: 9.2,
      sgpa: 9.4,
      results: [
        { course: "Software Engineering", grade: "S", marks: 92 },
        { course: "Machine Learning", grade: "A", marks: 88 }
      ]
    });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// GET /academic/success-score
router.get('/success-score', authenticate, async (req, res) => {
  try {
    res.json({
      success_score: 88
    });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// GET /academic/documents
router.get('/documents', authenticate, async (req, res) => {
  try {
    res.json([
      { id: "doc-1", type: "ID Card", status: "Approved" },
      { id: "doc-2", type: "Hall Ticket", status: "Approved" }
    ]);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

module.exports = router;
