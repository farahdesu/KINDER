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
  IconButton,
  Card,
  FormControl,
  Select,
  MenuItem
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
  const [openAvailabilityDialog, setOpenAvailabilityDialog] = useState(false);
  const [availability, setAvailability] = useState({
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: []
  });
  const [availabilitySaving, setAvailabilitySaving] = useState(false);
  const [openParentDetailsDialog, setOpenParentDetailsDialog] = useState(false);
  const [selectedParentDetails, setSelectedParentDetails] = useState(null);
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
      saveSkillsToBackend(updatedSkills);
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
    
    const updatedSkills = [...skills, skill];
    setSkills(updatedSkills);
    setNewSkill('');
    saveSkillsToBackend(updatedSkills);
    console.log('Skill added:', skill);
  };

  const saveSkillsToBackend = async (skillsArray) => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/babysitters/skills', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ skills: skillsArray })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Skills saved to backend:', data);
        
        // Update session storage to persist the skills across page refreshes
        const storedUser = sessionStorage.getItem('user');
        if (storedUser) {
          const updatedUser = JSON.parse(storedUser);
          if (!updatedUser.babysitterProfile) {
            updatedUser.babysitterProfile = {};
          }
          updatedUser.babysitterProfile.skills = skillsArray;
          sessionStorage.setItem('user', JSON.stringify(updatedUser));
          console.log('Session storage updated with new skills:', skillsArray);
        }
      } else {
        const errorData = await response.json();
        console.error('Error saving skills:', errorData.message);
        alert('Failed to save skills: ' + (errorData.message || 'Server error'));
      }
    } catch (error) {
      console.error('Error saving skills to backend:', error);
      alert('Failed to save skills. Please try again.');
    }
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
              parent: booking.parentId?.userId?.name || booking.parentId?.name || booking.parentName || 'Parent',
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

  // Fetch fresh babysitter profile from backend to ensure skills are up-to-date
  const fetchBabysitterProfile = async (userId) => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/babysitters/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched current babysitter profile:', data.babysitter);
        
        if (data.babysitter) {
          const babysitterProfile = data.babysitter;
          
          // Update session storage with fresh skills
          const storedUser = sessionStorage.getItem('user');
          if (storedUser) {
            const updatedUser = JSON.parse(storedUser);
            updatedUser.babysitterProfile = {
              ...updatedUser.babysitterProfile,
              skills: babysitterProfile.skills
            };
            sessionStorage.setItem('user', JSON.stringify(updatedUser));
            
            // Update local skills state
            const fetchedSkills = Array.isArray(babysitterProfile.skills) ? 
              babysitterProfile.skills : 
              ['Childcare', 'Homework Help', 'First Aid'];
            setSkills(fetchedSkills);
            
            console.log('Profile refreshed with latest skills:', fetchedSkills);
          }
        }
      } else {
        console.error('Failed to fetch babysitter profile');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Silently fail - use session storage skills
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
      
      // Fetch fresh babysitter profile from backend to ensure latest skills
      fetchBabysitterProfile(userData.id || userData._id);
      
      // Initialize skills from user profile (will be updated by fetchBabysitterProfile)
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

  const handleOpenAvailabilityDialog = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/babysitters/me/availability`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAvailability(data.availability || {
          monday: [],
          tuesday: [],
          wednesday: [],
          thursday: [],
          friday: [],
          saturday: [],
          sunday: []
        });
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
    }
    setOpenAvailabilityDialog(true);
  };

  const handleSaveAvailability = async () => {
    setAvailabilitySaving(true);
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/babysitters/availability`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ availability })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setOpenAvailabilityDialog(false);
        alert('Availability updated successfully!');
      } else {
        alert(data.message || 'Failed to update availability');
      }
    } catch (error) {
      console.error('Error updating availability:', error);
      alert('Error updating availability');
    } finally {
      setAvailabilitySaving(false);
    }
  };

  // View parent details
  const handleViewParentDetails = (booking) => {
    // Extract parent phone from the nested API response structure
    const parentPhone = booking._raw?.parentId?.userId?.phone || 
                       booking._raw?.parentId?.phone ||
                       booking._raw?.parentPhone || 
                       'Not provided';
    
    setSelectedParentDetails({
      name: booking.parent || 'Parent',
      address: booking._raw?.address || 'Not provided',
      phone: parentPhone,
      date: booking.date,
      time: booking.time,
      specialInstructions: booking._raw?.specialInstructions || 'None'
    });
    setOpenParentDetailsDialog(true);
  };

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  
  // Pre-defined quick time slots for easy selection
  const quickTimeSlots = [
    { label: 'Morning', start: '09:00', end: '12:00' },
    { label: 'Afternoon', start: '14:00', end: '17:00' },
    { label: 'Evening', start: '18:00', end: '21:00' }
  ];
  
  // Generate time options from 8 AM to 10 PM (22:00) in 1-hour intervals
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 8; hour <= 22; hour++) {
      const time = `${String(hour).padStart(2, '0')}:00`;
      const ampm = hour < 12 ? 'AM' : hour === 12 ? 'PM' : 'PM';
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      options.push({
        value: time,
        label: `${displayHour}:00 ${ampm}`
      });
    }
    return options;
  };
  
  const timeOptions = generateTimeOptions();

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
                startIcon={<Event />}
                onClick={handleOpenAvailabilityDialog}
                sx={{
                  backgroundColor: '#f5eb33ff',
                  color: '#111', // 👈 black text & icon
                  fontWeight: 600,
                  textTransform: 'none',
                  '&:hover': { backgroundColor: '#1976D2' }
                }}
              >
                Set Schedule
              </Button>
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
                                onClick={() => handleViewParentDetails(booking)}
                                title="View Parent Details"
                              >
                                <Person sx={{ color: '#2196F3', fontSize: 20 }} />
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

        {/* Availability/Schedule Dialog - Redesigned with Card Grid Layout */}
        <Dialog 
          open={openAvailabilityDialog} 
          onClose={() => setOpenAvailabilityDialog(false)} 
          maxWidth="md" 
          fullWidth
          PaperProps={{ sx: { borderRadius: 2 } }}
        >
          <DialogTitle sx={{ backgroundColor: '#2196F3', color: 'white', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1, fontSize: '1.3rem' }}>
            <Event /> Set Your Weekly Availability
          </DialogTitle>
          <DialogContent sx={{ paddingTop: 3, backgroundColor: '#f5f5f5' }}>
            <Typography sx={{ mb: 2, color: 'rgba(0,0,0,0.7)', fontSize: '0.95rem', fontWeight: 500 }}>
              Set your available time slots for each day. Parents will only be able to book you during these times.
            </Typography>
            
            {/* Quick Time Slots Selection */}
            <Box sx={{ mb: 4, p: 2.5, backgroundColor: 'white', borderRadius: 2, border: '2px solid #FF9800' }}>
              <Typography sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1, color: '#333' }}>
                ⚡ Quick Add Time Slots
              </Typography>
              <Typography sx={{ fontSize: '0.85rem', color: 'rgba(0,0,0,0.6)', mb: 2 }}>
                Select a pre-defined time slot and it will be added to all selected days:
              </Typography>
              
              <Grid container spacing={1.5} sx={{ mb: 2 }}>
                {quickTimeSlots.map((slot, idx) => (
                  <Grid item xs={4} key={idx}>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={() => {
                        const daysToAdd = days.filter(day => {
                          // Add to days that don't already have this exact slot
                          return !(availability[day] || []).some(s => s.start === slot.start && s.end === slot.end);
                        });
                        
                        if (daysToAdd.length === 0) {
                          alert('This slot already exists in all days');
                          return;
                        }
                        
                        const newAvailability = { ...availability };
                        daysToAdd.forEach(day => {
                          newAvailability[day] = [...(newAvailability[day] || []), { start: slot.start, end: slot.end }];
                        });
                        setAvailability(newAvailability);
                        alert(`Added ${slot.label} (${slot.start}-${slot.end}) to ${daysToAdd.length} days`);
                      }}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        color: '#FF9800',
                        borderColor: '#FF9800',
                        backgroundColor: 'rgba(255, 152, 0, 0.05)',
                        fontSize: '0.9rem',
                        py: 1.5,
                        '&:hover': {
                          backgroundColor: 'rgba(255, 152, 0, 0.15)',
                          borderColor: '#F57C00'
                        }
                      }}
                    >
                      <Box>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.9rem' }}>{slot.label}</Typography>
                        <Typography sx={{ fontSize: '0.75rem', opacity: 0.8 }}>{slot.start}-{slot.end}</Typography>
                      </Box>
                    </Button>
                  </Grid>
                ))}
              </Grid>
              <Typography sx={{ fontSize: '0.8rem', color: 'rgba(255, 152, 0, 0.8)', fontStyle: 'italic' }}>
                💡 Tip: Quick slots are added to all days that don't already have this exact time slot
              </Typography>
            </Box>
            
            <Grid container spacing={2.5}>
              {days.map((day) => {
                const daySlots = availability[day] || [];
                return (
                  <Grid item xs={12} sm={6} key={day}>
                    <Card sx={{ 
                      p: 2.5, 
                      border: '2px solid #2196F3',
                      borderRadius: 2,
                      backgroundColor: 'white',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: '0 8px 24px rgba(33, 150, 243, 0.3)',
                        transform: 'translateY(-2px)'
                      }
                    }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography sx={{ fontWeight: 700, textTransform: 'capitalize', color: '#333', fontSize: '1.1rem' }}>
                          {day}
                        </Typography>
                        <Typography sx={{ 
                          fontSize: '0.8rem',
                          backgroundColor: '#2196F3',
                          color: 'white',
                          padding: '4px 12px',
                          borderRadius: 20,
                          fontWeight: 600
                        }}>
                          {daySlots.length} slot{daySlots.length !== 1 ? 's' : ''}
                        </Typography>
                      </Box>
                      
                      {/* Display existing slots */}
                      {daySlots.length > 0 ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
                          {daySlots.map((slot, idx) => (
                            <Box
                              key={idx}
                              sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                backgroundColor: 'rgba(33, 150, 243, 0.08)',
                                padding: '10px 12px',
                                borderRadius: 1,
                                border: '1px solid rgba(33, 150, 243, 0.3)',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                  backgroundColor: 'rgba(33, 150, 243, 0.15)',
                                }
                              }}
                            >
                              <Typography sx={{ fontWeight: 600, color: '#1976D2', fontSize: '0.95rem' }}>
                                {slot.start} — {slot.end}
                              </Typography>
                              <IconButton
                                size="small"
                                onClick={() => {
                                  const updated = daySlots.filter((_, i) => i !== idx);
                                  setAvailability({ ...availability, [day]: updated });
                                }}
                                sx={{ 
                                  color: '#F44336',
                                  '&:hover': { backgroundColor: 'rgba(244, 67, 54, 0.1)' }
                                }}
                              >
                                <DeleteIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Box>
                          ))}
                        </Box>
                      ) : (
                        <Typography sx={{ 
                          fontSize: '0.85rem', 
                          color: 'rgba(0,0,0,0.4)', 
                          mb: 2,
                          fontStyle: 'italic',
                          textAlign: 'center',
                          padding: '12px'
                        }}>
                          No slots added yet
                        </Typography>
                      )}
                      
                      {/* Custom Time Slot Input with Dropdowns */}
                      <Box sx={{ 
                        display: 'flex', 
                        gap: 1, 
                        flexWrap: 'wrap',
                        mt: 2,
                        pt: 2,
                        borderTop: '1px solid rgba(33, 150, 243, 0.2)'
                      }}>
                        <FormControl size="small" sx={{ flex: 1, minWidth: '100px' }}>
                          <Typography sx={{ fontSize: '0.8rem', color: '#666', mb: 0.5, fontWeight: 600 }}>
                            Start Time
                          </Typography>
                          <Select
                            value={availability[day]?.__startTime || ''}
                            onChange={(e) => {
                              // Store temp start time for UI purposes
                              const newAvail = { ...availability };
                              if (!newAvail[day]) newAvail[day] = [];
                              newAvail[day].__startTime = e.target.value;
                              setAvailability(newAvail);
                            }}
                            sx={{
                              backgroundColor: 'white',
                              color: '#333',
                              fontWeight: 600,
                              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#2196F3' },
                              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#1976D2' },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#1976D2' },
                              '& .MuiSvgIcon-root': { color: '#2196F3' }
                            }}
                            MenuProps={{
                              PaperProps: {
                                sx: {
                                  backgroundColor: 'white',
                                  maxHeight: '300px',
                                  '& .MuiMenuItem-root': {
                                    color: '#333',
                                    fontWeight: 600,
                                    '&:hover': { backgroundColor: 'rgba(33, 150, 243, 0.1)' },
                                    '&.Mui-selected': { backgroundColor: 'rgba(33, 150, 243, 0.2)' }
                                  }
                                }
                              }
                            }}
                          >
                            <MenuItem value=""><em>Select start time...</em></MenuItem>
                            {timeOptions.map((opt) => (
                              <MenuItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        
                        <FormControl size="small" sx={{ flex: 1, minWidth: '100px' }}>
                          <Typography sx={{ fontSize: '0.8rem', color: '#666', mb: 0.5, fontWeight: 600 }}>
                            End Time
                          </Typography>
                          <Select
                            value={availability[day]?.__endTime || ''}
                            onChange={(e) => {
                              // Store temp end time for UI purposes
                              const newAvail = { ...availability };
                              if (!newAvail[day]) newAvail[day] = [];
                              newAvail[day].__endTime = e.target.value;
                              setAvailability(newAvail);
                            }}
                            sx={{
                              backgroundColor: 'white',
                              color: '#333',
                              fontWeight: 600,
                              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#2196F3' },
                              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#1976D2' },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#1976D2' },
                              '& .MuiSvgIcon-root': { color: '#2196F3' }
                            }}
                            MenuProps={{
                              PaperProps: {
                                sx: {
                                  backgroundColor: 'white',
                                  maxHeight: '300px',
                                  '& .MuiMenuItem-root': {
                                    color: '#333',
                                    fontWeight: 600,
                                    '&:hover': { backgroundColor: 'rgba(33, 150, 243, 0.1)' },
                                    '&.Mui-selected': { backgroundColor: 'rgba(33, 150, 243, 0.2)' }
                                  }
                                }
                              }
                            }}
                          >
                            <MenuItem value=""><em>Select end time...</em></MenuItem>
                            {timeOptions.map((opt) => (
                              <MenuItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<AddIcon />}
                          onClick={() => {
                            const startTime = availability[day]?.__startTime;
                            const endTime = availability[day]?.__endTime;
                            
                            if (!startTime || !endTime) {
                              alert('Please select both start and end times');
                              return;
                            }
                            
                            if (startTime >= endTime) {
                              alert('End time must be after start time');
                              return;
                            }
                            
                            const newSlot = { start: startTime, end: endTime };
                            const newDaySlots = (availability[day] || []).filter(s => s.start && s.end);
                            const updated = [...newDaySlots, newSlot];
                            
                            const newAvail = { ...availability };
                            newAvail[day] = updated;
                            delete newAvail[day].__startTime;
                            delete newAvail[day].__endTime;
                            setAvailability(newAvail);
                          }}
                          sx={{ 
                            backgroundColor: '#2196F3',
                            color: 'white',
                            fontWeight: 600,
                            alignSelf: 'flex-end',
                            '&:hover': { backgroundColor: '#1976D2' }
                          }}
                        >
                          Add Slot
                        </Button>
                      </Box>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </DialogContent>
          <DialogActions sx={{ padding: 2.5, backgroundColor: '#f5f5f5' }}>
            <Button 
              onClick={() => setOpenAvailabilityDialog(false)}
              sx={{ color: '#666', fontWeight: 600 }}
            >
              Cancel
            </Button>
            <Button 
              variant="contained" 
              onClick={handleSaveAvailability}
              disabled={availabilitySaving}
              sx={{ 
                backgroundColor: '#2196F3', 
                fontWeight: 600,
                '&:hover': { backgroundColor: '#1976D2' },
                '&:disabled': { backgroundColor: '#ccc' }
              }}
            >
              {availabilitySaving ? <CircularProgress size={24} color="inherit" /> : 'Save Schedule'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Parent Details Dialog */}
        <Dialog 
          open={openParentDetailsDialog} 
          onClose={() => setOpenParentDetailsDialog(false)} 
          maxWidth="sm" 
          fullWidth
          PaperProps={{ sx: { borderRadius: 2 } }}
        >
          <DialogTitle sx={{ backgroundColor: '#03A9F4', color: 'white', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Person /> Parent Booking Details
          </DialogTitle>
          <DialogContent sx={{ paddingTop: 3 }}>
            {selectedParentDetails && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography sx={{ fontSize: '0.85rem', color: 'rgba(0,0,0,0.6)', fontWeight: 600 }}>
                    Parent Name
                  </Typography>
                  <Typography sx={{ fontSize: '1rem', color: '#333', fontWeight: 700 }}>
                    {selectedParentDetails.name}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography sx={{ fontSize: '0.85rem', color: 'rgba(0,0,0,0.6)', fontWeight: 600 }}>
                    Phone Number
                  </Typography>
                  <Typography sx={{ fontSize: '1rem', color: '#333', fontWeight: 700 }}>
                    {selectedParentDetails.phone}
                  </Typography>
                </Box>

                <Box>
                  <Typography sx={{ fontSize: '0.85rem', color: 'rgba(0,0,0,0.6)', fontWeight: 600 }}>
                    Address
                  </Typography>
                  <Typography sx={{ fontSize: '0.95rem', color: '#333' }}>
                    {selectedParentDetails.address}
                  </Typography>
                </Box>

                <Box>
                  <Typography sx={{ fontSize: '0.85rem', color: 'rgba(0,0,0,0.6)', fontWeight: 600 }}>
                    Booking Date & Time
                  </Typography>
                  <Typography sx={{ fontSize: '0.95rem', color: '#333' }}>
                    {selectedParentDetails.date} - {selectedParentDetails.time}
                  </Typography>
                </Box>

                {selectedParentDetails.specialInstructions && selectedParentDetails.specialInstructions !== 'None' && (
                  <Box>
                    <Typography sx={{ fontSize: '0.85rem', color: 'rgba(0,0,0,0.6)', fontWeight: 600 }}>
                      Special Instructions
                    </Typography>
                    <Typography sx={{ fontSize: '0.95rem', color: '#333' }}>
                      {selectedParentDetails.specialInstructions}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ padding: 2 }}>
            <Button onClick={() => setOpenParentDetailsDialog(false)} sx={{ color: '#03A9F4' }}>
              Close
            </Button>
          </DialogActions>
        </Dialog>

      </Container>
    </Box>
  );
};

export default BabysitterDashboard;