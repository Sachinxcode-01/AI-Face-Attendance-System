const mongoose = require('mongoose');

const campusDeviceSchema = new mongoose.Schema({
  device_id: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  device_type: {
    type: String,
    enum: ['terminal', 'usb_camera', 'ip_camera', 'edge_node', 'kiosk'],
    default: 'kiosk'
  },
  college_id: {
    type: String,
    required: true,
    index: true
  },
  college_name: {
    type: String,
    default: ''
  },
  campus: {
    type: String,
    default: 'Main Campus'
  },
  classroom: {
    type: String,
    default: ''
  },
  software_version: {
    type: String,
    default: '2.0.0'
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'maintenance', 'retired'],
    default: 'active',
    index: true
  },
  credential_hash: {
    type: String,
    default: ''
  },
  last_heartbeat: {
    type: Date,
    default: null,
    index: true
  },
  last_sync: {
    type: Date,
    default: null
  },
  ai_service_available: {
    type: Boolean,
    default: true
  },
  created_by: {
    type: String,
    default: null
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

campusDeviceSchema.index({ college_id: 1, status: 1 });

module.exports = mongoose.model('CampusDevice', campusDeviceSchema, 'campus_devices');
