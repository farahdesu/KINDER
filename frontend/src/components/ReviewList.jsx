import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Rating,
  CircularProgress,
  Pagination,
  Alert,
  Chip,
  Grid
} from '@mui/material';
import { Star, Schedule } from '@mui/icons-material';
import api from '../services/api';

const ReviewList = ({ userId, readOnly = false }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const reviewsPerPage = 5;

  useEffect(() => {
    fetchReviews();
  }, [userId, page]);

  const fetchReviews = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError('');

    try {
      const response = await api.get(`/reviews/user/${userId}`, {
        params: { page, limit: reviewsPerPage }
      });

      if (response.data.success) {
        setReviews(response.data.data.reviews || []);
        setTotalPages(Math.ceil((response.data.data.total || 0) / reviewsPerPage));
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const getSentimentColor = (sentiment) => {
    if (!sentiment) return 'default';
    if (sentiment === 'positive') return 'success';
    if (sentiment === 'negative') return 'error';
    return 'default';
  };

  const getSentimentLabel = (sentiment) => {
    if (!sentiment) return 'Neutral';
    return sentiment.charAt(0).toUpperCase() + sentiment.slice(1);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', padding: 4 }}>
        <CircularProgress sx={{ color: '#FF9800' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ marginTop: 2 }}>
        {error}
      </Alert>
    );
  }

  if (reviews.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', padding: 4 }}>
        <Star sx={{ fontSize: 60, color: 'rgba(255, 152, 0, 0.3)', marginBottom: 2 }} />
        <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '1.1rem' }}>
          No reviews yet
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Grid container spacing={2}>
        {reviews.map((review) => (
          <Grid item xs={12} key={review._id}>
            <Card
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 152, 0, 0.2)',
                borderRadius: 2,
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  borderColor: 'rgba(255, 152, 0, 0.4)',
                  boxShadow: '0 8px 32px rgba(255, 152, 0, 0.1)'
                }
              }}
            >
              <CardContent sx={{ padding: 2.5 }}>
                {/* Header: Reviewer Name and Rating */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ color: '#FF9800', fontWeight: 700, fontSize: '1.1rem', marginBottom: 0.5 }}>
                      {review.reviewerId?.name || 'Anonymous Reviewer'}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Rating value={review.rating} readOnly size="small" sx={{ '& .MuiRating-iconFilled': { color: '#FF9800' } }} />
                      <Typography sx={{ color: '#FF9800', fontWeight: 600, fontSize: '0.95rem' }}>
                        {review.rating}.0
                      </Typography>
                    </Box>
                  </Box>

                  {/* Sentiment Badge */}
                  {review.sentimentLabel && (
                    <Chip
                      label={getSentimentLabel(review.sentimentLabel)}
                      size="small"
                      color={getSentimentColor(review.sentimentLabel)}
                      variant="outlined"
                      sx={{
                        borderColor: getSentimentColor(review.sentimentLabel) === 'success' ? '#4CAF50' : getSentimentColor(review.sentimentLabel) === 'error' ? '#F44336' : 'rgba(255, 255, 255, 0.3)',
                        color: getSentimentColor(review.sentimentLabel) === 'success' ? '#4CAF50' : getSentimentColor(review.sentimentLabel) === 'error' ? '#F44336' : 'rgba(255, 255, 255, 0.7)'
                      }}
                    />
                  )}
                </Box>

                {/* Review Comment */}
                {review.comment && (
                  <Typography sx={{ color: 'rgba(255, 255, 255, 0.85)', marginBottom: 2, lineHeight: 1.6, fontSize: '0.95rem' }}>
                    "{review.comment}"
                  </Typography>
                )}

                {/* Sentiment Score (Debug) */}
                {review.sentimentScore !== undefined && (
                  <Box sx={{ marginBottom: 1.5, padding: 1, backgroundColor: 'rgba(255, 152, 0, 0.1)', borderRadius: 1 }}>
                    <Typography sx={{ fontSize: '0.8rem', color: 'rgba(255, 152, 0, 0.8)' }}>
                      Sentiment Score: {(review.sentimentScore * 100).toFixed(1)}%
                    </Typography>
                  </Box>
                )}

                {/* Footer: Date */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, marginTop: 2, paddingTop: 2, borderTop: '1px solid rgba(255, 152, 0, 0.1)' }}>
                  <Schedule sx={{ fontSize: 16, color: 'rgba(255, 255, 255, 0.5)' }} />
                  <Typography sx={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                    {new Date(review.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', marginTop: 4 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(e, value) => setPage(value)}
            sx={{
              '& .MuiPaginationItem-root': {
                color: 'rgba(255, 255, 255, 0.7)',
                border: '1px solid rgba(255, 152, 0, 0.3)',
                '&:hover': { backgroundColor: 'rgba(255, 152, 0, 0.1)' }
              },
              '& .MuiPaginationItem-page.Mui-selected': {
                backgroundColor: '#FF9800',
                color: 'white',
                border: '1px solid #FF9800'
              }
            }}
          />
        </Box>
      )}
    </Box>
  );
};

export default ReviewList;
