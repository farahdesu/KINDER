const mongoose = require('mongoose');
const User = require('./User');

const parentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  address: {
    type: String,
    required: [true, 'Address is required']
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  children: [{
    name: {
      type: String,
      required: true
    },
    age: {
      type: Number,
      required: true,
      min: 0,
      max: 18
    },
    specialNeeds: {
      type: String,
      default: ''
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other']
    }
  }],
  preferredTimings: {
    type: String,
    default: 'Flexible'
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Bkash', 'Nagad', 'Bank Transfer', 'Card'],
    default: 'Cash'
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  bookings: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  }],
  // Verification status
  verificationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  verificationDate: {
    type: Date
  },
  rejectionReason: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create geospatial index for location-based searches
parentSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Parent', parentSchema);