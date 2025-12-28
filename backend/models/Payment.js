const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
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
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  platformFee: {
    type: Number,
    required: true // 20% of totalAmount
  },
  babysitterEarnings: {
    type: Number,
    required: true // 80% of totalAmount
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'mobile_banking'],
    default: 'cash'
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paidAt: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    default: ''
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
paymentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Payment', paymentSchema);
