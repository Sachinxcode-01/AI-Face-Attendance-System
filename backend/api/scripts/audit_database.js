const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

async function audit() {
  const uri = process.env.MONGODB_URL || process.env.MONGO_URI;
  await mongoose.connect(uri, { dbName: 'smartface' });
  console.log('✅ Connected to MongoDB:', mongoose.connection.name);

  try {
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n--- Actual MongoDB Collections & Document Counts ---');
    for (const col of collections) {
      const count = await mongoose.connection.db.collection(col.name).countDocuments();
      console.log(` • ${col.name}: ${count}`);
    }

    // Load real models from backend
    const User = require('../src/models/User');
    const College = require('../src/models/College');
    const Department = require('../src/models/Department');
    const Attendance = require('../src/models/Attendance');
    const Session = require('../src/models/Session');
    const Leave = require('../src/models/Leave');
    const Role = require('../src/models/Role');
    const Permission = require('../src/models/Permission');

    console.log('\n--- Model Counts ---');
    console.log('Users:', await User.countDocuments());
    console.log('Colleges:', await College.countDocuments());
    console.log('Departments:', await Department.countDocuments());
    console.log('Attendance records:', await Attendance.countDocuments());
    console.log('Sessions:', await Session.countDocuments());
    console.log('Leaves:', await Leave.countDocuments());
    console.log('Roles:', await Role.countDocuments());
    console.log('Permissions:', await Permission.countDocuments());

    // Check super_admin
    const superAdmin = await User.findOne({ role: 'super_admin' });
    console.log('\nSuper Admin User:', superAdmin ? superAdmin.email : 'NONE');

    // Check admin
    const admin = await User.findOne({ role: 'admin' });
    console.log('Admin User:', admin ? admin.email : 'NONE');

    // Check teacher
    const teacher = await User.findOne({ role: 'teacher' });
    console.log('Teacher User:', teacher ? teacher.email : 'NONE');

    // Check parent
    const parent = await User.findOne({ role: 'parent' });
    console.log('Parent User:', parent ? parent.email : 'NONE');

    // Check student
    const student = await User.findOne({ role: 'student' });
    console.log('Student User:', student ? student.email : 'NONE');
  } finally {
    await mongoose.disconnect();
  }
}

audit().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
