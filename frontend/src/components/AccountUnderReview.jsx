import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Box,
  Typography,
  Button,
  CircularProgress
} from '@mui/material';
import { Logout, Refresh, Email, AccessTime } from '@mui/icons-material';
import KinderBackground from '../assets/KinderBackground.jpg';
import KinderLogo from '../assets/KinderLogo.png';

const AccountUnderReview = () => {
  const [user, setUser] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState('pending');
  const [rejectionReason, setRejectionReason] = useState('');
  const [checking, setChecking] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      checkVerificationStatus(userData);
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const checkVerificationStatus = async (userData) => {
    setChecking(true);
    try {
      const endpoint = userData.role === 'babysitter' 
        ? `http://localhost:3001/api/babysitters/verification-status/${userData.id}`
        : `http://localhost:3001/api/parents/verification-status/${userData.id}`;
      
      const response = await fetch(endpoint);
      const data = await response.json();
      
      if (data.success) {
        setVerificationStatus(data.data.verificationStatus);
        setRejectionReason(data.data.rejectionReason || '');
        
        // If approved, redirect to dashboard
        if (data.data.verificationStatus === 'approved') {
          if (userData.role === 'parent') {
            navigate('/parent-dashboard');
          } else if (userData.role === 'babysitter') {
            navigate('/babysitter-dashboard');
          }
        }
      }
    } catch (error) {
      console.error('Error checking verification status:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  const handleRefresh = () => {
    if (user) {
      checkVerificationStatus(user);
    }
  };

  if (!user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Rejected state
  if (verificationStatus === 'rejected') {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          backgroundImage: `url(${KinderBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 2
        }}
      >
        <Container maxWidth="sm">
          <Paper
            elevation={0}
            sx={{
              padding: 5,
              borderRadius: 4,
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              textAlign: 'center'
            }}
          >
            <Box
              component="img"
              src={KinderLogo}
              alt="KINDER"
              sx={{ height: 60, marginBottom: 3 }}
            />
            
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                backgroundColor: '#ffebee',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                fontSize: '2.5rem'
              }}
            >
              ❌
            </Box>

            <Typography variant="h4" sx={{ fontWeight: 700, color: '#c62828', marginBottom: 2 }}>
              Account Not Approved
            </Typography>

            <Typography sx={{ color: '#666', marginBottom: 3, fontSize: '1.1rem' }}>
              We're sorry, but your account registration has been rejected by our administrator.
            </Typography>

            {rejectionReason && (
              <Box
                sx={{
                  backgroundColor: '#fff3e0',
                  border: '1px solid #ffcc80',
                  borderRadius: 2,
                  padding: 2,
                  marginBottom: 3
                }}
              >
                <Typography sx={{ fontWeight: 600, color: '#e65100', marginBottom: 1 }}>
                  Reason for rejection:
                </Typography>
                <Typography sx={{ color: '#333' }}>
                  {rejectionReason}
                </Typography>
              </Box>
            )}

            <Typography sx={{ color: '#666', marginBottom: 3 }}>
              If you believe this is a mistake or need more information, please contact our admin team.
            </Typography>

            <Button
              variant="contained"
              startIcon={<Email />}
              href="mailto:admin@kinder.com"
              sx={{
                backgroundColor: '#667eea',
                padding: '12px 30px',
                fontSize: '1rem',
                fontWeight: 600,
                marginBottom: 2,
                '&:hover': { backgroundColor: '#764ba2' }
              }}
            >
              Contact Admin
            </Button>

            <Box sx={{ marginTop: 2 }}>
              <Button
                variant="outlined"
                startIcon={<Logout />}
                onClick={handleLogout}
                sx={{
                  color: '#666',
                  borderColor: '#ccc',
                  '&:hover': { borderColor: '#999', backgroundColor: 'rgba(0,0,0,0.05)' }
                }}
              >
                Logout
              </Button>
            </Box>
          </Paper>
        </Container>
      </Box>
    );
  }

  // Pending state (default)
  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundImage: `url(${KinderBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={0}
          sx={{
            padding: 5,
            borderRadius: 4,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            textAlign: 'center',
            animation: 'slideUp 0.8s ease-out',
            '@keyframes slideUp': {
              from: { opacity: 0, transform: 'translateY(30px)' },
              to: { opacity: 1, transform: 'translateY(0)' }
            }
          }}
        >
          <Box
            component="img"
            src={KinderLogo}
            alt="KINDER"
            sx={{ height: 60, marginBottom: 3 }}
          />
          
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              backgroundColor: '#fff3e0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px'
            }}
          >
            <AccessTime sx={{ fontSize: 40, color: '#ff9800' }} />
          </Box>

          <Typography variant="h4" sx={{ fontWeight: 700, color: '#333', marginBottom: 2 }}>
            Account Under Review
          </Typography>

          <Typography sx={{ color: '#666', marginBottom: 3, fontSize: '1.1rem', lineHeight: 1.6 }}>
            Thank you for registering, <strong>{user.name}</strong>!
          </Typography>

          <Box
            sx={{
              backgroundColor: '#e3f2fd',
              borderRadius: 2,
              padding: 3,
              marginBottom: 3
            }}
          >
            <Typography sx={{ color: '#1565c0', fontWeight: 500, marginBottom: 1 }}>
              Your {user.role} account is currently being reviewed by our admin team.
            </Typography>
            <Typography sx={{ color: '#666', fontSize: '0.95rem' }}>
              This process usually takes 24-48 hours. You will be able to access your dashboard once your account is approved.
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              gap: 2,
              marginBottom: 3,
              flexWrap: 'wrap'
            }}
          >
            <Box sx={{ textAlign: 'center', padding: 2 }}>
              <Typography sx={{ fontSize: '2rem', fontWeight: 700, color: '#667eea' }}>1</Typography>
              <Typography sx={{ fontSize: '0.85rem', color: '#666' }}>Registration<br/>Complete</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', color: '#ccc' }}>→</Box>
            <Box sx={{ textAlign: 'center', padding: 2, backgroundColor: '#fff3e0', borderRadius: 2 }}>
              <Typography sx={{ fontSize: '2rem', fontWeight: 700, color: '#ff9800' }}>2</Typography>
              <Typography sx={{ fontSize: '0.85rem', color: '#666' }}>Under<br/>Review</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', color: '#ccc' }}>→</Box>
            <Box sx={{ textAlign: 'center', padding: 2 }}>
              <Typography sx={{ fontSize: '2rem', fontWeight: 700, color: '#ccc' }}>3</Typography>
              <Typography sx={{ fontSize: '0.85rem', color: '#999' }}>Account<br/>Approved</Typography>
            </Box>
          </Box>

          <Button
            variant="contained"
            startIcon={checking ? <CircularProgress size={20} color="inherit" /> : <Refresh />}
            onClick={handleRefresh}
            disabled={checking}
            sx={{
              backgroundColor: '#667eea',
              padding: '12px 30px',
              fontSize: '1rem',
              fontWeight: 600,
              marginBottom: 2,
              '&:hover': { backgroundColor: '#764ba2' }
            }}
          >
            {checking ? 'Checking...' : 'Check Status'}
          </Button>

          <Typography sx={{ color: '#999', fontSize: '0.85rem', marginBottom: 3 }}>
            Click to check if your account has been approved
          </Typography>

          <Box sx={{ borderTop: '1px solid #eee', paddingTop: 3 }}>
            <Typography sx={{ color: '#666', fontSize: '0.9rem', marginBottom: 2 }}>
              Have questions? Contact us at:
            </Typography>
            <Button
              variant="text"
              startIcon={<Email />}
              href="mailto:admin@kinder.com"
              sx={{ color: '#667eea' }}
            >
              admin@kinder.com
            </Button>
          </Box>

          <Box sx={{ marginTop: 3 }}>
            <Button
              variant="outlined"
              startIcon={<Logout />}
              onClick={handleLogout}
              sx={{
                color: '#666',
                borderColor: '#ccc',
                '&:hover': { borderColor: '#999', backgroundColor: 'rgba(0,0,0,0.05)' }
              }}
            >
              Logout
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default AccountUnderReview;

