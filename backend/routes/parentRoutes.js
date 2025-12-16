// backend/routes/parentRoutes.js
const express = require('express');
const router = express.Router();
const Parent = require('../models/Parent');
const User = require('../models/User');

// GET /api/parents/verification-status/:userId - Check verification status for a parent
router.get('/verification-status/:userId', async (req, res) => {
  try {
    const parent = await Parent.findOne({ userId: req.params.userId })
      .select('verificationStatus verificationDate rejectionReason');
    
    if (!parent) {
      return res.status(404).json({
        success: false,
        message: 'Parent profile not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        verificationStatus: parent.verificationStatus,
        verificationDate: parent.verificationDate,
        rejectionReason: parent.rejectionReason
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

// GET /api/parents - Get all parents (for admin)
router.get('/', async (req, res) => {
  try {
    const parents = await Parent.find()
      .populate({
        path: 'userId',
        select: 'name email phone'
      })
      .select('-__v');
    
    res.status(200).json({
      success: true,
      count: parents.length,
      parents
    });
  } catch (error) {
    console.error('Error fetching parents:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching parents'
    });
  }
});

module.exports = router;

