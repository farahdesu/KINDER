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

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password'
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    const newAdmin = await User.create({
      name,
      email,
      password,
      role: 'admin',
      verified: true
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
    console.error('Error creating admin:', error);
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
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    const user = await User.findOne({ email, role: 'admin' }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin credentials'
      });
    }

    const isPasswordCorrect = await user.comparePassword(password);
    
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin credentials'
      });
    }

    const token = generateToken(user._id);

    console.log(`✅ ADMIN LOGIN SUCCESS: ${user.email}`);
    
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
    console.error('Error during admin login:', error);
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
    const totalParents = await Parent.countDocuments();
    const totalBabysitters = await Babysitter.countDocuments();
    const totalUsers = totalParents + totalBabysitters;
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const totalBookings = await Booking.countDocuments();
    
    const pendingBookings = await Booking.countDocuments({ status: 'pending' });
    const confirmedBookings = await Booking.countDocuments({ status: 'confirmed' });
    const completedBookings = await Booking.countDocuments({ status: 'completed' });
    const cancelledBookings = await Booking.countDocuments({ status: 'cancelled' });

    const pendingVerifications = await User.countDocuments({
      role: { $in: ['parent', 'babysitter'] },
      verified: false
    });

    const recentBookings = await Booking.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate({
        path: 'parentId',
        populate: { path: 'userId', select: 'name email' }
      })
      .populate({
        path: 'babysitterId',
        populate: { path: 'userId', select: 'name email' }
      });

    const recentUsers = await User.find({ role: { $ne: 'admin' } })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('-password');

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
    console.error('Error fetching dashboard stats:', error);
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
    
    let query = { role: { $ne: 'admin' } };
    
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
    console.error('Error fetching users:', error);
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
        populate: { path: 'userId', select: 'name email phone' }
      })
      .populate({
        path: 'babysitterId',
        populate: { path: 'userId', select: 'name email' }
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
    console.error('Error fetching bookings:', error);
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
    // Only get users who are NOT verified AND NOT rejected (truly pending)
    const unverifiedUsers = await User.find({
      role: { $in: ['parent', 'babysitter'] },
      verified: false,
      isRejected: { $ne: true }  // Exclude rejected users
    }).sort({ createdAt: -1 }).select('-password');
    
    const pendingVerifications = await Promise.all(
      unverifiedUsers.map(async (user) => {
        if (user.role === 'babysitter') {
          const profile = await Babysitter.findOne({ userId: user._id });
          return {
            _id: user._id,
            type: 'babysitter',
            name: user.name,
            email: user.email,
            phone: user.phone,
            university: profile?.university || '',
            studentId: profile?.studentId || '',
            department: profile?.department || '',
            year: profile?.year || '',
            hourlyRate: profile?.hourlyRate || 0,
            skills: profile?.skills || [],
            experience: profile?.experience || '',
            createdAt: user.createdAt
          };
        } else {
          const profile = await Parent.findOne({ userId: user._id });
          return {
            _id: user._id,
            type: 'parent',
            name: user.name,
            email: user.email,
            phone: user.phone,
            address: profile?.address || '',
            children: profile?.children || [],
            createdAt: user.createdAt
          };
        }
      })
    );

    res.status(200).json({
      success: true,
      data: pendingVerifications,
      counts: {
        total: pendingVerifications.length
      }
    });

  } catch (error) {
    console.error('Error fetching pending verifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending verifications',
      error: error.message
    });
  }
};

