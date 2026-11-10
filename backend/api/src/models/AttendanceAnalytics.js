const mongoose = require('mongoose');

const AttendanceAnalyticsSchema = new mongoose.Schema({
  student_email: { type: String, required: true, unique: true, index: true },
  health_score: { type: Number, required: true }, // 0 - 100
  standing: { type: String, enum: ['Excellent', 'Good', 'Warning', 'Critical'], required: true },
  consecutive_absences: { type: Number, default: 0 },
  late_arrivals_count: { type: Number, default: 0 },
  weekly_change_pct: { type: Number, default: 0 }, // e.g. -5.2%
  risk_alerts: [{
    type: { type: String }, // 'below_75', 'below_60', 'consecutive_absences', 'frequent_late'
    message: { type: String },
    created_at: { type: Date, default: Date.now }
  }],
  last_calculated: { type: Date, default: Date.now }
});

// Command center counts and risk-analysis range filters.
AttendanceAnalyticsSchema.index({ health_score: 1 });

module.exports = mongoose.model('AttendanceAnalytics', AttendanceAnalyticsSchema, 'attendance_analytics');
