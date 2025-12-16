import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Box,
  Typography,
  Button,
  Card,
  Grid,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Logout,
  PersonAdd,
  EventAvailable,
  Star,
  School,
  Wallet,
  Verified
} from '@mui/icons-material';
import KinderBackground from '../../assets/KinderBackground.jpg';
import '../Dashboard.css';

const ParentDashboard = () => {
  const [user, setUser] = useState(null);
  const [babysitters, setBabysitters] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('=== 🏠 PARENT DASHBOARD LOADING ===');
    
    // Get user from localStorage
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    
    console.log('📦 Stored user:', storedUser ? 'EXISTS' : 'MISSING');
    console.log('🔑 Stored token:', storedToken ? 'EXISTS' : 'MISSING');
    
    if (storedUser && storedToken) {
      const userData = JSON.parse(storedUser);
      console.log('✅ User authenticated:', userData.name);
      console.log('👤 Role:', userData.role);
      setUser(userData);
      
      // Fetch babysitters
      fetchBabysitters();
    } else {
      console.log('❌ No credentials found. Redirecting to login...');
      navigate('/login');
    }
  }, [navigate]);

  const fetchBabysitters = async () => {
    console.log('📡 Calling babysitters API...');
    
    try {
      const response = await fetch('http://localhost:3001/api/babysitters');
      console.log('🌐 API Status:', response.status);
      
      const data = await response.json();
      console.log('📊 API Data received:', data);
      
      if (data.success) {
        console.log(`✅ Found ${data.count} babysitters`);
        if (data.babysitters && data.babysitters.length > 0) {
          console.log('👶 Babysitter 1 details:', JSON.stringify(data.babysitters[0], null, 2));
          if (data.babysitters.length > 1) {
            console.log('👶 Babysitter 2 details:', JSON.stringify(data.babysitters[1], null, 2));
          }
        }
        setBabysitters(data.babysitters || []);
      } else {
        console.error('❌ API error:', data.message);
      }
    } catch (error) {
      console.error('❌ Network error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Navigate to dedicated booking page
  const handleBookBabysitter = (babysitter) => {
    console.log('📅 Navigating to book babysitter:', babysitter.name);
    navigate(`/book-babysitter/${babysitter.id}`, { state: { babysitter } });
  };

  // Navigate to bookings page
  const handleViewBookings = () => {
    navigate('/parent-bookings');
  };

  // Navigate to profile page
  const handleEditProfile = () => {
    navigate('/parent-profile');
  };

  const handleLogout = () => {
    console.log('👋 Logging out...');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '/'; // Full page reload
  };

  // Show loading while checking auth
  if (!user) {
    return (
      <div className="dashboard-container">
        <div className="loading">
          <h2>Checking authentication...</h2>
          <p>Please wait while we verify your login.</p>
        </div>
      </div>
    );
  }

  return (
    <Box
      className="parent-dashboard-wrapper"
      sx={{
        minHeight: '100vh',
        backgroundImage: `url(${KinderBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat',
        paddingTop: 4,
        paddingBottom: 4
      }}
    >
      <Container maxWidth="lg">
        {/* Loading State */}
        {!user ? (
          <Paper
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: 3,
              padding: 4,
              textAlign: 'center',
              animation: 'slideUp 0.8s ease-out',
              marginTop: 10
            }}
          >
            <CircularProgress />
            <Typography sx={{ marginTop: 2 }}>
              Loading dashboard...
            </Typography>
          </Paper>
        ) : (
          <>
            {/* Header Section */}
            <Paper
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                borderRadius: 3,
                padding: 3,
                marginBottom: 4,
                animation: 'slideUp 0.8s ease-out',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 2
              }}
            >
              <Box>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    color: '#333',
                    marginBottom: 0.5
                  }}
                >
                  Parent Dashboard
                </Typography>
                <Typography
                  sx={{
                    color: 'rgba(51, 51, 51, 0.7)',
                    fontSize: '0.95rem'
                  }}
                >
                  Welcome back, {user.name}!
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<Logout />}
                onClick={handleLogout}
                sx={{
                  backgroundColor: '#ff5252',
                  color: 'white',
                  fontWeight: 600,
                  padding: '10px 25px',
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '0.95rem',
                  '&:hover': {
                    backgroundColor: '#ff0000'
                  }
                }}
              >
                Logout
              </Button>
            </Paper>

            {/* User Info Card */}
            <Paper
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                borderRadius: 3,
                padding: 3,
                marginBottom: 4,
                animation: 'fadeInDown 0.8s ease-out'
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: '#333',
                  marginBottom: 2
                }}
              >
                Your Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ padding: 2, backgroundColor: 'rgba(102, 126, 234, 0.1)', borderRadius: 2 }}>
                    <Typography sx={{ fontSize: '0.85rem', color: 'rgba(51, 51, 51, 0.6)' }}>
                      Email
                    </Typography>
                    <Typography sx={{ fontWeight: 600, color: '#333', marginTop: 0.5 }}>
                      {user.email}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ padding: 2, backgroundColor: 'rgba(102, 126, 234, 0.1)', borderRadius: 2 }}>
                    <Typography sx={{ fontSize: '0.85rem', color: 'rgba(51, 51, 51, 0.6)' }}>
                      Phone
                    </Typography>
                    <Typography sx={{ fontWeight: 600, color: '#333', marginTop: 0.5 }}>
                      {user.phone || 'Not provided'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ padding: 2, backgroundColor: 'rgba(102, 126, 234, 0.1)', borderRadius: 2 }}>
                    <Typography sx={{ fontSize: '0.85rem', color: 'rgba(51, 51, 51, 0.6)' }}>
                      Role
                    </Typography>
                    <Typography sx={{ fontWeight: 600, color: '#333', marginTop: 0.5 }}>
                      Parent
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ padding: 2, backgroundColor: 'rgba(102, 126, 234, 0.1)', borderRadius: 2 }}>
                    <Typography sx={{ fontSize: '0.85rem', color: 'rgba(51, 51, 51, 0.6)' }}>
                      Status
                    </Typography>
                    <Typography sx={{ fontWeight: 600, color: '#4CAF50', marginTop: 0.5 }}>
                      Active
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>

            {/* Stats Cards */}
            <Grid container spacing={3} sx={{ marginBottom: 4 }}>
              {[
                { icon: '👶', label: 'Available Babysitters', value: babysitters.length },
                { icon: '📅', label: 'Your Bookings', value: '0' },
                { icon: '✅', label: 'Completed Jobs', value: '0' },
                { icon: '⭐', label: 'Your Rating', value: '5.0' }
              ].map((stat, idx) => (
                <Grid item xs={12} sm={6} md={3} key={idx}>
                  <Paper
                    sx={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(10px)',
                      border: '2px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: 3,
                      padding: 2.5,
                      textAlign: 'center',
                      animation: `slideUp 0.8s ease-out ${idx * 0.1}s both`,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        backgroundColor: 'rgba(255, 255, 255, 1)',
                        border: '2px solid rgba(255, 255, 255, 0.4)'
                      }
                    }}
                  >
                    <Typography sx={{ fontSize: '2rem', marginBottom: 1 }}>
                      {stat.icon}
                    </Typography>
                    <Typography sx={{ fontSize: '2rem', fontWeight: 700, color: '#333', marginBottom: 0.5 }}>
                      {stat.value}
                    </Typography>
                    <Typography sx={{ fontSize: '0.85rem', color: 'rgba(51, 51, 51, 0.7)' }}>
                      {stat.label}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>

            {/* Action Cards */}
            <Grid container spacing={3} sx={{ marginBottom: 4 }}>
              {[
                { icon: PersonAdd, label: 'Browse Babysitters', desc: 'Find verified students', action: () => {} },
                { icon: EventAvailable, label: 'My Bookings', desc: 'View your bookings', action: handleViewBookings },
                { icon: Star, label: 'Reviews', desc: 'Rate babysitters', action: () => {} }
              ].map((card, idx) => {
                const IconComponent = card.icon;
                return (
                  <Grid item xs={12} sm={6} md={4} key={idx}>
                    <Paper
                      sx={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(10px)',
                        border: '2px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: 3,
                        padding: 3,
                        textAlign: 'center',
                        animation: `fadeInUp 0.8s ease-out ${idx * 0.1}s both`,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-8px)',
                          backgroundColor: 'rgba(255, 255, 255, 1)',
                          border: '2px solid rgba(102, 126, 234, 0.5)'
                        }
                      }}
                    >
                      <IconComponent
                        sx={{
                          fontSize: '2.5rem',
                          color: '#667eea',
                          marginBottom: 1.5
                        }}
                      />
                      <Typography
                        sx={{
                          fontWeight: 600,
                          color: '#333',
                          marginBottom: 0.5,
                          fontSize: '1.1rem'
                        }}
                      >
                        {card.label}
                      </Typography>
                      <Typography
                        sx={{
                          color: 'rgba(51, 51, 51, 0.6)',
                          fontSize: '0.9rem',
                          marginBottom: 2
                        }}
                      >
                        {card.desc}
                      </Typography>
                      <Button
                        variant="contained"
                        sx={{
                          backgroundColor: '#667eea',
                          color: 'white',
                          fontWeight: 600,
                          textTransform: 'none',
                          '&:hover': {
                            backgroundColor: '#764ba2'
                          }
                        }}
                        onClick={card.action}
                      >
                        View
                      </Button>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>

            {/* Babysitters Section */}
            {loading ? (
              <Paper
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 3,
                  padding: 4,
                  textAlign: 'center',
                  animation: 'slideUp 0.8s ease-out'
                }}
              >
                <CircularProgress />
                <Typography sx={{ marginTop: 2, color: '#333' }}>
                  Loading babysitters...
                </Typography>
              </Paper>
            ) : babysitters.length > 0 ? (
              <Paper
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: 3,
                  padding: 3,
                  animation: 'fadeInUp 0.8s ease-out'
                }}
              >
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    color: '#333',
                    marginBottom: 3
                  }}
                >
                  Available Babysitters ({babysitters.length})
                </Typography>
                <Grid container spacing={3}>
                  {babysitters.map((bs, idx) => (
                    <Grid item xs={12} sm={6} md={4} key={bs.id}>
                      <Card
                        sx={{
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          borderRadius: 2,
                          padding: 2,
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                          transition: 'all 0.3s ease',
                          animation: `slideUp 0.8s ease-out ${idx * 0.05}s both`,
                          '&:hover': {
                            transform: 'translateY(-8px)',
                            boxShadow: '0 15px 40px rgba(102, 126, 234, 0.2)',
                            backgroundColor: '#fff'
                          }
                        }}
                      >
                        <Box sx={{ textAlign: 'center', marginBottom: 2 }}>
                          <Box
                            sx={{
                              width: 60,
                              height: 60,
                              margin: '0 auto 12px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontWeight: 'bold',
                              fontSize: '1.5rem'
                            }}
                          >
                            {(bs.name || 'B').charAt(0).toUpperCase()}
                          </Box>
                          <Typography
                            sx={{
                              fontWeight: 600,
                              color: '#333',
                              fontSize: '1.1rem'
                            }}
                          >
                            {bs.name}
                          </Typography>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 0.5,
                              marginTop: 0.5,
                              color: '#4CAF50'
                            }}
                          >
                            <Verified fontSize="small" />
                            <Typography sx={{ fontSize: '0.85rem' }}>
                              Verified
                            </Typography>
                          </Box>
                        </Box>

                        <Box sx={{ marginBottom: 2 }}>
                          <Box sx={{ marginBottom: 1.5, padding: 1.5, backgroundColor: 'rgba(102, 126, 234, 0.1)', borderRadius: 1 }}>
                            <Typography sx={{ fontSize: '0.8rem', color: 'rgba(51, 51, 51, 0.6)' }}>
                              University
                            </Typography>
                            <Typography sx={{ fontWeight: 600, color: '#333', marginTop: 0.3 }}>
                              {bs.university}
                            </Typography>
                            <Typography sx={{ fontSize: '0.8rem', color: 'rgba(51, 51, 51, 0.6)', marginTop: 0.3 }}>
                              Year {bs.year} • {bs.department}
                            </Typography>
                          </Box>

                          <Box sx={{ marginBottom: 1.5, padding: 1.5, backgroundColor: 'rgba(102, 126, 234, 0.1)', borderRadius: 1 }}>
                            <Typography sx={{ fontSize: '0.8rem', color: 'rgba(51, 51, 51, 0.6)' }}>
                              Hourly Rate
                            </Typography>
                            <Typography sx={{ fontWeight: 600, color: '#4CAF50', marginTop: 0.3, fontSize: '1.1rem' }}>
                              {bs.hourlyRate} BDT/hr
                            </Typography>
                          </Box>

                          <Box sx={{ padding: 1.5, backgroundColor: 'rgba(102, 126, 234, 0.1)', borderRadius: 1 }}>
                            <Typography sx={{ fontSize: '0.8rem', color: 'rgba(51, 51, 51, 0.6)' }}>
                              Rating
                            </Typography>
                            <Typography sx={{ fontWeight: 600, color: '#FF9800', marginTop: 0.3 }}>
                              {bs.rating || '5.0'} ⭐
                            </Typography>
                          </Box>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            fullWidth
                            variant="contained"
                            sx={{
                              backgroundColor: '#667eea',
                              color: 'white',
                              fontWeight: 600,
                              textTransform: 'none',
                              '&:hover': {
                                backgroundColor: '#764ba2'
                              }
                            }}
                            onClick={() => handleBookBabysitter(bs)}
                          >
                            Book Now
                          </Button>
                          <Button
                            fullWidth
                            variant="outlined"
                            sx={{
                              color: '#667eea',
                              borderColor: '#667eea',
                              fontWeight: 600,
                              textTransform: 'none',
                              '&:hover': {
                                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                                borderColor: '#764ba2'
                              }
                            }}
                          >
                            Profile
                          </Button>
                        </Box>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            ) : (
              <Paper
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 3,
                  padding: 4,
                  textAlign: 'center',
                  animation: 'slideUp 0.8s ease-out'
                }}
              >
                <Typography sx={{ fontSize: '3rem', marginBottom: 1 }}>
                  👶
                </Typography>
                <Typography sx={{ fontWeight: 600, color: '#333', marginBottom: 1 }}>
                  No Babysitters Available
                </Typography>
                <Typography sx={{ color: 'rgba(51, 51, 51, 0.6)', marginBottom: 2 }}>
                  Check back later or try refreshing the page.
                </Typography>
                <Button
                  variant="contained"
                  sx={{
                    backgroundColor: '#667eea',
                    color: 'white',
                    fontWeight: 600,
                    textTransform: 'none',
                    '&:hover': {
                      backgroundColor: '#764ba2'
                    }
                  }}
                  onClick={fetchBabysitters}
                >
                  Refresh List
                </Button>
              </Paper>
            )}
          </>
        )}
      </Container>
    </Box>
  );
};

export default ParentDashboard;