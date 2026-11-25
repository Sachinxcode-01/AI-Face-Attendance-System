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
