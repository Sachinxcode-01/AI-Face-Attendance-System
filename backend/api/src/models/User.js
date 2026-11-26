const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, index: true },
  full_name: { type: String, required: true },
  role: {
    type: String,
    required: true,
    enum: ['student', 'teacher', 'parent', 'admin', 'super_admin', 'hod', 'principal', 'management'],
    index: true
  },
  email_verified: { type: Boolean, default: false },
  college_id: { type: String, index: true },
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
  theme_preference: { type: String, default: 'dark' },
  academic_year: { type: String },
  notification_preferences: {
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    in_app: { type: Boolean, default: true },
    shortage_alerts: { type: Boolean, default: true },
    reminder_minutes_before: { type: Number, default: 15 },
    quiet_hours: {
      enabled: { type: Boolean, default: false },
      start: { type: String, default: '22:00' },
      end: { type: String, default: '07:00' }
    }
  },
  privacy_preferences: {
    biometric_consent: { type: Boolean, default: false },
    consent_updated_at: { type: Date },
    data_retention_ack: { type: Boolean, default: false },
    deletion_requested_at: { type: Date },
    deletion_reason: { type: String }
  },
  employee_id: { type: String },
  designation: { type: String },
  specialization: { type: String },
  qualification: { type: String },
  experience: { type: String },
  gender: { type: String },
  address: { type: String },
  account_status: {
    type: String,
    enum: ['active', 'suspended', 'archived', 'pending'],
    default: 'active',
    index: true
  },
  assigned_subjects: { type: [String], default: [] },
  assigned_sections: { type: [String], default: [] },
  permissions_override: { type: [String], default: [] },
  created_at: { type: Date, default: Date.now }
});

UserSchema.index({ email: 1, role: 1 });
UserSchema.index({ college_id: 1, role: 1, account_status: 1 });
UserSchema.index({ college: 1, role: 1 });

module.exports = mongoose.model('User', UserSchema, 'users');
