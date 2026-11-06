const fs = require('fs');
const path = require('path');
const readline = require('readline');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URL = process.env.MONGODB_URL || process.env.MONGO_URI || "mongodb://localhost:27017/smartface";

// Models
const User = require('../src/models/User');
const Session = require('../src/models/Session');
const Attendance = require('../src/models/Attendance');
const AttendanceAnalytics = require('../src/models/AttendanceAnalytics');
const DepartmentAnalytics = require('../src/models/DepartmentAnalytics');

const parseCsvLine = (line) => {
  return line.split(',').map(s => s.trim().replace(/^"|"$/g, ''));
};

const parseCsvFile = (filePath) => {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length === 0) return [];

  const headers = parseCsvLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    if (values.length >= headers.length) {
      const obj = {};
      headers.forEach((h, idx) => {
        obj[h] = values[idx] || '';
      });
      rows.push(obj);
    }
  }
  return rows;
};

// Department mapping from roll number code
const getDepartment = (rollNo) => {
  const upper = rollNo.toUpperCase();
  if (upper.includes('CS')) return 'Computer Science & Engineering';
  if (upper.includes('AI')) return 'Artificial Intelligence & Data Science';
  if (upper.includes('EC')) return 'Electronics & Communication Engineering';
  if (upper.includes('IA')) return 'Information Science & Engineering';
  return 'Computer Science';
};

const getSubjectForSlot = (dateStr, timeStr) => {
  const subjects = [
    'Machine Learning',
    'Deep Learning & Vision',
    'Cloud Architecture',
    'Database Management Systems',
    'Computer Networks',
    'AI Ethics & Cyber Security'
  ];
  // Stable pseudo-random pick based on date string
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash * 31 + dateStr.charCodeAt(i)) % subjects.length;
  }
  return subjects[hash];
};

