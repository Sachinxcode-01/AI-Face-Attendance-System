const mongoose = require('mongoose');

const HolidaySchema = new mongoose.Schema({
  title: { type: String, required: true },
  date: { type: Date, required: true, index: true }, // Date of holiday
  description: { type: String, default: "" },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Holiday', HolidaySchema, 'holidays');
