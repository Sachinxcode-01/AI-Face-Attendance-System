const mongoose = require('mongoose');

const OtpSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, index: true },
  otp: { type: String, required: true },
  expiry: { type: Date, required: true, index: { expires: 0 } }, // TTL index
  role: { type: String },
  type: { type: String }
});

module.exports = mongoose.model('Otp', OtpSchema, 'login_otps');
