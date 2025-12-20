import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Box,
  Typography,
  Button,
  Grid,
  Avatar,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Person,
  Email,
  Phone,
  Home,
  Badge,
  CheckCircle,
  CalendarMonth
} from '@mui/icons-material';
import KinderLogo from '../../assets/KinderLogo.png';
import KinderBackground from '../../assets/KinderBackground.jpg';

const ParentProfilePage = () => {
  const [user, setUser] = useState(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editData, setEditData] = useState({ name: '', phone: '', address: '' });
  const [editLoading, setEditLoading] = useState(false);
  const navigate = useNavigate();

  // Theme color for parents - Sky Blue
  const themeColor = '#03A9F4';
  const themeColorDark = '#0288D1';

  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    const storedToken = sessionStorage.getItem('token');
    
    if (storedUser && storedToken) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      setEditData({
        name: userData.name || '',
        phone: userData.phone || '',
        address: userData.address || ''
      });
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const handleOpenEdit = () => {
    setEditData({
      name: user.name || '',
      phone: user.phone || '',
      address: user.address || ''
    });
    setOpenEditDialog(true);
  };

  const handleSaveProfile = async () => {
    setEditLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/parents/profile/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const updatedUser = { ...user, ...editData };
        setUser(updatedUser);
        sessionStorage.setItem('user', JSON.stringify(updatedUser));
        setOpenEditDialog(false);
        alert('Profile updated successfully!');
      } else {
        alert(data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile');
    } finally {
      setEditLoading(false);
    }
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
      <Container maxWidth="md">
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
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'white' }}>
                My Profile
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
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

          {/* Profile Card */}
          <Box sx={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.4)', 
            borderRadius: 2, 
            padding: 3,
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            {/* Avatar and Name */}
            <Box sx={{ textAlign: 'center', marginBottom: 4 }}>
              <Avatar sx={{ 
                width: 100, 
                height: 100, 
                margin: '0 auto 15px', 
                backgroundColor: themeColor, 
                fontSize: '2.5rem',
                fontWeight: 700,
                border: `4px solid ${themeColorDark}`
              }}>
                {(user.name || 'P').charAt(0).toUpperCase()}
              </Avatar>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', marginBottom: 1 }}>
                {user.name}
              </Typography>
              <Typography sx={{ 
                color: themeColor, 
                fontSize: '1rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                backgroundColor: 'rgba(3, 169, 244, 0.2)',
                padding: '5px 15px',
                borderRadius: 2
              }}>
                <CheckCircle sx={{ fontSize: 18 }} /> Verified Parent
              </Typography>
            </Box>

            {/* Profile Information */}
            <Grid container spacing={2}>
              {[
                { icon: <Email />, label: 'Email', value: user.email },
                { icon: <Phone />, label: 'Phone', value: user.phone || 'Not provided' },
                { icon: <Home />, label: 'Address', value: user.address || 'Not provided' },
                { icon: <Badge />, label: 'Role', value: 'Parent' },
                { icon: <CheckCircle />, label: 'Status', value: 'Active', isStatus: true },
                { icon: <CalendarMonth />, label: 'Member Since', value: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A' }
              ].map((item, idx) => (
                <Grid item xs={12} sm={6} key={idx}>
                  <Box sx={{ 
                    padding: 2.5, 
                    backgroundColor: 'rgba(3, 169, 244, 0.1)', 
                    borderRadius: 2,
                    border: '1px solid rgba(3, 169, 244, 0.3)',
                    height: '100%'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, marginBottom: 1 }}>
                      {React.cloneElement(item.icon, { sx: { fontSize: 20, color: themeColor } })}
                      <Typography sx={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 500 }}>
                        {item.label}
                      </Typography>
                    </Box>
                    <Typography sx={{ 
                      fontWeight: 600, 
                      color: item.isStatus ? '#4CAF50' : 'white',
                      fontSize: '1.1rem'
                    }}>
                      {item.value}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>

            {/* Edit Profile Button */}
            <Box sx={{ textAlign: 'center', marginTop: 4 }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<Edit />}
                onClick={handleOpenEdit}
                sx={{
                  backgroundColor: themeColor,
                  color: 'white',
                  fontWeight: 600,
                  textTransform: 'none',
                  padding: '12px 40px',
                  fontSize: '1rem',
                  '&:hover': { backgroundColor: themeColorDark }
                }}
              >
                Edit Profile
              </Button>
            </Box>
          </Box>

        </Paper>

        {/* Edit Profile Dialog */}
        <Dialog 
          open={openEditDialog} 
          onClose={() => setOpenEditDialog(false)} 
          maxWidth="sm" 
          fullWidth
          PaperProps={{ sx: { borderRadius: 2 } }}
        >
          <DialogTitle sx={{ backgroundColor: themeColor, color: 'white', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Edit /> Edit Profile
          </DialogTitle>
          <DialogContent sx={{ paddingTop: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 1 }}>
              <TextField
                label="Full Name"
                fullWidth
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              />
              <TextField
                label="Phone Number"
                fullWidth
                value={editData.phone}
                onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
              />
              <TextField
                label="Address"
                fullWidth
                multiline
                rows={3}
                value={editData.address}
                onChange={(e) => setEditData({ ...editData, address: e.target.value })}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ padding: 2 }}>
            <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
            <Button 
              variant="contained" 
              onClick={handleSaveProfile}
              disabled={editLoading || !editData.name}
              sx={{ backgroundColor: themeColor, '&:hover': { backgroundColor: themeColorDark } }}
            >
              {editLoading ? <CircularProgress size={24} color="inherit" /> : 'Save Changes'}
            </Button>
          </DialogActions>
        </Dialog>

      </Container>
    </Box>
  );
};

export default ParentProfilePage;
