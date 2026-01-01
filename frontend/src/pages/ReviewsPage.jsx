import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Tab,
  Tabs,
  Paper,
  AppBar,
  Toolbar
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import KinderLogo from '../assets/KinderLogo.png';
import KinderBackground from '../assets/KinderBackground.jpg';
import ReviewList from '../components/ReviewList';
import { useAuth } from '../context/AuthContext';

const ReviewsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);

  if (!user) {
    return (
      <Box sx={{ textAlign: 'center', paddingTop: 10, color: 'white' }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

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
            <img src={KinderLogo} alt="KINDER" style={{ height: 40, cursor: 'pointer' }} onClick={() => navigate('/')} />
            <Typography sx={{ color: '#FF9800', fontWeight: 700, fontSize: '1.3rem', display: { xs: 'none', sm: 'block' } }}>
              Reviews & Ratings
            </Typography>
          </Box>
          <Button
            onClick={() => navigate(-1)}
            startIcon={<ArrowBack />}
            sx={{ color: '#FF9800', textTransform: 'none', fontSize: '1rem' }}
          >
            Back
          </Button>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ paddingY: 4, position: 'relative', zIndex: 1 }}>
        {/* User Info */}
        <Box sx={{ marginBottom: 4 }}>
          <Typography sx={{ color: '#FF9800', fontSize: '1.5rem', fontWeight: 700, marginBottom: 1 }}>
            {user.role === 'babysitter' ? `Reviews for ${user.name}` : 'My Reviews'}
          </Typography>
          <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '1rem' }}>
            {user.role === 'babysitter'
              ? 'View all the reviews from parents who have booked your services'
              : 'View all your reviews and ratings'}
          </Typography>
        </Box>

        {/* Tabs */}
        <Paper
          sx={{
            backgroundColor: 'rgba(26, 26, 46, 0.8)',
            border: '1px solid rgba(255, 152, 0, 0.2)',
            borderRadius: 2,
            backdropFilter: 'blur(10px)',
            marginBottom: 4,
            display: 'none'
          }}
        >
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': {
                color: 'rgba(255, 255, 255, 0.6)',
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 600,
                padding: '16px 24px',
                '&:hover': {
                  color: '#FF9800'
                }
              },
              '& .MuiTab-root.Mui-selected': {
                color: '#FF9800',
                borderBottom: '3px solid #FF9800'
              },
              '& .MuiTabs-indicator': {
                backgroundColor: 'transparent'
              }
            }}
          >
            <Tab label="Reviews" />
            <Tab label="Statistics" />
          </Tabs>
        </Paper>

        {/* Tab Content */}
        <Box sx={{ marginTop: 3 }}>
          <ReviewList userId={user._id || user.id} readOnly={true} />
        </Box>
      </Container>
    </Box>
  );
};

export default ReviewsPage;
