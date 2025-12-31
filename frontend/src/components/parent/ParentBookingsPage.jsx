import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton
} from '@mui/material';
import {
  ArrowBack,
  CalendarMonth,
  Visibility,
  Cancel,
  CheckCircle,
  AccessTime,
  Person,
  AttachMoney,
  CreditCard,
  CheckCircleOutline
} from '@mui/icons-material';
import KinderLogo from '../../assets/KinderLogo.png';
import KinderBackground from '../../assets/KinderBackground.jpg';
import ReportSubmission from '../ReportSubmission';
import NotificationBell from '../NotificationBell';
import AccountStatusNotification from '../AccountStatusNotification';

const ParentBookingsPage = () => {
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const navigate = useNavigate();

  // Theme color for parents - Sky Blue
  const themeColor = '#03A9F4';
  const themeColorDark = '#0288D1';

  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    const storedToken = sessionStorage.getItem('token');
    
    if (storedUser && storedToken) {
      const userData = JSON.parse(storedUser);
      
      // Immediately refresh user status to get latest data
      refreshUserStatus().then(() => {
        // Check if user is banned after refreshing
        const updatedUser = JSON.parse(sessionStorage.getItem('user'));
        if (updatedUser?.accountStatus !== 'banned') {
          // Only fetch bookings if not banned
          fetchBookings();
        }
      });
      
      // Then refresh every 5 seconds
      const statusInterval = setInterval(() => {
        refreshUserStatus();
      }, 5000);
      
      return () => clearInterval(statusInterval);
    } else {
      navigate('/login');
    }
  }, [navigate]);

  // Watch for user changes and log them
  useEffect(() => {
    if (user?.accountStatus) {
      console.log('👤 User state updated:', {
        name: user.name,
        accountStatus: user.accountStatus,
        accountStatusReason: user.accountStatusReason
      });
    }
  }, [user?.accountStatus, user?.accountStatusReason]);

  const refreshUserStatus = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      console.log('🔄 API Response from /api/auth/me:', data);
      
      // Handle both success and banned user cases
      if (data.user) {
        console.log('✅ Updating user with status:', data.user.accountStatus);
        // Update user in state with complete user object
        setUser(data.user);
        
        // Also update sessionStorage
        const storedUser = JSON.parse(sessionStorage.getItem('user'));
        const updatedUser = {
          ...storedUser,
          ...data.user
        };
        sessionStorage.setItem('user', JSON.stringify(updatedUser));
      } else if (data.accountStatus === 'banned') {
        // User is banned - show restricted message
        console.log('🚫 User is banned');
        setUser({
          ...JSON.parse(sessionStorage.getItem('user')),
          accountStatus: 'banned',
          accountStatusReason: data.reason || 'Your account has been banned'
        });
      }
    } catch (error) {
      console.error('❌ Error refreshing user status:', error);
    }
  };

  const fetchBookings = async () => {
    try {
      const token = sessionStorage.getItem('token');
      // Use the main bookings endpoint which uses req.user from token
      const response = await fetch(`http://localhost:3000/api/bookings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      console.log('📋 Bookings response:', data);
      
      if (data.success) {
        setBookings(data.bookings || []);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;

    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'cancelled' })
      });
      const data = await response.json();
      
      if (data.success) {
        alert('Booking cancelled successfully');
        fetchBookings();
      } else {
        alert(data.message || 'Failed to cancel booking');
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('Error cancelling booking');
    }
  };

  const handleCompleteBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to mark this booking as completed?')) return;

    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'completed' })
      });
      const data = await response.json();
      
      if (data.success) {
        alert('Booking marked as completed');
        fetchBookings();
      } else {
        alert(data.message || 'Failed to mark booking as completed');
      }
    } catch (error) {
      console.error('Error marking booking as completed:', error);
      alert('Error marking booking as completed');
    }
  };

  const handleMakePayment = async () => {
    if (!selectedBooking) return;
    if (!window.confirm('Confirm payment of ৳' + selectedBooking.totalAmount + '?')) return;

    setPaymentLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bookingId: selectedBooking._id,
          paymentMethod: 'cash'
        })
      });
      const data = await response.json();
      
      if (data.success) {
        alert('Payment completed successfully!');
        setOpenPaymentDialog(false);
        fetchBookings();
      } else {
        alert(data.message || 'Failed to process payment');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Error processing payment');
    } finally {
      setPaymentLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#FFA726',
      confirmed: '#03A9F4',
      completed: '#4CAF50',
      cancelled: '#9E9E9E',
      rejected: '#f44336'
    };
    return colors[status] || '#9E9E9E';
  };

  const getPaymentStatusColor = (paymentStatus) => {
    const colors = {
      pending: '#FF9800',
      paid: '#4CAF50',
      refunded: '#9E9E9E'
    };
    return colors[paymentStatus] || '#9E9E9E';
  };

  // Glass style
  const glassStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: 3
  };

  if (!user) {
    return (
      <Box sx={{
        minHeight: '100vh',
        backgroundImage: `url(${KinderBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <CircularProgress sx={{ color: themeColor }} />
      </Box>
    );
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      backgroundImage: `url(${KinderBackground})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      paddingTop: 4,
      paddingBottom: 4
    }}>
      <Container maxWidth="lg">
        <Paper sx={{ ...glassStyle, padding: 3 }}>
          
          {/* Header */}
          <Box sx={{
            backgroundColor: 'rgba(0, 0, 0, 0.35)',
            borderRadius: 2,
            padding: 2.5,
            marginBottom: 3,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                component="img"
                src={KinderLogo}
                alt="Kinder Logo"
                sx={{ height: 45, width: 'auto' }}
              />
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'white' }}>
                  My Bookings
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>
                    Manage your babysitting bookings
                  </Typography>
                  {user?.accountStatus && (
                    <Chip 
                      key={user.accountStatus}
                      label={user.accountStatus.charAt(0).toUpperCase() + user.accountStatus.slice(1)} 
                      sx={{ 
                        backgroundColor: user.accountStatus === 'banned' ? '#f44336' : user.accountStatus === 'warned' ? '#FFA726' : '#4CAF50',
                        color: 'white',
                        fontWeight: 600,
                        height: 26,
                        fontSize: '0.8rem'
                      }}
                    />
                  )}
                </Box>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <NotificationBell themeColor={themeColor} />
              <Button
                variant="contained"
                startIcon={<ArrowBack />}
                onClick={() => navigate('/parent-dashboard')}
                sx={{
                  backgroundColor: '#424242',
                  color: 'white',
                  fontWeight: 600,
                  textTransform: 'none',
                  '&:hover': { backgroundColor: '#303030' }
                }}
              >
                Back to Dashboard
              </Button>
            </Box>
          </Box>

          {/* Stats Summary */}
          <Box sx={{ 
            display: 'flex', 
            gap: 2, 
            marginBottom: 3,
            flexWrap: 'wrap'
          }}>
            {[
              { label: 'Total Bookings', value: bookings.length, color: themeColor },
              { label: 'Pending', value: bookings.filter(b => b.status === 'pending').length, color: '#FFA726' },
              { label: 'Confirmed', value: bookings.filter(b => b.status === 'confirmed').length, color: '#2196F3' },
              { label: 'Completed', value: bookings.filter(b => b.status === 'completed').length, color: '#4CAF50' }
            ].map((stat, idx) => (
              <Box key={idx} sx={{
                backgroundColor: 'rgba(0,0,0,0.4)',
                borderRadius: 2,
                padding: 2,
                minWidth: 120,
                textAlign: 'center',
                border: `1px solid ${stat.color}40`
              }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: stat.color }}>
                  {stat.value}
                </Typography>
                <Typography sx={{ color: 'white', fontSize: '0.85rem' }}>
                  {stat.label}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Bookings Table */}
          {user?.accountStatus === 'banned' ? (
            <Box sx={{ 
              backgroundColor: '#f8d7da', 
              border: '1px solid #f5c6cb',
              borderRadius: 2, 
              padding: 3,
              textAlign: 'center'
            }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#721c24', marginBottom: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                🚫 Access Restricted
              </Typography>
              <Typography sx={{ color: '#721c24' }}>
                Your account has been banned. You cannot view or manage bookings at this time.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ 
              backgroundColor: 'rgba(0, 0, 0, 0.3)', 
              borderRadius: 2, 
              padding: 2.5,
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
            {loading ? (
              <Box sx={{ textAlign: 'center', padding: 4 }}>
                <CircularProgress sx={{ color: themeColor }} />
                <Typography sx={{ marginTop: 2, color: 'white' }}>
                  Loading bookings...
                </Typography>
              </Box>
            ) : bookings.length > 0 ? (
              <TableContainer sx={{ 
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                borderRadius: 2,
                border: '1px solid rgba(255, 255, 255, 0.15)'
              }}>
                <Table sx={{ backgroundColor: 'transparent' }}>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: themeColor }}>
                      <TableCell sx={{ fontWeight: 700, color: 'white', borderBottom: 'none', py: 1.5 }}>Booking ID</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: 'white', borderBottom: 'none', py: 1.5 }}>Babysitter</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: 'white', borderBottom: 'none', py: 1.5 }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: 'white', borderBottom: 'none', py: 1.5 }}>Time</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: 'white', borderBottom: 'none', py: 1.5 }}>Amount</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: 'white', borderBottom: 'none', py: 1.5 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: 'white', borderBottom: 'none', py: 1.5 }}>Payment</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: 'white', borderBottom: 'none', py: 1.5 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody sx={{ backgroundColor: 'transparent' }}>
                    {bookings.map((booking) => (
                      <TableRow
                        key={booking._id}
                        sx={{
                          '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' },
                          backgroundColor: 'transparent'
                        }}
                      >
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'white', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          #{booking._id?.slice(-6) || 'N/A'}
                        </TableCell>
                        <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{
                              width: 35,
                              height: 35,
                              backgroundColor: '#FFEB3B',
                              color: '#333',
                              fontSize: '0.9rem',
                              fontWeight: 700
                            }}>
                              {(booking.babysitterId?.userId?.name || 'B').charAt(0).toUpperCase()}
                            </Avatar>
                            <Typography sx={{ color: 'white', fontWeight: 600 }}>
                              {booking.babysitterId?.userId?.name || 'N/A'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.9rem', color: 'white', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          {booking.date ? new Date(booking.date).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.9rem', color: 'white', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          {booking.startTime || ''} - {booking.endTime || ''}
                        </TableCell>
                        <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          <Typography sx={{ fontWeight: 700, color: '#4CAF50', fontSize: '0.95rem' }}>
                            ৳{booking.totalAmount || 0}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          <Chip
                            label={booking.status || 'unknown'}
                            size="small"
                            sx={{
                              backgroundColor: getStatusColor(booking.status),
                              color: 'white',
                              fontWeight: 600
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {booking.paymentStatus === 'paid' ? (
                              <>
                                <CheckCircleOutline sx={{ color: '#4CAF50', fontSize: 20 }} />
                                <Chip
                                  label="Paid"
                                  size="small"
                                  sx={{
                                    backgroundColor: getPaymentStatusColor(booking.paymentStatus),
                                    color: 'white',
                                    fontWeight: 600
                                  }}
                                />
                              </>
                            ) : (
                              <>
                                <CreditCard sx={{ color: '#FF9800', fontSize: 20 }} />
                                <Chip
                                  label="Due"
                                  size="small"
                                  sx={{
                                    backgroundColor: getPaymentStatusColor(booking.paymentStatus),
                                    color: 'white',
                                    fontWeight: 600
                                  }}
                                />
                              </>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          <IconButton
                            size="small"
                            onClick={() => { setSelectedBooking(booking); setOpenDetailsDialog(true); }}
                            title="View Details"
                          >
                            <Visibility sx={{ color: '#00E5FF', fontSize: 22 }} />
                          </IconButton>
                          {booking.status === 'pending' && (
                            <IconButton
                              size="small"
                              onClick={() => handleCancelBooking(booking._id)}
                              title="Cancel Booking"
                            >
                              <Cancel sx={{ color: '#FF5252', fontSize: 22 }} />
                            </IconButton>
                          )}
                          {booking.status === 'confirmed' && (
                            <IconButton
                              size="small"
                              onClick={() => handleCompleteBooking(booking._id)}
                              title="Mark as Completed"
                            >
                              <CheckCircle sx={{ color: '#4CAF50', fontSize: 22 }} />
                            </IconButton>
                          )}
                          {booking.status === 'completed' && booking.paymentStatus !== 'paid' && (
                            <IconButton
                              size="small"
                              onClick={() => { setSelectedBooking(booking); setOpenPaymentDialog(true); }}
                              title="Make Payment"
                            >
                              <CreditCard sx={{ color: '#FF9800', fontSize: 22 }} />
                            </IconButton>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ textAlign: 'center', padding: 4 }}>
                <CalendarMonth sx={{ fontSize: 60, color: themeColor, marginBottom: 1 }} />
                <Typography sx={{ fontWeight: 700, color: 'white', marginBottom: 1, fontSize: '1.2rem' }}>
                  No Bookings Yet
                </Typography>
                <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: 2 }}>
                  You haven't made any bookings yet.
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => navigate('/parent-dashboard')}
                  sx={{ backgroundColor: themeColor, '&:hover': { backgroundColor: themeColorDark } }}
                >
                  Browse Babysitters
                </Button>
              </Box>
            )}
            </Box>
          )}

        </Paper>

        {/* Booking Details Dialog */}
        <Dialog 
          open={openDetailsDialog} 
          onClose={() => setOpenDetailsDialog(false)} 
          maxWidth="sm" 
          fullWidth
          PaperProps={{ sx: { borderRadius: 2 } }}
        >
          <DialogTitle sx={{ backgroundColor: themeColor, color: 'white', fontWeight: 700 }}>
            Booking Details
          </DialogTitle>
          <DialogContent sx={{ paddingTop: 3 }}>
            {selectedBooking && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ textAlign: 'center', marginBottom: 2 }}>
                  <Chip
                    label={selectedBooking.status}
                    sx={{
                      backgroundColor: getStatusColor(selectedBooking.status),
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      padding: '5px 10px'
                    }}
                  />
                </Box>

                <Typography><strong>Booking ID:</strong> #{selectedBooking._id?.slice(-6)}</Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Person sx={{ color: '#FFEB3B' }} />
                  <Typography><strong>Babysitter:</strong> {selectedBooking.babysitterId?.userId?.name || 'N/A'}</Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarMonth sx={{ color: themeColor }} />
                  <Typography><strong>Date:</strong> {selectedBooking.date ? new Date(selectedBooking.date).toLocaleDateString() : 'N/A'}</Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AccessTime sx={{ color: '#FF9800' }} />
                  <Typography><strong>Time:</strong> {selectedBooking.startTime} - {selectedBooking.endTime}</Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AttachMoney sx={{ color: '#4CAF50' }} />
                  <Typography><strong>Total Amount:</strong> ৳{selectedBooking.totalAmount || 0}</Typography>
                </Box>

                {selectedBooking.notes && (
                  <Box>
                    <Typography><strong>Notes:</strong></Typography>
                    <Typography sx={{ color: '#666', marginTop: 0.5 }}>{selectedBooking.notes}</Typography>
                  </Box>
                )}

                <Typography sx={{ color: '#999', fontSize: '0.85rem', marginTop: 1 }}>
                  Booked on: {selectedBooking.createdAt ? new Date(selectedBooking.createdAt).toLocaleString() : 'N/A'}
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ padding: 2 }}>
            <Button onClick={() => setOpenDetailsDialog(false)} sx={{ color: themeColor }}>
              Close
            </Button>
            {selectedBooking && selectedBooking.status === 'completed' && selectedBooking.paymentStatus === 'paid' && (
              <Button 
                variant="contained" 
                sx={{ backgroundColor: '#FF6B6B', '&:hover': { backgroundColor: '#e55555' } }}
                onClick={() => { setOpenDetailsDialog(false); setShowReportModal(true); }}
              >
                📋 Report Issue
              </Button>
            )}
            {selectedBooking && selectedBooking.status === 'pending' && (
              <Button 
                variant="contained" 
                color="error"
                onClick={() => { setOpenDetailsDialog(false); handleCancelBooking(selectedBooking._id); }}
              >
                Cancel Booking
              </Button>
            )}
            {selectedBooking && selectedBooking.status === 'confirmed' && (
              <Button 
                variant="contained" 
                sx={{ backgroundColor: '#4CAF50', '&:hover': { backgroundColor: '#45a049' } }}
                onClick={() => { setOpenDetailsDialog(false); handleCompleteBooking(selectedBooking._id); }}
              >
                Mark as Completed
              </Button>
            )}
          </DialogActions>
        </Dialog>

        {/* Payment Modal */}
        <Dialog 
          open={openPaymentDialog} 
          onClose={() => setOpenPaymentDialog(false)} 
          maxWidth="sm" 
          fullWidth
          PaperProps={{ sx: { borderRadius: 2 } }}
        >
          <DialogTitle sx={{ backgroundColor: '#FF9800', color: 'white', fontWeight: 700 }}>
            Make Payment
          </DialogTitle>
          <DialogContent sx={{ paddingTop: 3 }}>
            {selectedBooking && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box sx={{ 
                  backgroundColor: 'rgba(255, 152, 0, 0.1)',
                  borderLeft: '4px solid #FF9800',
                  padding: 2,
                  borderRadius: 1
                }}>
                  <Typography sx={{ color: '#666', fontSize: '0.9rem', marginBottom: 1 }}>
                    Booking #{selectedBooking._id?.slice(-6)}
                  </Typography>
                  <Typography sx={{ fontWeight: 600, color: '#333' }}>
                    {selectedBooking.babysitterId?.userId?.name || 'Babysitter'} - {new Date(selectedBooking.date).toLocaleDateString()}
                  </Typography>
                </Box>

                <Box sx={{ 
                  backgroundColor: '#f5f5f5',
                  padding: 2,
                  borderRadius: 2,
                  border: '1px solid #e0e0e0'
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2, paddingBottom: 2, borderBottom: '1px solid #ddd' }}>
                    <Typography sx={{ color: '#666' }}>Total Amount:</Typography>
                    <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#333' }}>
                      ৳{selectedBooking.totalAmount || 0}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', marginBottom: 1.5 }}>
                    <Typography sx={{ color: '#666', fontSize: '0.9rem' }}>Platform Fee (20%):</Typography>
                    <Typography sx={{ fontWeight: 600, color: '#FF9800' }}>
                      ৳{Math.round((selectedBooking.totalAmount || 0) * 0.2)}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ color: '#666', fontSize: '0.9rem' }}>Babysitter Receives (80%):</Typography>
                    <Typography sx={{ fontWeight: 600, color: '#4CAF50' }}>
                      ৳{Math.round((selectedBooking.totalAmount || 0) * 0.8)}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ 
                  backgroundColor: '#e3f2fd',
                  padding: 2,
                  borderRadius: 1,
                  border: '1px solid #90caf9'
                }}>
                  <Typography sx={{ fontSize: '0.85rem', color: '#1976d2' }}>
                    <strong>💳 Payment Method:</strong> Cash
                  </Typography>
                  <Typography sx={{ fontSize: '0.85rem', color: '#1976d2', marginTop: 0.5 }}>
                    The payment will be marked as completed after confirmation.
                  </Typography>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ padding: 2, gap: 1 }}>
            <Button 
              onClick={() => setOpenPaymentDialog(false)} 
              sx={{ color: '#666' }}
            >
              Cancel
            </Button>
            <Button 
              variant="contained" 
              sx={{ backgroundColor: '#FF9800', '&:hover': { backgroundColor: '#f57c00' } }}
              onClick={handleMakePayment}
              disabled={paymentLoading}
            >
              {paymentLoading ? 'Processing...' : 'Confirm Payment'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Report Submission Modal */}
        {showReportModal && selectedBooking && (
          <ReportSubmission
            bookingId={selectedBooking._id}
            booking={selectedBooking}
            userRole="parent"
            onClose={() => setShowReportModal(false)}
            onSuccess={(report) => {
              setShowReportModal(false);
              fetchBookings(); // Refresh bookings
              alert('Report submitted successfully!');
            }}
          />
        )}

      </Container>
    </Box>
  );
};

export default ParentBookingsPage;
