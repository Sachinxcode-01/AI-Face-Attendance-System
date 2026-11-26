const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const Timetable = require('../models/Timetable');
const Holiday = require('../models/Holiday');
const Leave = require('../models/Leave');
const Session = require('../models/Session');
const Attendance = require('../models/Attendance');
const Notification = require('../models/Notification');
const { authenticate, requireRole } = require('../middleware/auth');
const { getInstitutionPolicy, buildTimetableKeys, parseSlotTimes, toDateKey } = require('../services/studentAttendanceService');
const cache = require('../utils/cache');

// GET /academic/dashboard
router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const userEmail = req.userEmail;
    const user = await User.findOne({ email: userEmail }).lean();
    if (!user) return res.status(404).json({ detail: 'User not found' });
    const totalAtt = await Attendance.countDocuments({ student_email: userEmail });
    const presentAtt = await Attendance.countDocuments({ student_email: userEmail, status: 'Present' });
    const pct = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : null;
    res.json({
      student: {
        name: user.full_name,
        email: user.email
      },
      ai_insights: pct !== null
        ? [`Current verified attendance rate is ${pct}% (${presentAtt}/${totalAtt} sessions).`]
        : ['No attendance records found yet for insight generation.']
    });
  } catch (error) {
    res.status(500).json({ detail: 'Unable to load academic dashboard.' });
  }
});

// GET /academic/timetable
router.get('/timetable', authenticate, async (req, res) => {
  try {
    const email = req.userEmail.toLowerCase();
    let queryIds = [email.toUpperCase()];

    if (req.userRole === 'student') {
      const user = await User.findOne({ email }).select('email department semester section').lean();
      const keys = buildTimetableKeys(user);
      if (keys.length > 0) queryIds = keys;
    }

    const timetable = await Timetable.find({ user_id: { $in: queryIds } }).lean();

    const formatted = timetable.map(item => {
      item.id = item._id.toString();
      delete item._id;
      return item;
    });

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ detail: 'Unable to load timetable.' });
  }
});

// GET /academic/timetable/summary
router.get('/timetable/summary', authenticate, async (req, res) => {
  try {
    const email = req.userEmail.toLowerCase();
    const user = await User.findOne({ email }).lean();
    if (!user) return res.status(404).json({ detail: 'User not found.' });

    const policy = await getInstitutionPolicy(user);
    const keys = buildTimetableKeys(user);
    const queryIds = keys.length > 0 ? keys : [email.toUpperCase()];

    const [slots, holidays] = await Promise.all([
      Timetable.find({ user_id: { $in: queryIds } }).lean(),
      cache.getOrLoad('academic:holidays:all', () => Holiday.find().sort({ date: 1 }).lean(), 60 * 1000),
    ]);

    const now = new Date();
    const todayIso = toDateKey(now);
    const todayLong = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()];
    const todayShort = todayLong.slice(0, 3).toLowerCase();
    const holidayDates = new Set(holidays.map((h) => toDateKey(h.date)).filter(Boolean));
    const isTodayHoliday = holidayDates.has(todayIso);

    const enrichedSlots = slots.map((s) => {
      const sDay = String(s.day || '').trim();
      const isToday = sDay.toLowerCase() === todayLong.toLowerCase() || sDay.slice(0, 3).toLowerCase() === todayShort;
      const { start, end } = isToday ? parseSlotTimes(s.time, now) : { start: null, end: null };
      let status = 'upcoming';
      let minutesUntilStart = null;
      if (s.is_cancelled) {
        status = 'cancelled';
      } else if (isToday && start && end) {
        if (now >= start && now <= end) status = 'live';
        else if (now > end) status = 'completed';
        else minutesUntilStart = Math.max(0, Math.round((start.getTime() - now.getTime()) / 60000));
      }

      return {
        id: s._id.toString(),
        day: sDay.slice(0, 3),
        day_full: sDay,
        time: s.time,
        subject: s.subject,
        subject_code: s.subject_code || '',
        professor: s.substitute_faculty || s.faculty_name || s.teacher_email || 'Faculty',
        substitute_faculty: s.substitute_faculty || '',
        room: s.room || 'TBA',
        session_type: s.session_type || 'lecture',
        semester: s.semester || policy.currentSemester,
        is_cancelled: Boolean(s.is_cancelled),
        cancellation_reason: s.cancellation_reason || '',
        rescheduled_to: s.rescheduled_to || '',
        status,
        minutes_until_start: minutesUntilStart,
      };
    });

    const todaySlots = enrichedSlots.filter((s) => s.day.toLowerCase() === todayShort);
    const currentClass = todaySlots.find((s) => s.status === 'live') || null;
    const nextClass = todaySlots
      .filter((s) => s.status === 'upcoming' && s.minutes_until_start != null)
      .sort((a, b) => a.minutes_until_start - b.minutes_until_start)[0] || null;

    res.json({
      slots: enrichedSlots,
      today_slots: todaySlots,
      current_class: currentClass,
      next_class: nextClass,
      is_today_holiday: isTodayHoliday,
      holidays: holidays.map((h) => ({
        id: h._id.toString(),
        title: h.title,
        date: toDateKey(h.date),
        description: h.description || '',
      })),
      timezone: policy.timezone,
      semester: policy.currentSemester,
      academic_year: policy.academicYear,
    });
  } catch (error) {
    res.status(500).json({ detail: 'Unable to load timetable summary.' });
  }
});

