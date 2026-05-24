const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  user_id: { type: String, required: true, index: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, required: true }, // attendance, leave, security, announcement
  priority: { type: String, default: "Info" },
  is_read: { type: Boolean, default: false, index: true },
  created_at: { type: Date, default: Date.now, index: -1 },
  extra_data: { type: mongoose.Schema.Types.Mixed, default: {} }
});

NotificationSchema.index({ user_id: 1, is_read: 1, created_at: -1 });

module.exports = mongoose.model('Notification', NotificationSchema, 'notifications');
