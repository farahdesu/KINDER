const express = require('express');
const router = express.Router();
const Babysitter = require('../models/Babysitter');
const User = require('../models/User');

// GET /api/babysitters - Get all babysitters
router.get('/', async (req, res) => {
  try {
    const babysitters = await Babysitter.find()
      .populate({
        path: 'userId',
        select: 'name email phone'
      })
      .select('-__v');
    
    // Format the response
    const formattedBabysitters = babysitters.map(bs => {
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

module.exports = router;