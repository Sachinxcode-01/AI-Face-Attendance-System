const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  module: {
    type: String,
    required: true,
    index: true
  },
  description: {
    type: String,
    default: ''
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

module.exports = mongoose.model('Permission', permissionSchema);
