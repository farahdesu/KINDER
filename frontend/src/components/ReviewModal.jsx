import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Rating,
  Typography,
  CircularProgress,
  Alert
} from '@mui/material';
import { Star, Close } from '@mui/icons-material';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const ReviewModal = ({ open, onClose, booking, babysitter, onSuccess }) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hoverRating, setHoverRating] = useState(0);

  const maxCommentLength = 500;
  const minCommentLength = 10;

  // Log when modal opens with booking data
  useEffect(() => {
    if (open && booking) {
      console.log('📋 ReviewModal opened with booking:');
      console.log('  _id:', booking._id);
      console.log('  status:', booking.status);
      console.log('  date:', booking.date);
      console.log('  parentId:', booking.parentId);
      console.log('  babysitterId:', booking.babysitterId);
      console.log('  Full booking object:', booking);
    }
  }, [open, booking]);

  // Determine who is being reviewed based on user role
  const isParentReviewing = user?.role === 'parent';
  const isBabysitterReviewing = user?.role === 'babysitter';
  
  // Get the person being reviewed
  const getReviewedPerson = () => {
    if (isParentReviewing) {
      return babysitter?.name || 'Babysitter';
    } else if (isBabysitterReviewing) {
      return booking?.parentId?.name || booking?.parentName || 'Parent';
    }
    return 'User';
  };

  const getReviewType = () => {
    return isParentReviewing ? 'Babysitter' : 'Parent';
  };

  // Validate that booking is completed
  const isValidBooking = booking && booking.status === 'completed';

  const handleSubmit = async () => {
    setError('');

    // Validation
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    if (comment.trim().length < minCommentLength) {
      setError(`Comment must be at least ${minCommentLength} characters`);
      return;
    }

    if (comment.length > maxCommentLength) {
      setError(`Comment cannot exceed ${maxCommentLength} characters`);
      return;
    }

    // Validate booking object
    if (!booking || !booking._id) {
      console.error('❌ Invalid booking object:', booking);
      setError('Invalid booking information. Please refresh and try again.');
      return;
    }

    setLoading(true);

    try {
      // Build the review data
      const reviewData = {
        bookingId: booking._id,
        rating,
        comment: comment.trim()
      };

      console.log('📤 Submitting review:');
      console.log('  bookingId:', reviewData.bookingId);
      console.log('  userRole:', user?.role);
      console.log('  userId:', user?._id);
      console.log('  rating:', reviewData.rating);
      console.log('  comment length:', reviewData.comment.length);
      console.log('  Full review data:', reviewData);

      const response = await api.post('/reviews', reviewData);

      if (response.data.success) {
        setRating(0);
        setComment('');
        setError('');
        if (onSuccess) onSuccess(response.data.data);
        onClose();
      } else {
        setError(response.data.message || 'Failed to submit review');
      }
    } catch (err) {
      console.error('❌ Error submitting review:', err);
      console.error('  Response status:', err.response?.status);
      console.error('  Response data:', err.response?.data);
      setError(err.response?.data?.message || 'Error submitting review. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setRating(0);
      setComment('');
      setError('');
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          backgroundImage: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          border: '1px solid rgba(255, 152, 0, 0.3)'
        }
      }}
    >
      <DialogTitle
        sx={{
          backgroundColor: '#FF9800',
          color: 'white',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '1.3rem'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Star sx={{ fontSize: 28 }} />
          Leave a Review
        </Box>
        <Close
          onClick={handleClose}
          sx={{ cursor: 'pointer', fontSize: 24 }}
        />
      </DialogTitle>

      <DialogContent sx={{ paddingTop: 3, backgroundColor: 'rgba(26, 26, 46, 0.8)' }}>
        {!isValidBooking ? (
          <Alert severity="warning" sx={{ marginBottom: 2 }}>
            This booking is not eligible for review yet. Only completed bookings can be reviewed.
          </Alert>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* Person Being Reviewed Info */}
            <Box sx={{ padding: 2, backgroundColor: 'rgba(255, 152, 0, 0.1)', borderRadius: 2, border: '1px solid rgba(255, 152, 0, 0.3)' }}>
              <Typography sx={{ color: '#FF9800', fontWeight: 600, marginBottom: 1 }}>
                Reviewing: {getReviewType()}
              </Typography>
              <Typography sx={{ color: 'rgba(255, 255, 255, 0.8)', fontWeight: 600, fontSize: '1.1rem', marginBottom: 0.5 }}>
                {getReviewedPerson()}
              </Typography>
              <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem' }}>
                Date: {new Date(booking.date).toLocaleDateString()}
              </Typography>
            </Box>

            {/* Error Message */}
            {error && (
              <Alert severity="error" sx={{ backgroundColor: 'rgba(244, 67, 54, 0.2)' }}>
                {error}
              </Alert>
            )}

            {/* Rating Section */}
            <Box sx={{ textAlign: 'center', padding: 2, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 2 }}>
              <Typography sx={{ color: 'rgba(255, 255, 255, 0.9)', marginBottom: 1.5, fontWeight: 600 }}>
                How would you rate this {getReviewType().toLowerCase()}?
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                <Rating
                  value={rating}
                  onChange={(event, newValue) => setRating(newValue)}
                  onChangeActive={(event, newHoverValue) => setHoverRating(newHoverValue)}
                  size="large"
                  sx={{
                    '& .MuiRating-iconFilled': {
                      color: '#FF9800'
                    },
                    '& .MuiRating-iconHover': {
                      color: '#FFB74D'
                    },
                    '& .MuiRating-iconEmpty': {
                      color: 'rgba(255, 152, 0, 0.3)'
                    }
                  }}
                />
              </Box>
              {(hoverRating || rating) > 0 && (
                <Typography sx={{ color: '#FF9800', marginTop: 1, fontWeight: 600, fontSize: '1.1rem' }}>
                  {hoverRating || rating}/5
                </Typography>
              )}
            </Box>

            {/* Comment Section */}
            <Box>
              <Typography sx={{ color: 'rgba(255, 255, 255, 0.9)', marginBottom: 1, fontWeight: 600 }}>
                Your Review (Optional but recommended)
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                placeholder={`Share your experience with this ${getReviewType().toLowerCase()}... (min 10 characters)`}
                value={comment}
                onChange={(e) => setComment(e.target.value.slice(0, maxCommentLength))}
                disabled={loading}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderColor: 'rgba(255, 152, 0, 0.3)',
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 152, 0, 0.5)'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#FF9800'
                    }
                  },
                  '& .MuiOutlinedInput-input::placeholder': {
                    color: 'rgba(255, 255, 255, 0.5)',
                    opacity: 1
                  }
                }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', marginTop: 1 }}>
                <Typography sx={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                  {comment.length}/{maxCommentLength} characters
                </Typography>
                {comment.length > 0 && comment.length < minCommentLength && (
                  <Typography sx={{ fontSize: '0.85rem', color: '#FF9800' }}>
                    At least {minCommentLength - comment.length} more characters needed
                  </Typography>
                )}
              </Box>
            </Box>

            {/* Info Message */}
            <Typography sx={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.6)', textAlign: 'center', fontStyle: 'italic' }}>
              Your review helps other users find trusted matches. Please be honest and respectful.
            </Typography>
          </Box>
        )}
      </DialogContent>

      {isValidBooking && (
        <DialogActions sx={{ padding: 2, backgroundColor: 'rgba(0, 0, 0, 0.3)', borderTop: '1px solid rgba(255, 152, 0, 0.2)' }}>
          <Button
            onClick={handleClose}
            disabled={loading}
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading || rating === 0}
            sx={{
              backgroundColor: '#FF9800',
              color: 'white',
              fontWeight: 600,
              '&:hover': { backgroundColor: '#F57C00' },
              '&:disabled': { backgroundColor: 'rgba(255, 152, 0, 0.5)' }
            }}
          >
            {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Submit Review'}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default ReviewModal;
