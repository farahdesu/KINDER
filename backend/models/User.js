const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Use bcryptjs consistently

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
  
  // Common fields
  phone: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  // Password reset fields
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  resetCode: String,
  resetCodeExpires: Date
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