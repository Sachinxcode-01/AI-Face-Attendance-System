const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../src/models/User');
const College = require('../src/models/College');
const Department = require('../src/models/Department');
const Role = require('../src/models/Role');
const Permission = require('../src/models/Permission');
const RolePermission = require('../src/models/RolePermission');
const Timetable = require('../src/models/Timetable');
const Leave = require('../src/models/Leave');
const Attendance = require('../src/models/Attendance');
const Notification = require('../src/models/Notification');
const AttendanceAnalytics = require('../src/models/AttendanceAnalytics');
const DepartmentAnalytics = require('../src/models/DepartmentAnalytics');
const { PERMISSIONS } = require('../src/security/permissions');
const { ROLE_PERMISSIONS_MATRIX } = require('../src/security/rbac');

async function seedProductionSaaS() {
  const uri = process.env.MONGODB_URL || process.env.MONGO_URI;
  console.log('⚡ Connecting to MongoDB Atlas...');
  await mongoose.connect(uri, { dbName: 'smartface' });
  console.log('✅ Connected to MongoDB:', mongoose.connection.name);

  // 1. Seed Permissions & Roles
  console.log('\n--- 1. Initializing RBAC Roles & Permissions ---');
  const permMap = {};
  for (const [key, code] of Object.entries(PERMISSIONS)) {
    const moduleName = code.split('.')[0].toUpperCase();
    const perm = await Permission.findOneAndUpdate(
      { code },
      { code, name: key.replace(/_/g, ' '), module: moduleName },
      { upsert: true, returnDocument: 'after' }
    );
    permMap[code] = perm._id;
  }
  console.log(`✅ Seeded ${Object.keys(permMap).length} granular system permissions.`);

  for (const [roleName, permissions] of Object.entries(ROLE_PERMISSIONS_MATRIX)) {
    const role = await Role.findOneAndUpdate(
      { name: roleName },
      { name: roleName, description: `System ${roleName} role`, is_system: true },
      { upsert: true, returnDocument: 'after' }
    );

    const targetPermIds = [];
    for (const permCode of permissions) {
      const permId = permMap[permCode];
      if (permId) {
        targetPermIds.push(permId);
        await RolePermission.findOneAndUpdate(
          { role_id: role._id, permission_id: permId },
          { role_id: role._id, permission_id: permId },
          { upsert: true }
        );
      }
    }
  }
  console.log('✅ Roles and RolePermission mappings synchronized.');

  // 2. Provision Official Enterprise Colleges
  console.log('\n--- 2. Provisioning Official Colleges ---');
  const mainCollege = await College.findOneAndUpdate(
    { code: 'SFIT' },
    {
        $setOnInsert: {
          name: 'SmartFace Institute of Technology',
          code: 'SFIT',
          address: 'Knowledge City, Tech Corridor, Chennai, India',
          domain: 'smartface.pro',
          is_active: true,
          branding: {
            primary_color: '#3B82F6',
            secondary_color: '#10B981',
            accent_color: '#F59E0B',
            portal_title: 'SmartFace Institute Enterprise Attendance Portal',
            sender_name: 'SmartFace Attendance System',
            support_email: 'support@smartface.pro'
          },
          subscription: {
            plan: 'enterprise',
            status: 'active',
            max_students: 50000,
            max_teachers: 1000
          }
        }
      },
    { upsert: true, returnDocument: 'after' }
  );

  const recCollege = await College.findOneAndUpdate(
    { code: 'REC' },
    {
        $setOnInsert: {
          name: 'Rajalakshmi Engineering College',
          code: 'REC',
          address: 'Rajalakshmi Nagar, Thandalam, Chennai, India',
          domain: 'rec.edu',
          is_active: true,
          branding: {
            primary_color: '#2563EB',
            portal_title: 'REC Smart Attendance Portal'
          },
          subscription: {
            plan: 'standard',
            status: 'active',
            max_students: 15000
          }
        }
      },
    { upsert: true, returnDocument: 'after' }
  );
  console.log(`✅ Colleges provisioned: ${mainCollege.name} (SFIT) & ${recCollege.name} (REC)`);

  // 3. Provision Departments
  console.log('\n--- 3. Provisioning Academic Departments ---');
  const deptDefs = [
    { code: 'CSE', name: 'Computer Science & Engineering' },
    { code: 'AI', name: 'Artificial Intelligence & Data Science' },
    { code: 'ECE', name: 'Electronics & Communication Engineering' },
    { code: 'ISE', name: 'Information Science & Engineering' }
  ];
  for (const d of deptDefs) {
    await Department.findOneAndUpdate(
      { college_id: mainCollege._id, code: d.code },
      { $set: { college_id: mainCollege._id, name: d.name, code: d.code } },
      { upsert: true }
    );
  }
  console.log('✅ Academic Departments provisioned in SFIT.');

  // 4. Provision Production Users for Each Role
  console.log('\n--- 4. Provisioning Production Users per Role ---');
  const salt = await bcrypt.genSalt(12);
  const resolveSeedHash = async (envVar) => {
    const raw = process.env[envVar] && process.env[envVar].trim()
      ? process.env[envVar].trim()
      : crypto.randomBytes(24).toString('hex');
    return bcrypt.hash(raw, salt);
  };

  // A. Super Admin
  const superAdminHash = await resolveSeedHash('SEED_SUPERADMIN_PASSWORD');
  const superAdmin = await User.findOneAndUpdate(
    { email: 'superadmin@smartface.pro' },
    {
      $set: {
        email: 'superadmin@smartface.pro',
        full_name: 'Dr. Evelyn Cross (Global Overseer)',
        role: 'super_admin',
        college: 'SmartFace Institute of Technology',
        department: 'Governance & Institutional Oversight',
        designation: 'Chief Academic Officer & Platform Overseer',
        setup_completed: true,
        biometric_registered: true,
        avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'
    },
    $setOnInsert: { password: superAdminHash }
    },
{ upsert: true, returnDocument: 'after' }
  );
console.log('✅ Super Admin provisioned:', superAdmin.email);

// B. Admin
const adminHash = await resolveSeedHash('SEED_ADMIN_PASSWORD');
const admin = await User.findOneAndUpdate(
  { email: 'admin@smartface.pro' },
  {
    $set: {
      email: 'admin@smartface.pro',
      full_name: 'System Administrator (SFIT)',
      role: 'admin',
      college: 'SmartFace Institute of Technology',
      department: 'Administration',
      designation: 'Head of Campus Operations',
      setup_completed: true,
      biometric_registered: true,
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
  },
  $setOnInsert: { password: adminHash }
    },
{ upsert: true, returnDocument: 'after' }
  );
console.log('✅ Campus Admin provisioned:', admin.email);

// C. Teacher
const teacherHash = await resolveSeedHash('SEED_TEACHER_PASSWORD');
const teacher = await User.findOneAndUpdate(
  { email: 'teacher@smartface.pro' },
  {
    $set: {
      email: 'teacher@smartface.pro',
      full_name: 'Prof. Marcus Vance',
      role: 'teacher',
      college: 'SmartFace Institute of Technology',
      department: 'Computer Science & Engineering',
      designation: 'Associate Professor & AI Lab Director',
      employee_id: 'EMP-CSE-2024',
      classes: ['CSE-6A', 'AI-6A'],
      subjects: ['Machine Learning', 'Deep Learning & Vision', 'Cloud Architecture', 'Database Management Systems'],
      setup_completed: true,
      biometric_registered: true,
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'
  },
  $setOnInsert: { password: teacherHash }
    },
{ upsert: true, returnDocument: 'after' }
  );
console.log('✅ Teacher provisioned:', teacher.email);

// D. Parent (Linked to seeded students: Bob Dylan & Abhishek)
const parentHash = await resolveSeedHash('SEED_PARENT_PASSWORD');
const parent = await User.findOneAndUpdate(
  { email: 'parent@smartface.pro' },
  {
    $set: {
      email: 'parent@smartface.pro',
      full_name: 'Robert & Sarah Cooper',
      role: 'parent',
      college: 'SmartFace Institute of Technology',
      phone: '7090804228',
      setup_completed: true,
      avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150'
    },
    $setOnInsert: {
      password: parentHash,
      children: ['bob@smartface.pro', 'abhishek.student@smartface.pro'],
      linked_children: [
        { email: 'bob@smartface.pro', full_name: 'Bob Dylan', student_id: 'AI2405' },
          { email: 'abhishek.student@smartface.pro', full_name: 'Abhishek', student_id: '25CS089' }
        ]
      }
    },
{ upsert: true, returnDocument: 'after' }
  );
console.log('✅ Parent provisioned with 2 linked wards:', parent.email);

// E. Ensure Student bob@smartface.pro has initial links
const studentBobHash = await resolveSeedHash('SEED_STUDENT_PASSWORD');
const studentBob = await User.findOneAndUpdate(
  { email: 'bob@smartface.pro' },
  {
    $set: {
      email: 'bob@smartface.pro',
      full_name: 'Bob Dylan',
      role: 'student',
      student_id: 'AI2405',
      roll_number: 'AI2405',
      usn: 'AI2405',
      college: 'SmartFace Institute of Technology',
      department: 'Artificial Intelligence & Data Science',
      semester: '6th',
      section: 'A',
      course: 'B.Tech AI & Data Science',
      parent_details: 'parent@smartface.pro',
      setup_completed: true,
      biometric_registered: true,
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
  },
  $setOnInsert: { password: studentBobHash }
    },
{ upsert: true, returnDocument: 'after' }
  );

// Standardize only verified SFIT cohort students with college & class mappings
await User.updateMany(
  { role: 'student', college: 'SmartFace Institute of Technology', student_id: { $in: ['25CS089'] } },
  {
    $set: {
      college: 'SmartFace Institute of Technology',
      semester: '6th',
        section: 'A'
    }
  }
);
await User.updateMany(
  { role: 'student', college: 'SmartFace Institute of Technology', student_id: { $in: ['AI2405'] } },
  {
    $set: {
      college: 'SmartFace Institute of Technology',
      semester: '6th',
        section: 'A'
    }
  }
);
console.log('✅ Verified SFIT cohort students normalized with valid college, semester, and section.');

// 5. Seed Real Academic Timetable for CSE_6_A and AI_6_A (plus Bob's derived class ID)
console.log('\n--- 5. Seeding Real Academic Timetable ---');
const aiBobClassId = 'ARTIFICIAL INTELLIGENCE & DATA SCIENCE_6TH_A';
const scheduleSlots = [
  // CSE_6_A
  { user_id: 'CSE_6_A', subject: 'Machine Learning (CSE-601)', day: 'Monday', time: '09:00 AM - 10:30 AM', room: 'Room 401', teacher_email: 'teacher@smartface.pro' },
  { user_id: 'CSE_6_A', subject: 'Deep Learning & Vision (CSE-602)', day: 'Monday', time: '11:00 AM - 12:30 PM', room: 'AI Lab 2', teacher_email: 'teacher@smartface.pro' },
  { user_id: 'CSE_6_A', subject: 'Cloud Architecture (CSE-603)', day: 'Tuesday', time: '10:00 AM - 11:30 AM', room: 'Room 402', teacher_email: 'teacher@smartface.pro' },
  { user_id: 'CSE_6_A', subject: 'Database Management Systems (CSE-604)', day: 'Wednesday', time: '09:00 AM - 10:30 AM', room: 'Room 303', teacher_email: 'teacher@smartface.pro' },
  { user_id: 'CSE_6_A', subject: 'AI Ethics & Cyber Security (CSE-605)', day: 'Thursday', time: '02:00 PM - 03:30 PM', room: 'Auditorium A', teacher_email: 'teacher@smartface.pro' },
  { user_id: 'CSE_6_A', subject: 'Capstone Innovation Lab (CSE-606)', day: 'Friday', time: '10:00 AM - 01:00 PM', room: 'Innovation Center', teacher_email: 'teacher@smartface.pro' },
  // AI_6_A (Monday moved to 02:00 PM - 03:30 PM to avoid teacher overlap with CSE_6_A 09:00 AM)
  { user_id: 'AI_6_A', subject: 'Deep Learning & Vision (AI-601)', day: 'Monday', time: '02:00 PM - 03:30 PM', room: 'Lab 4', teacher_email: 'teacher@smartface.pro' },
  { user_id: 'AI_6_A', subject: 'Machine Learning (AI-602)', day: 'Tuesday', time: '11:00 AM - 12:30 PM', room: 'Room 302', teacher_email: 'teacher@smartface.pro' },
  { user_id: 'AI_6_A', subject: 'Cloud Architecture (AI-603)', day: 'Wednesday', time: '10:00 AM - 11:30 AM', room: 'Room 401', teacher_email: 'teacher@smartface.pro' },
  { user_id: 'AI_6_A', subject: 'AI Ethics & Cyber Security (AI-604)', day: 'Thursday', time: '09:00 AM - 10:30 AM', room: 'Auditorium B', teacher_email: 'teacher@smartface.pro' },
  { user_id: 'AI_6_A', subject: 'Computer Networks (AI-605)', day: 'Friday', time: '02:00 PM - 03:30 PM', room: 'Room 204', teacher_email: 'teacher@smartface.pro' },
  // Bob's student timetable query ID (`${department.toUpperCase()}_${semester}_${section}`)
  { user_id: aiBobClassId, subject: 'Deep Learning & Vision (AI-601)', day: 'Monday', time: '02:00 PM - 03:30 PM', room: 'Lab 4', teacher_email: 'teacher@smartface.pro' },
  // Also teacher specific schedule
  { user_id: 'teacher@smartface.pro', subject: 'Machine Learning (CSE-601)', day: 'Monday', time: '09:00 AM - 10:30 AM', room: 'Room 401', teacher_email: 'teacher@smartface.pro' },
    { user_id: 'teacher@smartface.pro', subject: 'Deep Learning & Vision (CSE-602)', day: 'Monday', time: '11:00 AM - 12:30 PM', room: 'AI Lab 2', teacher_email: 'teacher@smartface.pro' }
];

// Validate teacher availability across class schedules before writing
const teacherScheduleSeen = new Map();
for (const slot of scheduleSlots) {
  if (slot.user_id.includes('@') || slot.user_id === aiBobClassId) continue;
  const key = `${slot.teacher_email.toLowerCase()}|${slot.day}|${slot.time}`;
  if (teacherScheduleSeen.has(key)) {
    throw new Error(`Timetable conflict for ${slot.teacher_email} on ${slot.day} at ${slot.time}: ${teacherScheduleSeen.get(key)} vs ${slot.user_id}`);
  }
  teacherScheduleSeen.set(key, slot.user_id);
}

for (const slot of scheduleSlots) {
  await Timetable.findOneAndUpdate(
    { user_id: slot.user_id, subject: slot.subject, day: slot.day, time: slot.time },
    { $set: { ...slot, college_id: mainCollege._id.toString() } },
    { upsert: true }
  );
}
console.log(`✅ Seeded ${scheduleSlots.length} real academic timetable slots into MongoDB.`);

// 6. Seed Real Inter-Role Leave Workflows (Student -> Teacher -> Parent -> Admin)
console.log('\n--- 6. Seeding Interconnected Leave Requests ---');
await Leave.findOneAndUpdate(
  { seed_id: 'seed-leave-bob-hackathon' },
  {
      $setOnInsert: {
        seed_id: 'seed-leave-bob-hackathon',
        user_id: 'bob@smartface.pro',
        reason: 'Attending Smart India Hackathon Regional Finals in Bengaluru',
        start_date: '2026-11-28',
        end_date: '2026-11-30',
        status: 'Pending',
        remarks: 'Awaiting Faculty Advisor Review'
      }
    },
    { upsert: true }
);

await Leave.findOneAndUpdate(
  { seed_id: 'seed-leave-abhishek-academic' },
  {
      $setOnInsert: {
        seed_id: 'seed-leave-abhishek-academic',
        user_id: 'abhishek.student@smartface.pro',
        reason: 'Approved Academic Leave - Technical Workshop Participation',
        start_date: '2026-11-15',
        end_date: '2026-11-17',
        status: 'Approved',
        remarks: 'Approved by Faculty Advisor'
      }
    },
    { upsert: true }
);
console.log('✅ Real Leave requests seeded connecting Student, Teacher, Parent, and Admin.');

// 7. Seed Real Notifications from verified underlying records
console.log('\n--- 7. Seeding Initial Notifications ---');
    const verifiedNotifs = [];
    const bobPendingLeave = await Leave.findOne({ seed_id: 'seed-leave-bob-hackathon', status: 'Pending' }).lean();
    if(bobPendingLeave) {
      verifiedNotifs.push({
        user_id: 'teacher@smartface.pro',
        title: 'Pending Leave Application: Bob Dylan',
        message: `Bob Dylan (${studentBob.student_id || 'AI2405'}) has a pending leave request (${bobPendingLeave.start_date} to ${bobPendingLeave.end_date}).`,
        type: 'leave',
        priority: 'High'
        });
    }
  const recentBobAttendance = await Attendance.findOne({ student_email: 'bob@smartface.pro' }).sort({ timestamp: -1 }).lean();
    if(recentBobAttendance) {
      verifiedNotifs.push({
        user_id: 'bob@smartface.pro',
        title: 'Attendance Record Synchronized',
        message: `Your latest attendance status (${recentBobAttendance.status}) has been recorded.`,
        type: 'attendance',
        priority: 'Low'
      });
    }

  if(process.env.NODE_ENV !== 'production') {
    const sampleNotifs = require('./fixtures/sample_notifications.json');
    for(const n of sampleNotifs) {
      if (!verifiedNotifs.some((v) => v.user_id === n.user_id && v.title === n.title)) {
        verifiedNotifs.push(n);
      }
    }
  }

  for (const n of verifiedNotifs) {
    await Notification.findOneAndUpdate(
      { user_id: n.user_id, title: n.title },
      { $setOnInsert: n },
      { upsert: true }
    );
  }
  console.log(`✅ Seeded ${verifiedNotifs.length} verified notifications.`);

  console.log('\n======================================================');
  console.log('🎉 PRODUCTION SAAS PLATFORM DATABASE SYNC COMPLETE!');
  console.log('======================================================');

  await mongoose.disconnect();
}

seedProductionSaaS().catch(err => {
  console.error('❌ Error during seeding:', err);
  process.exit(1);
});
