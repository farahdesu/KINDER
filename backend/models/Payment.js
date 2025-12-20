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
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  prepaymentPercentage: {
    type: Number,
    default: 50, // 50% prepayment
    min: 0,
    max: 100
  },
  prepaymentAmount: {
    type: Number,
    required: true
  },
  remainingAmount: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['bkash', 'nagad', 'card', 'bank_transfer', 'cash'],
    required: true
  },
  transactionId: {
    type: String,
    unique: true,
    sparse: true
  },
  prepaymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  finalPaymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  prepaymentDate: {
    type: Date
  },
  finalPaymentDate: {
    type: Date
  },
  refundReason: {
    type: String,
    default: ''
  },
  refundDate: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Payment', paymentSchema);
