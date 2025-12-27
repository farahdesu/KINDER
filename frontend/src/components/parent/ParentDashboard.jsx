import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Box,
  Typography,
  Button,
  Grid,
  CircularProgress,
  Avatar,
  Chip,
  TextField,
  FormControl,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Logout,
  EventAvailable,
  Star,
  School,
  Wallet,
  Verified,
  ChildCare,
  CalendarMonth,
  CheckCircle,
  StarRate,
  Person,
  Email,
  Phone,
  Badge,
  Search,
  Visibility,
  BookOnline,
  Edit
} from '@mui/icons-material';
import KinderLogo from '../../assets/KinderLogo.png';
import KinderBackground from '../../assets/KinderBackground.jpg';

const ParentDashboard = () => {
  const [user, setUser] = useState(null);
  const [babysitters, setBabysitters] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [universityFilter, setUniversityFilter] = useState('all');
  const [minRate, setMinRate] = useState('');
  const [maxRate, setMaxRate] = useState('');
  const [selectedBabysitter, setSelectedBabysitter] = useState(null);
  const [openProfileDialog, setOpenProfileDialog] = useState(false);
  const [openEditProfileDialog, setOpenEditProfileDialog] = useState(false);
  const [editProfileData, setEditProfileData] = useState({ name: '', phone: '', address: '' });
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
      checkVerificationStatus(userData);
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const checkVerificationStatus = async (userData) => {
    try {
      const response = await fetch(`http://localhost:3000/api/parents/verification-status/${userData.id}`);
      const data = await response.json();
      
      if (data.success) {
        if (data.data.verificationStatus === 'approved') {
          setUser(userData);
          fetchBabysitters();
          fetchBookings();
        } else {
          navigate('/account-under-review');
        }
      } else {
        navigate('/account-under-review');
      }
    } catch (error) {
      console.error('Error checking verification:', error);
      navigate('/account-under-review');
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
    }
  };

  const fetchBabysitters = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/babysitters');
      const data = await response.json();
      
      if (data.success) {
        setBabysitters(data.babysitters || []);
      }
    } catch (error) {
      console.error('Network error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookBabysitter = (babysitter) => {
    navigate(`/book-babysitter/${babysitter.id}`, { state: { babysitter } });
  };

  const handleViewBookings = () => {
    navigate('/parent-bookings');
  };

  const handleLogout = () => {
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
    window.location.href = '/';
  };

  const handleOpenEditProfile = () => {
    setEditProfileData({
      name: user.name || '',
      phone: user.phone || '',
      address: user.address || ''
    });
    setOpenEditProfileDialog(true);
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
        body: JSON.stringify(editProfileData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Update local user data
        const updatedUser = { ...user, ...editProfileData };
        setUser(updatedUser);
        sessionStorage.setItem('user', JSON.stringify(updatedUser));
        setOpenEditProfileDialog(false);
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

  // Get unique universities for filter
  const universities = [...new Set(babysitters.map(bs => bs.university).filter(Boolean))];

  // Filter babysitters
  const filteredBabysitters = babysitters.filter(bs => {
    const matchesSearch = bs.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bs.university?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bs.department?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesUniversity = universityFilter === 'all' || bs.university === universityFilter;
    const matchesMinRate = !minRate || bs.hourlyRate >= parseInt(minRate);
    const matchesMaxRate = !maxRate || bs.hourlyRate <= parseInt(maxRate);
    return matchesSearch && matchesUniversity && matchesMinRate && matchesMaxRate;
  });

  // Glass style
  const glassStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: 3
  };

  // Dark card style
  const darkCardStyle = {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    transition: 'all 0.3s ease',
    '&:hover': {
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      transform: 'translateY(-3px)',
      boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
    }
  };

  // Input style
  const inputStyle = {
    '& .MuiOutlinedInput-root': {
      backgroundColor: 'rgba(60, 60, 60, 0.9) !important',
      color: 'white !important',
      fontWeight: 600,
      '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
      '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.5)' },
      '&.Mui-focused fieldset': { borderColor: themeColor },
      '&.Mui-focused': { backgroundColor: 'rgba(60, 60, 60, 0.9) !important' }
    },
    '& .MuiOutlinedInput-input': {
      color: 'white !important',
      caretColor: 'white',
      '&::placeholder': { color: 'rgba(255,255,255,0.7)', opacity: 1 }
    }
  };

  // Select menu props
  const selectMenuProps = {
    PaperProps: {
      sx: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        '& .MuiMenuItem-root': {
          color: 'white',
          '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' },
          '&.Mui-selected': { backgroundColor: 'rgba(3, 169, 244, 0.3)' }
        }
      }
    }
  };

  if (!user) {
    return (
      <Box sx={{
        minHeight: '100vh',
        backgroundImage: `url(${KinderBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat'
      }}>
        <Container maxWidth="sm" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <Paper sx={{ ...glassStyle, padding: 4, textAlign: 'center' }}>
            <CircularProgress sx={{ color: themeColor }} />
            <Typography sx={{ marginTop: 2, color: 'white', fontWeight: 500 }}>
              Checking authentication...
            </Typography>
          </Paper>
        </Container>
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
      backgroundRepeat: 'no-repeat',
      paddingTop: 4,
      paddingBottom: 4
    }}>
      <Container maxWidth="lg">
        {/* Main Transparent Container */}
        <Paper sx={{ ...glassStyle, padding: 3 }}>
          
          {/* Header Section */}
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
                sx={{ height: 50, width: 'auto' }}
              />
              <Box sx={{ textAlign: 'left' }}>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 800,
                    color: 'white',
                    textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)'
                  }}
                >
                  Parent Dashboard
                </Typography>
                <Typography sx={{ color: 'rgba(255, 255, 255, 0.95)', fontSize: '1rem', textAlign: 'left' }}>
                  Welcome back, {user.name}!
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                startIcon={<Edit />}
                onClick={handleOpenEditProfile}
                sx={{
                  backgroundColor: themeColor,
                  color: 'white',
                  fontWeight: 600,
                  textTransform: 'none',
                  '&:hover': { backgroundColor: themeColorDark }
                }}
              >
                Edit Profile
              </Button>
              <Button
                variant="contained"
                startIcon={<Logout />}
                onClick={handleLogout}
                sx={{
                  backgroundColor: '#424242',
                  color: 'white',
                  fontWeight: 600,
                  textTransform: 'none',
                  '&:hover': { backgroundColor: '#303030' }
                }}
              >
                Logout
              </Button>
            </Box>
          </Box>

          {/* Stats Cards */}
          <Grid container spacing={2} sx={{ marginBottom: 3 }}>
            {[
              { icon: <ChildCare />, label: 'Available Babysitters', value: babysitters.length, color: '#FFEB3B' },
              { icon: <CalendarMonth />, label: 'My Bookings', value: bookings.length, color: themeColor },
              { icon: <CheckCircle />, label: 'Completed', value: bookings.filter(b => b.status === 'completed').length, color: '#4CAF50' },
              { icon: <StarRate />, label: 'Rating', value: '5.0', color: '#FF9800' }
            ].map((stat, idx) => (
              <Grid item xs={6} sm={3} key={idx}>
                <Box sx={{ ...darkCardStyle, padding: 2, textAlign: 'center' }}>
                  <Box
                    sx={{
                      width: 45,
                      height: 45,
                      borderRadius: '50%',
                      backgroundColor: stat.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 10px',
                      color: stat.color === '#FFEB3B' ? '#333' : 'white'
                    }}
                  >
                    {React.cloneElement(stat.icon, { sx: { fontSize: 24 } })}
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: 'white', textShadow: '2px 2px 4px rgba(0,0,0,0.7)' }}>
                    {stat.value}
                  </Typography>
                  <Typography sx={{ color: 'white', fontSize: '0.85rem', fontWeight: 600 }}>
                    {stat.label}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>

          {/* User Info Card */}
          <Box sx={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.3)', 
            borderRadius: 2, 
            padding: 2.5, 
            marginBottom: 3,
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'white', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Person sx={{ color: themeColor }} /> Your Information
            </Typography>
            <Grid container spacing={2}>
              {[
                { icon: <Email />, label: 'Email', value: user.email },
                { icon: <Phone />, label: 'Phone', value: user.phone || 'Not provided' },
                { icon: <Badge />, label: 'Role', value: 'Parent' },
                { icon: <CheckCircle />, label: 'Status', value: 'Active', isStatus: true }
              ].map((item, idx) => (
                <Grid item xs={12} sm={6} md={3} key={idx}>
                  <Box sx={{ 
                    padding: 2, 
                    backgroundColor: 'rgba(3, 169, 244, 0.15)', 
                    borderRadius: 2,
                    border: '1px solid rgba(3, 169, 244, 0.3)'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, marginBottom: 0.5 }}>
                      {React.cloneElement(item.icon, { sx: { fontSize: 18, color: themeColor } })}
                      <Typography sx={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                        {item.label}
                      </Typography>
                    </Box>
                    <Typography sx={{ fontWeight: 600, color: item.isStatus ? '#4CAF50' : 'white' }}>
                      {item.value}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Quick Actions */}
          <Grid container spacing={2} sx={{ marginBottom: 3 }}>
            {[
              { icon: <EventAvailable />, label: 'My Bookings', action: handleViewBookings, color: themeColor },
              { icon: <Star />, label: 'Reviews', action: () => {}, color: '#FF9800' },
              { icon: <Person />, label: 'My Profile', action: () => navigate('/parent-profile'), color: '#4CAF50' }
            ].map((card, idx) => (
              <Grid item xs={12} sm={4} key={idx}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={card.icon}
                  onClick={card.action}
                  sx={{
                    backgroundColor: card.color,
                    color: 'white',
                    fontWeight: 600,
                    padding: '12px 20px',
                    textTransform: 'none',
                    fontSize: '1rem',
                    '&:hover': { backgroundColor: card.color, filter: 'brightness(0.9)' }
                  }}
                >
                  {card.label}
                </Button>
              </Grid>
            ))}
          </Grid>

          {/* Babysitters Section */}
          <Box sx={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.3)', 
            borderRadius: 2, 
            padding: 2.5,
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'white', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <ChildCare sx={{ color: '#FFEB3B' }} /> Available Babysitters ({filteredBabysitters.length})
            </Typography>

            {/* Search and Filters */}
            <Box sx={{ display: 'flex', gap: 2, marginBottom: 3, flexWrap: 'wrap' }}>
              <TextField
                placeholder="Search by name, university, department..."
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ color: 'white', mr: 1 }} />
                }}
                sx={{ ...inputStyle, minWidth: 300, flexGrow: 1 }}
              />
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <Select
                  value={universityFilter}
                  onChange={(e) => setUniversityFilter(e.target.value)}
                  displayEmpty
                  MenuProps={selectMenuProps}
                  sx={{
                    backgroundColor: 'rgba(60, 60, 60, 0.9)',
                    color: 'white',
                    fontWeight: 600,
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: themeColor },
                    '& .MuiSvgIcon-root': { color: 'white' }
                  }}
                >
                  <MenuItem value="all">All Universities</MenuItem>
                  {universities.map(uni => (
                    <MenuItem key={uni} value={uni}>{uni}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                backgroundColor: 'rgba(60, 60, 60, 0.9)',
                borderRadius: 2,
                padding: '4px 12px',
                gap: 1
              }}>
                <Typography sx={{ color: 'rgba(53, 228, 100, 0.5)', fontSize: '1.0rem' }}>৳</Typography>
                <TextField
                  size="small"
                  placeholder="Min"
                  value={minRate}
                  onChange={(e) => setMinRate(e.target.value.replace(/[^0-9]/g, ''))}
                  sx={{
                    width: 70,
                    '& .MuiOutlinedInput-root': {
                      color: 'black',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      '& fieldset': { border: 'none' },
                      '& input': { padding: '6px 8px', textAlign: 'center' }
                    },
                    '& input::placeholder': { color: 'rgba(4, 1, 1, 0.5)' }
                  }}
                />
                <Typography sx={{ color: 'rgba(53, 196, 228, 0.5)', fontSize: '0.9rem' }}>—</Typography>
                <TextField
                  size="small"
                  placeholder="Max"
                  value={maxRate}
                  onChange={(e) => setMaxRate(e.target.value.replace(/[^0-9]/g, ''))}
                  sx={{
                    width: 70,
                    '& .MuiOutlinedInput-root': {
                      color: 'black',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      '& fieldset': { border: 'none' },
                      '& input': { padding: '6px 8px', textAlign: 'center' }
                    },
                    '& input::placeholder': { color: 'rgba(1, 0, 0, 0.5)' }
                  }}
                />
                <Typography sx={{ color: 'rgba(53, 196, 228, 0.5)', fontSize: '0.85rem' }}>/hr</Typography>
              </Box>
            </Box>

            {loading ? (
              <Box sx={{ textAlign: 'center', padding: 4 }}>
                <CircularProgress sx={{ color: themeColor }} />
                <Typography sx={{ marginTop: 2, color: 'white' }}>
                  Loading babysitters...
                </Typography>
              </Box>
            ) : filteredBabysitters.length > 0 ? (
              <TableContainer sx={{ 
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                borderRadius: 2,
                border: '1px solid rgba(255, 255, 255, 0.15)'
              }}>
                <Table sx={{ backgroundColor: 'transparent' }}>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: themeColor }}>
                      <TableCell sx={{ fontWeight: 700, color: 'white', borderBottom: 'none', py: 1.5 }}>Babysitter</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: 'white', borderBottom: 'none', py: 1.5 }}>University</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: 'white', borderBottom: 'none', py: 1.5 }}>Department</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: 'white', borderBottom: 'none', py: 1.5 }}>Year</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: 'white', borderBottom: 'none', py: 1.5 }}>Rate</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: 'white', borderBottom: 'none', py: 1.5 }}>Rating</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: 'white', borderBottom: 'none', py: 1.5 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: 'white', borderBottom: 'none', py: 1.5 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody sx={{ backgroundColor: 'transparent' }}>
                    {filteredBabysitters.map((bs) => (
                      <TableRow
                        key={bs.id}
                        sx={{
                          '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' },
                          backgroundColor: 'transparent'
                        }}
                      >
                        <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar sx={{
                              width: 40,
                              height: 40,
                              fontSize: '1rem',
                              fontWeight: 700,
                              backgroundColor: '#FFEB3B',
                              color: '#333',
                              border: '2px solid #FBC02D'
                            }}>
                              {(bs.name || 'B').charAt(0).toUpperCase()}
                            </Avatar>
                            <Typography sx={{ fontSize: '0.9rem', color: 'white', fontWeight: 700 }}>
                              {bs.name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.9rem', color: 'white', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          {bs.university || 'N/A'}
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.9rem', color: 'white', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          {bs.department || 'N/A'}
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.9rem', color: 'white', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          Year {bs.year || 'N/A'}
                        </TableCell>
                        <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          <Typography sx={{ fontWeight: 700, color: '#4CAF50', fontSize: '0.95rem' }}>
                            ৳{bs.hourlyRate}/hr
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          <Typography sx={{ fontWeight: 700, color: '#FF9800', fontSize: '0.95rem' }}>
                            {bs.rating || '5.0'} ⭐
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          <Chip
                            icon={<Verified sx={{ color: '#4CAF50 !important', fontSize: 16 }} />}
                            label="Verified"
                            size="small"
                            sx={{
                              backgroundColor: 'rgba(76, 175, 80, 0.2)',
                              color: '#4CAF50',
                              fontWeight: 600,
                              border: '1px solid rgba(76, 175, 80, 0.5)'
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          <IconButton
                            size="small"
                            onClick={() => { setSelectedBabysitter(bs); setOpenProfileDialog(true); }}
                            title="View Profile"
                          >
                            <Visibility sx={{ color: '#00E5FF', fontSize: 22 }} />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleBookBabysitter(bs)}
                            title="Book Now"
                          >
                            <BookOnline sx={{ color: '#4CAF50', fontSize: 22 }} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ textAlign: 'center', padding: 4 }}>
                <ChildCare sx={{ fontSize: 60, color: themeColor, marginBottom: 1 }} />
                <Typography sx={{ fontWeight: 700, color: 'white', marginBottom: 1, fontSize: '1.2rem' }}>
                  {babysitters.length === 0 ? 'No Babysitters Available' : 'No Results Found'}
                </Typography>
                <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  {babysitters.length === 0 ? 'Check back later for new babysitters.' : 'Try adjusting your search or filters.'}
                </Typography>
              </Box>
            )}
          </Box>

        </Paper>

        {/* Babysitter Profile Dialog - White background like Admin */}
        <Dialog 
          open={openProfileDialog} 
          onClose={() => setOpenProfileDialog(false)} 
          maxWidth="sm" 
          fullWidth
          PaperProps={{ sx: { borderRadius: 2 } }}
        >
          <DialogTitle sx={{ backgroundColor: '#333', color: 'white', fontWeight: 700 }}>
            Babysitter Profile
          </DialogTitle>
          <DialogContent sx={{ paddingTop: 3 }}>
            {selectedBabysitter && (
              <Box>
                <Box sx={{ textAlign: 'center', marginBottom: 3 }}>
                  <Avatar sx={{ 
                    width: 70, 
                    height: 70, 
                    margin: '0 auto 12px', 
                    backgroundColor: '#FFEB3B', 
                    color: '#333',
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    border: '3px solid rgba(251, 192, 45, 1)'
                  }}>
                    {(selectedBabysitter.name || 'B').charAt(0).toUpperCase()}
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
                    {selectedBabysitter.name}
                  </Typography>
                  <Chip
                    label="babysitter"
                    size="small"
                    sx={{
                      marginTop: 1,
                      backgroundColor: '#FFEB3B',
                      color: '#333',
                      fontWeight: 600
                    }}
                  />
                </Box>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Typography sx={{ mb: 0.5 }}><strong>Email:</strong> {selectedBabysitter.email || 'N/A'}</Typography>
                  <Typography sx={{ mb: 0.5 }}><strong>Phone:</strong> {selectedBabysitter.phone || 'N/A'}</Typography>
                  <Typography sx={{ mb: 0.5 }}><strong>University:</strong> {selectedBabysitter.university}</Typography>
                  <Typography sx={{ mb: 0.5 }}><strong>Student ID:</strong> {selectedBabysitter.studentId || 'N/A'}</Typography>
                  <Typography sx={{ mb: 0.5 }}><strong>Department:</strong> {selectedBabysitter.department}</Typography>
                  <Typography sx={{ mb: 0.5 }}><strong>Year:</strong> {selectedBabysitter.year}</Typography>
                  <Typography sx={{ mb: 0.5 }}><strong>Hourly Rate:</strong> ৳{selectedBabysitter.hourlyRate}</Typography>
                  <Typography sx={{ mb: 0.5 }}><strong>Rating:</strong> {selectedBabysitter.rating || '5.0'} ⭐</Typography>
                  {selectedBabysitter.experience && (
                    <Typography sx={{ mb: 0.5 }}><strong>Experience:</strong> {selectedBabysitter.experience}</Typography>
                  )}
                  <Box sx={{ mt: 2 }}>
                    <Typography sx={{ mb: 1, fontWeight: 600, color: '#333' }}>Skills:</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(Array.isArray(selectedBabysitter.skills) ? selectedBabysitter.skills : []).map((skill, idx) => (
                        <Chip 
                          key={idx} 
                          label={skill} 
                          size="small" 
                          sx={{ 
                            backgroundColor: '#03A9F4', 
                            color: 'white',
                            fontWeight: 600
                          }} 
                        />
                      ))}
                    </Box>
                  </Box>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ padding: 2 }}>
            <Button 
              onClick={() => setOpenProfileDialog(false)}
              sx={{ color: themeColor }}
            >
              Close
            </Button>
            <Button 
              variant="contained" 
              onClick={() => { setOpenProfileDialog(false); handleBookBabysitter(selectedBabysitter); }}
              sx={{ backgroundColor: themeColor, '&:hover': { backgroundColor: themeColorDark } }}
            >
              Book Now
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Profile Dialog */}
        <Dialog 
          open={openEditProfileDialog} 
          onClose={() => setOpenEditProfileDialog(false)} 
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
                value={editProfileData.name}
                onChange={(e) => setEditProfileData({ ...editProfileData, name: e.target.value })}
              />
              <TextField
                label="Phone Number"
                fullWidth
                value={editProfileData.phone}
                onChange={(e) => setEditProfileData({ ...editProfileData, phone: e.target.value })}
              />
              <TextField
                label="Address"
                fullWidth
                multiline
                rows={2}
                value={editProfileData.address}
                onChange={(e) => setEditProfileData({ ...editProfileData, address: e.target.value })}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ padding: 2 }}>
            <Button onClick={() => setOpenEditProfileDialog(false)}>Cancel</Button>
            <Button 
              variant="contained" 
              onClick={handleSaveProfile}
              disabled={editLoading || !editProfileData.name}
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

export default ParentDashboard;
