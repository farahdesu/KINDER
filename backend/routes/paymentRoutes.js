const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const { protect } = require('../middleware/auth');
const { initializePayment, validatePayment } = require('../utils/sslcommerzService');

// Initiate SSLCommerz payment
router.post('/init-payment', protect, async (req, res) => {
  try {
    const { bookingId, paymentMethod } = req.body;

    if (!bookingId || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Please provide bookingId and paymentMethod'
      });
    }

    // Find booking with populated data
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
    const platformFee = Math.round(totalAmount * 0.2);
    const babysitterEarnings = totalAmount - platformFee;

    // Generate unique transaction ID
    const transactionId = `KINDER-${Date.now()}-${bookingId.toString().slice(-6)}`;

    // Create payment record (pending)
    let payment = await Payment.create({
      bookingId,
      parentId: booking.parentId._id,
      babysitterId: booking.babysitterId._id,
      totalAmount,
      platformFee,
      babysitterEarnings,
      paymentMethod,
      status: 'pending',
      transactionId
    });

    // For cash payment, skip SSLCommerz
    if (paymentMethod === 'cash') {
      payment.status = 'completed';
      payment.paidAt = Date.now();
      await payment.save();

      booking.paymentStatus = 'paid';
      await booking.save();

      return res.status(200).json({
        success: true,
        message: 'Cash payment recorded successfully',
        paymentType: 'cash',
        data: { payment, booking }
      });
    }

    // Initialize SSLCommerz payment
    const paymentData = {
      totalAmount,
      transactionId,
      customerName: booking.parentId.userId?.name || 'Customer',
      customerEmail: booking.parentId.userId?.email || 'customer@kinder.com',
      customerPhone: booking.parentId.userId?.phone || '01700000000',
      customerAddress: booking.address
    };

    console.log('Initializing payment:', transactionId);

    let sslResponse;
    try {
      sslResponse = await initializePayment(paymentData);
    } catch (sslError) {
      console.error('Payment initialization error:', sslError.message);
      
      // Delete pending payment if initialization failed
      await Payment.findByIdAndDelete(payment._id);
      
      return res.status(400).json({
        success: false,
        message: 'Failed to initialize payment gateway: ' + sslError.message,
        error: sslError.message
      });
    }

    if (sslResponse.status === 'SUCCESS') {
      
      return res.status(200).json({
        success: true,
        message: 'Payment gateway initialized',
        paymentType: 'online',
        data: {
          paymentId: payment._id,
          gatewayUrl: sslResponse.GatewayPageURL,
          transactionId
        }
      });
    } else {
      console.error('Payment gateway error:', sslResponse.failedreason || 'Unknown error');
      
      // Delete pending payment if initialization failed
      await Payment.findByIdAndDelete(payment._id);
      
      return res.status(400).json({
        success: false,
        message: 'Failed to initialize payment gateway',
        error: sslResponse.failedreason || 'Unknown error'
      });
    }

  } catch (error) {
    console.error('Payment error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error initializing payment',
      error: error.message
    });
  }
});

