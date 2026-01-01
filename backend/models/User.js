const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic Info
  name: {
    type: String,
    required: [true, 'Please provide your name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  
  // Role
  role: {
    type: String,
    enum: ['parent', 'babysitter', 'admin'],
    default: 'parent'
  },
  
  // Verification status
  verified: {
  type: Boolean,
    default: false
},
  
  // Common fields
  phone: String,
  address: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  // Password reset fields
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  resetCode: String,
  resetCodeExpires: Date,
  
  // Rejection tracking
  isRejected: {
    type: Boolean,
    default: false
  },
  rejectionReason: {
    type: String,
    default: null
  },
  rejectionSeenAt: {
    type: Date,
    default: null
  },
  
  // Account status
  accountStatus: {
    type: String,
    enum: ['active', 'warned', 'banned'],
    default: 'active'
  },
  accountStatusReason: {
    type: String,
    default: null
  },
  accountStatusChangedAt: {
    type: Date,
    default: null
  },
  accountStatusChangedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
});

// Hash password BEFORE saving
userSchema.pre('save', async function(next) {
  // Only hash if password is modified (or new)
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);