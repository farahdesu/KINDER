// backend/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

// Admin login (no auth required)
router.post('/login', adminController.adminLogin);

// Protected admin routes
router.get('/dashboard', protect, adminOnly, adminController.getDashboardStats);
router.get('/users', protect, adminOnly, adminController.getAllUsers);
router.get('/bookings', protect, adminOnly, adminController.getAllBookings);
router.get('/verifications', protect, adminOnly, adminController.getPendingVerifications);
router.put('/verify-user/:id', protect, adminOnly, adminController.verifyUser);
router.put('/verify-babysitter/:babysitterId', protect, adminOnly, adminController.verifyBabysitter); // Legacy
router.delete('/users/:userId', protect, adminOnly, adminController.deleteUser);
router.post('/create-admin', protect, adminOnly, adminController.createAdmin);

module.exports = router;

