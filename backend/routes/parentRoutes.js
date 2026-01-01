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

// PUT /api/parents/profile/:userId - Update parent profile
router.put('/profile/:userId', async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    const userId = req.params.userId;

    // Update User model (name, phone)
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name, phone },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update Parent model (address)
    const updatedParent = await Parent.findOneAndUpdate(
      { userId: userId },
      { address },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        name: updatedUser.name,
        phone: updatedUser.phone,
        address: updatedParent?.address || address
      }
    });
  } catch (error) {
    console.error('Error updating parent profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating profile'
    });
  }
});

// GET /api/parents/profile/:userId - Get parent profile
router.get('/profile/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');
    const parent = await Parent.findOne({ userId: req.params.userId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: parent?.address || '',
        rating: parent?.rating || 0,
        totalReviews: parent?.totalReviews || 0,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Error fetching parent profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching profile'
    });
  }
});

module.exports = router;

