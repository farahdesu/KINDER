import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider
} from '@mui/material';
import {
  Lock,
  Info,
  Visibility,
  VisibilityOff,
  ArrowBack
} from '@mui/icons-material';
import KinderLogo from '../assets/KinderLogo.png';
import './LoginPage.css';

const ResetPasswordPage = () => {
  const { token } = useParams();
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [openTerms, setOpenTerms] = useState(false);
  const [openPrivacy, setOpenPrivacy] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link. Please request a new password reset.');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          newPassword: formData.newPassword,
          confirmPassword: formData.confirmPassword
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setFormData({ newPassword: '', confirmPassword: '' });
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(data.message || 'Failed to reset password. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleTermsOpen = () => {
    setOpenTerms(true);
  };

  const handleTermsClose = () => {
    setOpenTerms(false);
  };

  const handlePrivacyOpen = () => {
    setOpenPrivacy(true);
  };

  const handlePrivacyClose = () => {
    setOpenPrivacy(false);
  };

  return (
    <Box 
      className="login-page-wrapper"
      sx={{
        minHeight: '100vh',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2,
        position: 'relative'
      }}
    >
      {/* Info Button - Top Left */}
      <Box sx={{ position: 'absolute', top: 20, left: 20 }}>
        <IconButton
          onClick={handleMenuOpen}
          sx={{
            backgroundColor: 'rgba(255, 255, 255, 0.3)',
            backdropFilter: 'blur(10px)',
            color: 'white',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.5)'
            }
          }}
        >
          <Info />
        </IconButton>
      </Box>

      {/* Back Button - Top Right */}
      <Box sx={{ position: 'absolute', top: 20, right: 20 }}>
        <Link to="/login" style={{ textDecoration: 'none' }}>
          <IconButton
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.3)',
              backdropFilter: 'blur(10px)',
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.5)'
              }
            }}
          >
            <ArrowBack />
          </IconButton>
        </Link>
      </Box>

      <Container maxWidth="sm">
        <Paper
          elevation={0}
          sx={{
            padding: 4,
            borderRadius: 3,
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(10px)',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            animation: 'slideUp 0.8s ease-out',
            '@keyframes slideUp': {
              from: {
                opacity: 0,
                transform: 'translateY(50px)'
              },
              to: {
                opacity: 1,
                transform: 'translateY(0)'
              }
            }
          }}
        >
          {/* Welcome Header with Logo */}
          <Box sx={{ textAlign: 'center', marginBottom: 4 }}>
            <Box component="img" 
              src={KinderLogo} 
              alt="KINDER Logo" 
              sx={{ 
                height: 80, 
                objectFit: 'contain',
                marginBottom: 2,
                animation: 'bounceIn 0.8s ease-out',
                '@keyframes bounceIn': {
                  '0%': {
                    opacity: 0,
                    transform: 'scale(0.8)'
                  },
                  '100%': {
                    opacity: 1,
                    transform: 'scale(1)'
                  }
                }
              }} 
            />
            <Typography 
              variant="h4" 
              sx={{ 
                color: 'white',
                fontWeight: 800,
                textShadow: '1px 1px 4px rgba(0, 0, 0, 0.3)',
                marginBottom: 0.5,
                animation: 'fadeInDown 0.8s ease-out 0.1s both',
                '@keyframes fadeInDown': {
                  from: {
                    opacity: 0,
                    transform: 'translateY(-20px)'
                  },
                  to: {
                    opacity: 1,
                    transform: 'translateY(0)'
                  }
                }
              }}
            >
              Create New Password
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.85)',
                fontSize: '0.9rem',
                animation: 'fadeInDown 0.8s ease-out 0.2s both',
                '@keyframes fadeInDown': {
                  from: {
                    opacity: 0,
                    transform: 'translateY(-20px)'
                  },
                  to: {
                    opacity: 1,
                    transform: 'translateY(0)'
                  }
                }
              }}
            >
              Enter your new password below
            </Typography>
          </Box>

          {/* Success Alert */}
          {success && (
            <Alert severity="success" sx={{ marginBottom: 2 }}>
              Password reset successful! Redirecting to login...
            </Alert>
          )}

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ marginBottom: 2 }}>
              {error}
            </Alert>
          )}

          {/* Reset Password Form */}
          {!success && (
            <form onSubmit={handleSubmit}>
              {/* New Password Input */}
              <Box sx={{ marginBottom: 2 }}>
                <Typography sx={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.9rem', fontWeight: 500, marginBottom: 0.5 }}>
                  New Password *
                </Typography>
                <TextField
                  fullWidth
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter new password"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  disabled={loading}
                  required
                  InputProps={{
                    startAdornment: <Lock sx={{ mr: 1, color: '#333' }} />,
                    endAdornment: (
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        disabled={loading}
                        sx={{ color: '#333' }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    )
                  }}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      color: '#333',
                      padding: '10px 12px',
                      '& fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.5)'
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.8)'
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#fff'
                      }
                    },
                    '& .MuiOutlinedInput-input': {
                      padding: '10px 8px',
                      fontSize: '0.95rem'
                    },
                    '& .MuiOutlinedInput-input::placeholder': {
                      color: 'rgba(51, 51, 51, 0.5)',
                      opacity: 1
                    }
                  }}
                />
              </Box>

              {/* Confirm Password Input */}
              <Box sx={{ marginBottom: 3 }}>
                <Typography sx={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.9rem', fontWeight: 500, marginBottom: 0.5 }}>
                  Confirm Password *
                </Typography>
                <TextField
                  fullWidth
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  disabled={loading}
                  required
                  InputProps={{
                    startAdornment: <Lock sx={{ mr: 1, color: '#333' }} />,
                    endAdornment: (
                      <IconButton
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                        disabled={loading}
                        sx={{ color: '#333' }}
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    )
                  }}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      color: '#333',
                      padding: '10px 12px',
                      '& fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.5)'
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.8)'
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#fff'
                      }
                    },
                    '& .MuiOutlinedInput-input': {
                      padding: '10px 8px',
                      fontSize: '0.95rem'
                    },
                    '& .MuiOutlinedInput-input::placeholder': {
                      color: 'rgba(51, 51, 51, 0.5)',
                      opacity: 1
                    }
                  }}
                />
              </Box>

              {/* Submit Button */}
              <Button
                fullWidth
                variant="contained"
                size="large"
                type="submit"
                disabled={loading || !formData.newPassword || !formData.confirmPassword}
                sx={{
                  backgroundColor: '#333',
                  color: 'white',
                  marginBottom: 2,
                  marginTop: 1,
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 600,
                  padding: '10px 20px',
                  '&:hover': {
                    backgroundColor: '#1a1a1a'
                  },
                  '&:disabled': {
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    color: 'rgba(255, 255, 255, 0.5)'
                  }
                }}
              >
                {loading ? (
                  <>
                    <CircularProgress size={20} sx={{ mr: 1, color: '#fff' }} />
                    Resetting...
                  </>
                ) : (
                  'Reset Password'
                )}
              </Button>
            </form>
          )}

          {/* Back to Login Link */}
          <Box sx={{ textAlign: 'center', marginTop: 3 }}>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
              <Link to="/login" style={{ textDecoration: 'none' }}>
                <Typography
                  component="span"
                  variant="body2"
                  sx={{
                    color: '#fff',
                    fontWeight: 600,
                    '&:hover': { textDecoration: 'underline' }
                  }}
                >
                  Back to login
                </Typography>
              </Link>
            </Typography>
            <Typography variant="caption" sx={{ marginTop: 1, display: 'block', color: 'rgba(255, 255, 255, 0.7)' }}>
              By using this service, you agree to our{' '}
              <Typography
                component="span"
                variant="caption"
                onClick={handleTermsOpen}
                sx={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  '&:hover': { textDecoration: 'underline' }
                }}
              >
                Terms
              </Typography>
              {' '}and{' '}
              <Typography
                component="span"
                variant="caption"
                onClick={handlePrivacyOpen}
                sx={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  '&:hover': { textDecoration: 'underline' }
                }}
              >
                Privacy Policy
              </Typography>
            </Typography>
          </Box>
        </Paper>
      </Container>

      {/* Terms & Conditions Modal */}
      <Dialog
        open={openTerms}
        onClose={handleTermsClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(10px)',
            borderRadius: 2
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1.3rem', color: '#333' }}>
          Terms & Conditions
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ maxHeight: '60vh', overflowY: 'auto' }}>
          <Typography variant="body2" sx={{ color: '#333', lineHeight: 1.8, whiteSpace: 'pre-wrap', marginTop: 1 }}>
            {`By accessing or using KINDER Babysitter Platform, you agree to be bound by these Terms & Conditions.

You must be at least 18 years old to use our services.

Parents are responsible for verifying babysitter credentials and conducting interviews.

Babysitters must be currently enrolled university students with valid ID.

All bookings are agreements between parents and babysitters; KINDER acts only as a connection platform.

Users must maintain respectful conduct and appropriate communication.

Cancellations must be made at least 12 hours in advance.

Repeated cancellations or inappropriate behavior may result in account suspension.

KINDER reserves the right to modify or terminate services without notice.

You are responsible for maintaining account security and confidentiality.

These terms are governed by applicable laws and constitute the entire agreement between you and KINDER.`}
          </Typography>
        </DialogContent>
        <Divider />
        <DialogActions>
          <Button onClick={handleTermsClose} sx={{ color: '#333', fontWeight: 600 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Privacy Policy Modal */}
      <Dialog
        open={openPrivacy}
        onClose={handlePrivacyClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(10px)',
            borderRadius: 2
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1.3rem', color: '#333' }}>
          Privacy Policy
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ maxHeight: '60vh', overflowY: 'auto' }}>
          <Typography variant="body2" sx={{ color: '#333', lineHeight: 1.8, whiteSpace: 'pre-wrap', marginTop: 1 }}>
            {`KINDER collects personal information including name, email, phone number, and user type to provide our services.

For parents, we collect child information and booking addresses.

For babysitters, we collect university details, student ID, experience, and availability.

We use this information to facilitate connections, verify identities, improve services, and communicate updates.

We do not sell your data to third parties.

Information is shared only between matched parents and babysitters for booking purposes.

We implement security measures to protect your data but cannot guarantee absolute security.

You may access, correct, or delete your personal information by contacting us.

By using KINDER, you consent to our data practices.

This policy may be updated periodically; continued use constitutes acceptance of changes.`}
          </Typography>
        </DialogContent>
        <Divider />
        <DialogActions>
          <Button onClick={handlePrivacyClose} sx={{ color: '#333', fontWeight: 600 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ResetPasswordPage;