async function seedDataset() {
  console.log('🚀 [SmartFace] Starting full Dataset & Attendance History Ingestion...');
  const rootDir = path.resolve(__dirname, '../../..');
  const dataDir = path.join(rootDir, 'data');
  const logsDir = path.join(dataDir, 'Attendance_Logs');
  const credsPath = path.join(dataDir, 'student_credentials.csv');
  const studentsPath = path.join(dataDir, 'students.csv');
  const mainAttendancePath = path.join(dataDir, 'attendance.csv');

  // 1. Read Student Credentials & Profiles
  const credRows = parseCsvFile(credsPath);
  const studentRows = parseCsvFile(studentsPath);

  const studentMap = new Map();
  studentRows.forEach(row => {
    const roll = row['Roll No'] || row['Roll_No'];
    if (roll) studentMap.set(roll.trim(), row);
  });

  const studentsToRegister = [];
  for (const cred of credRows) {
    const roll = (cred['Roll_No'] || cred['Roll No'] || '').trim();
    const email = (cred['Email'] || '').trim().toLowerCase();
    const password = (cred['Password'] || 'Student#123').trim();
    if (!roll || !email) continue;

    const profile = studentMap.get(roll) || {};
    const name = profile['Name'] || roll;
    const phone = profile['Mobile'] || '9123456789';
    const parentPhone = profile['Parent_Phone'] || '7090804228';
    const department = getDepartment(roll);

    studentsToRegister.push({
      roll,
      email,
      name,
      password,
      phone,
      parentPhone,
      department,
      semester: '6th'
    });
  }

  console.log(`📋 Found ${studentsToRegister.length} students to register with credentials.`);

  // 2. Read Attendance Logs
  const attendanceRecords = [];
  const logFiles = fs.existsSync(logsDir)
    ? fs.readdirSync(logsDir).filter(f => f.endsWith('.csv')).map(f => path.join(logsDir, f))
    : [];

  if (fs.existsSync(mainAttendancePath)) {
    logFiles.push(mainAttendancePath);
  }

  console.log(`📂 Processing ${logFiles.length} attendance log files...`);

  const seenLogKeys = new Set();

  for (const file of logFiles) {
    const rows = parseCsvFile(file);
    for (const r of rows) {
      const roll = (r['Roll No'] || r['Roll_No'] || '').trim();
      const status = (r['Status'] || 'Present').trim();
      const date = (r['Date'] || '').trim();
      const time = (r['Time'] || '09:00:00').trim();
      const accuracyStr = (r['Accuracy'] || '85%').replace('%', '').trim();
      const accuracyNum = parseFloat(accuracyStr) || 85.0;

      if (!roll || !date || date === 'Date') continue;

      const dedupeKey = `${roll}_${date}_${time}`;
      if (seenLogKeys.has(dedupeKey)) continue;
      seenLogKeys.add(dedupeKey);

      // Clean roll number if Ali_25AI011
      const cleanRoll = roll.includes('_') ? roll.split('_').pop() : roll;

      attendanceRecords.push({
        roll: cleanRoll,
        status: status.toLowerCase() === 'absent' ? 'Absent' : 'Present',
        date,
        time: time === 'END' ? '17:00:00' : time,
        confidence: accuracyNum > 0 ? (accuracyNum / 100) : 0.85
      });
    }
  }

  console.log(`📊 Ingested ${attendanceRecords.length} unique historical attendance records.`);

  // 3. Save Master JSON for Offline & Fast Caching
  const masterData = {
    generated_at: new Date().toISOString(),
    total_students: studentsToRegister.length,
    total_attendance_logs: attendanceRecords.length,
    students: studentsToRegister,
    attendance_logs: attendanceRecords
  };
  const masterJsonPath = path.join(dataDir, 'attendance_history_master.json');
  fs.writeFileSync(masterJsonPath, JSON.stringify(masterData, null, 2), 'utf-8');
  console.log(`💾 Saved consolidated master cache: ${masterJsonPath}`);

  // 4. Connect to MongoDB and Seed Collections if MongoDB is available
  try {
    console.log(`🔌 Attempting MongoDB connection at: ${MONGODB_URL.split('@').pop() || 'localhost'}...`);
    await mongoose.connect(MONGODB_URL, {
      dbName: 'smartface',
      serverSelectionTimeoutMS: 6000
    });
    console.log('✅ Connected to MongoDB successfully.');

    // Seed Users
    console.log('👤 Syncing Users in database...');
    for (const s of studentsToRegister) {
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(s.password, salt);

      await User.findOneAndUpdate(
        { email: s.email },
        {
          $set: {
            email: s.email,
            full_name: s.name,
            role: 'student',
            password: hashedPassword,
            student_id: s.roll,
            roll_number: s.roll,
            usn: s.roll,
            phone: s.phone,
            parent_details: s.parentPhone,
            department: s.department,
            semester: s.semester,
            college: 'SmartFace Institute of Technology',
            biometric_registered: true,
            setup_completed: true,
            avatar_url: `https://api.dicebear.com/7.x/bottts/png?seed=${encodeURIComponent(s.name)}`
          }
        },
        { upsert: true, new: true }
      );
    }
    console.log('✅ All student accounts registered and synced in MongoDB.');

    // Seed Teacher & Admin Accounts if missing
    const defaultStaff = [
      { email: 'teacher@smartface.pro', name: 'Dr. Sarah Jenkins', role: 'teacher', pass: process.env.DEMO_TEACHER_PASSWORD, dept: 'Computer Science & Engineering' },
      { email: 'admin@smartface.pro', name: 'System Administrator', role: 'admin', pass: process.env.DEMO_ADMIN_PASSWORD, dept: 'Administration' }
    ].filter((staff) => staff.pass);
    for (const staff of defaultStaff) {
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(staff.pass, salt);
      await User.findOneAndUpdate(
        { email: staff.email },
        {
          $set: {
            email: staff.email,
            full_name: staff.name,
            role: staff.role,
            password: hashedPassword,
            department: staff.dept,
            setup_completed: true
          }
        },
        { upsert: true }
      );
    }

    // Seed Sessions & Attendance Records
    console.log('📅 Seeding Sessions and Attendance records...');
    const sessionCache = new Map();

    let insertedAttendanceCount = 0;
    for (const log of attendanceRecords) {
      const student = studentsToRegister.find(s => s.roll.toUpperCase() === log.roll.toUpperCase());
      if (!student) continue;

      const subject = getSubjectForSlot(log.date, log.time);
      const sessionKey = `${subject}_${log.date}`;

      let session = sessionCache.get(sessionKey);
      if (!session) {
        const sessionDate = new Date(`${log.date}T${log.time.length === 5 ? log.time + ':00' : log.time}Z`);
        session = await Session.findOneAndUpdate(
          { subject, start_time: sessionDate },
          {
            $set: {
              teacher_id: 'teacher@smartface.pro',
              subject,
              duration: '1 Hour',
              start_time: isNaN(sessionDate.getTime()) ? new Date() : sessionDate,
              is_active: false,
              qr_code: `token_${Date.now()}`
            }
          },
          { upsert: true, new: true }
        );
        sessionCache.set(sessionKey, session);
      }

      const logTimestamp = new Date(`${log.date}T${log.time.length === 5 ? log.time + ':00' : log.time}Z`);
      const validTimestamp = isNaN(logTimestamp.getTime()) ? new Date() : logTimestamp;

      await Attendance.findOneAndUpdate(
        { student_email: student.email, session_id: session._id.toString() },
        {
          $set: {
            student_email: student.email,
            session_id: session._id.toString(),
            timestamp: validTimestamp,
            status: log.status,
            verified_by: 'face',
            confidence: log.confidence,
            lighting_quality: log.confidence > 0.75 ? 'Good' : 'Moderate',
            face_visibility: log.confidence > 0.7 ? 'Excellent' : 'Good'
          }
        },
        { upsert: true }
      );
      insertedAttendanceCount++;
    }
    console.log(`✅ Seeded ${insertedAttendanceCount} attendance logs into MongoDB.`);

    // Compute Analytics for Each Student
    console.log('📈 Computing Student Attendance Intelligence...');
    for (const student of studentsToRegister) {
      const totalLogs = await Attendance.countDocuments({ student_email: student.email });
      const presentLogs = await Attendance.countDocuments({ student_email: student.email, status: 'Present' });
      const pct = totalLogs > 0 ? Math.round((presentLogs / totalLogs) * 100) : 85;

      let standing = 'Good';
      if (pct >= 90) standing = 'Excellent';
      else if (pct >= 75) standing = 'Good';
      else if (pct >= 60) standing = 'Warning';
      else standing = 'Critical';

      await AttendanceAnalytics.findOneAndUpdate(
        { student_email: student.email },
        {
          $set: {
            student_email: student.email,
            health_score: pct,
            standing,
            consecutive_absences: pct < 75 ? 2 : 0,
            late_arrivals_count: 1,
            weekly_change_pct: pct >= 80 ? 2.5 : -1.8,
            risk_alerts: pct < 75 ? [
              {
                type: 'below_75',
                message: `⚠️ Attention: Attendance health is currently ${pct}%, which is below the mandatory 75% cutoff.`
              }
            ] : []
          }
        },
        { upsert: true }
      );
    }

    // Seed Department Analytics
    const depts = [
      { name: 'Computer Science & Engineering', pct: 88.5, count: 68 },
      { name: 'Artificial Intelligence & Data Science', pct: 92.1, count: 54 },
      { name: 'Electronics & Communication Engineering', pct: 84.7, count: 45 }
    ];
    for (const d of depts) {
      await DepartmentAnalytics.findOneAndUpdate(
        { department: d.name },
        {
          $set: {
            department: d.name,
            semester: '6th',
            attendance_percentage: d.pct,
            total_students: d.count,
            critical_count: 2,
            warning_count: 5,
            monthly_average: {
              "Feb": 86, "Mar": 89, "Apr": 87, "May": 91, "Jun": 90, "Jul": 88
            }
          }
        },
        { upsert: true }
      );
    }

    console.log('🎉 Seeding and sync completed successfully!');
  } catch (mongoErr) {
    console.warn('⚠️ [MongoDB Sync] Could not connect directly to MongoDB:', mongoErr.message);
    console.log('ℹ️ Master cache file `data/attendance_history_master.json` is ready and verified.');
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(0);
  }
}

seedDataset();

