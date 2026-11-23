const mongoose = require('mongoose');

const aiModelMetricsSchema = new mongoose.Schema({
  model_version: {
    type: String,
    required: true,
    index: true
  },
  accuracy: {
    type: Number,
    required: true
  },
  false_positive_rate: {
    type: Number,
    default: 0.0
  },
  false_negative_rate: {
    type: Number,
    default: 0.0
  },
  average_processing_time_ms: {
    type: Number,
    required: true
  },
  dataset_size: {
    type: Number,
    required: true
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

aiModelMetricsSchema.index({ model_version: 1, created_at: -1 });

module.exports = mongoose.model('AIModelMetrics', aiModelMetricsSchema);
