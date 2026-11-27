const mongoose = require('mongoose');
const { GUARDIAN_RELATIONSHIP_TYPES } = require('./GuardianRelationship');

const GuardianInvitationSchema = new mongoose.Schema({
  token_hash: { type: String, required: true, unique: true, index: true },
  student_email: { type: String, required: true, lowercase: true, trim: true, index: true },
  college_id: { type: String, index: true },
  intended_parent_email: { type: String, lowercase: true, trim: true },
  relationship_type: {
    type: String,
    enum: GUARDIAN_RELATIONSHIP_TYPES,
    default: 'legal_guardian',
  },
  created_by: { type: String, required: true, lowercase: true, trim: true },
  created_by_role: { type: String },
  status: {
    type: String,
    enum: ['active', 'redeemed', 'expired', 'revoked'],
    default: 'active',
    index: true,
  },
  redeemed_by: { type: String, lowercase: true, trim: true },
  redeemed_at: { type: Date },
  expires_at: { type: Date, required: true, index: true },
  created_at: { type: Date, default: Date.now },
});

GuardianInvitationSchema.index({ student_email: 1, status: 1, expires_at: 1 });

module.exports = mongoose.model('GuardianInvitation', GuardianInvitationSchema, 'guardian_invitations');
