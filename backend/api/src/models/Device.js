const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  user_email: {
    type: String,
    required: true,
    index: true
  },
  device_name: {
    type: String,
    default: 'Unknown Device'
  },
  platform: {
    type: String,
    enum: ['web', 'ios', 'android', 'desktop', 'unknown'],
    default: 'unknown'
  },
  browser: {
    type: String,
    default: 'Unknown Browser'
  },
  ip_address: {
    type: String,
    default: '127.0.0.1'
  },
  location: {
    type: String,
    default: 'Unknown Location'
  },
  last_seen: {
    type: Date,
    default: Date.now,
    index: true
  },
  is_trusted: {
    type: Boolean,
    default: true
  },
  is_active: {
    type: Boolean,
    default: true,
    index: true
  },
  device_fingerprint: {
    type: String,
    required: true,
    index: true
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

deviceSchema.index({ user_id: 1, device_fingerprint: 1 }, { unique: true });

module.exports = mongoose.model('Device', deviceSchema);
