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

    // Helper function to check if time slots overlap
    const timeSlotOverlaps = (startTime1, endTime1, startTime2, endTime2) => {
      const start1 = parseInt(startTime1.replace(':', ''));
      const end1 = parseInt(endTime1.replace(':', ''));
      const start2 = parseInt(startTime2.replace(':', ''));
      const end2 = parseInt(endTime2.replace(':', ''));
      
      return !(end1 <= start2 || end2 <= start1);
    };

    // STEP 1: Validate that booking time is within babysitter's available time slots
    const bookingDate = new Date(date);
    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][bookingDate.getDay()];
    const babysitterFreeSlots = babysitter.availability[dayOfWeek] || [];
    
    if (!babysitterFreeSlots || babysitterFreeSlots.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Babysitter is not available on this day'
      });
    }

    // Check if requested time falls within any free slot
    const isWithinFreeSlot = babysitterFreeSlots.some(slot =>
      timeSlotOverlaps(startTime, endTime, slot.start, slot.end)
    );

    if (!isWithinFreeSlot) {
      return res.status(400).json({
        success: false,
        message: 'Requested time is outside babysitter\'s available time slots. Please choose from their available hours.',
        availableSlots: babysitterFreeSlots
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

    // STEP 2: CHECK FOR TIME SLOT CONFLICTS (both confirmed and pending bookings)
    // Convert date to start and end of day for comparison
    const bookingStartDate = new Date(date);
    bookingStartDate.setHours(0, 0, 0, 0);
    const bookingEndDate = new Date(date);
    bookingEndDate.setHours(23, 59, 59, 999);

    // Check if babysitter has any CONFIRMED or PENDING bookings at the same time slot on this date
    const conflictingBookings = await Booking.find({
      babysitterId: babysitterId,
      date: { $gte: bookingStartDate, $lte: bookingEndDate },
      status: { $in: ['confirmed', 'pending'] }
    });

    // Check if any bookings overlap with the requested time
    const hasConflict = conflictingBookings.some(booking => 
      timeSlotOverlaps(startTime, endTime, booking.startTime, booking.endTime)
    );

    if (hasConflict) {
      return res.status(400).json({
        success: false,
        message: 'This time slot is already booked or pending. Please choose a different time.'
      });
    }

    // Create booking using Parent document's _id (for consistency with the ref)
    console.log('Creating booking - User._id:', req.user._id, 'Parent._id:', parent._id);
    
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
    
    console.log('Booking created:', booking._id, 'parentId stored:', booking.parentId);

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

      // IF CONFIRMING A BOOKING - CHECK FOR TIME SLOT CONFLICTS
      if (status === 'confirmed') {
        // Convert date to start and end of day for comparison
        const bookingDate = new Date(booking.date);
        bookingDate.setHours(0, 0, 0, 0);
        const endOfDay = new Date(bookingDate);
        endOfDay.setHours(23, 59, 59, 999);

        // Find all other pending or confirmed bookings for this babysitter on the same date
        const otherBookings = await Booking.find({
          babysitterId: booking.babysitterId,
          _id: { $ne: bookingId },
          date: { $gte: bookingDate, $lte: endOfDay },
          status: { $in: ['confirmed', 'pending'] }
        });

        // Function to check if time slots overlap
        const timeSlotOverlaps = (startTime1, endTime1, startTime2, endTime2) => {
          const start1 = parseInt(startTime1.replace(':', ''));
          const end1 = parseInt(endTime1.replace(':', ''));
          const start2 = parseInt(startTime2.replace(':', ''));
          const end2 = parseInt(endTime2.replace(':', ''));
          
          return !(end1 <= start2 || end2 <= start1);
        };

        // Check if any overlapping bookings exist and are confirmed
        const hasConfirmedConflict = otherBookings.some(otherBooking => 
          otherBooking.status === 'confirmed' && 
          timeSlotOverlaps(booking.startTime, booking.endTime, otherBooking.startTime, otherBooking.endTime)
        );

        if (hasConfirmedConflict) {
          return res.status(400).json({
            success: false,
            message: 'You already have a confirmed booking during this time slot. Please reject one of the overlapping requests.'
          });
        }

        // If there are other pending bookings in the same time slot, reject them automatically
        const pendingConflicts = otherBookings.filter(otherBooking =>
          otherBooking.status === 'pending' &&
          timeSlotOverlaps(booking.startTime, booking.endTime, otherBooking.startTime, otherBooking.endTime)
        );

        if (pendingConflicts.length > 0) {
          // Reject all conflicting pending bookings
          for (const conflictBooking of pendingConflicts) {
            conflictBooking.status = 'rejected';
            await conflictBooking.save();
            console.log('Auto-rejected conflicting pending booking:', conflictBooking._id);
          }
        }
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
    message: 'Booking routes are working!',
    timestamp: new Date().toISOString()
  });
});

