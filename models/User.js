


const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    select: false
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: function() {
      return this.role !== 'superadmin';
    }
  },
  role: {
    type: String,
    enum: ['superadmin', 'admin', 'recruiter'],
    default: 'recruiter'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  experience: {
    type: Number,
    min: 0,
    max: 50
  },
  phoneNumber: {
    type: String,
    validate: {
      validator: function(v) {
        return /^(\+\d{1,3}[- ]?)?\d{10}$/.test(v);
      },
      message: props => `${props.value} is not a valid phone number!`
    }
  },
  profilePicture: {
    type: String,
    default: null
  },
  // Track if user needs to reset password
  requiresPasswordReset: {
    type: Boolean,
    default: false
  },
  // Add these new fields for password reset
  passwordResetToken: String,
  passwordResetExpires: Date,
  otp: String,
  otpExpires: Date
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Add these methods for password reset functionality
userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).toString('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  return resetToken;
};

userSchema.methods.createOTP = function() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
  this.otp = crypto.createHash('sha256').update(otp).toString('hex');
  this.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  return otp;
};

// Method to mark user as requiring password reset
userSchema.methods.requirePasswordReset = function() {
  this.requiresPasswordReset = true;
  return this.save();
};

// Method to complete password reset
userSchema.methods.completePasswordReset = function() {
  this.requiresPasswordReset = false;
  this.passwordResetToken = undefined;
  this.passwordResetExpires = undefined;
  return this.save();
};

module.exports = mongoose.model('User', userSchema);