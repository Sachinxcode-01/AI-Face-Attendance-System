const datasetService = require('../services/datasetService');
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
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
      // Fallback mocks with Monday to Saturday schedule
      return res.json([
        { id: "slot-1", subject: "Software Engineering (CSE-302)", day: "Monday", time: "09:00 AM - 10:30 AM", room: "Room 401", teacher: "Dr. Sarah Jenkins" },
        { id: "slot-2", subject: "Machine Learning (CSE-303)", day: "Monday", time: "11:00 AM - 12:30 PM", room: "Lab 3", teacher: "Prof. Alan Turing" },
        { id: "slot-3", subject: "Cloud Computing (CSE-304)", day: "Tuesday", time: "10:00 AM - 11:30 AM", room: "Room 402", teacher: "Dr. Lisa Su" },
        { id: "slot-4", subject: "Computer Networks (CSE-305)", day: "Wednesday", time: "09:00 AM - 10:30 AM", room: "Room 301", teacher: "Prof. Andrew Tanenbaum" },
        { id: "slot-5", subject: "Database Systems Lab (CSE-306)", day: "Thursday", time: "02:00 PM - 04:00 PM", room: "Lab 2", teacher: "Dr. Edgar Codd" },
        { id: "slot-6", subject: "Cybersecurity & Cryptography (CSE-307)", day: "Friday", time: "11:00 AM - 12:30 PM", room: "Auditorium B", teacher: "Prof. Whitfield Diffie" },
        { id: "slot-7", subject: "Capstone Project & Industry Mentorship (CSE-308)", day: "Saturday", time: "09:30 AM - 12:30 PM", room: "Innovation Hub", teacher: "Dr. Sarah Jenkins" }
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
router.post('/timetable', authenticate, requireRole(['admin', 'teacher', 'super_admin']), async (req, res) => {
  try {
    const { user_id, subject, day, time, room, college_id, teacher_email } = req.body;
    if (typeof user_id !== 'string' || !user_id.trim() || typeof subject !== 'string' || !subject.trim() || typeof day !== 'string' || !day.trim() || typeof time !== 'string' || !time.trim()) {
      return res.status(400).json({ detail: "Missing or invalid required fields (user_id, subject, day, time must be non-empty strings)." });
    }

    const callerCollege = (req.user?.college_id || req.user?.college || "").trim();
    const slotCollege = req.userRole === 'super_admin' ? (typeof college_id === 'string' ? college_id.trim() : "") : callerCollege;

    const entry = new Timetable({
      user_id: user_id.trim().toUpperCase(),
      subject: subject.trim(),
      day: day.trim(),
      time: time.trim(),
      room: typeof room === 'string' ? room.trim() : "",
      college_id: slotCollege,
      teacher_email: typeof teacher_email === 'string' ? teacher_email.trim() : ""
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

// PUT /academic/timetable/:id
router.put('/timetable/:id', authenticate, requireRole(['admin', 'teacher', 'super_admin']), async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ detail: "Invalid timetable ID." });
    }

    const slot = await Timetable.findById(id);
    if (!slot) {
      return res.status(404).json({ detail: "Timetable slot not found." });
    }

    const callerCollege = (req.user?.college_id || req.user?.college || "").trim();
    const slotCollege = (slot.college_id || "").trim();
    if (req.userRole !== 'super_admin' && slotCollege !== callerCollege) {
      return res.status(403).json({ detail: "Forbidden: Cannot edit timetable slot for another college." });
    }

    const updates = {};
    if (req.body.user_id !== undefined) {
      if (typeof req.body.user_id !== 'string' || !req.body.user_id.trim()) {
        return res.status(400).json({ detail: "user_id must be a non-empty string." });
      }
      updates.user_id = req.body.user_id.trim().toUpperCase();
    }
    if (req.body.subject !== undefined) {
      if (typeof req.body.subject !== 'string' || !req.body.subject.trim()) {
        return res.status(400).json({ detail: "subject must be a non-empty string." });
      }
      updates.subject = req.body.subject.trim();
    }
    if (req.body.day !== undefined) {
      if (typeof req.body.day !== 'string' || !req.body.day.trim()) {
        return res.status(400).json({ detail: "day must be a non-empty string." });
      }
      updates.day = req.body.day.trim();
    }
    if (req.body.time !== undefined) {
      if (typeof req.body.time !== 'string' || !req.body.time.trim()) {
        return res.status(400).json({ detail: "time must be a non-empty string." });
      }
      updates.time = req.body.time.trim();
    }
    if (req.body.room !== undefined) updates.room = typeof req.body.room === 'string' ? req.body.room.trim() : "";
    if (req.userRole === 'super_admin' && req.body.college_id !== undefined) {
      updates.college_id = typeof req.body.college_id === 'string' ? req.body.college_id.trim() : "";
    }
    if (req.body.teacher_email !== undefined) updates.teacher_email = typeof req.body.teacher_email === 'string' ? req.body.teacher_email.trim() : "";

    const updated = await Timetable.findByIdAndUpdate(id, updates, { new: true }).lean();
    updated.id = updated._id.toString();
    delete updated._id;
    res.json({ success: true, slot: updated });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// DELETE /academic/timetable/:id
router.delete('/timetable/:id', authenticate, requireRole(['admin', 'teacher', 'super_admin']), async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ detail: "Invalid timetable ID." });
    }

    const slot = await Timetable.findById(id);
    if (!slot) {
      return res.status(404).json({ detail: "Timetable slot not found." });
    }

    const callerCollege = (req.user?.college_id || req.user?.college || "").trim();
    const slotCollege = (slot.college_id || "").trim();
    if (req.userRole !== 'super_admin' && slotCollege !== callerCollege) {
      return res.status(403).json({ detail: "Forbidden: Cannot delete timetable slot for another college." });
    }

    await Timetable.findByIdAndDelete(id).lean();

    res.json({ success: true, message: "Timetable slot deleted successfully.", deleted_id: id });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// POST /academic/timetable/bulk
router.post('/timetable/bulk', authenticate, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { slots, college_id } = req.body;
    if (!Array.isArray(slots) || slots.length === 0) {
      return res.status(400).json({ detail: "slots array is required and must not be empty." });
    }
    if (slots.length > 500) {
      return res.status(400).json({ detail: "Batch limit exceeded (maximum 500 slots per request)." });
    }

    const callerCollege = (req.user?.college_id || req.user?.college || "").trim();
    const targetCollege = req.userRole === 'super_admin' ? (typeof college_id === 'string' ? college_id.trim() : "") : callerCollege;

    const validSlots = [];
    for (const s of slots) {
      if (!s || typeof s.user_id !== 'string' || !s.user_id.trim() || typeof s.subject !== 'string' || !s.subject.trim() || typeof s.day !== 'string' || !s.day.trim() || typeof s.time !== 'string' || !s.time.trim()) {
        return res.status(400).json({ detail: `Invalid entry encountered: ${JSON.stringify(s)}` });
      }
      let slotCollege = callerCollege;
      if (req.userRole === 'super_admin') {
        const trimmed = typeof s.college_id === 'string' ? s.college_id.trim() : "";
        slotCollege = trimmed || targetCollege;
      }
      validSlots.push({
        user_id: s.user_id.trim().toUpperCase(),
        subject: s.subject.trim(),
        day: s.day.trim(),
        time: s.time.trim(),
        room: typeof s.room === 'string' ? s.room.trim() : "",
        college_id: slotCollege,
        teacher_email: typeof s.teacher_email === 'string' ? s.teacher_email.trim() : ""
      });
    }

    const inserted = await Timetable.insertMany(validSlots);
    res.status(201).json({
      success: true,
      count: inserted.length,
      message: `Successfully created ${inserted.length} timetable entries.`
    });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// GET /academic/timetable/conflicts (Smart AI/Heuristic Conflict Detector)
router.get('/timetable/conflicts', authenticate, requireRole(['admin', 'teacher', 'super_admin']), async (req, res) => {
  try {
    const { college_id, day } = req.query;
    const filter = {};
    if (req.userRole === 'super_admin') {
      if (typeof college_id === 'string' && college_id.trim()) {
        filter.college_id = college_id.trim();
      }
    } else {
      filter.college_id = req.user?.college_id || req.user?.college || "";
    }
    if (typeof day === 'string' && day.trim()) {
      filter.day = day.trim();
    }

    const allSlots = await Timetable.find(filter).lean();
    const roomConflicts = [];
    const teacherConflicts = [];

    // Group by room & day
    const roomMap = new Map();
    const teacherMap = new Map();

    for (const slot of allSlots) {
      // Room conflict check
      if (slot.room && slot.room.trim()) {
        const roomKey = `${slot.day}_${slot.room.trim().toUpperCase()}_${slot.time.trim()}`;
        if (roomMap.has(roomKey)) {
          roomConflicts.push({
            type: "room_double_booked",
            room: slot.room,
            day: slot.day,
            time: slot.time,
            slots: [roomMap.get(roomKey), { id: slot._id.toString(), subject: slot.subject, class: slot.user_id }]
          });
        } else {
          roomMap.set(roomKey, { id: slot._id.toString(), subject: slot.subject, class: slot.user_id });
        }
      }

      // Teacher conflict check
      if (slot.teacher_email && slot.teacher_email.trim()) {
        const teacherKey = `${slot.day}_${slot.teacher_email.trim().toLowerCase()}_${slot.time.trim()}`;
        if (teacherMap.has(teacherKey)) {
          teacherConflicts.push({
            type: "teacher_double_booked",
            teacher_email: slot.teacher_email,
            day: slot.day,
            time: slot.time,
            slots: [teacherMap.get(teacherKey), { id: slot._id.toString(), subject: slot.subject, class: slot.user_id }]
          });
        } else {
          teacherMap.set(teacherKey, { id: slot._id.toString(), subject: slot.subject, class: slot.user_id });
        }
      }
    }

    res.json({
      success: true,
      total_slots_checked: allSlots.length,
      conflicts_found: roomConflicts.length + teacherConflicts.length,
      room_conflicts: roomConflicts,
      teacher_conflicts: teacherConflicts
    });
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
router.post('/holidays', authenticate, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { title, date, description } = req.body;
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ detail: "Title is required and must be a non-empty string." });
    }
    if (date === null || (typeof date !== 'string' && typeof date !== 'number') || (typeof date === 'string' && !date.trim())) {
      return res.status(400).json({ detail: "Invalid date format." });
    }
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ detail: "Invalid date format." });
    }
    const holiday = new Holiday({
      title: title.trim(),
      date: parsedDate,
      description: typeof description === 'string' ? description.trim() : ""
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

// PUT /academic/holidays/:id
router.put('/holidays/:id', authenticate, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ detail: "Invalid holiday ID." });
    }
    const updates = {};
    if (req.body.title !== undefined) {
      if (typeof req.body.title !== 'string' || !req.body.title.trim()) {
        return res.status(400).json({ detail: "title must be a non-empty string." });
      }
      updates.title = req.body.title.trim();
    }
    if (req.body.date !== undefined) {
      if (req.body.date === null || (typeof req.body.date !== 'string' && typeof req.body.date !== 'number') || (typeof req.body.date === 'string' && !req.body.date.trim())) {
        return res.status(400).json({ detail: "Invalid date format." });
      }
      const parsedDate = new Date(req.body.date);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ detail: "Invalid date format." });
      }
      updates.date = parsedDate;
    }
    if (req.body.description !== undefined) updates.description = typeof req.body.description === 'string' ? req.body.description.trim() : "";

    const updated = await Holiday.findByIdAndUpdate(id, updates, { new: true }).lean();
    if (!updated) {
      return res.status(404).json({ detail: "Holiday not found." });
    }
    updated.id = updated._id.toString();
    delete updated._id;
    res.json({ success: true, holiday: updated });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// DELETE /academic/holidays/:id
router.delete('/holidays/:id', authenticate, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ detail: "Invalid holiday ID." });
    }
    const deleted = await Holiday.findByIdAndDelete(id).lean();
    if (!deleted) {
      return res.status(404).json({ detail: "Holiday not found." });
    }
    res.json({ success: true, message: "Holiday removed successfully.", deleted_id: id });
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
