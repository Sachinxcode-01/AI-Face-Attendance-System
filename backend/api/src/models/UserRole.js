const mongoose = require('mongoose');

const userRoleSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  role_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
    required: true,
    index: true
  },
  assigned_by: {
    type: String,
    default: 'system'
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Compound unique index to prevent duplicate role assignments
userRoleSchema.index({ user_id: 1, role_id: 1 }, { unique: true });

module.exports = mongoose.model('UserRole', userRoleSchema);
