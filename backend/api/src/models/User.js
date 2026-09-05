const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, index: true },
  full_name: { type: String, required: true },
  role: { type: String, required: true, index: true }, // admin, teacher, student
  password: { type: String },
  failedLoginAttempts: { type: Number, default: 0 },
  lockoutUntil: { type: Date },
  loginProgressiveDelay: { type: Number, default: 0 },
  biometric_registered: { type: Boolean, default: false },
  setup_completed: { type: Boolean, default: false },
  linked_children: [{ email: String, full_name: String, student_id: String }],
  avatar_url: { type: String },
  profilePhotoUrl: { type: String },
  profilePhotoPublicId: { type: String },
  phone: { type: String },
  dob: { type: String },
  college: { type: String },
  department: { type: String },
  semester: { type: String },
  student_id: { type: String },
  usn: { type: String },
  course: { type: String },
  section: { type: String },
  roll_number: { type: String },
  parent_details: { type: String },
  children: { type: [String], default: [] }, // student emails linked to a parent account
  language_preference: { type: String, default: 'English' },
  notification_preferences: {
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    in_app: { type: Boolean, default: true }
  },
  employee_id: { type: String },
  designation: { type: String },
  specialization: { type: String },
  qualification: { type: String },
  experience: { type: String },
  gender: { type: String },
  address: { type: String },
  created_at: { type: Date, default: Date.now }
});

UserSchema.index({ email: 1, role: 1 });

module.exports = mongoose.model('User', UserSchema, 'users');
