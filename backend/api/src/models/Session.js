const mongoose = require('mongoose');

const SESSION_STATUSES = [
  'scheduled',
  'ready',
  'active',
  'paused',
  'resumed',
  'closed',
  'cancelled',
  'under_review',
  'finalised',
];

const SessionSchema = new mongoose.Schema({
  teacher_id: { type: String, required: true, index: true },
  college_id: { type: String, index: true },
  department: { type: String, index: true },
  subject: { type: String, required: true },
  subject_code: { type: String },
  section: { type: String },
  semester: { type: String },
  class_key: { type: String, index: true },
  academic_year: { type: String },
  room: { type: String },
  duration: { type: String, default: "1 Hour" },
  duration_minutes: { type: Number, default: 60 },
  extended_minutes: { type: Number, default: 0 },
  scheduled_start: { type: Date },
  start_time: {
    type: Date,
    default: function () {
      if (this && ['scheduled', 'ready'].includes(this.status)) {
        return undefined;
      }
      return Date.now();
    },
    index: -1,
  },
  expires_at: { type: Date },
  paused_at: { type: Date },
  resumed_at: { type: Date },
  closed_at: { type: Date },
  cancelled_at: { type: Date },
  cancellation_reason: { type: String },
  finalised_at: { type: Date },
  finalised_by: { type: String },
  status: {
    type: String,
    enum: SESSION_STATUSES,
    default: function () {
      return this && this.is_active === false ? 'closed' : 'active';
    },
    index: true,
  },
  is_active: {
    type: Boolean,
    default: function () {
      if (this && this.status) {
        return ['active', 'paused', 'resumed'].includes(this.status);
      }
      return true;
    },
    index: true,
  },
  qr_code: { type: String, required: true },
  qr_epoch: { type: Number, default: 1 },
  qr_rotation_seconds: { type: Number, default: 15, min: 5, max: 120 },
  verification_methods: { type: [String], default: ['qr', 'face', 'manual'] },
  late_threshold_minutes: { type: Number, default: 15 },
  latitude: { type: Number },
  longitude: { type: Number },
  radius_meters: { type: Number },
  telemetry: {
    duplicate_attempts: { type: Number, default: 0 },
    failed_verifications: { type: Number, default: 0 },
    pending_verifications: { type: Number, default: 0 },
  },
});

// Serves the live-monitor / active-session lookups and per-subject analytics.
SessionSchema.index({ is_active: 1, start_time: -1 });
SessionSchema.index({ teacher_id: 1, start_time: -1 });
SessionSchema.index({ college_id: 1, status: 1, start_time: -1 });
SessionSchema.index({ subject: 1 });
SessionSchema.index(
  { teacher_id: 1, subject: 1 },
  { unique: true, partialFilterExpression: { is_active: true } }
);

SessionSchema.statics.SESSION_STATUSES = SESSION_STATUSES;

module.exports = mongoose.model('Session', SessionSchema, 'sessions');
