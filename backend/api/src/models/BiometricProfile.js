const mongoose = require('mongoose');

const BiometricProfileSchema = new mongoose.Schema({
  user_email: { 
    type: String, 
    required: true, 
    unique: true, 
    index: true,
    lowercase: true,
    trim: true 
  },
  user_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    index: true 
  },
  // 512-dimensional normalized face embedding vector (ArcFace / InsightFace)
  embedding: { 
    type: [Number], 
    required: true 
  },
  vector_version: { 
    type: String, 
    default: 'arcface-insightface-512-v1' 
  },
  consent_given: { 
    type: Boolean, 
    default: true 
  },
  consent_timestamp: { 
    type: Date, 
    default: Date.now 
  },
  updated_at: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('BiometricProfile', BiometricProfileSchema, 'biometric_profiles');
