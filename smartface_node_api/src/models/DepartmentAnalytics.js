const mongoose = require('mongoose');

const DepartmentAnalyticsSchema = new mongoose.Schema({
  department: { type: String, required: true, index: true },
  semester: { type: String, required: true },
  attendance_percentage: { type: Number, required: true }, // 0 - 100
  total_students: { type: Number, required: true },
  critical_count: { type: Number, default: 0 }, // Below 60%
  warning_count: { type: Number, default: 0 },  // 60% - 75%
  monthly_average: { type: Map, of: Number },  // e.g. { "Jan": 88, "Feb": 91 }
  last_updated: { type: Date, default: Date.now }
});

DepartmentAnalyticsSchema.index({ department: 1, semester: 1 }, { unique: true });
module.exports = mongoose.model('DepartmentAnalytics', DepartmentAnalyticsSchema, 'department_analytics');
