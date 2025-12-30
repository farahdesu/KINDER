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
    enum: ['cash', 'online'],
    default: 'cash'
  },
  status: {
    type: String,
    enum: ['pending', 'completed','failed', 'refunded', 'cancelled'],
    default: 'pending'
  },
  
  // SSLCommerz specific fields
  transactionId: {
    type: String,
    unique: true,
    sparse: true // Allows null values
  },
  sslcommerzData: {
    tran_id: String,
    val_id: String,
    amount: String,
    card_type: String,
    store_amount: String,
    card_no: String,
    bank_tran_id: String,
    status: String,
    tran_date: String,
    currency: String,
    card_issuer: String,
    card_brand: String,
    card_issuer_country: String,
    card_issuer_country_code: String,
    verify_sign: String,
    verify_key: String,
    risk_level: String,
    risk_title: String
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
