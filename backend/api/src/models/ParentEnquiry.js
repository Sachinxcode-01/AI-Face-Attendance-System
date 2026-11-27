const mongoose = require('mongoose');

const ParentEnquirySchema = new mongoose.Schema({
  parent_email: { type: String, required: true, lowercase: true, trim: true, index: true },
  student_email: { type: String, required: true, lowercase: true, trim: true, index: true },
  college_id: { type: String, index: true },
  department: { type: String },
  subject: { type: String, required: true, trim: true, maxlength: 160 },
  category: {
    type: String,
    enum: ['attendance_enquiry', 'policy_clarification', 'leave_followup', 'correction_followup', 'general'],
    default: 'attendance_enquiry',
  },
  message: { type: String, required: true, trim: true, maxlength: 2000 },
  status: {
    type: String,
    enum: ['submitted', 'assigned', 'under_review', 'responded', 'resolved', 'closed'],
    default: 'submitted',
    index: true,
  },
  assigned_to_role: { type: String, default: 'coordinator' },
  responses: [{
    sender_role: { type: String },
    sender_label: { type: String },
    message: { type: String },
    timestamp: { type: Date, default: Date.now },
  }],
  created_at: { type: Date, default: Date.now, index: -1 },
  updated_at: { type: Date, default: Date.now },
});

ParentEnquirySchema.index({ parent_email: 1, student_email: 1, created_at: -1 });

module.exports = mongoose.model('ParentEnquiry', ParentEnquirySchema, 'parent_enquiries');
