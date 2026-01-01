// backend/controllers/authController.js - COMPLETE VERSconst userExistsON
const User = require('../models/User');
const Babysitter = require('../models/Babysitter');
const Parent = require('../models/Parent');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendPasswordResetEmail, sendWelcomeEmail } = require('../utils/emailService');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

exports.register = async (req, res) => {
  try {
    console.log('📝 REGISTRATION REQUEST:', req.body);
    
    const { name, email, password, role, phone, university, studentId, department, year, skills, experience, hourlyRate, bio } = req.body;

    // Validate required fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, password, and role'
      });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
    // If user is rejected, allow re-application
      if (userExists.isRejected) {
        console.log('🔄 Rejected user re-applying:', email);
      // Continue with registration (will create new user)
      } else {
    // Normal user exists - block registration
        return res.status(400).json({
          success: false,
          message: 'User already exists with this email'
      });
    }
  }

    // Role-specific validation
    if (role === 'parent' && !phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required for parents'
      });
    }

    if (role === 'babysitter') {
      if (!university || !studentId || !department || !year || !hourlyRate) {
        return res.status(400).json({
          success: false,
          message: 'All babysitter fields are required: university, studentId, department, year, hourlyRate'
        });
      }
      
      // ✅ VALIDATE STUDENT ID: Must be exactly 8 digits
      const studentIdRegex = /^\d{8}$/;
      if (!studentIdRegex.test(studentId)) {
        return res.status(400).json({
          success: false,
          message: 'Student ID must be exactly 8 digits (e.g., 20241234)'
        });
      }
      
      // Check if student ID already exists
      const studentIdExists = await Babysitter.findOne({ studentId });
      if (studentIdExists) {
        return res.status(400).json({
          success: false,
          message: 'Student ID already registered'
        });
      }
      
      // ✅ VALIDATE YEAR: Must be 1-5
      const yearNum = parseInt(year);
      if (isNaN(yearNum) || yearNum < 1 || yearNum > 5) {
        return res.status(400).json({
          success: false,
          message: 'Academic year must be between 1 and 5'
        });
      }
      
      // ✅ VALIDATE HOURLY RATE
      const rateNum = parseFloat(hourlyRate);
      if (isNaN(rateNum) || rateNum < 100 || rateNum > 1000) {
        return res.status(400).json({
          success: false,
          message: 'Hourly rate must be between 100 and 1000 BDT'
        });
      }
    }

    // Create user - Model will hash the password automatically
    const user = await User.create({
      name,
      email,
      password: password, // Plain password, model's pre-save will hash it
      role,
      phone: role === 'parent' ? phone : undefined
    });

    // If babysitter, create babysitter profile
    if (role === 'babysitter') {
      await Babysitter.create({
        userId: user._id,
        university,
        studentId: studentId, // Already validated as 8 digits
        department,
        year: parseInt(year),
        skills: Array.isArray(skills) ? skills : (skills ? skills.split(',').map(s => s.trim()) : ['Childcare', 'Homework Help', 'First Aid']),
        experience: experience || 'Beginner (0-1 years)',
        hourlyRate: parseFloat(hourlyRate),
        bio: bio || ""
      });
    }

    // If parent, create parent profile
    if (role === 'parent') {
      await Parent.create({
        userId: user._id,
        address: "Address to be updated",
        location: {
          type: "Point",
          coordinates: [90.399452, 23.777176]
        },
        children: [],
        paymentMethod: "Cash"
      });
    }

    // Generate token
    const token = generateToken(user._id);

    // Get user data to return
    let userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      createdAt: user.createdAt
    };

    // If babysitter, include babysitter profile
    if (role === 'babysitter') {
      const babysitter = await Babysitter.findOne({ userId: user._id });
      userData.babysitterProfile = {
        university: babysitter.university,
        studentId: babysitter.studentId,
        department: babysitter.department,
        year: babysitter.year,
        hourlyRate: babysitter.hourlyRate,
        experience: babysitter.experience
      };
    }

    // If parent, include parent profile
    if (role === 'parent') {
      const parent = await Parent.findOne({ userId: user._id });
      userData.parentProfile = {
        address: parent.address,
        children: parent.children,
        paymentMethod: parent.paymentMethod
      };
    }

    console.log('✅ USER REGISTERED:', user.email);
    
    res.status(201).json({
      success: true,
      message: `${role === 'parent' ? 'Parent' : 'Babysitter'} registered successfully`,
      token,
      user: userData
    });

  } catch (error) {
    console.error('🔥 REGISTRATION ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message
    });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

