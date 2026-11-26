const mongoose = require('mongoose');

const collegeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  address: {
    type: String,
    default: ''
  },
  domain: {
    type: String,
    index: true
  },
  departments: {
    type: [String],
    default: undefined
  },
  admin_email: {
    type: String,
    default: null
  },
  is_active: {
    type: Boolean,
    default: true,
    index: true
  },
  // White-label branding configurations
  branding: {
    logo_url: { type: String, default: null },
    favicon_url: { type: String, default: null },
    primary_color: { type: String, default: '#4f46e5' },
    secondary_color: { type: String, default: '#06b6d4' },
    accent_color: { type: String, default: '#f59e0b' },
    portal_title: { type: String, default: null },
    custom_domain: { type: String, default: null, sparse: true, index: true },
    custom_domain_verified: { type: Boolean, default: false },
    sender_name: { type: String, default: null },
    support_email: { type: String, default: null }
  },
  // Enterprise subscription & billing
  subscription: {
    plan: {
      type: String,
      enum: ['pilot', 'standard', 'enterprise'],
      default: 'pilot'
    },
    status: {
      type: String,
      enum: ['trialing', 'active', 'past_due', 'canceled', 'paused'],
      default: 'trialing'
    },
    billing_cycle: {
      type: String,
      enum: ['monthly', 'annual'],
      default: 'annual'
    },
    current_period_end: {
      type: Date,
      default: () => new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 60-day pilot default
    },
    student_quota: { type: Number, default: 250 },
    active_students_count: { type: Number, default: 0 },
    stripe_customer_id: { type: String, default: null },
    stripe_subscription_id: { type: String, default: null },
    currency: { type: String, default: 'USD' }
  },
  // SIS / LMS configuration
  sis_config: {
    provider: {
      type: String,
      enum: ['none', 'canvas', 'moodle', 'blackboard', 'oneroster'],
      default: 'none'
    },
    api_url: { type: String, default: null },
    sync_enabled: { type: Boolean, default: false },
    last_sync_at: { type: Date, default: null },
    last_sync_status: { type: String, enum: ['idle', 'success', 'failed', 'running'], default: 'idle' },
    auto_sync_frequency_hours: { type: Number, default: 24 }
  },
  // Attendance & Academic Policy configuration
  attendance_policy: {
    min_percentage: { type: Number, default: 75, min: 0, max: 100 },
    approved_leave_counts_as_present: { type: Boolean, default: false },
    excused_counts_as_present: { type: Boolean, default: true },
    late_counts_as_present: { type: Boolean, default: true },
    dispute_deadline_days: { type: Number, default: 14 },
    allow_leave_withdrawal: { type: Boolean, default: true },
    timezone: { type: String, default: 'Asia/Kolkata' },
    academic_year: { type: String, default: '2026-2027' },
    current_semester: { type: String, default: 'Odd Semester' },
    semester_end_date: { type: Date, default: null }
  },
  biometric_config: {
    similarity_threshold: { type: Number, default: 0.65, min: 0.5, max: 0.85 },
    liveness_required: { type: Boolean, default: true },
    retention_days: { type: Number, default: 365 },
    updated_at: { type: Date, default: null },
    updated_by: { type: String, default: null }
  },
  policy_history: {
    type: [{
      version: Number,
      changed_by: String,
      changed_at: { type: Date, default: Date.now },
      reason: String,
      snapshot: mongoose.Schema.Types.Mixed
    }],
    default: []
  },
  academic_terms: {
    type: [{
      name: String,
      academic_year: String,
      start_date: Date,
      end_date: Date,
      status: { type: String, enum: ['draft', 'active', 'closed'], default: 'draft' }
    }],
    default: []
  },
  governance_config: {
    working_days: { type: [String], default: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] },
    attendance_retention_days: { type: Number, default: 1825 },
    security_snapshot_retention_days: { type: Number, default: 30 },
    audit_retention_days: { type: Number, default: 2555 }
  },
  // Customer Success & health telemetry
  health_telemetry: {
    score: { type: Number, default: 95 },
    category: {
      type: String,
      enum: ['HEALTHY', 'NEUTRAL', 'AT_RISK', 'CRITICAL'],
      default: 'HEALTHY'
    },
    nps_score: { type: Number, default: 72 },
    open_tickets_count: { type: Number, default: 0 },
    last_login_at: { type: Date, default: Date.now }
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

module.exports = mongoose.model('College', collegeSchema);
