const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema({
  course_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  semester: {
    type: Number,
    required: true
  },
  academic_year: {
    type: String,
    required: true
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

sectionSchema.index({ course_id: 1, name: 1, academic_year: 1 }, { unique: true });

module.exports = mongoose.model('Section', sectionSchema);
