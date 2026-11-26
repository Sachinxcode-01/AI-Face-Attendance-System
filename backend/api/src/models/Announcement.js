const mongoose = require('mongoose');

const AnnouncementSchema = new mongoose.Schema({
  college_id: { type: String, index: true },
  department: { type: String, index: true },
  author_email: { type: String, required: true, index: true, lowercase: true, trim: true },
  author_name: { type: String, default: 'Faculty' },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  message: { type: String, required: true, trim: true, maxlength: 2000 },
  category: {
    type: String,
    enum: ['class', 'subject', 'attendance_reminder', 'schedule_update', 'deadline', 'exam', 'instruction'],
    default: 'class',
  },
  priority: {
    type: String,
    enum: ['Low', 'Normal', 'High', 'Critical'],
    default: 'Normal',
  },
  target_scope: {
    type: String,
    enum: ['class', 'subject', 'department'],
    default: 'department',
  },
  target_subject: { type: String },
  target_section: { type: String },
  target_semester: { type: String },
  attachments: [{
    name: { type: String },
    url: { type: String },
  }],
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'published', 'expired'],
    default: 'published',
    index: true,
  },
  pinned: { type: Boolean, default: false },
  scheduled_for: { type: Date },
  published_at: { type: Date },
  expires_at: { type: Date },
  delivery_stats: {
    recipients: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
  },
  created_at: { type: Date, default: Date.now, index: -1 },
  updated_at: { type: Date, default: Date.now },
});

AnnouncementSchema.index({ college_id: 1, author_email: 1, created_at: -1 });
AnnouncementSchema.index({ status: 1, scheduled_for: 1 });

module.exports = mongoose.model('Announcement', AnnouncementSchema, 'announcements');
