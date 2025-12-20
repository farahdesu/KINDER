const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // Check for token in headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // ✅ FIXED: Use 'id' (not userId or _id) - matches what generateToken signs
      // NEW (FIXED)
      const user = await User.findById(decoded.id);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found in database'
        });
      }
      
      req.user = user;
      next();
    } catch (error) {
      console.error('Token verification error:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed'
      });
    }
  } else {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token provided'
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, user not found'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`
      });
    }
    next();
  };
};

// Admin-only middleware
const adminOnly = (req, res, next) => {
  console.log('🔐 AdminOnly check - User:', req.user?.email, 'Role:', req.user?.role);
  
  if (!req.user) {
    console.log('❌ AdminOnly: No user found in request');
    return res.status(401).json({
      success: false,
      message: 'Not authorized, user not found'
    });
  }

  if (req.user.role !== 'admin') {
    console.log(`❌ AdminOnly: User ${req.user.email} has role '${req.user.role}', not admin`);
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin only.'
    });
  }
  
  console.log('✅ Admin access granted for:', req.user.email);
  next();
};

module.exports = { protect, authorize, adminOnly };