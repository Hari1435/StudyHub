const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'User ID is required'],
    ref: 'User'
  },
  otp: {
    type: String,
    required: [true, 'OTP is required'],
    match: [/^[0-9]{6}$/, 'OTP must be exactly 6 digits'],
    trim: true
  },
  expiresAt: {
    type: Date,
    required: [true, 'Expiration time is required'],
    default: () => Date.now() + 10 * 60 * 1000 // Expires in 10 minutes
  }
}, {
  timestamps: true
});

// Index to automatically remove expired OTPs
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Create and export the OTP model
const OTP = mongoose.model('OTP', otpSchema);
module.exports = OTP;