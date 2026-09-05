const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load environment configuration
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URL = process.env.MONGODB_URL || "mongodb://localhost:27017/smartface";

// Models
const AttendanceAnalytics = require('../src/models/AttendanceAnalytics');
const DepartmentAnalytics = require('../src/models/DepartmentAnalytics');
const AttendanceAuditLog = require('../src/models/AttendanceAuditLog');
const Attendance = require('../src/models/Attendance');
const Session = require('../src/models/Session');
const User = require('../src/models/User');

const seedAttendanceIntel = async () => {
  try {
    console.log("Connecting to database at:", MONGODB_URL);
    await mongoose.connect(MONGODB_URL, { dbName: 'smartface' });
    console.log("✅ Database connected successfully.");

    // Clean up collections
    console.log("Clearing existing attendance intelligence data...");
    await AttendanceAnalytics.deleteMany({});
    await DepartmentAnalytics.deleteMany({});
    await AttendanceAuditLog.deleteMany({});

    const studentAlice = "alice@smartface.pro";
    const studentBob = "bob@smartface.pro";
    const studentCharlie = "charlie@smartface.pro";
    const teacherSarah = "teacher@smartface.pro";
    const adminEmail = "admin@smartface.pro";

    console.log("Seeding student analytics caches...");
    // 1. Alice (Excellent standing)
    await AttendanceAnalytics.create({
      student_email: studentAlice,
      health_score: 94,
      standing: 'Excellent',
      consecutive_absences: 0,
      late_arrivals_count: 0,
      weekly_change_pct: 1.5,
      risk_alerts: []
    });

    // 2. Bob (Warning standing)
    await AttendanceAnalytics.create({
      student_email: studentBob,
      health_score: 72,
      standing: 'Warning',
      consecutive_absences: 1,
      late_arrivals_count: 3,
      weekly_change_pct: -4.8,
      risk_alerts: [
        {
          type: 'below_75',
          message: '⚠️ Warning: Attendance health is currently 72%, which is below the mandatory 75% eligibility.'
        }
      ]
    });

    // 3. Charlie (Critical standing)
    await AttendanceAnalytics.create({
      student_email: studentCharlie,
      health_score: 54,
      standing: 'Critical',
      consecutive_absences: 4,
      late_arrivals_count: 2,
      weekly_change_pct: -8.5,
      risk_alerts: [
        {
          type: 'below_60',
          message: '🚨 Critical Alert: Attendance health has dropped to 54%. Immediately report to HOD.'
        },
        {
          type: 'consecutive_absences',
          message: '⚠️ Warning: You have missed 4 consecutive sessions. Automatic academic check triggered.'
        }
      ]
    });

    console.log("Seeding department analytics...");
    await DepartmentAnalytics.create({
      department: "Computer Science",
      semester: "6th",
      attendance_percentage: 86.4,
      total_students: 124,
      critical_count: 5,
      warning_count: 14,
      monthly_average: {
        "Jan": 84, "Feb": 86, "Mar": 89, "Apr": 85, "May": 87, "Jun": 86
      }
    });

    await DepartmentAnalytics.create({
      department: "AI & Data Science",
      semester: "4th",
      attendance_percentage: 91.2,
      total_students: 84,
      critical_count: 1,
      warning_count: 6,
      monthly_average: {
        "Jan": 89, "Feb": 92, "Mar": 90, "Apr": 91, "May": 93, "Jun": 91
      }
    });

    console.log("Seeding security audit trails...");
    await AttendanceAuditLog.create([
      {
        actor_email: adminEmail,
        role: "admin",
        action: "LOGIN_EVENT",
        details: { status: "success", device: "Chrome / Windows 11" },
        ip_address: "10.0.1.48"
      },
      {
        actor_email: teacherSarah,
        role: "teacher",
        action: "SESSION_CREATED",
        details: { subject: "Deep Learning", class_type: "Lecture", room: "Block-B LHC-101" },
        ip_address: "10.0.2.102"
      },
      {
        actor_email: teacherSarah,
        role: "teacher",
        action: "QR_GENERATED",
        details: { subject: "Deep Learning", token: "token_17728192000" },
        ip_address: "10.0.2.102"
      },
      {
        actor_email: studentAlice,
        role: "student",
        action: "ATTENDANCE_MARKED",
        details: { method: "qr", session_id: "667104b2b9381c8ea322e700", subject: "Deep Learning" },
        ip_address: "10.0.3.15"
      },
      {
        actor_email: studentBob,
        role: "student",
        action: "ATTENDANCE_MARKED",
        details: { method: "face", session_id: "667104b2b9381c8ea322e700", confidence: 0.94 },
        ip_address: "10.0.3.18"
      }
    ]);

    console.log("🎉 Seeding attendance intelligence mock data successfully completed.");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
  } finally {
    await mongoose.disconnect();
  }
};

seedAttendanceIntel();
