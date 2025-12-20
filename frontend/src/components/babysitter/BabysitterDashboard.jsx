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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton
} from '@mui/material';
import {
  Logout,
  Edit,
  School,
  Work,
  AttachMoney,
  Star,
  CheckCircle,
  Pending,
  Event,
  Person,
  Email,
  Phone,
  Badge,
  TrendingUp,
  Add as AddIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  Clear as ClearIcon,
  Message as MessageIcon,
  RateReview as RateReviewIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import KinderLogo from '../../assets/KinderLogo.png';
import KinderBackground from '../../assets/KinderBackground.jpg';

const BabysitterDashboard = () => {
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState('');
  const [profileIdMap, setProfileIdMap] = useState({});
  const [verificationStatus, setVerificationStatus] = useState('pending');
  const [rejectionReason, setRejectionReason] = useState('');
  const [openEditProfileDialog, setOpenEditProfileDialog] = useState(false);
  const [editProfileData, setEditProfileData] = useState({ name: '', phone: '', address: '' });
  const [editLoading, setEditLoading] = useState(false);
  const navigate = useNavigate();

  // Theme color for babysitters - Yellow
  const themeColor = '#FFEB3B';
  const themeColorDark = '#FBC02D';

  // Helper function to check if booking ID is real (MongoDB ID) or mock
  const isRealBookingId = (bookingId) => {
    if (!bookingId) return false;
    
    // MongoDB IDs are 24-character hex strings
    const idStr = bookingId.toString();
    const isMongoId = idStr.length === 24 && /^[0-9a-fA-F]+$/.test(idStr);
    
    return isMongoId;
  };

  // Skills management functions
  const removeSkill = (skillToRemove) => {
    if (window.confirm(`Remove "${skillToRemove}" from your skills?`)) {
      const updatedSkills = skills.filter(skill => skill !== skillToRemove);
      setSkills(updatedSkills);
      console.log('Skill removed:', skillToRemove);
    }
  };

  const addSkill = () => {
    const skill = newSkill.trim();
    
    if (!skill) {
      alert('Please enter a skill name');
      return;
    }
    
    if (skills.includes(skill)) {
      alert(`"${skill}" is already in your skills list`);
      return;
    }
    
    if (skills.length >= 10) {
      alert('Maximum 10 skills allowed');
      return;
    }
    
    setSkills([...skills, skill]);
    setNewSkill('');
    console.log('Skill added:', skill);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      addSkill();
    }
  };

  // Helper function: Calculate hours between times
  const calculateHours = (startTime, endTime) => {
    if (!startTime || !endTime) return 4;
    const start = parseInt(startTime.split(':')[0]);
    const end = parseInt(endTime.split(':')[0]);
    return Math.abs(end - start);
  };

  // Helper function: Calculate amount
  const calculateAmount = (booking, userRate) => {
    const hours = calculateHours(booking.startTime, booking.endTime);
    const rate = userRate || 300;
    return hours * rate;
  };

  // Function to build profile ID mapping dynamically
  const buildProfileIdMap = async () => {
    console.log('Building profile ID mapping...');
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/babysitters/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.babysitters) {
          const map = {};
          console.log(`Found ${data.babysitters.length} babysitters`);
          
          data.babysitters.forEach((babysitter, index) => {
            if (babysitter.userId && babysitter.id) {
              map[babysitter.userId] = babysitter.id;
              console.log(`   ${index + 1}. ${babysitter.name}: ${babysitter.userId} → ${babysitter.id}`);
            } else if (babysitter.userId && babysitter._id) {
              map[babysitter.userId] = babysitter._id;
              console.log(`   ${index + 1}. ${babysitter.name}: ${babysitter.userId} → ${babysitter._id}`);
            }
          });
          
          console.log('Profile ID mapping built:', map);
          return map;
        }
      }
      console.log('Could not fetch babysitters for mapping');
      return null;
    } catch (error) {
      console.error('Error building profile map:', error);
      return null;
    }
  };

  // UPDATED: Fetch real bookings from backend with dynamic mapping
  const fetchRealBookings = async (babysitterUserId) => {
    console.log('Fetching REAL bookings for babysitter USER ID:', babysitterUserId);
    
    try {
      const token = sessionStorage.getItem('token');
      console.log('Token available:', token ? 'YES' : 'NO');
      
      // First, build or get the profile ID mapping
      let mapping = profileIdMap;
      if (Object.keys(mapping).length === 0) {
        console.log('No mapping found, building new one...');
        mapping = await buildProfileIdMap() || {};
        setProfileIdMap(mapping);
        
        // Fallback to hardcoded mapping if dynamic fails
        if (Object.keys(mapping).length === 0) {
          console.log('Dynamic mapping failed, using hardcoded fallback');
          mapping = {
            '693b04b68ae27726f3f5e6cb': '693b04b68ae27726f3f5e6cd', // John Babysitter
            '693b276787fe929f5d3429d3': '693b276887fe929f5d3429d5', // Test Babysitter 2
          };
        }
      }
      
      const babysitterProfileId = mapping[babysitterUserId];
      
      console.log('Profile ID lookup:', {
        userId: babysitterUserId,
        profileId: babysitterProfileId,
        mappingAvailable: Object.keys(mapping).length > 0
      });
      
      if (!babysitterProfileId) {
        console.error('No profile ID found for user:', babysitterUserId);
        console.log('Available mappings:', mapping);
        setBookings([]);
        setLoading(false);
        return;
      }
      
      // Now fetch bookings
      const apiUrl = `http://localhost:3000/api/bookings/`;
      console.log('Calling bookings API:', apiUrl);
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Bookings API status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('REAL Bookings API response received');
        
        if (data.success && data.bookings) {
          console.log(`Total bookings from API: ${data.bookings.length}`);
          
          // Filter bookings: Check if booking.babysitterId matches the PROFILE ID
          const babysitterBookings = data.bookings.filter(booking => {
            const bookingBabysitterId = booking.babysitterId?.toString();
            const isMatch = bookingBabysitterId === babysitterProfileId.toString();
            
            if (isMatch) {
              console.log(`Booking ${booking._id} belongs to this babysitter`);
            }
            
            return isMatch;
          });
          
          console.log(`Found ${babysitterBookings.length} bookings for this babysitter`);
          
          if (babysitterBookings.length > 0) {
            // Transform API data to frontend format
            const formattedBookings = babysitterBookings.map(booking => ({
              id: booking._id,
              parent: booking.parentId?.name || booking.parentId?.username || booking.parentName || 'Parent',
              date: booking.date ? new Date(booking.date).toLocaleDateString() : 'No date',
              time: `${booking.startTime || '00:00'} - ${booking.endTime || '00:00'}`,
              hours: booking.hours || calculateHours(booking.startTime, booking.endTime),
              amount: booking.totalAmount || booking.amount || calculateAmount(booking, user?.babysitterProfile?.hourlyRate),
              status: booking.status || 'pending',
              children: booking.children || booking.numberOfChildren || booking.specialInstructions || 'Not specified',
              _raw: booking
            }));
            
            console.log('Formatted REAL bookings:', formattedBookings);
            setBookings(formattedBookings);
          } else {
            console.log('No bookings found for this babysitter');
            console.log('Looking for bookings where babysitterId =', babysitterProfileId);
            setBookings([]);
          }
          
          setLoading(false);
        } else {
          console.log('API returned no bookings:', data.message);
          setBookings([]);
          setLoading(false);
        }
      } else {
        console.error('Bookings API error:', response.status);
        setBookings([]);
        setLoading(false);
      }
    } catch (error) {
      console.error('Network error fetching bookings:', error);
      setBookings([]);
      setLoading(false);
    }
  };

  // Check verification status
  const checkVerificationStatus = async (userId) => {
    try {
      const response = await fetch(`http://localhost:3000/api/babysitters/verification-status/${userId}`);
      const data = await response.json();
      
      if (data.success) {
        console.log('Verification status:', data.data.verificationStatus);
        
        if (data.data.verificationStatus !== 'approved') {
          // Not approved, redirect to review page
          console.log('User not verified. Redirecting to review page...');
          navigate('/account-under-review');
          return null;
        }
        
        setVerificationStatus(data.data.verificationStatus);
        return data.data.verificationStatus;
      }
      // If check fails, redirect to review page
      navigate('/account-under-review');
      return null;
    } catch (error) {
      console.error('Error checking verification status:', error);
      navigate('/account-under-review');
      return null;
    }
  };

  // Debug function - REMOVED
  
  useEffect(() => {
    console.log('Babysitter Dashboard Loading');
    
    const storedUser = sessionStorage.getItem('user');
    const storedToken = sessionStorage.getItem('token');
    
    console.log('Stored user:', storedUser ? 'EXISTS' : 'MISSING');
    console.log('Stored token:', storedToken ? 'EXISTS' : 'MISSING');
    
    if (storedUser && storedToken) {
      const userData = JSON.parse(storedUser);
      console.log('Babysitter authenticated:', userData.name);
      console.log('User ID:', userData.id || userData._id);
      
      setUser(userData);
      
      // Check verification status first
      checkVerificationStatus(userData.id || userData._id);
      
      // Initialize skills from user profile
      const profile = userData.babysitterProfile || userData;
      const initialSkills = Array.isArray(profile.skills) ? 
        profile.skills.flatMap(skill => 
          typeof skill === 'string' ? 
            skill.split(',').map(s => s.trim()).filter(s => s) : 
            [skill]
        ) : 
        ['Childcare', 'Homework Help', 'First Aid'];
      
      console.log('Initial skills:', initialSkills);
      setSkills(initialSkills);
      
      // Fetch REAL bookings from API with correct ID
      fetchRealBookings(userData.id || userData._id);
    } else {
      console.log('No credentials found. Redirecting to login...');
      navigate('/login');
    }
  }, [navigate]);

  // Accept booking
  const acceptBooking = async (id) => {
    console.log('Accepting booking:', id);
    
    if (!isRealBookingId(id)) {
      alert('This appears to be an invalid booking ID. Please refresh and try again.');
      return;
    }
    
    try {
      const token = sessionStorage.getItem('token');
      console.log('Using token for API call');
      
      const response = await fetch(`http://localhost:3000/api/bookings/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'confirmed' })
      });
      
      console.log('API Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Accept booking response:', data);
        
        if (data.success) {
          // Update local state
          setBookings(bookings.map(booking => 
            booking.id === id ? { ...booking, status: 'confirmed' } : booking
          ));
          alert('Booking accepted successfully!');
          
          // Refresh bookings to get latest data
          const userData = JSON.parse(sessionStorage.getItem('user'));
          fetchRealBookings(userData?.id || userData?._id);
        } else {
          alert(`Error: ${data.message}`);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`Server error: ${errorData.message || response.statusText}`);
      }
    } catch (error) {
      console.log('Backend API failed:', error.message);
      alert('Error connecting to server. Please try again.');
    }
  };

  // Reject booking
  const rejectBooking = async (id) => {
    if (!window.confirm('Are you sure you want to reject this booking?')) {
      return;
    }
    
    console.log('Rejecting booking:', id);
    
    if (!isRealBookingId(id)) {
      alert('This appears to be an invalid booking ID. Please refresh and try again.');
      return;
    }
    
    try {
      const token = sessionStorage.getItem('token');
      console.log('Using token for API call');
      
      const response = await fetch(`http://localhost:3000/api/bookings/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'rejected' })
      });
      
      console.log('API Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Reject booking response:', data);
        
        if (data.success) {
          // Update local state
          setBookings(bookings.map(booking => 
            booking.id === id ? { ...booking, status: 'rejected' } : booking
          ));
          alert('Booking rejected successfully.');
          
          // Refresh bookings to get latest data
          const userData = JSON.parse(sessionStorage.getItem('user'));
          fetchRealBookings(userData?.id || userData?._id);
        } else {
          alert(`Error: ${data.message}`);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`Server error: ${errorData.message || response.statusText}`);
      }
    } catch (error) {
      console.log('Backend API failed:', error.message);
      alert('Error connecting to server. Please try again.');
    }
  };

  const handleLogout = () => {
    console.log('Logging out...');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
    window.location.href = '/';
  };

  // Show loading while checking auth
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
          <Paper sx={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.12)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: 3,
            padding: 4, 
            textAlign: 'center' 
          }}>
            <CircularProgress sx={{ color: themeColor }} />
            <Typography sx={{ marginTop: 2, color: 'white', fontWeight: 500 }}>
              Checking authentication...
            </Typography>
          </Paper>
        </Container>
      </Box>
    );
  }

  const profile = user.babysitterProfile || user;
  const userProfileId = profileIdMap[user.id || user._id];

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
      const response = await fetch(`http://localhost:3000/api/babysitters/profile/${user.id}`, {
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
                  Babysitter Dashboard
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
                  color: '#333',
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
              { icon: <AttachMoney />, label: 'Total Earnings', value: bookings.filter(b => b.status === 'completed').reduce((sum, b) => sum + (b.amount || 0), 0) + ' BDT', color: '#4CAF50' },
              { icon: <Pending />, label: 'Pending Requests', value: bookings.filter(b => b.status === 'pending').length, color: '#FF9800' },
              { icon: <CheckCircle />, label: 'Confirmed Jobs', value: bookings.filter(b => b.status === 'confirmed').length, color: themeColor },
              { icon: <Event />, label: 'Total Jobs', value: bookings.length, color: '#03A9F4' }
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
                      color: stat.color === themeColor ? '#333' : 'white'
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
                { icon: <School />, label: 'University', value: profile.university || 'Not set' },
                { icon: <Work />, label: 'Department', value: profile.department || 'Not set' },
                { icon: <Badge />, label: 'Year', value: profile.year || 'Not set' },
                { icon: <AttachMoney />, label: 'Hourly Rate', value: (profile.hourlyRate || '0') + ' BDT' }
              ].map((item, idx) => (
                <Grid item xs={12} sm={6} md={3} key={idx}>
                  <Box sx={{ 
                    padding: 2, 
                    backgroundColor: 'rgba(255, 235, 59, 0.15)', 
                    borderRadius: 2,
                    border: '1px solid rgba(255, 235, 59, 0.3)'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, marginBottom: 0.5 }}>
                      {React.cloneElement(item.icon, { sx: { fontSize: 18, color: themeColor } })}
                      <Typography sx={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                        {item.label}
                      </Typography>
                    </Box>
                    <Typography sx={{ fontWeight: 600, color: 'white' }}>
                      {item.value}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Skills Section */}
          <Box sx={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.3)', 
            borderRadius: 2, 
            padding: 2.5,
            marginBottom: 3,
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
                <Work sx={{ color: themeColor }} /> Your Skills
              </Typography>
              <Chip label={`${skills.length}/10`} sx={{ backgroundColor: themeColor, color: '#333', fontWeight: 600 }} />
            </Box>

            {skills.length === 0 ? (
              <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: 2 }}>
                No skills added yet. Add your first skill!
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', gap: 1, marginBottom: 2, flexWrap: 'wrap' }}>
                {skills.map((skill, index) => (
                  <Chip
                    key={index}
                    label={skill}
                    onDelete={() => removeSkill(skill)}
                    sx={{
                      backgroundColor: 'rgba(255, 235, 59, 0.2)',
                      color: 'white',
                      border: '1px solid rgba(255, 235, 59, 0.5)',
                      fontWeight: 600
                    }}
                  />
                ))}
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                size="small"
                placeholder="Enter a skill (e.g., 'Tutoring', 'First Aid')"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyPress={handleKeyPress}
                maxLength="50"
                sx={{ ...inputStyle, flex: 1 }}
              />
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={addSkill}
                disabled={!newSkill.trim()}
                sx={{
                  backgroundColor: themeColor,
                  color: '#333',
                  fontWeight: 600,
                  textTransform: 'none',
                  '&:hover': { backgroundColor: themeColorDark }
                }}
              >
                Add
              </Button>
            </Box>
            <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.6)', marginTop: 1 }}>
              Press Enter or click Add to save. Max 10 skills.
            </Typography>
          </Box>

          {/* Bookings Section */}
          <Box sx={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.3)', 
            borderRadius: 2, 
            padding: 2.5,
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'white', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Event sx={{ color: themeColor }} /> Your Bookings ({bookings.length})
            </Typography>

            {/* Status Badges */}
            <Box sx={{ display: 'flex', gap: 1, marginBottom: 3, flexWrap: 'wrap' }}>
              <Chip 
                label={`${bookings.filter(b => b.status === 'pending').length} Pending`} 
                sx={{ backgroundColor: 'rgba(255, 152, 0, 0.2)', color: '#FF9800', fontWeight: 600, border: '1px solid rgba(255, 152, 0, 0.5)' }} 
              />
              <Chip 
                label={`${bookings.filter(b => b.status === 'confirmed').length} Confirmed`} 
                sx={{ backgroundColor: 'rgba(255, 235, 59, 0.2)', color: themeColor, fontWeight: 600, border: '1px solid rgba(255, 235, 59, 0.5)' }} 
              />
              <Chip 
                label={`${bookings.filter(b => b.status === 'completed').length} Completed`} 
                sx={{ backgroundColor: 'rgba(76, 175, 80, 0.2)', color: '#4CAF50', fontWeight: 600, border: '1px solid rgba(76, 175, 80, 0.5)' }} 
              />
            </Box>

            {loading ? (
              <Box sx={{ textAlign: 'center', padding: 4 }}>
                <CircularProgress sx={{ color: themeColor }} />
                <Typography sx={{ marginTop: 2, color: 'white' }}>
                  Loading your bookings...
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
                      <TableCell sx={{ fontWeight: 700, color: '#333', borderBottom: 'none', py: 1.5 }}>Parent</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#333', borderBottom: 'none', py: 1.5 }}>Date & Time</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#333', borderBottom: 'none', py: 1.5 }}>Children</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#333', borderBottom: 'none', py: 1.5 }}>Amount</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#333', borderBottom: 'none', py: 1.5 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#333', borderBottom: 'none', py: 1.5 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody sx={{ backgroundColor: 'transparent' }}>
                    {bookings.map((booking) => (
                      <TableRow
                        key={booking.id}
                        sx={{
                          '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' },
                          backgroundColor: 'transparent'
                        }}
                      >
                        <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{
                              width: 36,
                              height: 36,
                              fontSize: '0.9rem',
                              fontWeight: 700,
                              backgroundColor: '#03A9F4',
                              color: 'white',
                              border: '2px solid rgba(3, 169, 244, 0.5)'
                            }}>
                              {(booking.parent || 'P').charAt(0).toUpperCase()}
                            </Avatar>
                            <Typography sx={{ fontSize: '0.9rem', color: 'white', fontWeight: 600 }}>
                              {booking.parent}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          <Typography sx={{ fontSize: '0.9rem', color: 'white', fontWeight: 600 }}>
                            {booking.date}
                          </Typography>
                          <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>
                            {booking.time} ({booking.hours} hrs)
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.9rem', color: 'white', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          {booking.children}
                        </TableCell>
                        <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          <Typography sx={{ fontWeight: 700, color: '#4CAF50', fontSize: '0.95rem' }}>
                            {booking.amount} BDT
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          <Chip
                            label={booking.status}
                            size="small"
                            sx={{
                              backgroundColor: 
                                booking.status === 'pending' ? 'rgba(255, 152, 0, 0.2)' :
                                booking.status === 'confirmed' ? 'rgba(255, 235, 59, 0.2)' :
                                booking.status === 'completed' ? 'rgba(76, 175, 80, 0.2)' :
                                'rgba(244, 67, 54, 0.2)',
                              color: 
                                booking.status === 'pending' ? '#FF9800' :
                                booking.status === 'confirmed' ? themeColor :
                                booking.status === 'completed' ? '#4CAF50' :
                                '#F44336',
                              fontWeight: 600,
                              border: '1px solid currentColor',
                              borderColor: 
                                booking.status === 'pending' ? 'rgba(255, 152, 0, 0.5)' :
                                booking.status === 'confirmed' ? 'rgba(255, 235, 59, 0.5)' :
                                booking.status === 'completed' ? 'rgba(76, 175, 80, 0.5)' :
                                'rgba(244, 67, 54, 0.5)'
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            {booking.status === 'pending' && (
                              <>
                                <IconButton
                                  size="small"
                                  onClick={() => acceptBooking(booking.id)}
                                  title="Accept Booking"
                                >
                                  <CheckIcon sx={{ color: '#4CAF50', fontSize: 20 }} />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() => rejectBooking(booking.id)}
                                  title="Reject Booking"
                                >
                                  <ClearIcon sx={{ color: '#F44336', fontSize: 20 }} />
                                </IconButton>
                              </>
                            )}
                            {booking.status === 'confirmed' && (
                              <IconButton
                                size="small"
                                title="Message Parent"
                              >
                                <MessageIcon sx={{ color: '#2196F3', fontSize: 20 }} />
                              </IconButton>
                            )}
                            {booking.status === 'completed' && (
                              <IconButton
                                size="small"
                                title="Leave Review"
                              >
                                <RateReviewIcon sx={{ color: '#FF9800', fontSize: 20 }} />
                              </IconButton>
                            )}
                            {(booking.status === 'cancelled' || booking.status === 'rejected') && (
                              <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                                No actions
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ textAlign: 'center', padding: 4 }}>
                <Event sx={{ fontSize: 60, color: themeColor, marginBottom: 1 }} />
                <Typography sx={{ fontWeight: 700, color: 'white', marginBottom: 1, fontSize: '1.2rem' }}>
                  No Bookings Yet
                </Typography>
                <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  When parents book your services, their requests will appear here.
                </Typography>
              </Box>
            )}
          </Box>

        </Paper>

        {/* Edit Profile Dialog */}
        <Dialog 
          open={openEditProfileDialog} 
          onClose={() => setOpenEditProfileDialog(false)} 
          maxWidth="sm" 
          fullWidth
          PaperProps={{ sx: { borderRadius: 2 } }}
        >
          <DialogTitle sx={{ backgroundColor: themeColor, color: '#333', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
            <EditIcon /> Edit Profile
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
              sx={{ backgroundColor: themeColor, color: '#333', '&:hover': { backgroundColor: themeColorDark } }}
            >
              {editLoading ? <CircularProgress size={24} color="inherit" /> : 'Save Changes'}
            </Button>
          </DialogActions>
        </Dialog>

      </Container>
    </Box>
  );
};

export default BabysitterDashboard;