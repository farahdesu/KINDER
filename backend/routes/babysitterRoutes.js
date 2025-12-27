const express = require('express');
const router = express.Router();
const Babysitter = require('../models/Babysitter');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// GET /api/babysitters - Get all approved babysitters (for parents to see)
router.get('/', async (req, res) => {
  try {
    // Get all babysitters with user info including verified status
    const babysitters = await Babysitter.find()
      .populate({
        path: 'userId',
        select: 'name email phone verified isRejected'
      })
      .select('-__v');
    
    // Filter to only show babysitters whose USER is verified (approved by admin)
    const approvedBabysitters = babysitters.filter(bs => {
      const user = bs.userId;
      // User must exist, be verified, and not rejected
      return user && user.verified === true && user.isRejected !== true;
    });
    
    // Format the response
    const formattedBabysitters = approvedBabysitters.map(bs => {
      const user = bs.userId || {};
      return {
        id: bs._id,
        userId: user._id,
        name: user.name || 'Unknown',
        email: user.email || '',
        phone: user.phone || '',
        university: bs.university || '',
        studentId: bs.studentId || '',
        department: bs.department || '',
        year: bs.year || 1,
        skills: Array.isArray(bs.skills) ? bs.skills : (bs.skills || '').split(',').map(s => s.trim()).filter(s => s),
        experience: bs.experience || 'Beginner',
        hourlyRate: bs.hourlyRate || 0,
        rating: bs.rating || 0,
        totalJobs: bs.totalJobs || 0,
        verificationStatus: 'approved', // Only approved ones shown
        createdAt: bs.createdAt
      };
    });

    res.status(200).json({
      success: true,
      count: formattedBabysitters.length,
      babysitters: formattedBabysitters
    });
  } catch (error) {
    console.error('Error fetching babysitters:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching babysitters'
    });
  }
});

// IMPORTANT: Specific routes (/me/*, /availability, etc.) must come BEFORE generic /:id routes
// This ensures that /me/availability matches before /:userId is evaluated

