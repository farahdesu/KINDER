const Review = require('../models/Review');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Babysitter = require('../models/Babysitter');
const Parent = require('../models/Parent');
const { analyzeSentiment, detectFakeReview, getReviewStatistics } = require('../utils/sentimentAnalysis');

// Submit a review for a booking
exports.submitReview = async (req, res) => {
  try {
    const { bookingId, rating, comment } = req.body;
    const userId = req.user._id;

    // Validate input
    if (!bookingId || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Please provide bookingId, rating, and comment'
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    if (comment.length < 10 || comment.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Comment must be between 10 and 500 characters'
      });
    }

    // Find booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if booking is completed
    if (booking.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Can only review completed bookings'
      });
    }

    // Determine who is reviewing whom
    let toUserId, fromRole;
    
    // Get parent's userId from Parent document
    const parentDoc = await Parent.findById(booking.parentId);
    if (!parentDoc) {
      return res.status(404).json({
        success: false,
        message: 'Parent not found'
      });
    }
    const parentUserId = parentDoc.userId;

    // Get babysitter's userId from Babysitter document
    const babysitterDoc = await Babysitter.findById(booking.babysitterId);
    if (!babysitterDoc) {
      return res.status(404).json({
        success: false,
        message: 'Babysitter not found'
      });
    }
    const babysitterUserId = babysitterDoc.userId;

    // Determine who is reviewing whom
    if (userId.toString() === parentUserId.toString()) {
      // Parent reviewing babysitter
      toUserId = babysitterUserId;
      fromRole = 'parent';
    } else if (userId.toString() === babysitterUserId.toString()) {
      // Babysitter reviewing parent
      toUserId = parentUserId;
      fromRole = 'babysitter';
    } else {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to review this booking'
      });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({
      bookingId,
      fromUserId: userId
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this booking'
      });
    }

    // Analyze sentiment
    const sentiment = analyzeSentiment(comment);
    const fakeReviewCheck = detectFakeReview(comment, rating);

    // Create review
    const review = await Review.create({
      bookingId,
      fromUserId: userId,
      toUserId,
      fromRole,
      rating,
      comment,
      sentimentScore: sentiment.score,
      sentimentLabel: sentiment.label,
      flaggedForReview: sentiment.flagged || fakeReviewCheck.isSuspicious,
      flagReason: sentiment.reason || fakeReviewCheck.reasons.join('; ')
    });

    // Update babysitter or parent rating
    if (fromRole === 'parent') {
      // Update babysitter rating
      const babysitter = await Babysitter.findById(booking.babysitterId);
      const allReviews = await Review.find({ toUserId: babysitter.userId });
      
      const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
      babysitter.rating = parseFloat((totalRating / allReviews.length).toFixed(2));
      await babysitter.save();
    } else {
      // Update parent rating - babysitter reviewing parent
      const parent = await Parent.findById(booking.parentId);
      const allReviews = await Review.find({ toUserId: parent.userId });
      
      const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
      parent.rating = parseFloat((totalRating / allReviews.length).toFixed(2));
      await parent.save();
    }

    console.log(`✅ Review submitted for booking ${bookingId}`);
    if (review.flaggedForReview) {
      console.log(`⚠️ Review flagged for admin review: ${review.flagReason}`);
    }

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: review,
      flagged: review.flaggedForReview
    });

  } catch (error) {
    console.error('🔥 SUBMIT REVIEW ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting review',
      error: error.message
    });
  }
};

// Get reviews for a user
exports.getUserReviews = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10, page = 1 } = req.query;

    const reviews = await Review.find({ toUserId: userId })
      .populate('fromUserId', 'name email')
      .populate('bookingId', 'date')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Review.countDocuments({ toUserId: userId });

    // Get statistics
    const stats = getReviewStatistics(reviews);

    res.status(200).json({
      success: true,
      data: {
        reviews,
        statistics: stats,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('🔥 GET USER REVIEWS ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews',
      error: error.message
    });
  }
};

// Get flagged reviews for admin
exports.getFlaggedReviews = async (req, res) => {
  try {
    const { limit = 10, page = 1 } = req.query;

    const reviews = await Review.find({ flaggedForReview: true })
      .populate('fromUserId', 'name email')
      .populate('toUserId', 'name email')
      .populate('bookingId')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Review.countDocuments({ flaggedForReview: true });

    res.status(200).json({
      success: true,
      data: {
        reviews,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('🔥 GET FLAGGED REVIEWS ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching flagged reviews',
      error: error.message
    });
  }
};

// Admin action on flagged review
exports.handleFlaggedReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { action, adminNotes } = req.body; // action: 'approve', 'remove', 'warn_user'

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    if (action === 'approve') {
      review.flaggedForReview = false;
      review.flagReason = '';
      await review.save();
      
      console.log(`✅ Review ${reviewId} approved by admin`);
    } else if (action === 'remove') {
      await Review.findByIdAndDelete(reviewId);
      console.log(`❌ Review ${reviewId} removed by admin`);
    } else if (action === 'warn_user') {
      // Create warning notification for user
      review.flaggedForReview = false;
      await review.save();
      console.log(`⚠️ User warned for review ${reviewId}`);
    }

    res.status(200).json({
      success: true,
      message: `Review ${action} successfully`,
      data: review
    });

  } catch (error) {
    console.error('🔥 HANDLE FLAGGED REVIEW ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Error handling flagged review',
      error: error.message
    });
  }
};

// Get review statistics for a user
exports.getReviewStats = async (req, res) => {
  try {
    const { userId } = req.params;

    const reviews = await Review.find({ toUserId: userId });
    const stats = getReviewStatistics(reviews);

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('🔥 GET REVIEW STATS ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching review statistics',
      error: error.message
    });
  }
};
