import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Box,
  Typography,
  Link,
  CircularProgress,
  Alert,
  Card,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import { useAuthContext } from '../context/AuthContext';
import API from '../services/api';
import './LoginPage.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuthUser } = useAuthContext();

  // Show message from location state (e.g., after account deletion)
  const locationMessage = location.state?.message;

  useEffect(() => {
    // Check if user is already logged in
    const token = sessionStorage.getItem('token');
    const user = sessionStorage.getItem('user');
    
    if (token && user) {
      try {
        const userData = JSON.parse(user);
        
        // Route to appropriate dashboard
        if (userData.role === 'admin') {
          navigate('/admin/dashboard');
        } else if (userData.role === 'babysitter') {
          navigate('/babysitter/dashboard');
        } else if (userData.role === 'parent') {
          navigate('/parent/dashboard');
        }
      } catch (err) {
        console.error('Error parsing stored user data:', err);
      }
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Please enter both email and password');
      setLoading(false);
      return;
    }

    try {
      console.log('🔐 Attempting login for:', email);

      // Determine which endpoint to use
      let endpoint = '/auth/login';
      let loginData = { email, password };

      // Check if email looks like admin email (you can customize this logic)
      // For now, we'll try regular login first, then admin if needed
      
      const response = await API.post(endpoint, loginData);
      
      console.log('✅ Login response received:', response.data);

      if (response.data.success) {
        // ✅ NORMAL LOGIN SUCCESS
        const token = response.data.token;
        const user = response.data.user;

        // Save to localStorage
        sessionStorage.setItem('token', token);
        sessionStorage.setItem('user', JSON.stringify(user));

        // Update auth context
        setAuthUser(user);

        console.log(`✅ Login successful for ${user.role}: ${user.email}`);

        // Route based on role
        if (user.role === 'admin') {
          navigate('/admin/dashboard');
        } else if (user.role === 'babysitter') {
          navigate('/babysitter/dashboard');
        } else if (user.role === 'parent') {
          navigate('/parent/dashboard');
        } else {
          navigate('/');
        }
      } else if (response.data.message === 'rejected') {
        // ✅ USER IS REJECTED - Show RejectionPage
        console.log('🚫 User account is rejected');
        
        const rejectedUserData = response.data.data;
        
        // Navigate to rejection page with user data
        navigate('/rejection', {
          state: {
            userData: rejectedUserData
          }
        });
      }
    } catch (err) {
      console.error('❌ Login error:', err);

      if (err.response?.status === 401) {
        setError('Invalid email or password');
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.message === 'Network Error') {
        setError('Cannot connect to server. Please check your internet connection.');
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle admin login
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Please enter both email and password');
      setLoading(false);
      return;
    }

    try {
      console.log('🔐 Attempting admin login for:', email);

      const response = await API.post('/admin/login', { email, password });
      
      console.log('✅ Admin login response received:', response.data);

      if (response.data.success) {
        const token = response.data.token;
        const user = response.data.user;

        // Save to localStorage
        sessionStorage.setItem('token', token);
        sessionStorage.setItem('user', JSON.stringify(user));

        // Update auth context
        setAuthUser(user);

        console.log(`✅ Admin login successful: ${user.email}`);

        // Navigate to admin dashboard
        navigate('/admin/dashboard');
      }
    } catch (err) {
      console.error('❌ Admin login error:', err);

      if (err.response?.status === 401) {
        setError('Invalid admin credentials');
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.message === 'Network Error') {
        setError('Cannot connect to server. Please check your internet connection.');
      } else {
        setError('Admin login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2
      }}
    >
      <Container maxWidth="sm">
        <Box sx={{ animation: 'fadeInUp 0.8s ease-out' }}>
          {/* Logo/Header */}
          <Box sx={{ textAlign: 'center', marginBottom: 4 }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                color: 'white',
                marginBottom: 1,
                textShadow: '0 2px 10px rgba(0,0,0,0.3)'
              }}
            >
              KINDER
            </Typography>
            <Typography
              sx={{
                color: 'rgba(255,255,255,0.9)',
                fontSize: '1rem',
                fontWeight: 300
              }}
            >
              Trusted Babysitting Platform
            </Typography>
          </Box>

          {/* Location Message Alert */}
          {locationMessage && (
            <Alert severity="info" sx={{ marginBottom: 3, borderRadius: 2 }}>
              {locationMessage}
            </Alert>
          )}

          {/* Login Card */}
          <Paper
            sx={{
              padding: 4,
              borderRadius: 3,
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              backdropFilter: 'blur(10px)'
            }}
          >
            {/* User Login Tab */}
            <Box>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  marginBottom: 1,
                  color: '#1a1a2e'
                }}
              >
                User Login
              </Typography>
              <Typography
                sx={{
                  color: 'rgba(0,0,0,0.6)',
                  marginBottom: 3,
                  fontSize: '0.9rem'
                }}
              >
                Login as Parent or Babysitter
              </Typography>

              {error && (
                <Alert severity="error" sx={{ marginBottom: 2, borderRadius: 1 }}>
                  {error}
                </Alert>
              )}

              <form onSubmit={handleLogin}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    label="Email Address"
                    type="email"
                    fullWidth
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    variant="outlined"
                    disabled={loading}
                    required
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': {
                          borderColor: '#667eea'
                        }
                      }
                    }}
                  />

                  <TextField
                    label="Password"
                    type="password"
                    fullWidth
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••"
                    variant="outlined"
                    disabled={loading}
                    required
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': {
                          borderColor: '#667eea'
                        }
                      }
                    }}
                  />

                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        disabled={loading}
                      />
                    }
                    label="Remember me"
                  />

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={loading}
                    sx={{
                      backgroundColor: '#667eea',
                      color: 'white',
                      fontWeight: 600,
                      padding: '12px',
                      marginTop: 1,
                      transition: 'all 0.3s',
                      '&:hover': {
                        backgroundColor: '#764ba2',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 10px 20px rgba(102, 126, 234, 0.3)'
                      },
                      '&:disabled': {
                        backgroundColor: '#ccc'
                      }
                    }}
                  >
                    {loading ? (
                      <>
                        <CircularProgress size={20} sx={{ marginRight: 1, color: 'white' }} />
                        Logging in...
                      </>
                    ) : (
                      'Login'
                    )}
                  </Button>
                </Box>
              </form>

              <Box sx={{ marginTop: 2, textAlign: 'center' }}>
                <Typography sx={{ fontSize: '0.9rem', color: '#666' }}>
                  Don't have an account?{' '}
                  <Link
                    href="/register"
                    sx={{
                      color: '#667eea',
                      fontWeight: 600,
                      textDecoration: 'none',
                      cursor: 'pointer',
                      '&:hover': { textDecoration: 'underline' }
                    }}
                  >
                    Register here
                  </Link>
                </Typography>
              </Box>

              <Box sx={{ marginTop: 1, textAlign: 'center' }}>
                <Typography sx={{ fontSize: '0.85rem', color: '#666' }}>
                  <Link
                    href="/forgot-password"
                    sx={{
                      color: '#764ba2',
                      fontWeight: 500,
                      textDecoration: 'none',
                      cursor: 'pointer',
                      '&:hover': { textDecoration: 'underline' }
                    }}
                  >
                    Forgot password?
                  </Link>
                </Typography>
              </Box>
            </Box>

            {/* Divider */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                margin: '30px 0',
                gap: 2
              }}
            >
              <Box sx={{ flex: 1, height: 1, backgroundColor: '#ddd' }} />
              <Typography sx={{ color: '#999', fontSize: '0.9rem' }}>OR</Typography>
              <Box sx={{ flex: 1, height: 1, backgroundColor: '#ddd' }} />
            </Box>

            {/* Admin Login Tab */}
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  marginBottom: 1,
                  color: '#1a1a2e'
                }}
              >
                Admin Login
              </Typography>
              <Typography
                sx={{
                  color: 'rgba(0,0,0,0.6)',
                  marginBottom: 2,
                  fontSize: '0.85rem'
                }}
              >
                Admin access only
              </Typography>

              <form onSubmit={handleAdminLogin}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    label="Admin Email"
                    type="email"
                    fullWidth
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@example.com"
                    variant="outlined"
                    disabled={loading}
                    size="small"
                    required
                  />

                  <TextField
                    label="Admin Password"
                    type="password"
                    fullWidth
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••"
                    variant="outlined"
                    disabled={loading}
                    size="small"
                    required
                  />

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={loading}
                    sx={{
                      backgroundColor: '#4CAF50',
                      color: 'white',
                      fontWeight: 600,
                      padding: '10px',
                      transition: 'all 0.3s',
                      '&:hover': {
                        backgroundColor: '#388E3C',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 10px 20px rgba(76, 175, 80, 0.3)'
                      },
                      '&:disabled': {
                        backgroundColor: '#ccc'
                      }
                    }}
                  >
                    {loading ? (
                      <>
                        <CircularProgress size={18} sx={{ marginRight: 1, color: 'white' }} />
                        Logging in...
                      </>
                    ) : (
                      'Admin Login'
                    )}
                  </Button>
                </Box>
              </form>
            </Box>
          </Paper>

          {/* Footer */}
          <Box sx={{ marginTop: 3, textAlign: 'center' }}>
            <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>
              © 2024 KINDER. All rights reserved.
            </Typography>
          </Box>
        </Box>
      </Container>

      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </Box>
  );
};

export default LoginPage;