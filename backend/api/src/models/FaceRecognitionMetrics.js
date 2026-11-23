const mongoose = require('mongoose');

const faceRecognitionMetricsSchema = new mongoose.Schema({
  attendance_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Attendance',
    index: true
  },
  user_email: {
    type: String,
    required: true,
    index: true
  },
  model_version: {
    type: String,
    default: 'InsightFace-ArcFace-buffalo_l'
  },
  confidence_score: {
    type: Number,
    required: true,
    min: 0.0,
    max: 1.0
  },
  processing_time_ms: {
    type: Number,
    required: true
  },
  recognition_result: {
    type: String,
    enum: ['MATCH', 'MISMATCH', 'NO_FACE', 'MULTIPLE_FACES', 'INTRUDER', 'ERROR'],
    required: true,
    index: true
  },
  liveness_score: {
    type: Number,
    default: 1.0
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

faceRecognitionMetricsSchema.index({ user_email: 1, created_at: -1 });
faceRecognitionMetricsSchema.index({ recognition_result: 1, created_at: -1 });

module.exports = mongoose.model('FaceRecognitionMetrics', faceRecognitionMetricsSchema);