// SSLCommerz Success Callback (POST) - Sandbox mode friendly
router.post('/sslcommerz/success', async (req, res) => {
  try {
    const sslData = req.body;
    console.log('Payment callback received');

    // SANDBOX MODE: Handle empty callback data
    if (!sslData || Object.keys(sslData).length === 0 || !sslData.tran_id) {
      console.warn('Empty callback data');
      
      // Try to get transaction ID from query params
      const queryTranId = req.query.tran_id;
      
      if (queryTranId) {
        const payment = await Payment.findOne({ transactionId: queryTranId });
        if (payment && payment.status === 'pending') {
          payment.status = 'completed';
          payment.paidAt = Date.now();
          payment.sslcommerzData = { sandbox_mode: true, source: 'post_query' };
          await payment.save();

          const booking = await Booking.findById(payment.bookingId);
          if (booking) {
            booking.paymentStatus = 'paid';
            await booking.save();
          }

          console.log('Payment completed via query:', queryTranId);
          return res.redirect(`${process.env.FRONTEND_URL}/payment-success?transactionId=${queryTranId}&amount=${payment.totalAmount}`);
        }
      }
      
      // If no transaction ID anywhere, find the most recent pending payment (sandbox workaround)
      console.warn('Trying latest pending payment');
      const latestPending = await Payment.findOne({ 
        status: 'pending',
        paymentMethod: 'online'
      }).sort({ createdAt: -1 });
      
      if (latestPending && process.env.IS_LIVE === 'false') {
        latestPending.status = 'completed';
        latestPending.paidAt = Date.now();
        latestPending.sslcommerzData = { sandbox_mode: true, source: 'latest_pending' };
        await latestPending.save();

        const booking = await Booking.findById(latestPending.bookingId);
        if (booking) {
          booking.paymentStatus = 'paid';
          await booking.save();
        }

        console.log('Sandbox payment completed:', latestPending.transactionId);
        return res.redirect(`${process.env.FRONTEND_URL}/payment-success?transactionId=${latestPending.transactionId}&amount=${latestPending.totalAmount}`);
      }
      
      return res.redirect(`${process.env.FRONTEND_URL}/payment-error?message=Unable to identify transaction`);
    }

    // Normal flow with transaction data
    const payment = await Payment.findOne({ transactionId: sslData.tran_id });
    
    if (!payment) {
      console.error('Payment not found:', sslData.tran_id);
      return res.redirect(`${process.env.FRONTEND_URL}/payment-error?message=Payment not found`);
    }

    // SANDBOX MODE: Accept all transactions
    if (process.env.IS_LIVE === 'false') {
      payment.status = 'completed';
      payment.paidAt = Date.now();
      payment.sslcommerzData = sslData;
      await payment.save();

      const booking = await Booking.findById(payment.bookingId);
      if (booking) {
        booking.paymentStatus = 'paid';
        await booking.save();
      }

      console.log('Sandbox payment completed:', sslData.tran_id);
      return res.redirect(`${process.env.FRONTEND_URL}/payment-success?transactionId=${sslData.tran_id}&amount=${sslData.amount || payment.totalAmount}`);
    }

    // PRODUCTION MODE: Strict validation
    let isValid = false;
    try {
      const validation = await validatePayment(sslData.val_id);
      isValid = validation.status === 'VALID' || validation.status === 'VALIDATED';
    } catch (validationError) {
      console.error('Validation error:', validationError.message);
      return res.redirect(`${process.env.FRONTEND_URL}/payment-error?message=Payment validation failed`);
    }

    if (isValid) {
      payment.status = 'completed';
      payment.paidAt = Date.now();
      payment.sslcommerzData = sslData;
      await payment.save();

      const booking = await Booking.findById(payment.bookingId);
      if (booking) {
        booking.paymentStatus = 'paid';
        await booking.save();
      }

      console.log('Payment completed:', sslData.tran_id);
      return res.redirect(`${process.env.FRONTEND_URL}/payment-success?transactionId=${sslData.tran_id}&amount=${sslData.amount}`);
    } else {
      console.error('Validation failed');
      return res.redirect(`${process.env.FRONTEND_URL}/payment-error?message=Payment validation failed`);
    }

  } catch (error) {
    console.error('Payment callback error:', error.message);
    return res.redirect(`${process.env.FRONTEND_URL}/payment-error?message=${encodeURIComponent(error.message)}`);
  }
});

// SSLCommerz Fail Callback
router.post('/sslcommerz/fail', async (req, res) => {
  try {
    const sslData = req.body;
    console.log('Payment failed');

    // Update payment status
    const payment = await Payment.findOne({ transactionId: sslData.tran_id });
    if (payment) {
      payment.status = 'failed';
      payment.sslcommerzData = sslData;
      await payment.save();
    }

    return res.redirect(`${process.env.FRONTEND_URL}/payment-error?message=Payment failed&transactionId=${sslData.tran_id}`);
  } catch (error) {
    console.error('Payment fail error:', error.message);
    return res.redirect(`${process.env.FRONTEND_URL}/payment-error?message=${error.message}`);
  }
});

