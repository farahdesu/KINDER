// backend/controllers/adminController.js
const User = require('../models/User');
const Babysitter = require('../models/Babysitter');
const Parent = require('../models/Parent');
const Booking = require('../models/Booking');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Create New Admin (only admins can create admins)
exports.createAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password'
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists'
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Create new admin user
    const newAdmin = await User.create({
      name,
      email,
      password, // Will be hashed by pre-save hook
      role: 'admin'
    });

    console.log(`✅ NEW ADMIN CREATED: ${email} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      data: {
        id: newAdmin._id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role,
        createdAt: newAdmin.createdAt
      }
    });

  } catch (error) {
    console.error('🔥 CREATE ADMIN ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating admin',
      error: error.message
    });
  }
};

// Admin Login
exports.adminLogin = async (req, res) => {
  try {
    console.log('🔐 ADMIN LOGIN REQUEST:', req.body);
    
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find admin user
    const user = await User.findOne({ email, role: 'admin' }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin credentials'
      });
    }

    // Check password
    const isPasswordCorrect = await user.comparePassword(password);
    
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin credentials'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    console.log('✅ ADMIN LOGIN SUCCESS:', user.email);
    
    res.status(200).json({
      success: true,
      message: 'Admin login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('🔥 ADMIN LOGIN ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during admin login',
      error: error.message
    });
  }
};

// Get Dashboard Statistics
exports.getDashboardStats = async (req, res) => {
  try {
    // Get counts based on actual profiles (more accurate)
    const totalParents = await Parent.countDocuments();
    const totalBabysitters = await Babysitter.countDocuments();
    const totalUsers = totalParents + totalBabysitters; // Sum of actual profiles
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const totalBookings = await Booking.countDocuments();
    
    // Get booking statistics
    const pendingBookings = await Booking.countDocuments({ status: 'pending' });
    const confirmedBookings = await Booking.countDocuments({ status: 'confirmed' });
    const completedBookings = await Booking.countDocuments({ status: 'completed' });
    const cancelledBookings = await Booking.countDocuments({ status: 'cancelled' });

    // Get babysitters pending verification
    const pendingVerifications = await Babysitter.countDocuments({ verificationStatus: 'pending' });

    // Get recent bookings
    const recentBookings = await Booking.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate({
        path: 'parentId',
        populate: {
          path: 'userId',
          select: 'name email'
        }
      })
      .populate({
        path: 'babysitterId',
        populate: {
          path: 'userId',
          select: 'name email'
        }
      });

    // Get recent users
    const recentUsers = await User.find({ role: { $ne: 'admin' } })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('-password');

    // Calculate total revenue (from completed bookings)
    const revenueData = await Booking.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
    ]);
    const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

    res.status(200).json({
      success: true,
      data: {
        statistics: {
          totalUsers,
          totalParents,
          totalBabysitters,
          totalAdmins,
          totalBookings,
          pendingBookings,
          confirmedBookings,
          completedBookings,
          cancelledBookings,
          pendingVerifications,
          totalRevenue
        },
        recentBookings,
        recentUsers
      }
    });

  } catch (error) {
    console.error('🔥 DASHBOARD STATS ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics',
      error: error.message
    });
  }
};

// Get All Users (with filters)
exports.getAllUsers = async (req, res) => {
  try {
    const { role, search, page = 1, limit = 10 } = req.query;
    
    let query = { role: { $ne: 'admin' } }; // Exclude admin users
    
    if (role && role !== 'all') {
      query.role = role;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select('-password');

    const total = await User.countDocuments(query);

    // Get additional profile info for each user
    const usersWithProfiles = await Promise.all(
      users.map(async (user) => {
        let profile = null;
        if (user.role === 'babysitter') {
          profile = await Babysitter.findOne({ userId: user._id });
        } else if (user.role === 'parent') {
          profile = await Parent.findOne({ userId: user._id });
        }
        return {
          ...user.toObject(),
          profile
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        users: usersWithProfiles,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('🔥 GET ALL USERS ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
};

// Get All Bookings (with filters)
exports.getAllBookings = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    let query = {};
    
    if (status && status !== 'all') {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate({
        path: 'parentId',
        populate: {
          path: 'userId',
          select: 'name email phone'
        }
      })
      .populate({
        path: 'babysitterId',
        populate: {
          path: 'userId',
          select: 'name email'
        }
      });

    const total = await Booking.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        bookings,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('🔥 GET ALL BOOKINGS ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bookings',
      error: error.message
    });
  }
};

// Get Pending Verifications (Both Parents and Babysitters)
exports.getPendingVerifications = async (req, res) => {
  try {
    // Get all babysitters with pending verification status
    const babysitters = await Babysitter.find({ verificationStatus: 'pending' })
      .populate('userId', 'name email phone createdAt')
      .sort({ createdAt: -1 });

    // Get all parents with pending verification status
    const parents = await Parent.find({ verificationStatus: 'pending' })
      .populate('userId', 'name email phone createdAt')
      .sort({ createdAt: -1 });

    // Format babysitters with type
    const formattedBabysitters = babysitters.map(b => ({
      _id: b._id,
      type: 'babysitter',
      userId: b.userId,
      university: b.university,
      studentId: b.studentId,
      department: b.department,
      year: b.year,
      hourlyRate: b.hourlyRate,
      experience: b.experience,
      verificationStatus: b.verificationStatus,
      createdAt: b.createdAt
    }));

    // Format parents with type
    const formattedParents = parents.map(p => ({
      _id: p._id,
      type: 'parent',
      userId: p.userId,
      address: p.address,
      children: p.children,
      verificationStatus: p.verificationStatus,
      createdAt: p.createdAt
    }));

    // Combine and sort by creation date
    const allPending = [...formattedBabysitters, ...formattedParents]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({
      success: true,
      data: allPending,
      counts: {
        babysitters: babysitters.length,
        parents: parents.length,
        total: allPending.length
      }
    });

  } catch (error) {
    console.error('🔥 GET PENDING VERIFICATIONS ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending verifications',
      error: error.message
    });
  }
};

// Verify User (Approve or Reject - works for both babysitters and parents)
exports.verifyUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { verified, rejectionReason, userType } = req.body;

    let profile;
    let Model;

    if (userType === 'babysitter') {
      Model = Babysitter;
      profile = await Babysitter.findById(id).populate('userId', 'name email');
    } else if (userType === 'parent') {
      Model = Parent;
      profile = await Parent.findById(id).populate('userId', 'name email');
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid user type. Must be "babysitter" or "parent"'
      });
    }
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: `${userType} not found`
      });
    }

    const userName = profile.userId?.name || 'Unknown';
    const userEmail = profile.userId?.email || 'Unknown';
    const mainUserId = profile.userId?._id;

    if (verified) {
      // APPROVED: Update verification status
      profile.verificationStatus = 'approved';
      profile.verificationDate = new Date();
      await profile.save();

      console.log(`✅ ${userType} ${userName} has been APPROVED`);

      res.status(200).json({
        success: true,
        message: `${userType.charAt(0).toUpperCase() + userType.slice(1)} approved and can now access their dashboard`,
        data: {
          id: profile._id,
          type: userType,
          name: userName,
          email: userEmail,
          verificationStatus: 'approved',
          verificationDate: profile.verificationDate
        }
      });
    } else {
      // REJECTED: Delete the user completely from database
      
      // Delete the profile (Babysitter or Parent)
      await Model.findByIdAndDelete(id);
      
      // Delete the main User account
      if (mainUserId) {
        await User.findByIdAndDelete(mainUserId);
      }

      console.log(`❌ ${userType} ${userName} has been REJECTED and DELETED from database`);

      res.status(200).json({
        success: true,
        message: `${userType.charAt(0).toUpperCase() + userType.slice(1)} rejected and removed from the system${rejectionReason ? `. Reason: ${rejectionReason}` : ''}`,
        data: {
          id: id,
          type: userType,
          name: userName,
          email: userEmail,
          verificationStatus: 'rejected',
          deleted: true
        }
      });
    }

  } catch (error) {
    console.error('🔥 VERIFY USER ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying user',
      error: error.message
    });
  }
};

// Legacy endpoint - Verify Babysitter (for backwards compatibility)
exports.verifyBabysitter = async (req, res) => {
  req.body.userType = 'babysitter';
  req.params.id = req.params.babysitterId;
  return exports.verifyUser(req, res);
};

// Get Babysitter Verification Status (for babysitter dashboard)
exports.getBabysitterVerificationStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const babysitter = await Babysitter.findOne({ userId })
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
    console.error('🔥 GET VERIFICATION STATUS ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching verification status',
      error: error.message
    });
  }
};

// Delete User
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete admin user'
      });
    }

    // Delete associated profile
    if (user.role === 'babysitter') {
      await Babysitter.deleteOne({ userId: user._id });
    } else if (user.role === 'parent') {
      await Parent.deleteOne({ userId: user._id });
    }

    // Delete user
    await User.deleteOne({ _id: userId });

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('🔥 DELETE USER ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
  }
};

// Update Booking Status
exports.updateBookingStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;

    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    booking.status = status;
    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Booking status updated successfully',
      data: booking
    });

  } catch (error) {
    console.error('🔥 UPDATE BOOKING STATUS ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating booking status',
      error: error.message
    });
  }
};

