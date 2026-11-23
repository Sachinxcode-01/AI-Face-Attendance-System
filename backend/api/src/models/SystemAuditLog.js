const mongoose = require('mongoose');

const systemAuditLogSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  actor_email: {
    type: String,
    required: true,
    index: true
  },
  role: {
    type: String,
    required: true,
    index: true
  },
  action: {
    type: String,
    required: true,
    index: true
  },
  module: {
    type: String,
    required: true,
    enum: ['AUTH', 'ATTENDANCE', 'LEAVE', 'ACADEMIC', 'SECURITY', 'ADMIN', 'AI', 'NOTIFICATION'],
    index: true
  },
  entity_id: {
    type: String,
    default: null,
    index: true
  },
  description: {
    type: String,
    default: ''
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ip_address: {
    type: String,
    default: '127.0.0.1'
  },
  user_agent: {
    type: String,
    default: 'unknown'
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

systemAuditLogSchema.index({ module: 1, created_at: -1 });
systemAuditLogSchema.index({ action: 1, created_at: -1 });
systemAuditLogSchema.index({ actor_email: 1, created_at: -1 });

module.exports = mongoose.model('SystemAuditLog', systemAuditLogSchema);
