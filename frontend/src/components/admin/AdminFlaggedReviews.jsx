import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Card,
  CardContent,
  Rating,
  AppBar,
  Toolbar
} from '@mui/material';
import { Visibility, Warning, Check } from '@mui/icons-material';
import api from '../../services/api';
import KinderLogo from '../../assets/KinderLogo.png';
import KinderBackground from '../../assets/KinderBackground.jpg';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminFlaggedReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedReview, setSelectedReview] = useState(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState('approve');
  const [adminNotes, setAdminNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Check if user is admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    fetchFlaggedReviews();
  }, []);

  const fetchFlaggedReviews = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get('/reviews/admin/flagged');
      if (response.data.success) {
        setReviews(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching flagged reviews:', err);
      setError('Failed to load flagged reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (review) => {
    setSelectedReview(review);
    setDetailsDialogOpen(true);
  };

  const handleCloseDetailsDialog = () => {
    setDetailsDialogOpen(false);
    setSelectedReview(null);
  };

  const handleOpenActionDialog = (review) => {
    setSelectedReview(review);
    setSelectedAction('approve');
    setAdminNotes('');
    setActionDialogOpen(true);
  };

  const handleCloseActionDialog = () => {
    setActionDialogOpen(false);
    setSelectedReview(null);
    setSelectedAction('approve');
    setAdminNotes('');
  };

  const handleSubmitAction = async () => {
    if (!selectedReview) return;

    setActionLoading(true);

    try {
      const payload = {
        action: selectedAction,
        adminNotes
      };

      const response = await api.put(`/reviews/admin/flagged/${selectedReview._id}`, payload);

      if (response.data.success) {
        // Remove the processed review from the list
        setReviews(reviews.filter(r => r._id !== selectedReview._id));
        handleCloseActionDialog();
        
        // Show success message
        alert(`Review ${selectedAction}d successfully`);
      }
    } catch (err) {
      console.error('Error processing review:', err);
      alert(err.response?.data?.message || 'Error processing review');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress sx={{ color: '#FF9800' }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundImage: `url(${KinderBackground})`,
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed',
        backgroundColor: '#0f0f1e',
        backgroundBlendMode: 'overlay',
        position: 'relative',
        zIndex: 0
      }}
    >
      {/* Header */}
      <AppBar
        position="static"
        sx={{
          backgroundColor: 'rgba(26, 26, 46, 0.95)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255, 152, 0, 0.3)',
          boxShadow: '0 4px 20px rgba(255, 152, 0, 0.1)'
        }}
      >
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <img src={KinderLogo} alt="KINDER" style={{ height: 40, cursor: 'pointer' }} onClick={() => navigate('/admin')} />
            <Typography sx={{ color: '#FF9800', fontWeight: 700, fontSize: '1.3rem', display: { xs: 'none', sm: 'block' } }}>
              Flagged Reviews
            </Typography>
          </Box>
          <Button
            onClick={() => navigate('/admin')}
            sx={{ color: '#FF9800', textTransform: 'none', fontSize: '1rem' }}
          >
            Back to Admin
          </Button>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ paddingY: 4, position: 'relative', zIndex: 1 }}>
        {/* Header Info */}
        <Box sx={{ marginBottom: 4 }}>
          <Typography sx={{ color: '#FF9800', fontSize: '1.5rem', fontWeight: 700, marginBottom: 1 }}>
            Manage Flagged Reviews
          </Typography>
          <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            Review and take action on reported inappropriate reviews
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ marginBottom: 2 }}>{error}</Alert>}

        {reviews.length === 0 ? (
          <Paper
            sx={{
              backgroundColor: 'rgba(26, 26, 46, 0.8)',
              border: '1px solid rgba(255, 152, 0, 0.2)',
              borderRadius: 2,
              backdropFilter: 'blur(10px)',
              padding: 4,
              textAlign: 'center'
            }}
          >
            <Check sx={{ fontSize: 60, color: 'rgba(76, 175, 80, 0.5)', marginBottom: 2 }} />
            <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '1.1rem' }}>
              No flagged reviews to manage
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={2}>
            {reviews.map(review => (
              <Grid item xs={12} key={review._id}>
                <Card
                  sx={{
                    backgroundColor: 'rgba(255, 152, 0, 0.1)',
                    border: '2px solid rgba(255, 152, 0, 0.4)',
                    borderRadius: 2,
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ color: '#FF9800', fontWeight: 700, fontSize: '1.1rem' }}>
                          Review #{review._id?.slice(-6) || 'Unknown'}
                        </Typography>
                        <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', marginTop: 0.5 }}>
                          From: {review.reviewerId?.name || 'Unknown'} | To: {review.babysitterId?.name || 'Unknown'}
                        </Typography>
                      </Box>
                      <Chip
                        icon={<Warning />}
                        label="Flagged"
                        color="error"
                        variant="outlined"
                      />
                    </Box>

                    {/* Review Content */}
                    <Box sx={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: 2, borderRadius: 1, marginBottom: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, marginBottom: 1 }}>
                        <Rating value={review.rating} readOnly size="small" sx={{ '& .MuiRating-iconFilled': { color: '#FF9800' } }} />
                        <Typography sx={{ color: '#FF9800', fontWeight: 600 }}>{review.rating}.0</Typography>
                      </Box>
                      <Typography sx={{ color: 'rgba(255, 255, 255, 0.85)' }}>
                        "{review.comment}"
                      </Typography>
                    </Box>

                    {/* Flag Reason */}
                    {review.flagReason && (
                      <Box sx={{ backgroundColor: 'rgba(244, 67, 54, 0.1)', padding: 1.5, borderRadius: 1, marginBottom: 2, border: '1px solid rgba(244, 67, 54, 0.3)' }}>
                        <Typography sx={{ fontSize: '0.9rem', color: '#F44336', fontWeight: 600, marginBottom: 0.5 }}>
                          Flag Reason:
                        </Typography>
                        <Typography sx={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.8)' }}>
                          {review.flagReason}
                        </Typography>
                      </Box>
                    )}

                    {/* Sentiment */}
                    {review.sentimentLabel && (
                      <Box sx={{ marginBottom: 2 }}>
                        <Chip
                          label={`Sentiment: ${review.sentimentLabel}`}
                          variant="outlined"
                          size="small"
                          sx={{
                            color: review.sentimentLabel === 'positive' ? '#4CAF50' : review.sentimentLabel === 'negative' ? '#F44336' : '#FF9800',
                            borderColor: review.sentimentLabel === 'positive' ? '#4CAF50' : review.sentimentLabel === 'negative' ? '#F44336' : '#FF9800'
                          }}
                        />
                      </Box>
                    )}

                    {/* Actions */}
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        startIcon={<Visibility />}
                        variant="outlined"
                        onClick={() => handleViewDetails(review)}
                        sx={{
                          color: '#FF9800',
                          borderColor: '#FF9800',
                          '&:hover': { backgroundColor: 'rgba(255, 152, 0, 0.1)' }
                        }}
                      >
                        View Details
                      </Button>
                      <Button
                        startIcon={<Check />}
                        variant="contained"
                        onClick={() => handleOpenActionDialog(review)}
                        sx={{
                          backgroundColor: '#FF9800',
                          color: 'white',
                          '&:hover': { backgroundColor: '#F57C00' }
                        }}
                      >
                        Take Action
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onClose={handleCloseDetailsDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ backgroundColor: '#FF9800', color: 'white', fontWeight: 700 }}>
          Review Details
        </DialogTitle>
        <DialogContent sx={{ backgroundColor: 'rgba(26, 26, 46, 0.8)', marginTop: 2 }}>
          {selectedReview && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography sx={{ color: '#FF9800', fontWeight: 600, marginBottom: 0.5 }}>Reviewer:</Typography>
                <Typography sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>{selectedReview.reviewerId?.name}</Typography>
              </Box>
              <Box>
                <Typography sx={{ color: '#FF9800', fontWeight: 600, marginBottom: 0.5 }}>Babysitter:</Typography>
                <Typography sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>{selectedReview.babysitterId?.name}</Typography>
              </Box>
              <Box>
                <Typography sx={{ color: '#FF9800', fontWeight: 600, marginBottom: 0.5 }}>Rating:</Typography>
                <Rating value={selectedReview.rating} readOnly />
              </Box>
              <Box>
                <Typography sx={{ color: '#FF9800', fontWeight: 600, marginBottom: 0.5 }}>Comment:</Typography>
                <Typography sx={{ color: 'rgba(255, 255, 255, 0.8)', whiteSpace: 'pre-wrap' }}>
                  {selectedReview.comment}
                </Typography>
              </Box>
              <Box>
                <Typography sx={{ color: '#FF9800', fontWeight: 600, marginBottom: 0.5 }}>Flag Reason:</Typography>
                <Typography sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>{selectedReview.flagReason}</Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ padding: 2, borderTop: '1px solid rgba(255, 152, 0, 0.2)' }}>
          <Button onClick={handleCloseDetailsDialog} sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onClose={handleCloseActionDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ backgroundColor: '#FF9800', color: 'white', fontWeight: 700 }}>
          Take Action on Review
        </DialogTitle>
        <DialogContent sx={{ backgroundColor: 'rgba(26, 26, 46, 0.8)', marginTop: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Action</InputLabel>
              <Select
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
                label="Action"
                sx={{
                  color: 'white',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 152, 0, 0.3)'
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#FF9800'
                  }
                }}
              >
                <MenuItem value="approve">Approve (Keep Review)</MenuItem>
                <MenuItem value="remove">Remove Review</MenuItem>
                <MenuItem value="warn_user">Warn User</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              multiline
              rows={4}
              label="Admin Notes (Optional)"
              placeholder="Add notes about this action..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  '& fieldset': { borderColor: 'rgba(255, 152, 0, 0.3)' },
                  '&:hover fieldset': { borderColor: '#FF9800' }
                },
                '& .MuiInputBase-input::placeholder': {
                  color: 'rgba(255, 255, 255, 0.5)',
                  opacity: 1
                }
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ padding: 2, borderTop: '1px solid rgba(255, 152, 0, 0.2)' }}>
          <Button onClick={handleCloseActionDialog} sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmitAction}
            variant="contained"
            disabled={actionLoading}
            sx={{
              backgroundColor: '#FF9800',
              color: 'white',
              '&:hover': { backgroundColor: '#F57C00' }
            }}
          >
            {actionLoading ? <CircularProgress size={24} /> : 'Submit Action'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminFlaggedReviews;