// SSLCommerz Cancel Callback
router.post('/sslcommerz/cancel', async (req, res) => {
  try {
    const sslData = req.body;
    console.log('Payment cancelled');

    // Update payment status
    const payment = await Payment.findOne({ transactionId: sslData.tran_id });
    if (payment) {
      payment.status = 'cancelled';
      payment.sslcommerzData = sslData;
      await payment.save();
    }

    return res.redirect(`${process.env.FRONTEND_URL}/payment-cancelled?transactionId=${sslData.tran_id}`);
  } catch (error) {
    console.error('Payment cancel error:', error.message);
    return res.redirect(`${process.env.FRONTEND_URL}/payment-error?message=${error.message}`);
  }
});

// SSLCommerz IPN (Instant Payment Notification)
router.post('/sslcommerz/ipn', async (req, res) => {
  try {
    const sslData = req.body;
    console.log('IPN received');

    // Validate and update payment
    const validation = await validatePayment(sslData.val_id);
    
    if (validation.status === 'VALID' || validation.status === 'VALIDATED') {
      const payment = await Payment.findOne({ transactionId: sslData.tran_id });
      
      if (payment && payment.status === 'pending') {
        payment.status = 'completed';
        payment.paidAt = Date.now();
        payment.sslcommerzData = sslData;
        await payment.save();

        const booking = await Booking.findById(payment.bookingId);
        if (booking) {
          booking.paymentStatus = 'paid';
          await booking.save();
        }
      }
    }

    res.status(200).send('IPN Processed');
  } catch (error) {
    console.error('IPN error:', error.message);
    res.status(500).send('IPN Error');
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
    console.error('Get payment error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching payment',
      error: error.message
    });
  }
});

// Get user's payment transactions
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
    console.error('Get transactions error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching payments',
      error: error.message
    });
  }
});

// SSLCommerz Success Callback (GET) - Sandbox often uses this
router.get('/sslcommerz/success', async (req, res) => {
  try {
    const sslData = req.query;
    console.log('Payment success (GET)');

    // Handle case when no transaction ID is present
    if (!sslData.tran_id) {
      console.error('No transaction ID');
      return res.redirect(`${process.env.FRONTEND_URL}/payment-error?message=No transaction ID`);
    }

    const payment = await Payment.findOne({ transactionId: sslData.tran_id });
    
    if (!payment) {
      console.error('Payment not found (GET):', sslData.tran_id);
      return res.redirect(`${process.env.FRONTEND_URL}/payment-error?message=Payment not found`);
    }

    // Update payment status (sandbox mode - accept it)
    payment.status = 'completed';
    payment.paidAt = Date.now();
    payment.sslcommerzData = sslData;
    await payment.save();

    // Update booking
    const booking = await Booking.findById(payment.bookingId);
    if (booking) {
      booking.paymentStatus = 'paid';
      await booking.save();
    }

    console.log('Payment completed (GET):', sslData.tran_id);

    return res.redirect(`${process.env.FRONTEND_URL}/payment-success?transactionId=${sslData.tran_id}&amount=${payment.totalAmount}`);

  } catch (error) {
    console.error('Payment success (GET) error:', error.message);
    return res.redirect(`${process.env.FRONTEND_URL}/payment-error?message=${encodeURIComponent(error.message)}`);
  }
});

// SSLCommerz Fail Callback (GET)
router.get('/sslcommerz/fail', async (req, res) => {
  const sslData = req.query;
  console.log('Payment failed (GET)');
  return res.redirect(`${process.env.FRONTEND_URL}/payment-error?message=Payment failed&transactionId=${sslData.tran_id || 'unknown'}`);
});

// SSLCommerz Cancel Callback (GET)
router.get('/sslcommerz/cancel', async (req, res) => {
  const sslData = req.query;
  console.log('Payment cancelled (GET)');
  return res.redirect(`${process.env.FRONTEND_URL}/payment-cancelled?transactionId=${sslData.tran_id || 'unknown'}`);
});

module.exports = router;
