const mongoose = require('mongoose');

const backupMetadataSchema = new mongoose.Schema({
  backup_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  backup_type: {
    type: String,
    enum: ['DAILY_SNAPSHOT', 'WEEKLY_FULL', 'BIOMETRIC_DATASET', 'MANUAL'],
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['IN_PROGRESS', 'SUCCESS', 'FAILED'],
    default: 'IN_PROGRESS',
    index: true
  },
  file_size_bytes: {
    type: Number,
    default: 0
  },
  storage_location: {
    type: String,
    required: true
  },
  checksum_sha256: {
    type: String,
    default: ''
  },
  restore_point: {
    type: Date,
    required: true
  },
  recovery_validated: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

backupMetadataSchema.index({ backup_type: 1, created_at: -1 });

module.exports = mongoose.model('BackupMetadata', backupMetadataSchema);
