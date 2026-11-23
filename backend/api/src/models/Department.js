const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  college_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  hod_email: {
    type: String,
    default: null
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

departmentSchema.index({ college_id: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('Department', departmentSchema);
