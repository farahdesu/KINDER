const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Babysitter = require('../models/Babysitter');
const Parent = require('../models/Parent');
const { protect } = require('../middleware/auth');

// GET /api/bookings - Get all bookings for current user
router.get('/', protect, async (req, res) => {
  try {
    let bookings;
    
    console.log('📋 GET /api/bookings - User:', req.user._id, 'Role:', req.user.role);
    
    if (req.user.role === 'parent') {
      // Find the parent profile first
      const parent = await Parent.findOne({ userId: req.user._id });
      console.log('📋 Parent profile found:', parent ? parent._id : 'NOT FOUND');
      console.log('📋 User._id:', req.user._id);
      
      // First, let's see all bookings in the system for debugging
      const allBookings = await Booking.find({});
      console.log('📋 Total bookings in DB:', allBookings.length);
      
      // Build search conditions
      const searchConditions = [{ parentId: req.user._id }];
      if (parent) {
        searchConditions.push({ parentId: parent._id });
      }
      
      // Log all bookings and check for matches
      for (const b of allBookings) {
        const parentIdStr = b.parentId ? b.parentId.toString() : 'null';
        const userIdStr = req.user._id.toString();
        const parentDocIdStr = parent ? parent._id.toString() : 'no-parent';
        const matchesUser = parentIdStr === userIdStr;
        const matchesParent = parent && parentIdStr === parentDocIdStr;
        console.log(`  - Booking: ${b._id}, parentId: ${parentIdStr}, status: ${b.status}`);
        console.log(`    Matches User._id: ${matchesUser}, Matches Parent._id: ${matchesParent}`);
      }
      
      // Search by both User's _id and Parent document's _id
      bookings = await Booking.find({ $or: searchConditions })
        .populate('babysitterId', 'userId')
        .populate({
          path: 'babysitterId',
          populate: {
            path: 'userId',
            select: 'name email phone'
          }
        })
        .sort({ date: -1, createdAt: -1 });
      
      console.log('📋 Found bookings for this parent:', bookings.length);
    } else if (req.user.role === 'babysitter') {
      // Babysitter sees bookings assigned to them
      const babysitter = await Babysitter.findOne({ userId: req.user._id });
      if (!babysitter) {
        return res.status(404).json({
          success: false,
          message: 'Babysitter profile not found'
        });
      }
      
      bookings = await Booking.find({ babysitterId: babysitter._id })
        .populate({
          path: 'parentId',
          populate: {
            path: 'userId',
            select: 'name email phone'
          }
        })
        .sort({ date: -1, createdAt: -1 });
    } else {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching bookings'
    });
  }
});

// POST /api/bookings - Create new booking (Parent posts a job)
router.post('/', protect, async (req, res) => {
  try {
    const { babysitterId, date, startTime, endTime, address, specialInstructions, children } = req.body;

    // Validation
    if (!babysitterId || !date || !startTime || !endTime || !address) {
      return res.status(400).json({
        success: false,
        message: 'Please provide babysitterId, date, startTime, endTime, and address'
      });
    }

    // Check if babysitter exists
    const babysitter = await Babysitter.findById(babysitterId);
    if (!babysitter) {
      return res.status(404).json({
        success: false,
        message: 'Babysitter not found'
      });
    }

    // Parse times and calculate hours
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const hours = (end - start) / (1000 * 60 * 60);
    
    if (hours <= 0) {
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time'
      });
    }

    // Calculate total amount
    const totalAmount = hours * babysitter.hourlyRate;

    // Find the Parent document for the current user
    const parent = await Parent.findOne({ userId: req.user._id });
    if (!parent) {
      return res.status(404).json({
        success: false,
        message: 'Parent profile not found'
      });
    }

    // Create booking using Parent document's _id (for consistency with the ref)
    console.log('📝 Creating booking - User._id:', req.user._id, 'Parent._id:', parent._id);
    
    const booking = await Booking.create({
      parentId: parent._id,  // Use Parent document's _id, not User's _id
      babysitterId,
      date: new Date(date),
      startTime,
      endTime,
      hours: parseFloat(hours.toFixed(1)),
      totalAmount,
      address,
      specialInstructions: specialInstructions || '',
      status: 'pending',
      paymentStatus: 'pending'
    });
    
    console.log('✅ Booking created:', booking._id, 'parentId stored:', booking.parentId);

    // Populate the response
    const populatedBooking = await Booking.findById(booking._id)
      .populate('babysitterId', 'userId hourlyRate')
      .populate({
        path: 'babysitterId',
        populate: {
          path: 'userId',
          select: 'name'
        }
      });

    res.status(201).json({
      success: true,
      message: 'Booking created successfully. Waiting for babysitter confirmation.',
      booking: populatedBooking
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating booking'
    });
  }
});

