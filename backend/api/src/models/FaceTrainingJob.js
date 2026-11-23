const mongoose = require('mongoose');

const faceTrainingJobSchema = new mongoose.Schema({
  triggered_by: {
    type: String,
    required: true,
    index: true
  },
  dataset_size: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED'],
    default: 'PENDING',
    index: true
  },
  accuracy: {
    type: Number,
    default: 0.0
  },
  started_at: {
    type: Date,
    default: Date.now
  },
  completed_at: {
    type: Date
  },
  error_message: {
    type: String,
    default: null
  },
  encodings_output_path: {
    type: String
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

faceTrainingJobSchema.index({ status: 1, created_at: -1 });

module.exports = mongoose.model('FaceTrainingJob', faceTrainingJobSchema);
