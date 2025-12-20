const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { protect, adminOnly } = require('../middleware/auth');

// Submit a review (protected)
router.post('/', protect, reviewController.submitReview);

// Get reviews for a user
router.get('/user/:userId', reviewController.getUserReviews);

// Get review statistics for a user
router.get('/stats/:userId', reviewController.getReviewStats);

// Admin routes
router.get('/admin/flagged', protect, adminOnly, reviewController.getFlaggedReviews);
router.put('/admin/flagged/:reviewId', protect, adminOnly, reviewController.handleFlaggedReview);

module.exports = router;
