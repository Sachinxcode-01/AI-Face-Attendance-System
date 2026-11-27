const mongoose = require('mongoose');

const GUARDIAN_RELATIONSHIP_TYPES = [
  'father',
  'mother',
  'legal_guardian',
  'authorized_guardian',
];

const GUARDIAN_STATUSES = [
  'pending_verification',
  'pending_approval',
  'active',
  'suspended',
  'rejected',
  'expired',
  'revoked',
];

const GuardianRelationshipSchema = new mongoose.Schema({
  parent_email: { type: String, required: true, lowercase: true, trim: true, index: true },
  student_email: { type: String, required: true, lowercase: true, trim: true, index: true },
  college_id: { type: String, index: true },
  relationship_type: {
    type: String,
    enum: GUARDIAN_RELATIONSHIP_TYPES,
    default: 'legal_guardian',
  },
  status: {
    type: String,
    enum: GUARDIAN_STATUSES,
    default: 'pending_approval',
    index: true,
  },
  verification_method: {
    type: String,
    enum: ['invitation_code', 'student_confirmation', 'admin_approval', 'registered_contact', 'legacy_sync'],
    default: 'invitation_code',
  },
  consent_granted: { type: Boolean, default: false },
  consent_granted_at: { type: Date },
  consent_granted_by: { type: String, lowercase: true, trim: true },
  permissions: {
    view_attendance: { type: Boolean, default: true },
    view_timetable: { type: Boolean, default: true },
    view_leaves: { type: Boolean, default: true },
    submit_leave: { type: Boolean, default: true },
    submit_dispute: { type: Boolean, default: true },
    download_reports: { type: Boolean, default: true },
    use_nexa: { type: Boolean, default: true },
  },
  approved_by: { type: String, lowercase: true, trim: true },
  approved_at: { type: Date },
  revoked_by: { type: String, lowercase: true, trim: true },
  revoked_at: { type: Date },
  revocation_reason: { type: String },
  expires_at: { type: Date },
  audit_trail: [{
    action: { type: String, required: true },
    actor: { type: String },
    role: { type: String },
    note: { type: String },
    timestamp: { type: Date, default: Date.now },
  }],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

GuardianRelationshipSchema.index({ parent_email: 1, student_email: 1 }, { unique: true });
GuardianRelationshipSchema.index({ student_email: 1, status: 1 });
GuardianRelationshipSchema.index({ college_id: 1, status: 1 });

module.exports = mongoose.model('GuardianRelationship', GuardianRelationshipSchema, 'guardian_relationships');
module.exports.GUARDIAN_RELATIONSHIP_TYPES = GUARDIAN_RELATIONSHIP_TYPES;
module.exports.GUARDIAN_STATUSES = GUARDIAN_STATUSES;