// GET /academic/timetable/export.ics
router.get('/timetable/export.ics', authenticate, async (req, res) => {
  try {
    const email = req.userEmail.toLowerCase();
    const user = await User.findOne({ email }).lean();
    const policy = await getInstitutionPolicy(user);
    const keys = buildTimetableKeys(user);
    const queryIds = keys.length > 0 ? keys : [email.toUpperCase()];
    const slotQuery = (req.userRole || '').toLowerCase() === 'teacher'
      ? { $or: [{ teacher_email: email }, { user_id: { $in: queryIds } }] }
      : { user_id: { $in: queryIds } };
    const slots = await Timetable.find(slotQuery).lean();

    const dayToByDay = { sun: 'SU', mon: 'MO', tue: 'TU', wed: 'WE', thu: 'TH', fri: 'FR', sat: 'SA' };
    const dayToDow = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
    const now = new Date();

    const formatIcsDate = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const esc = (v) => String(v || '').replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');

    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//SmartFace Attendance//Student Timetable//EN',
      `X-WR-CALNAME:${esc(policy.collegeName || 'SmartFace')} Timetable`,
      `X-WR-TIMEZONE:${esc(policy.timezone)}`,
    ];

    for (const slot of slots) {
      if (slot.is_cancelled) continue;
      const dKey = String(slot.day || 'Mon').slice(0, 3).toLowerCase();
      const targetDow = dayToDow[dKey] ?? 1;
      const diff = (targetDow - now.getDay() + 7) % 7;
      const base = new Date(now);
      base.setDate(now.getDate() + diff);
      const { start, end } = parseSlotTimes(slot.time, base);
      const dtStart = start || base;
      const dtEnd = end || new Date(dtStart.getTime() + 60 * 60000);

      lines.push(
        'BEGIN:VEVENT',
        `UID:${slot._id.toString()}@smartface.pro`,
        `DTSTAMP:${formatIcsDate(now)}`,
        `DTSTART:${formatIcsDate(dtStart)}`,
        `DTEND:${formatIcsDate(dtEnd)}`,
        `RRULE:FREQ=WEEKLY;BYDAY=${dayToByDay[dKey] || 'MO'}`,
        `SUMMARY:${esc(slot.subject)}${slot.subject_code ? ` (${esc(slot.subject_code)})` : ''}`,
        `LOCATION:${esc(slot.room || 'Campus')}`,
        `DESCRIPTION:${esc(`Faculty: ${slot.substitute_faculty || slot.faculty_name || slot.teacher_email || 'Faculty'} | Type: ${slot.session_type || 'lecture'}`)}`,
        'END:VEVENT'
      );
    }
    lines.push('END:VCALENDAR');

    res.setHeader('Content-Disposition', 'attachment; filename="smartface_timetable.ics"');
    res.set('Content-Type', 'text/calendar; charset=utf-8');
    res.send(lines.join('\r\n'));
  } catch (error) {
    res.status(500).json({ detail: 'Unable to export ICS calendar.' });
  }
});

