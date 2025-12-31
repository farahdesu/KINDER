// backend/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

// Admin login (no auth required)
router.post('/login', adminController.adminLogin);

// Protected admin-only routes
router.get('/dashboard', protect, adminOnly, adminController.getDashboardStats);
router.get('/users', protect, adminOnly, adminController.getAllUsers);
router.get('/bookings', protect, adminOnly, adminController.getAllBookings);
router.get('/verifications', protect, adminOnly, adminController.getPendingVerifications);

// Verify user by User ID
router.put('/verify-user/:id', protect, adminOnly, adminController.verifyUser);

// Other admin routes
router.put('/users/:userId', protect, adminOnly, adminController.updateUser);
router.put('/users/:userId/status', protect, adminOnly, adminController.updateUserAccountStatus);
router.delete('/users/:userId', protect, adminOnly, adminController.deleteUser);
router.post('/create-admin', protect, adminOnly, adminController.createAdmin);
router.put('/bookings/:bookingId', protect, adminOnly, adminController.updateBookingStatus);

// Allow users to check their own verification status
router.get('/my-verification-status', protect, adminController.getMyVerificationStatus);

module.exports = router;