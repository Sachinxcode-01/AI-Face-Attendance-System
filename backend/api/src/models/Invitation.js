const mongoose = require('mongoose');

const InvitationSchema = new mongoose.Schema({
  token_hash: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, lowercase: true, trim: true, index: true },
  role: {
    type: String,
    required: true,
    enum: ['student', 'teacher', 'parent', 'admin', 'hod', 'principal', 'management']
  },
  college_id: { type: String, index: true },
  college_name: { type: String },
  department: { type: String },
  invited_by: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'expired', 'revoked'],
    default: 'pending',
    index: true
  },
  expires_at: { type: Date, required: true, index: true },
  accepted_at: { type: Date },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Invitation', InvitationSchema, 'auth_invitations');