// GET /academic/announcements
router.get('/announcements', authenticate, async (req, res) => {
  try {
    const email = req.userEmail.toLowerCase();
    const search = typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase() : '';
    const priority = typeof req.query.priority === 'string' ? req.query.priority : 'all';

    const items = await Notification.find({
      user_id: email,
      type: { $in: ['announcement', 'exam', 'holiday', 'policy'] }
    }).sort({ created_at: -1 }).limit(100).lean();

    const now = new Date();
    let announcements = items
      .filter((a) => !a.extra_data?.expires_at || new Date(a.extra_data.expires_at) > now)
      .map((a) => ({
        id: a._id.toString(),
        title: a.title,
        message: a.message,
        type: a.type,
        priority: a.priority || 'Info',
        pinned: Boolean(a.extra_data?.pinned),
        sender: a.extra_data?.sender || 'Administration',
        attachment_url: a.extra_data?.attachment_url || null,
        read: Boolean(a.is_read),
        created_at: a.created_at,
        expires_at: a.extra_data?.expires_at || null,
      }));

    if (priority !== 'all') {
      announcements = announcements.filter((a) => a.priority.toLowerCase() === priority.toLowerCase());
    }
    if (search) {
      announcements = announcements.filter((a) =>
        a.title.toLowerCase().includes(search) || a.message.toLowerCase().includes(search)
      );
    }

    announcements.sort((a, b) => Number(b.pinned) - Number(a.pinned));
    res.json({ announcements });
  } catch (error) {
    res.status(500).json({ detail: 'Unable to fetch announcements.' });
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
    res.json([]);
  } catch (error) {
    res.status(500).json({ detail: 'Unable to fetch assignments.' });
  }
});

// GET /academic/exams
router.get('/exams', authenticate, async (req, res) => {
  try {
    res.json([]);
  } catch (error) {
    res.status(500).json({ detail: 'Unable to fetch exams.' });
  }
});

// GET /academic/results
router.get('/results', authenticate, async (req, res) => {
  try {
    res.json({ cgpa: null, sgpa: null, results: [] });
  } catch (error) {
    res.status(500).json({ detail: 'Unable to fetch results.' });
  }
});

// GET /academic/success-score
router.get('/success-score', authenticate, async (req, res) => {
  try {
    const email = req.userEmail;
    const totalAtt = await Attendance.countDocuments({ student_email: email });
    const presentAtt = await Attendance.countDocuments({ student_email: email, status: 'Present' });
    const score = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : null;
    res.json({ success_score: score });
  } catch (error) {
    res.status(500).json({ detail: 'Unable to compute success score.' });
  }
});

// GET /academic/documents
router.get('/documents', authenticate, async (req, res) => {
  try {
    res.json([]);
  } catch (error) {
    res.status(500).json({ detail: 'Unable to fetch documents.' });
  }
});

// GET /academic/holidays
router.get('/holidays', authenticate, async (req, res) => {
  try {
    const formatted = await cache.getOrLoad(
      'academic:holidays:formatted',
      async () => {
        const holidays = await Holiday.find().sort({ date: 1 }).lean();
        return holidays.map((h) => {
          const item = { ...h, id: h._id.toString() };
          delete item._id;
          return item;
        });
      },
      60 * 1000
    );
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ detail: 'Unable to load holidays.' });
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
    cache.invalidate('academic:holidays');
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
    cache.invalidate('academic:holidays');
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
    cache.invalidate('academic:holidays');
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

    // Fetch marked attendance logs for student (optimized single session lookup)
    let attendanceEvents = [];
    if (req.userRole === 'student') {
      if (mongoose.connection.readyState === 1) {
        const records = await Attendance.find({ student_email: email.toLowerCase() }).lean();
        const sessionIds = [...new Set(records.map((r) => r.session_id).filter((id) => mongoose.Types.ObjectId.isValid(id)))];
        const sessions = sessionIds.length ? await Session.find({ _id: { $in: sessionIds } }, 'subject').lean() : [];
        const subjectById = new Map(sessions.map((s) => [s._id.toString(), s.subject]));
        for (const rec of records) {
          const subjectName = rec.subject || subjectById.get(String(rec.session_id)) || 'Class Session';
          attendanceEvents.push({
            id: rec._id.toString(),
            title: `${rec.status || 'Present'}: ${subjectName}`,
            type: "attendance",
            start_date: rec.timestamp,
            end_date: rec.timestamp,
            status: rec.status || "Present"
          });
        }
      }
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
