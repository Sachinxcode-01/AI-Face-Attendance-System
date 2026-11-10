const mongoose = require('mongoose');

const LeaveSchema = new mongoose.Schema({
  user_id: { type: String, required: true, index: true },
  reason: { type: String, required: true },
  start_date: { type: String, required: true },
  end_date: { type: String, required: true },
  status: { type: String, default: "Pending", index: true }, // Pending, Under Review, Approved, Rejected
  document_url: { type: String },
  remarks: { type: String },
  created_at: { type: Date, default: Date.now }
});

LeaveSchema.index({ status: 1, user_id: 1 });
LeaveSchema.index({ user_id: 1, created_at: -1 });

module.exports = mongoose.model('Leave', LeaveSchema, 'leaves');
