const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parent',
    required: true
  },
  babysitterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Babysitter',
    required: true
  },
  date: {
    type: Date,
    required: [true, 'Booking date is required']
  },
  startTime: {
    type: String, // Format: "14:00"
    required: [true, 'Start time is required']
  },
  endTime: {
    type: String, // Format: "18:00"
    required: [true, 'End time is required']
  },
  hours: {
    type: Number,
    required: true,
    min: 1
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled', 'rejected'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending'
  },
  address: {
    type: String,
    required: true
  },
  specialInstructions: {
    type: String,
    default: ''
  },
  parentRating: {
    rating: Number,
    comment: String,
    date: Date
  },
  babysitterRating: {
    rating: Number,
    comment: String,
    date: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
bookingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);