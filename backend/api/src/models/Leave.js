const mongoose = require('mongoose');

const LeaveSchema = new mongoose.Schema({
  user_id: { type: String, required: true, index: true },
  college_id: { type: String, index: true },
  reason: { type: String, required: true },
  category: { type: String, default: 'Academic' }, // Medical, Personal, Emergency, Academic, Sports, Institutional Activity, Other
  start_date: { type: String, required: true },
  end_date: { type: String, required: true },
  status: { type: String, default: "Pending", index: true }, // Draft, Pending, Under Review, Clarification, Approved, Rejected, Withdrawn, Cancelled
  document_url: { type: String },
  document_name: { type: String },
  remarks: { type: String },
  reviewed_by: { type: String },
  reviewed_at: { type: Date },
  status_history: [{
    status: { type: String },
    actor: { type: String },
    note: { type: String },
    timestamp: { type: Date, default: Date.now }
  }],
  seed_id: { type: String, sparse: true, index: true },
  updated_at: { type: Date, default: Date.now },
  created_at: { type: Date, default: Date.now }
});

LeaveSchema.index({ status: 1, user_id: 1 });
LeaveSchema.index({ user_id: 1, created_at: -1 });

module.exports = mongoose.model('Leave', LeaveSchema, 'leaves');