// ✅ VERIFY USER (CRITICAL FIX - Works for both babysitters and parents)
exports.verifyUser = async (req, res) => {
  try {
    const { id } = req.params; // USER ID from User collection
    const { verified, rejectionReason, userType } = req.body;

    // 1. Find the main user
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // 2. Update user's verified status
    user.verified = verified === true || verified === 'true';
    
    if (!user.verified && rejectionReason) {
      user.isRejected = true;
      user.rejectionReason = rejectionReason;
      user.rejectionSeenAt = null; // Will be set when user views rejection
    } else if (user.verified) {
      user.isRejected = false;
      user.rejectionReason = null;
    }

    await user.save();

    // 3. Also update profile if exists
    if (userType === 'babysitter') {
      await Babysitter.findOneAndUpdate(
        { userId: id },
        { 
          verificationStatus: user.verified ? 'approved' : 'rejected',
          verificationDate: new Date(),
          rejectionReason: user.verified ? null : rejectionReason
        },
        { new: true }
      );
    } else if (userType === 'parent') {
      await Parent.findOneAndUpdate(
        { userId: id },
        { 
          verificationStatus: user.verified ? 'approved' : 'rejected',
          verificationDate: new Date(),
          rejectionReason: user.verified ? null : rejectionReason
        },
        { new: true }
      );
    }

    const action = user.verified ? 'APPROVED' : 'REJECTED';
    console.log(`✅ User ${user.name} (${userType}) ${action}`);

    res.status(200).json({
      success: true,
      message: `User ${user.verified ? 'approved' : 'rejected'} successfully`,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        verified: user.verified,
        isRejected: user.isRejected,
        rejectionReason: user.rejectionReason,
        userType
      }
    });

  } catch (error) {
    console.error('Error verifying user:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying user',
      error: error.message
    });
  }
};

// Legacy endpoint - Verify Babysitter
exports.verifyBabysitter = async (req, res) => {
  req.body.userType = 'babysitter';
  req.params.id = req.params.babysitterId;
  return exports.verifyUser(req, res);
};

// Get Verification Status for current user
exports.getMyVerificationStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const user = await User.findById(userId).select('verified isRejected rejectionReason role');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let profileData = null;
    if (user.role === 'babysitter') {
      profileData = await Babysitter.findOne({ userId }).select('verificationStatus verificationDate rejectionReason');
    } else if (user.role === 'parent') {
      profileData = await Parent.findOne({ userId }).select('verificationStatus verificationDate rejectionReason');
    }

    res.status(200).json({
      success: true,
      data: {
        verified: user.verified,
        isRejected: user.isRejected,
        rejectionReason: user.rejectionReason,
        verificationStatus: profileData?.verificationStatus || 'pending',
        verificationDate: profileData?.verificationDate
      }
    });

  } catch (error) {
    console.error('Error fetching verification status:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching verification status',
      error: error.message
    });
  }
};

// Update User (Admin can edit user info)
exports.updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { 
      name, email, phone, 
      // Parent fields
      address,
      // Babysitter fields
      university, studentId, department, year, hourlyRate, experience, skills
    } = req.body;

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
        message: 'Cannot edit admin user from this endpoint'
      });
    }

    // Check for duplicate email (if email is being changed)
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use by another user'
        });
      }
    }

    // Update user fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone !== undefined) user.phone = phone;

    await user.save();

    // Update profile based on role
    if (user.role === 'parent') {
      const updateData = {};
      if (address !== undefined) updateData.address = address;
      
      if (Object.keys(updateData).length > 0) {
        await Parent.findOneAndUpdate({ userId }, updateData);
      }
    } else if (user.role === 'babysitter') {
      const updateData = {};
      if (university !== undefined) updateData.university = university;
      if (studentId !== undefined) updateData.studentId = studentId;
      if (department !== undefined) updateData.department = department;
      if (year !== undefined) updateData.year = parseInt(year);
      if (hourlyRate !== undefined) updateData.hourlyRate = parseFloat(hourlyRate);
      if (experience !== undefined) updateData.experience = experience;
      if (skills !== undefined) updateData.skills = Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim());
      
      if (Object.keys(updateData).length > 0) {
        await Babysitter.findOneAndUpdate({ userId }, updateData);
      }
    }

    console.log(`✅ User ${user.email} updated by admin`);

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user',
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

    if (user.role === 'babysitter') {
      await Babysitter.deleteOne({ userId });
    } else if (user.role === 'parent') {
      await Parent.deleteOne({ userId });
    }

    await User.deleteOne({ _id: userId });

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting user:', error);
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
    console.error('Error updating booking status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating booking status',
      error: error.message
    });
  }
};