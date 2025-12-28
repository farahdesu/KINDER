const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const { protect } = require('../middleware/auth');

// Create/Process payment for a completed booking
router.post('/', protect, async (req, res) => {
  try {
    const { bookingId, paymentMethod } = req.body;

    if (!bookingId || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Please provide bookingId and paymentMethod'
      });
    }

    // Find booking
    const booking = await Booking.findById(bookingId)
      .populate('parentId')
      .populate('babysitterId');
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if booking is completed
    if (booking.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Only completed bookings can be paid'
      });
    }

    // Check if payment already exists and is completed
    const existingPayment = await Payment.findOne({ 
      bookingId,
      status: 'completed'
    });
    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: 'Payment already completed for this booking'
      });
    }

    // Calculate fees (20% to platform, 80% to babysitter)
    const totalAmount = booking.totalAmount;
    const platformFee = Math.round(totalAmount * 0.2); // 20%
    const babysitterEarnings = totalAmount - platformFee; // 80%

    // Create or update payment record
    let payment = await Payment.findOne({ bookingId });
    
    if (payment) {
      // Update existing payment
      payment.status = 'completed';
      payment.paidAt = Date.now();
      payment.paymentMethod = paymentMethod;
      await payment.save();
    } else {
      // Create new payment record
      payment = await Payment.create({
        bookingId,
        parentId: booking.parentId._id,
        babysitterId: booking.babysitterId._id,
        totalAmount,
        platformFee,
        babysitterEarnings,
        paymentMethod,
        status: 'completed',
        paidAt: Date.now()
      });
    }

    // Update booking payment status
    booking.paymentStatus = 'paid';
    await booking.save();

    console.log(`💳 Payment completed for booking ${bookingId}: ৳${totalAmount} (Platform: ৳${platformFee}, Babysitter: ৳${babysitterEarnings})`);

    res.status(201).json({
      success: true,
      message: 'Payment processed successfully',
      data: {
        payment,
        booking: {
          id: booking._id,
          status: booking.status,
          paymentStatus: booking.paymentStatus
        }
      }
    });

  } catch (error) {
    console.error('🔥 CREATE PAYMENT ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing payment',
      error: error.message
    });
  }
});

// Get payment details
router.get('/:paymentId', protect, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.paymentId)
      .populate('bookingId')
      .populate('parentId', 'name email')
      .populate('babysitterId', 'name email');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.status(200).json({
      success: true,
      data: payment
    });

  } catch (error) {
    console.error('🔥 GET PAYMENT ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payment',
      error: error.message
    });
  }
});

// Get user's payments
router.get('/user/transactions', protect, async (req, res) => {
  try {
    const { limit = 10, page = 1 } = req.query;

    const payments = await Payment.find({
      $or: [
        { parentId: req.user._id },
        { babysitterId: req.user._id }
      ]
    })
      .populate('bookingId')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Payment.countDocuments({
      $or: [
        { parentId: req.user._id },
        { babysitterId: req.user._id }
      ]
    });

    res.status(200).json({
      success: true,
      data: {
        payments,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('🔥 GET USER PAYMENTS ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payments',
      error: error.message
    });
  }
});

// Process prepayment
router.put('/:paymentId/prepay', protect, async (req, res) => {
  try {
    const { transactionId } = req.body;

    const payment = await Payment.findById(req.params.paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Update prepayment status
    payment.prepaymentStatus = 'completed';
    payment.prepaymentDate = new Date();
    payment.transactionId = transactionId || `TXN-${Date.now()}`;
    await payment.save();

    // Update booking payment status
    const booking = await Booking.findById(payment.bookingId);
    if (booking) {
      booking.paymentStatus = 'paid';
      await booking.save();
    }

    console.log(`✅ Prepayment completed for payment ${req.params.paymentId}`);

    res.status(200).json({
      success: true,
      message: 'Prepayment processed successfully',
      data: payment
    });

  } catch (error) {
    console.error('🔥 PROCESS PREPAYMENT ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing prepayment',
      error: error.message
    });
  }
});

// Process final payment
router.put('/:paymentId/finalize', protect, async (req, res) => {
  try {
    const { transactionId } = req.body;

    const payment = await Payment.findById(req.params.paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.prepaymentStatus !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Prepayment must be completed first'
      });
    }

    // Update final payment status
    payment.finalPaymentStatus = 'completed';
    payment.finalPaymentDate = new Date();
    await payment.save();

    console.log(`✅ Final payment completed for payment ${req.params.paymentId}`);

    res.status(200).json({
      success: true,
      message: 'Final payment processed successfully',
      data: payment
    });

  } catch (error) {
    console.error('🔥 PROCESS FINAL PAYMENT ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing final payment',
      error: error.message
    });
  }
});

// Request refund
router.put('/:paymentId/refund', protect, async (req, res) => {
  try {
    const { reason } = req.body;

    const payment = await Payment.findById(req.params.paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Update refund status
    payment.prepaymentStatus = 'refunded';
    payment.refundReason = reason || 'Refund requested';
    payment.refundDate = new Date();
    await payment.save();

    console.log(`💰 Refund processed for payment ${req.params.paymentId}: ${reason}`);

    res.status(200).json({
      success: true,
      message: 'Refund processed successfully',
      data: payment
    });

  } catch (error) {
    console.error('🔥 PROCESS REFUND ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing refund',
      error: error.message
    });
  }
});

// Get payment statistics (admin)
router.get('/admin/stats', protect, async (req, res) => {
  try {
    const totalPayments = await Payment.countDocuments();
    const completedPayments = await Payment.countDocuments({ prepaymentStatus: 'completed' });
    const pendingPayments = await Payment.countDocuments({ prepaymentStatus: 'pending' });
    const refundedPayments = await Payment.countDocuments({ prepaymentStatus: 'refunded' });

    const revenueData = await Payment.aggregate([
      { $match: { prepaymentStatus: 'completed' } },
      { $group: { _id: null, totalRevenue: { $sum: '$prepaymentAmount' } } }
    ]);

    const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

    res.status(200).json({
      success: true,
      data: {
        totalPayments,
        completedPayments,
        pendingPayments,
        refundedPayments,
        totalRevenue
      }
    });

  } catch (error) {
    console.error('🔥 GET PAYMENT STATS ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payment statistics',
      error: error.message
    });
  }
});

module.exports = router;