exports.login = async (req, res) => {
  try {
    console.log('🔐 LOGIN REQUEST:', req.body);
    
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user with password
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordCorrect = await user.comparePassword(password);
    
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // ✅ CHECK IF USER IS REJECTED
    if (user.isRejected) {
      // Get rejection reason from profile
      let rejectionReason = 'Your account has been rejected by the admin team.';
      
      if (user.role === 'babysitter') {
        const babysitter = await Babysitter.findOne({ userId: user._id });
        if (babysitter?.rejectionReason) {
          rejectionReason = babysitter.rejectionReason;
        }
      } else if (user.role === 'parent') {
        const parent = await Parent.findOne({ userId: user._id });
        if (parent?.rejectionReason) {
          rejectionReason = parent.rejectionReason;
        }
      }

      return res.status(200).json({
        success: false,
        message: 'rejected',
        data: {
          id: user._id,
          email: user.email,
          role: user.role,
          name: user.name,
          isRejected: true,
          rejectionReason: rejectionReason
        }
      });
    }

    // Generate token
    const token = generateToken(user._id);

    // Get user data
    let userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      createdAt: user.createdAt
    };

    // If babysitter, include babysitter profile
    if (user.role === 'babysitter') {
      const babysitter = await Babysitter.findOne({ userId: user._id });
      if (babysitter) {
        userData.babysitterProfile = {
          university: babysitter.university,
          studentId: babysitter.studentId,
          department: babysitter.department,
          year: babysitter.year,
          hourlyRate: babysitter.hourlyRate,
          experience: babysitter.experience,
          skills: babysitter.skills,
          rating: babysitter.rating,
          totalJobs: babysitter.totalJobs
        };
      }
    }

    // If parent, include parent profile
    if (user.role === 'parent') {
      const parent = await Parent.findOne({ userId: user._id });
      if (parent) {
        userData.parentProfile = {
          address: parent.address,
          children: parent.children,
          paymentMethod: parent.paymentMethod
        };
      }
    }

    console.log('✅ LOGIN SUCCESS:', user.email);
    
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: userData
    });

  } catch (error) {
    console.error('🔥 LOGIN ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message
    });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email address'
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // For security, we don't reveal if email exists or not
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, you will receive a password reset code.'
      });
    }

    // Generate 6-digit reset code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set reset code and expiration (15 minutes from now)
    user.resetCode = resetCode;
    user.resetCodeExpires = Date.now() + 900000; // 15 minutes
    
    await user.save();

    // Try to send email if configured
    const emailResult = await sendPasswordResetEmail(email, resetCode, user.name);
    
    if (emailResult.success) {
      console.log('✅ Password reset code sent to:', email);
    } else {
      console.log('⚠️  Email not configured. Reset code for testing:', resetCode);
    }
    
    res.status(200).json({
      success: true,
      message: 'If an account exists, a reset code will be sent to the email address.',
      // Only show code in development/testing mode
      testCode: process.env.NODE_ENV !== 'production' ? resetCode : undefined
    });

  } catch (error) {
    console.error('🔥 FORGOT PASSWORD ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Server error processing password reset',
      error: error.message
    });
  }
};

exports.verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and reset code'
      });
    }

    const user = await User.findOne({
      email,
      resetCode: code,
      resetCodeExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset code'
      });
    }

    console.log('✅ Reset code verified for:', email);

    res.status(200).json({
      success: true,
      message: 'Code verified. You can now reset your password.',
      verified: true
    });

  } catch (error) {
    console.error('🔥 VERIFY RESET CODE ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Server error verifying code',
      error: error.message
    });
  }
};

exports.resetPasswordWithCode = async (req, res) => {
  try {
    const { email, code, newPassword, confirmPassword } = req.body;

    if (!email || !code || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Find user with valid reset code
    const user = await User.findOne({
      email,
      resetCode: code,
      resetCodeExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset code'
      });
    }

    // Update password
    user.password = newPassword;
    user.resetCode = undefined;
    user.resetCodeExpires = undefined;
    
    await user.save();

    console.log('✅ Password reset successful for:', user.email);

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. Please login with your new password.'
    });

  } catch (error) {
    console.error('🔥 RESET PASSWORD ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Server error resetting password',
      error: error.message
    });
  }
};

// Check user verification status (for AccountUnderReview page)
exports.checkVerificationStatus = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Determine status
    let status = 'pending';
    if (user.verified) {
      status = 'approved';
    } else if (user.isRejected) {
      status = 'rejected';
    }

    res.status(200).json({
      success: true,
      data: {
        userId: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        verified: user.verified,
        isRejected: user.isRejected,
        rejectionReason: user.rejectionReason || '',
        status: status
      }
    });

  } catch (error) {
    console.error('Error checking verification status:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking verification status',
      error: error.message
    });
  }
};

// Delete rejected user's account and profile after viewing rejection message
exports.deleteRejectedUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Find the user
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify user is rejected
    if (!user.isRejected) {
      return res.status(400).json({
        success: false,
        message: 'User is not rejected'
      });
    }

    const userRole = user.role;
    const userEmail = user.email;

    // Delete profile based on role
    if (userRole === 'babysitter') {
      await Babysitter.findOneAndDelete({ userId: userId });
    } else if (userRole === 'parent') {
      await Parent.findOneAndDelete({ userId: userId });
    }

    // Delete the user account
    await User.findByIdAndDelete(userId);

    console.log(`✅ Rejected ${userRole} ${userEmail} account and profile deleted`);

    res.status(200).json({
      success: true,
      message: 'Your account and all associated data have been deleted',
      data: {
        deleted: true,
        email: userEmail
      }
    });

  } catch (error) {
    console.error('🔥 DELETE REJECTED USER ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting account',
      error: error.message
    });
  }
};

// GET /api/auth/me - Get current authenticated user
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        accountStatus: user.accountStatus,
        accountStatusReason: user.accountStatusReason,
        accountStatusChangedAt: user.accountStatusChangedAt,
        isRejected: user.isRejected
      }
    });
  } catch (error) {
    console.error('🔥 GET CURRENT USER ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user information',
      error: error.message
    });
  }
};