// PUT /api/bookings/:id - Update booking status (Accept/Reject/Complete)
router.put('/:id', protect, async (req, res) => {
  try {
    const { status } = req.body;
    const bookingId = req.params.id;

    // Validate status
    const validStatuses = ['confirmed', 'rejected', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Find booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check authorization
    if (req.user.role === 'babysitter') {
      const babysitter = await Babysitter.findOne({ userId: req.user._id });
      if (!babysitter || booking.babysitterId.toString() !== babysitter._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this booking'
        });
      }
      
      // Babysitter can only confirm/reject pending bookings
      if (booking.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Only pending bookings can be confirmed or rejected'
        });
      }
      
      if (!['confirmed', 'rejected'].includes(status)) {
        return res.status(403).json({
          success: false,
          message: 'Babysitter can only confirm or reject bookings'
        });
      }
    } else if (req.user.role === 'parent') {
      // Parent can only cancel their own bookings
      if (booking.parentId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this booking'
        });
      }
      
      if (status === 'cancelled' && booking.status === 'pending') {
        // Parent can cancel pending bookings
      } else {
        return res.status(403).json({
          success: false,
          message: 'Parent can only cancel pending bookings'
        });
      }
    } else {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Update booking
    booking.status = status;
    if (status === 'completed') {
      booking.paymentStatus = 'paid';
    }
    
    await booking.save();

    // If confirmed, update babysitter's total jobs
    if (status === 'confirmed') {
      const babysitter = await Babysitter.findById(booking.babysitterId);
      babysitter.totalJobs += 1;
      await babysitter.save();
    }

    res.status(200).json({
      success: true,
      message: `Booking ${status} successfully`,
      booking
    });
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating booking'
    });
  }
});

// GET /api/bookings/parent/:userId - Get bookings for a specific parent
router.get('/parent/:userId', protect, async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log('📋 Fetching bookings for userId:', userId);

    // First try to find by User ID directly (how bookings are created)
    let bookings = await Booking.find({ parentId: userId })
      .populate({
        path: 'babysitterId',
        populate: {
          path: 'userId',
          select: 'name email phone'
        }
      })
      .sort({ createdAt: -1 });
    
    console.log('📋 Found by userId:', bookings.length);

    // If no bookings found, also try with Parent document's _id
    if (bookings.length === 0) {
      const parent = await Parent.findOne({ userId: userId });
      if (parent) {
        bookings = await Booking.find({ parentId: parent._id })
          .populate({
            path: 'babysitterId',
            populate: {
              path: 'userId',
              select: 'name email phone'
            }
          })
          .sort({ createdAt: -1 });
      }
    }

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (error) {
    console.error('Error fetching parent bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching bookings'
    });
  }
});

// PUT /api/bookings/:id/cancel - Cancel a booking (only pending bookings can be cancelled)
router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Only pending bookings can be cancelled
    if (booking.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending bookings can be cancelled. Confirmed or completed bookings cannot be cancelled.'
      });
    }

    booking.status = 'cancelled';
    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      booking
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({
      success: false,
      message: 'Server error cancelling booking'
    });
  }
});

// GET /api/bookings/available-babysitters - Get available babysitters for booking
router.get('/available-babysitters', protect, async (req, res) => {
  try {
    if (req.user.role !== 'parent') {
      return res.status(403).json({
        success: false,
        message: 'Only parents can access available babysitters'
      });
    }

    // Get all babysitters with their user info
    const babysitters = await Babysitter.find()
      .populate('userId', 'name email phone verified isRejected')
      .select('-__v')
      .sort({ rating: -1, hourlyRate: 1 });

    // Filter to only show VERIFIED babysitters (approved by admin)
    const verifiedBabysitters = babysitters.filter(bs => {
      const user = bs.userId;
      // Only include if user exists, is verified, and not rejected
      return user && user.verified === true && user.isRejected !== true;
    });

    const formattedBabysitters = verifiedBabysitters.map(bs => {
      const user = bs.userId || {};
      return {
        id: bs._id,
        name: user.name || 'Unknown',
        email: user.email || '',
        phone: user.phone || '',
        university: bs.university || '',
        department: bs.department || '',
        year: bs.year || 1,
        hourlyRate: bs.hourlyRate || 0,
        rating: bs.rating || 0,
        totalJobs: bs.totalJobs || 0,
        experience: bs.experience || 'Beginner',
        skills: bs.skills || []
      };
    });

    res.status(200).json({
      success: true,
      count: formattedBabysitters.length,
      babysitters: formattedBabysitters
    });
  } catch (error) {
    console.error('Error fetching available babysitters:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// GET /api/bookings/test - Test route
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Booking routes are working! 🎉',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;