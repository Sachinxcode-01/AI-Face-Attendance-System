const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
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
      $set: {
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
      $set: {
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

  // A. Super Admin
  const superAdminHash = await bcrypt.hash('SuperAdmin@2026', salt);
  const superAdmin = await User.findOneAndUpdate(
    { email: 'superadmin@smartface.pro' },
    {
      $set: {
        email: 'superadmin@smartface.pro',
        full_name: 'Dr. Evelyn Cross (Global Overseer)',
        role: 'super_admin',
        password: superAdminHash,
        college: 'SmartFace Institute of Technology',
        department: 'Governance & Institutional Oversight',
        designation: 'Chief Academic Officer & Platform Overseer',
        setup_completed: true,
        biometric_registered: true,
        avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'
      }
    },
    { upsert: true, returnDocument: 'after' }
  );
  console.log('✅ Super Admin provisioned:', superAdmin.email);

  // B. Admin
  const adminHash = await bcrypt.hash('Admin@2026', salt);
  const admin = await User.findOneAndUpdate(
    { email: 'admin@smartface.pro' },
    {
      $set: {
        email: 'admin@smartface.pro',
        full_name: 'System Administrator (SFIT)',
        role: 'admin',
        password: adminHash,
        college: 'SmartFace Institute of Technology',
        department: 'Administration',
        designation: 'Head of Campus Operations',
        setup_completed: true,
        biometric_registered: true,
        avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
      }
    },
    { upsert: true, returnDocument: 'after' }
  );
  console.log('✅ Campus Admin provisioned:', admin.email);

  // C. Teacher
  const teacherHash = await bcrypt.hash('Teacher@2026', salt);
  const teacher = await User.findOneAndUpdate(
    { email: 'teacher@smartface.pro' },
    {
      $set: {
        email: 'teacher@smartface.pro',
        full_name: 'Prof. Marcus Vance',
        role: 'teacher',
        password: teacherHash,
        college: 'SmartFace Institute of Technology',
        department: 'Computer Science & Engineering',
        designation: 'Associate Professor & AI Lab Director',
        employee_id: 'EMP-CSE-2024',
        classes: ['CSE-6A', 'AI-6A'],
        subjects: ['Machine Learning', 'Deep Learning & Vision', 'Cloud Architecture', 'Database Management Systems'],
        setup_completed: true,
        biometric_registered: true,
        avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'
      }
    },
    { upsert: true, returnDocument: 'after' }
  );
  console.log('✅ Teacher provisioned:', teacher.email);

  // D. Parent (Linked to real students: Bob Dylan & Abhishek)
  const parentHash = await bcrypt.hash('Parent@2026', salt);
  const parent = await User.findOneAndUpdate(
    { email: 'parent@smartface.pro' },
    {
      $set: {
        email: 'parent@smartface.pro',
        full_name: 'Robert & Sarah Cooper',
        role: 'parent',
        password: parentHash,
        college: 'SmartFace Institute of Technology',
        phone: '7090804228',
        children: ['bob@smartface.pro', 'abhikhavasi123@gmail.com'],
        linked_children: [
          { email: 'bob@smartface.pro', full_name: 'Bob Dylan', student_id: 'AI2405' },
          { email: 'abhikhavasi123@gmail.com', full_name: 'Abhishek', student_id: '25CS089' }
        ],
        setup_completed: true,
        avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150'
      }
    },
    { upsert: true, returnDocument: 'after' }
  );
  console.log('✅ Parent provisioned with 2 linked wards:', parent.email);

  // E. Ensure Student bob@smartface.pro has known password & links
  const studentBobHash = await bcrypt.hash('Student@2026', salt);
  const studentBob = await User.findOneAndUpdate(
    { email: 'bob@smartface.pro' },
    {
      $set: {
        email: 'bob@smartface.pro',
        full_name: 'Bob Dylan',
        role: 'student',
        password: studentBobHash,
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
      }
    },
    { upsert: true, returnDocument: 'after' }
  );

  // Standardize all 25 students with college & class mappings
  await User.updateMany(
    { role: 'student', department: { $regex: /computer science/i } },
    {
      $set: {
        college: 'SmartFace Institute of Technology',
        semester: '6th',
        section: 'A',
        parent_details: 'parent@smartface.pro'
      }
    }
  );
  await User.updateMany(
    { role: 'student', department: { $regex: /artificial intelligence/i } },
    {
      $set: {
        college: 'SmartFace Institute of Technology',
        semester: '6th',
        section: 'A',
        parent_details: 'parent@smartface.pro'
      }
    }
  );
  console.log('✅ All students normalized with valid college, semester, and section.');

  // 5. Seed Real Academic Timetable for CSE_6_A and AI_6_A
  console.log('\n--- 5. Seeding Real Academic Timetable ---');
  const scheduleSlots = [
    // CSE_6_A
    { user_id: 'CSE_6_A', subject: 'Machine Learning (CSE-601)', day: 'Monday', time: '09:00 AM - 10:30 AM', room: 'Room 401', teacher_email: 'teacher@smartface.pro' },
    { user_id: 'CSE_6_A', subject: 'Deep Learning & Vision (CSE-602)', day: 'Monday', time: '11:00 AM - 12:30 PM', room: 'AI Lab 2', teacher_email: 'teacher@smartface.pro' },
    { user_id: 'CSE_6_A', subject: 'Cloud Architecture (CSE-603)', day: 'Tuesday', time: '10:00 AM - 11:30 AM', room: 'Room 402', teacher_email: 'teacher@smartface.pro' },
    { user_id: 'CSE_6_A', subject: 'Database Management Systems (CSE-604)', day: 'Wednesday', time: '09:00 AM - 10:30 AM', room: 'Room 303', teacher_email: 'teacher@smartface.pro' },
    { user_id: 'CSE_6_A', subject: 'AI Ethics & Cyber Security (CSE-605)', day: 'Thursday', time: '02:00 PM - 03:30 PM', room: 'Auditorium A', teacher_email: 'teacher@smartface.pro' },
    { user_id: 'CSE_6_A', subject: 'Capstone Innovation Lab (CSE-606)', day: 'Friday', time: '10:00 AM - 01:00 PM', room: 'Innovation Center', teacher_email: 'teacher@smartface.pro' },
    // AI_6_A
    { user_id: 'AI_6_A', subject: 'Deep Learning & Vision (AI-601)', day: 'Monday', time: '09:00 AM - 10:30 AM', room: 'Lab 4', teacher_email: 'teacher@smartface.pro' },
    { user_id: 'AI_6_A', subject: 'Machine Learning (AI-602)', day: 'Tuesday', time: '11:00 AM - 12:30 PM', room: 'Room 302', teacher_email: 'teacher@smartface.pro' },
    { user_id: 'AI_6_A', subject: 'Cloud Architecture (AI-603)', day: 'Wednesday', time: '10:00 AM - 11:30 AM', room: 'Room 401', teacher_email: 'teacher@smartface.pro' },
    { user_id: 'AI_6_A', subject: 'AI Ethics & Cyber Security (AI-604)', day: 'Thursday', time: '09:00 AM - 10:30 AM', room: 'Auditorium B', teacher_email: 'teacher@smartface.pro' },
    { user_id: 'AI_6_A', subject: 'Computer Networks (AI-605)', day: 'Friday', time: '02:00 PM - 03:30 PM', room: 'Room 204', teacher_email: 'teacher@smartface.pro' },
    // Also teacher specific schedule
    { user_id: 'teacher@smartface.pro', subject: 'Machine Learning (CSE-601)', day: 'Monday', time: '09:00 AM - 10:30 AM', room: 'Room 401', teacher_email: 'teacher@smartface.pro' },
    { user_id: 'teacher@smartface.pro', subject: 'Deep Learning & Vision (AI-601)', day: 'Monday', time: '11:00 AM - 12:30 PM', room: 'AI Lab 2', teacher_email: 'teacher@smartface.pro' }
  ];

  for (const slot of scheduleSlots) {
    await Timetable.findOneAndUpdate(
      { user_id: slot.user_id, subject: slot.subject, day: slot.day, time: slot.time },
      { $set: { ...slot, college_id: 'SFIT' } },
      { upsert: true }
    );
  }
  console.log(`✅ Seeded ${scheduleSlots.length} real academic timetable slots into MongoDB.`);

  // 6. Seed Real Inter-Role Leave Workflows (Student -> Teacher -> Parent -> Admin)
  console.log('\n--- 6. Seeding Interconnected Leave Requests ---');
  await Leave.findOneAndUpdate(
    { user_id: 'bob@smartface.pro', start_date: '2026-11-28' },
    {
      $set: {
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
    { user_id: 'abhikhavasi123@gmail.com', start_date: '2026-11-15' },
    {
      $set: {
        user_id: 'abhikhavasi123@gmail.com',
        reason: 'Medical Leave - Viral Fever with physician certificate',
        start_date: '2026-11-15',
        end_date: '2026-11-17',
        status: 'Approved',
        remarks: 'Approved by Dr. Sarah Jenkins with medical verification'
      }
    },
    { upsert: true }
  );
  console.log('✅ Real Leave requests seeded connecting Student, Teacher, Parent, and Admin.');

  // 7. Seed Real Notifications
  console.log('\n--- 7. Seeding Initial Notifications ---');
  const notifs = [
    {
      user_id: 'bob@smartface.pro',
      title: 'Biometric Attendance Verification Successful',
      message: 'Your morning attendance for Machine Learning (CSE-601) has been confirmed with 99.4% confidence.',
      type: 'attendance',
      priority: 'Low'
    },
    {
      user_id: 'parent@smartface.pro',
      title: 'Daily Attendance Digest',
      message: 'Bob Dylan has completed all morning lectures with 100% attendance today.',
      type: 'attendance',
      priority: 'Normal'
    },
    {
      user_id: 'teacher@smartface.pro',
      title: 'Pending Leave Application: Bob Dylan',
      message: 'Bob Dylan (AI2405) has requested 3 days leave for Smart India Hackathon finals.',
      type: 'leave',
      priority: 'High'
    },
    {
      user_id: 'admin@smartface.pro',
      title: 'Biometric System Health: Optimal',
      message: 'All 8 camera kiosks online. 242 attendance records synchronized with 0 false rejections.',
      type: 'security',
      priority: 'Normal'
    }
  ];

  for (const n of notifs) {
    await Notification.findOneAndUpdate(
      { user_id: n.user_id, title: n.title },
      { $set: n },
      { upsert: true }
    );
  }
  console.log('✅ Real notifications seeded across all role channels.');

  console.log('\n======================================================');
  console.log('🎉 PRODUCTION SAAS PLATFORM DATABASE SYNC COMPLETE!');
  console.log('======================================================');

  await mongoose.disconnect();
}

seedProductionSaaS().catch(err => {
  console.error('❌ Error during seeding:', err);
  process.exit(1);
});
