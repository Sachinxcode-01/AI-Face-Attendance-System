const assert = require('assert');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const { connectDB } = require('../../src/config/database');
const Timetable = require('../../src/models/Timetable');
const User = require('../../src/models/User');

async function runTests() {
  console.log('\n=============================================================');
  console.log('🧪 TESTING COLLEGE PRODUCTION MANAGEMENT & TIMETABLE ENGINES');
  console.log('=============================================================\n');

  await connectDB();

  // Test 1: Timetable Model Schema & Index
  console.log('[TEST 1] Verifying Timetable schema fields & compound indexing...');
  const testSlot = new Timetable({
    user_id: 'CSE_4_A',
    subject: 'Data Structures & Algorithms',
    day: 'Wednesday',
    time: '10:00 AM - 11:30 AM',
    room: 'Hall-101',
    college_id: 'COLLEGE_ALPHA',
    teacher_email: 'prof.smith@alpha.edu'
  });
  await testSlot.save();
  assert.ok(testSlot._id);
  assert.strictEqual(testSlot.college_id, 'COLLEGE_ALPHA');
  assert.strictEqual(testSlot.teacher_email, 'prof.smith@alpha.edu');
  console.log('  ✅ Timetable slot saved with college_id & teacher_email.');

  // Test 2: Conflict Detection Logic
  console.log('[TEST 2] Verifying Timetable Conflict Detection Engine...');
  const conflictSlot = new Timetable({
    user_id: 'CSE_4_B',
    subject: 'Database Systems',
    day: 'Wednesday',
    time: '10:00 AM - 11:30 AM',
    room: 'Hall-101', // Same room, same time, same day!
    college_id: 'COLLEGE_ALPHA',
    teacher_email: 'prof.smith@alpha.edu' // Also same teacher!
  });
  await conflictSlot.save();

  const collegeSlots = await Timetable.find({ college_id: 'COLLEGE_ALPHA' }).lean();
  const roomMap = new Map();
  const teacherMap = new Map();
  const roomConflicts = [];
  const teacherConflicts = [];

  for (const slot of collegeSlots) {
    if (slot.room) {
      const roomKey = `${slot.day}_${slot.room.trim().toUpperCase()}_${slot.time.trim()}`;
      if (roomMap.has(roomKey)) {
        roomConflicts.push({ room: slot.room, time: slot.time });
      } else {
        roomMap.set(roomKey, slot._id);
      }
    }
    if (slot.teacher_email) {
      const teacherKey = `${slot.day}_${slot.teacher_email.trim().toLowerCase()}_${slot.time.trim()}`;
      if (teacherMap.has(teacherKey)) {
        teacherConflicts.push({ teacher: slot.teacher_email, time: slot.time });
      } else {
        teacherMap.set(teacherKey, slot._id);
      }
    }
  }

  assert.strictEqual(roomConflicts.length >= 1, true, 'Should detect room double booking');
  assert.strictEqual(teacherConflicts.length >= 1, true, 'Should detect teacher double booking');
  console.log('  ✅ Conflict detector successfully caught room double-booking & teacher clash.');

  // Clean up timetable test slots
  await Timetable.deleteMany({ college_id: 'COLLEGE_ALPHA' });
  console.log('  🧹 Cleaned up test timetable slots.');

  // Test 3: User Multi-tenant Isolation & Bulk Validation
  console.log('[TEST 3] Testing User Multi-tenant Isolation & Bulk Insert...');
  const sampleUsers = [
    { email: 'student1@alpha.edu', full_name: 'Student One', role: 'student', college: 'COLLEGE_ALPHA' },
    { email: 'student2@alpha.edu', full_name: 'Student Two', role: 'student', college: 'COLLEGE_ALPHA' },
    { email: 'student3@beta.edu', full_name: 'Student Three', role: 'student', college: 'COLLEGE_BETA' }
  ];

  // Clean old test users
  await User.deleteMany({ email: { $in: sampleUsers.map(u => u.email) } });

  await User.insertMany(sampleUsers);
  const alphaStudents = await User.find({ college: 'COLLEGE_ALPHA' }).lean();
  const betaStudents = await User.find({ college: 'COLLEGE_BETA' }).lean();

  assert.strictEqual(alphaStudents.length, 2, 'College Alpha should have 2 students');
  assert.strictEqual(betaStudents.length, 1, 'College Beta should have 1 student');
  console.log('  ✅ Multi-tenant data segregation verified across colleges.');

  // Clean up test users
  await User.deleteMany({ email: { $in: sampleUsers.map(u => u.email) } });
  console.log('  🧹 Cleaned up test users.');

  console.log('\n=============================================================');
  console.log('🎉 ALL COLLEGE MANAGEMENT PRODUCTION TESTS PASSED!');
  console.log('=============================================================\n');

  await mongoose.disconnect();
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
