const mongoose = require('mongoose');

const jobExecutionSchema = new mongoose.Schema({
  job_type: {
    type: String,
    enum: ['EMAIL', 'ATTENDANCE_SUMMARY', 'FACE_TRAINING', 'NOTIFICATION', 'ANALYTICS', 'CLEANUP', 'BACKUP'],
    required: true,
    index: true
  },
  job_id: {
    type: String,
    required: true,
    index: true
  },
  queue_name: {
    type: String,
    default: 'default'
  },
  status: {
    type: String,
    enum: ['QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'RETRYING'],
    default: 'QUEUED',
    index: true
  },
  attempts: {
    type: Number,
    default: 0
  },
  started_at: {
    type: Date
  },
  completed_at: {
    type: Date
  },
  error_message: {
    type: String,
    default: null
  },
  payload: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

jobExecutionSchema.index({ job_type: 1, status: 1, created_at: -1 });

module.exports = mongoose.model('JobExecution', jobExecutionSchema);
