const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  department_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
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
  credits: {
    type: Number,
    default: 3
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

courseSchema.index({ department_id: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('Course', courseSchema);