// GET /api/bookings/check-availability/:babysitterId - Check if babysitter is available at a specific date and time
router.get('/check-availability/:babysitterId', protect, async (req, res) => {
  try {
    const { babysitterId } = req.params;
    const { date, startTime, endTime } = req.query;

    // Validation
    if (!date || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Please provide date, startTime, and endTime'
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

    // Helper function to check if time slots overlap
    const timeSlotOverlaps = (startTime1, endTime1, startTime2, endTime2) => {
      const start1 = parseInt(startTime1.replace(':', ''));
      const end1 = parseInt(endTime1.replace(':', ''));
      const start2 = parseInt(startTime2.replace(':', ''));
      const end2 = parseInt(endTime2.replace(':', ''));
      
      return !(end1 <= start2 || end2 <= start1);
    };

    // Step 1: Check if the requested time is within babysitter's free time slots
    const bookingDate = new Date(date);
    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][bookingDate.getDay()];
    
    const babysitterFreeSlots = babysitter.availability[dayOfWeek] || [];
    
    if (!babysitterFreeSlots || babysitterFreeSlots.length === 0) {
      return res.status(200).json({
        success: false,
        available: false,
        message: 'Babysitter is not available on this day',
        reason: 'no_free_slots'
      });
    }

    // Check if requested time falls within any free slot
    const isWithinFreeSlot = babysitterFreeSlots.some(slot =>
      timeSlotOverlaps(startTime, endTime, slot.start, slot.end)
    );

    if (!isWithinFreeSlot) {
      return res.status(200).json({
        success: false,
        available: false,
        message: 'Requested time is outside babysitter\'s available time slots',
        reason: 'outside_available_hours',
        babysitterSlots: babysitterFreeSlots
      });
    }

    // Step 2: Check for booking conflicts (both confirmed AND pending bookings)
    const bookingStartDate = new Date(date);
    bookingStartDate.setHours(0, 0, 0, 0);
    const bookingEndDate = new Date(date);
    bookingEndDate.setHours(23, 59, 59, 999);

    // Find all CONFIRMED and PENDING bookings for this babysitter on this date
    const existingBookings = await Booking.find({
      babysitterId: babysitterId,
      date: { $gte: bookingStartDate, $lte: bookingEndDate },
      status: { $in: ['confirmed', 'pending'] }
    });

    // Check if any bookings overlap with the requested time
    const conflictingBooking = existingBookings.find(booking =>
      timeSlotOverlaps(startTime, endTime, booking.startTime, booking.endTime)
    );

    if (conflictingBooking) {
      return res.status(200).json({
        success: false,
        available: false,
        message: 'This time slot is already booked or pending',
        reason: 'time_conflict',
        conflictingBooking: {
          startTime: conflictingBooking.startTime,
          endTime: conflictingBooking.endTime,
          status: conflictingBooking.status
        }
      });
    }

    // All checks passed - time slot is available
    res.status(200).json({
      success: true,
      available: true,
      message: 'Babysitter is available during this time slot'
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({
      success: false,
      message: 'Server error checking availability'
    });
  }
});

module.exports = router;