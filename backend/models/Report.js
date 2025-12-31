const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reporterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reportedUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  category: {
    type: String,
    enum: ['harassment', 'misconduct', 'safety_concern', 'fraud', 'other'],
    required: true
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'under_review', 'resolved', 'dismissed'],
    default: 'open'
  },
  adminNotes: {
    type: String,
    default: ''
  },
  resolution: {
    type: String,
    enum: ['warning', 'suspension', 'ban', 'no_action'],
    default: null
  },
  resolutionChangedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  resolvedAt: {
    type: Date
  },
  resolutionUpdatedAt: {
    type: Date
  }
});

// Index to enforce max 2 reports per booking (one per reporter)
reportSchema.index({ bookingId: 1, reporterId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Report', reportSchema);