// GET /api/babysitters/me - Get current user's babysitter profile
router.get('/me', protect, async (req, res) => {
  try {
    const babysitter = await Babysitter.findOne({ userId: req.user._id })
      .populate({
        path: 'userId',
        select: 'name email phone'
      });
    
    if (!babysitter) {
      return res.status(404).json({
        success: false,
        message: 'Babysitter profile not found'
      });
    }

    const user = babysitter.userId || {};
    res.status(200).json({
      success: true,
      babysitter: {
        id: babysitter._id,
        userId: user._id,
        name: user.name || 'Unknown',
        email: user.email || '',
        phone: user.phone || '',
        university: babysitter.university || '',
        studentId: babysitter.studentId || '',
        department: babysitter.department || '',
        year: babysitter.year || 1,
        skills: Array.isArray(babysitter.skills) ? babysitter.skills : (babysitter.skills || '').split(',').map(s => s.trim()).filter(s => s),
        experience: babysitter.experience || 'Beginner',
        hourlyRate: babysitter.hourlyRate || 0,
        rating: babysitter.rating || 0,
        totalJobs: babysitter.totalJobs || 0,
        availability: babysitter.availability || {},
        verificationStatus: babysitter.verificationStatus,
        createdAt: babysitter.createdAt
      }
    });
  } catch (error) {
    console.error('Error fetching current babysitter profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// GET /api/babysitters/me/availability - Get current babysitter's availability
router.get('/me/availability', protect, async (req, res) => {
  try {
    const babysitter = await Babysitter.findOne({ userId: req.user._id })
      .select('availability');
    
    if (!babysitter) {
      return res.status(404).json({
        success: false,
        message: 'Babysitter profile not found'
      });
    }

    res.status(200).json({
      success: true,
      availability: babysitter.availability || {
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: [],
        saturday: [],
        sunday: []
      }
    });
  } catch (error) {
    console.error('Error fetching availability:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// GET /api/babysitters/verification-status/:userId - Check verification status for a babysitter
router.get('/verification-status/:userId', async (req, res) => {
  try {
    const babysitter = await Babysitter.findOne({ userId: req.params.userId })
      .select('verificationStatus verificationDate rejectionReason');
    
    if (!babysitter) {
      return res.status(404).json({
        success: false,
        message: 'Babysitter profile not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        verificationStatus: babysitter.verificationStatus,
        verificationDate: babysitter.verificationDate,
        rejectionReason: babysitter.rejectionReason
      }
    });
  } catch (error) {
    console.error('Error fetching verification status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching verification status'
    });
  }
});

// GET /api/babysitters/:id - Get single babysitter
router.get('/:id', async (req, res) => {
  try {
    const babysitter = await Babysitter.findById(req.params.id)
      .populate('userId', 'name email phone')
      .populate('reviews.parentId', 'name');
    
    if (!babysitter) {
      return res.status(404).json({
        success: false,
        message: 'Babysitter not found'
      });
    }

    res.status(200).json({
      success: true,
      babysitter
    });
  } catch (error) {
    console.error('Error fetching babysitter:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// PUT /api/babysitters/availability - Update babysitter's availability schedule (must come before /:id)
router.put('/availability', protect, async (req, res) => {
  try {
    const { availability } = req.body;

    if (!availability) {
      return res.status(400).json({
        success: false,
        message: 'Please provide availability schedule'
      });
    }

    // Find babysitter by user ID
    const babysitter = await Babysitter.findOne({ userId: req.user._id });

    if (!babysitter) {
      return res.status(404).json({
        success: false,
        message: 'Babysitter profile not found'
      });
    }

    // Update availability
    babysitter.availability = availability;
    await babysitter.save();

    res.status(200).json({
      success: true,
      message: 'Availability updated successfully',
      availability: babysitter.availability
    });
  } catch (error) {
    console.error('Error updating availability:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating availability'
    });
  }
});

// PUT /api/babysitters/skills - Update babysitter skills
router.put('/skills', protect, async (req, res) => {
  try {
    const { skills } = req.body;

    if (!Array.isArray(skills)) {
      return res.status(400).json({
        success: false,
        message: 'Skills must be an array'
      });
    }

    if (skills.length > 10) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 10 skills allowed'
      });
    }

    // Find babysitter by user ID
    const babysitter = await Babysitter.findOne({ userId: req.user._id });

    if (!babysitter) {
      return res.status(404).json({
        success: false,
        message: 'Babysitter profile not found'
      });
    }

    // Update skills
    babysitter.skills = skills.map(skill => skill.trim()).filter(skill => skill);
    await babysitter.save();

    res.status(200).json({
      success: true,
      message: 'Skills updated successfully',
      skills: babysitter.skills
    });
  } catch (error) {
    console.error('Error updating skills:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating skills'
    });
  }
});

// PUT /api/babysitters/profile/:id - Update babysitter profile
router.put('/profile/:id', protect, async (req, res) => {
  try {
    const { name, phone, address } = req.body;

    // Find babysitter by user ID
    const babysitter = await Babysitter.findOne({ userId: req.user._id });

    if (!babysitter) {
      return res.status(404).json({
        success: false,
        message: 'Babysitter profile not found'
      });
    }

    // Update user info
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone },
      { new: true }
    );

    // Update babysitter info (address can be stored in user or babysitter model)
    if (address) {
      // Store address in user model
      user.address = address;
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating profile'
    });
  }
});

// GET /api/babysitters/:id/availability - Get babysitter's availability schedule
router.get('/:id/availability', async (req, res) => {
  try {
    const babysitter = await Babysitter.findById(req.params.id)
      .select('availability');
    
    if (!babysitter) {
      return res.status(404).json({
        success: false,
        message: 'Babysitter not found'
      });
    }

    res.status(200).json({
      success: true,
      availability: babysitter.availability || {
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: [],
        saturday: [],
        sunday: []
      }
    });
  } catch (error) {
    console.error('Error fetching availability:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;