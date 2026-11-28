const mongoose = require('mongoose');

const HolidaySchema = new mongoose.Schema({
  title: { type: String, required: true },
  date: { type: Date, required: true, index: true }, // Date of holiday
  college_id: { type: String, default: null, index: true },
  description: { type: String, default: "" },
  created_at: { type: Date, default: Date.now }
});

HolidaySchema.index({ college_id: 1, date: 1 });

module.exports = mongoose.model('Holiday', HolidaySchema, 'holidays');
