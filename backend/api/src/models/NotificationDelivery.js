const mongoose = require('mongoose');

const notificationDeliverySchema = new mongoose.Schema({
  notification_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Notification',
    required: true,
    index: true
  },
  user_email: {
    type: String,
    required: true,
    index: true
  },
  channel: {
    type: String,
    enum: ['IN_APP', 'EMAIL', 'PUSH'],
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['QUEUED', 'SENT', 'DELIVERED', 'OPENED', 'FAILED'],
    default: 'QUEUED',
    index: true
  },
  delivered_at: {
    type: Date
  },
  opened_at: {
    type: Date
  },
  error_message: {
    type: String,
    default: null
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

notificationDeliverySchema.index({ notification_id: 1, user_email: 1, channel: 1 }, { unique: true });

module.exports = mongoose.model('NotificationDelivery', notificationDeliverySchema);
