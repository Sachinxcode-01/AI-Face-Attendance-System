const datasetService = require('../services/datasetService');
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Timetable = require('../models/Timetable');
const Holiday = require('../models/Holiday');
const Leave = require('../models/Leave');
const Session = require('../models/Session');
const Attendance = require('../models/Attendance');
const { authenticate, requireRole } = require('../middleware/auth');

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
    let queryId = req.userEmail;

    if (req.userRole === 'student') {
      const user = await User.findOne({ email: req.userEmail });
      if (user && user.department && user.semester) {
        queryId = `${user.department.toUpperCase()}_${user.semester}_${user.section || 'A'}`;
      } else {
        queryId = "CSE_6_A"; // Fallback class
      }
    }

    const timetable = await Timetable.find({ user_id: queryId.toUpperCase() }).lean();

    if (timetable.length === 0) {
      // Fallback mocks
      return res.json([
        { id: "slot-1", subject: "Software Engineering (CSE-302)", day: "Monday", time: "09:00 AM - 10:30 AM", room: "Room 401" },
        { id: "slot-2", subject: "Machine Learning (CSE-303)", day: "Monday", time: "11:00 AM - 12:30 PM", room: "Lab 3" },
        { id: "slot-3", subject: "Cloud Computing (CSE-304)", day: "Tuesday", time: "10:00 AM - 11:30 AM", room: "Room 402" }
      ]);
    }

    const formatted = timetable.map(item => {
      item.id = item._id.toString();
      delete item._id;
      return item;
    });

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// POST /academic/timetable
router.post('/timetable', authenticate, requireRole(['admin', 'teacher']), async (req, res) => {
  try {
    const { user_id, subject, day, time, room } = req.body;
    if (!user_id || !subject || !day || !time) {
      return res.status(400).json({ detail: "Missing required fields (user_id, subject, day, time)." });
    }

    const entry = new Timetable({
      user_id: user_id.toUpperCase(),
      subject,
      day,
      time,
      room: room || ""
    });

    await entry.save();
    const entryObj = entry.toObject();
    entryObj.id = entryObj._id.toString();
    delete entryObj._id;

    res.status(201).json(entryObj);
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

// GET /academic/holidays
router.get('/holidays', authenticate, async (req, res) => {
  try {
    const holidays = await Holiday.find().sort({ date: 1 }).lean();
    if (holidays.length === 0) {
      // Default fallback mocks
      return res.json([
        { id: "h-1", title: "Independence Day", date: "2026-08-15T00:00:00.000Z", description: "National Holiday" },
        { id: "h-2", title: "Labor Day", date: "2026-09-07T00:00:00.000Z", description: "Institutional Holiday" }
      ]);
    }
    const formatted = holidays.map(h => {
      h.id = h._id.toString();
      delete h._id;
      return h;
    });
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// POST /academic/holidays
router.post('/holidays', authenticate, requireRole(['admin']), async (req, res) => {
  try {
    const { title, date, description } = req.body;
    if (!title || !date) {
      return res.status(400).json({ detail: "Title and date are required." });
    }
    const holiday = new Holiday({
      title,
      date: new Date(date),
      description: description || ""
    });
    await holiday.save();
    const hObj = holiday.toObject();
    hObj.id = hObj._id.toString();
    delete hObj._id;
    res.status(201).json(hObj);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// GET /academic/calendar
router.get('/calendar', authenticate, async (req, res) => {
  try {
    const email = req.userEmail;
    
    // Fetch user leaves
    const leaves = await Leave.find({ user_id: email }).lean();
    const leaveEvents = leaves.map(l => ({
      id: l._id.toString(),
      title: `Leave: ${l.reason}`,
      type: "leave",
      start_date: l.start_date,
      end_date: l.end_date,
      status: l.status // Approved, Pending, Rejected
    }));

    // Fetch holidays
    const holidays = await Holiday.find().lean();
    const holidayEvents = holidays.map(h => ({
      id: h._id.toString(),
      title: h.title,
      type: "holiday",
      start_date: h.date,
      end_date: h.date,
      description: h.description
    }));

    // Fetch marked attendance logs for student
    let attendanceEvents = [];
    if (req.userRole === 'student') {
      try {
        if (require('mongoose').connection.readyState === 1) {
          const records = await Attendance.find({ student_email: email }).lean();
          for (const rec of records) {
            try {
              const session = await Session.findById(rec.session_id);
              if (session) {
                attendanceEvents.push({
                  id: rec._id.toString(),
                  title: `Attended: ${session.subject}`,
                  type: "attendance",
                  start_date: rec.timestamp,
                  end_date: rec.timestamp,
                  status: rec.status || "Present"
                });
              }
            } catch (err) {}
          }
        }
      } catch (_) {}

      if (attendanceEvents.length === 0) {
        const dsLogs = datasetService.getStudentLogs(email, { limit: 500 }).logs;
        for (const log of dsLogs) {
          if (log.status.toLowerCase() === 'present') {
            attendanceEvents.push({
              id: log.id,
              title: `Attended: ${log.subject}`,
              type: "attendance",
              start_date: `${log.date}T${log.time}:00Z`,
              end_date: `${log.date}T${log.time}:00Z`,
              status: "Present"
            });
          }
        }
      }
    }

    // Default mock holidays if none found
    if (holidayEvents.length === 0) {
      holidayEvents.push(
        { id: "mh-1", title: "Independence Day", type: "holiday", start_date: "2026-08-15T00:00:00.000Z", end_date: "2026-08-15T00:00:00.000Z" },
        { id: "mh-2", title: "Labor Day", type: "holiday", start_date: "2026-09-07T00:00:00.000Z", end_date: "2026-09-07T00:00:00.000Z" }
      );
    }

    res.json({
      leaves: leaveEvents,
      holidays: holidayEvents,
      attendance: attendanceEvents
    });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

module.exports = router;
