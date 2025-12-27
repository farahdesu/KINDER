import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Paper,
  Box,
  Typography,
  Button,
  TextField,
  Grid,
  Card,
  Chip,
  Avatar,
  CircularProgress,
  FormControl,
  Select,
  MenuItem,
  Alert
} from '@mui/material';
import {
  ArrowBack,
  Person,
  School,
  Star,
  AccessTime,
  CalendarMonth,
  LocationOn,
  ChildCare,
  AttachMoney,
  Send,
  CheckCircle,
  Cancel,
  WbSunny,
  LightMode,
  NightsStay
} from '@mui/icons-material';
import KinderLogo from '../../assets/KinderLogo.png';
import KinderBackground from '../../assets/KinderBackground.jpg';

const BookBabysitterPage = () => {
  const { babysitterId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [babysitter, setBabysitter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);

  // Get user info early for default address
  const user = JSON.parse(sessionStorage.getItem('user') || '{}');

  // Booking form state
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('14:00');
  const [endTime, setEndTime] = useState('17:00');
  const [address, setAddress] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchingAddress, setSearchingAddress] = useState(false);
  const [children, setChildren] = useState('1 child');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [availabilityMessage, setAvailabilityMessage] = useState('');

  // Fetch parent's default address
  useEffect(() => {
    const fetchParentAddress = async () => {
      try {
        const token = sessionStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/api/parents/profile/${user.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data.address) {
            setAddress(data.data.address);
          }
        }
      } catch (error) {
        console.log('Could not fetch default address');
      }
    };
    
    if (user.id) {
      fetchParentAddress();
    }
  }, [user.id]);

  // Search address using OpenStreetMap Nominatim (FREE)
  const searchAddress = async (query) => {
    if (query.length < 3) {
      setAddressSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setSearchingAddress(true);
    try {
      // Using Nominatim API - completely free, no API key needed
      // Adding Bangladesh bias for more relevant results
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=bd&limit=5&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'en'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setAddressSuggestions(data);
        setShowSuggestions(data.length > 0);
      }
    } catch (error) {
      console.log('Address search error:', error);
    } finally {
      setSearchingAddress(false);
    }
  };

  // Debounce address search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (address && address.length >= 3) {
        searchAddress(address);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [address]);

  // Select address from suggestions
  const selectAddress = (suggestion) => {
    setAddress(suggestion.display_name);
    setShowSuggestions(false);
    setAddressSuggestions([]);
  };

  // Theme color for parents - Sky Blue
  const themeColor = '#03A9F4';
  const themeColorDark = '#0288D1';

  // Set default date to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDate = tomorrow.toISOString().split('T')[0];

  // Time options (9 AM to 9 PM)
  const timeOptions = Array.from({ length: 13 }, (_, i) => {
    const hour = i + 9;
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  // Quick time slots - using icon names instead of emojis
  const quickTimeSlots = [
    { start: '09:00', end: '12:00', label: 'Morning', iconType: 'morning' },
    { start: '14:00', end: '17:00', label: 'Afternoon', iconType: 'afternoon' },
    { start: '18:00', end: '21:00', label: 'Evening', iconType: 'evening' },
  ];
  
  // Orange color for time slots
  const timeSlotColor = '#FF9800';
  const timeSlotColorDark = '#F57C00';

  // Glass style
  const glassStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: 3
  };

  // Input style
  const inputStyle = {
    backgroundColor: 'rgba(60, 60, 60, 0.9)',
    borderRadius: 1,
    '& .MuiOutlinedInput-root': {
      color: 'white',
      '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
      '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.5)' },
      '&.Mui-focused fieldset': { borderColor: themeColor }
    },
    '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
    '& .MuiInputLabel-root.Mui-focused': { color: themeColor },
    '& input': { color: 'white' },
    '& textarea': { color: 'white' }
  };

  // Fetch babysitter details
  useEffect(() => {
    const fetchBabysitterDetails = async () => {
      try {
        const token = sessionStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/api/babysitters/${babysitterId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setBabysitter(data.babysitter);
          } else {
            navigate('/parent-dashboard');
          }
        }
      } catch (error) {
        console.error('Error fetching babysitter:', error);
        navigate('/parent-dashboard');
      } finally {
        setLoading(false);
      }
    };

    if (babysitterId) {
      fetchBabysitterDetails();
    } else if (location.state?.babysitter) {
      setBabysitter(location.state.babysitter);
      setLoading(false);
    } else {
      navigate('/parent-dashboard');
    }
  }, [babysitterId, navigate, location.state]);

  // Fetch babysitter's existing bookings
  useEffect(() => {
    const fetchBabysitterBookings = async () => {
      if (!babysitter) return;
      try {
        const token = sessionStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/bookings/', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.bookings) {
            const babysitterBookings = data.bookings.filter(
              booking => booking.babysitterId === babysitter.id
            );
            setBookings(babysitterBookings);
          }
        }
      } catch (error) {
        console.log('Could not fetch bookings:', error);
      }
    };
    fetchBabysitterBookings();
  }, [babysitter]);

  // Check 24-hour advance rule
  const is24HoursInAdvance = (selectedDate) => {
    const now = new Date();
    const bookingDate = new Date(selectedDate);
    const timeDifference = bookingDate - now;
    const hoursDifference = timeDifference / (1000 * 60 * 60);
    return hoursDifference >= 24;
  };

  // Validate time selection
  const validateTimeSelection = () => {
    if (startTime >= endTime) return '❌ End time must be after start time';
    const startHour = parseInt(startTime.split(':')[0]);
    const endHour = parseInt(endTime.split(':')[0]);
    const duration = endHour - startHour;
    if (duration < 2) return '❌ Minimum booking is 2 hours';
    if (duration > 8) return '❌ Maximum booking is 8 hours per day';
    return null;
  };

  // Function to check if time slot is within babysitter's free time
  const isWithinBabysitterAvailability = () => {
    if (!babysitter || !date) return false;
    
    const selectedDate = new Date(date);
    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][selectedDate.getDay()];
    const freeSlots = babysitter.availability?.[dayOfWeek] || [];
    
    if (!freeSlots || freeSlots.length === 0) return false;
    
    // Check if requested time falls within any free slot
    const timeSlotOverlaps = (start1, end1, start2, end2) => {
      const s1 = parseInt(start1.replace(':', ''));
      const e1 = parseInt(end1.replace(':', ''));
      const s2 = parseInt(start2.replace(':', ''));
      const e2 = parseInt(end2.replace(':', ''));
      return !(e1 <= s2 || e2 <= s1);
    };
    
    return freeSlots.some(slot => timeSlotOverlaps(startTime, endTime, slot.start, slot.end));
  };

  // Check availability when form changes
  useEffect(() => {
    if (!babysitter || !date) return;
    const selectedDate = date || defaultDate;

    if (!is24HoursInAdvance(selectedDate)) {
      setAvailabilityMessage('❌ Bookings must be made at least 24 hours in advance');
      return;
    }

    const validationError = validateTimeSelection();
    if (validationError) {
      setAvailabilityMessage(validationError);
      return;
    }

    // Check if time is within babysitter's free time slots
    if (!isWithinBabysitterAvailability()) {
      setAvailabilityMessage('❌ This time is outside babysitter\'s available hours on this day');
      return;
    }

    // Check for booking conflicts
    if (bookings.length > 0) {
      const hasConflict = checkForBookingConflicts({ date: selectedDate, startTime, endTime }, bookings);
      setAvailabilityMessage(hasConflict ? '❌ Babysitter is already booked at this time' : '✅ Time slot is available');
    } else {
      setAvailabilityMessage('✅ Time slot is available');
    }
  }, [date, startTime, endTime, babysitter, bookings, defaultDate]);

  // Check for booking conflicts
  const checkForBookingConflicts = (newBooking, existingBookings) => {
    const newDate = new Date(newBooking.date).toDateString();
    const parseTime = (timeStr) => parseInt(timeStr.split(':')[0]);
    const newStartHour = parseTime(newBooking.startTime);
    const newEndHour = parseTime(newBooking.endTime);

    for (const existing of existingBookings) {
      if (['rejected', 'cancelled'].includes(existing.status)) continue;
      const existingDate = new Date(existing.date).toDateString();
      if (existingDate !== newDate) continue;
      const existingStartHour = parseTime(existing.startTime);
      const existingEndHour = parseTime(existing.endTime);
      if (newStartHour < existingEndHour && newEndHour > existingStartHour) return true;
    }
    return false;
  };

  // Calculate hours and amount
  const calculateHours = (start, end) => {
    const startHour = parseInt(start.split(':')[0]);
    const endHour = parseInt(end.split(':')[0]);
    return Math.abs(endHour - startHour);
  };

    // Handle form submit
const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  setSubmitting(true);

  if (!date) {
      setError('Please select a date');
    setSubmitting(false);
    return;
  }

  if (!is24HoursInAdvance(date)) {
      setError('Bookings must be made at least 24 hours in advance');
    setSubmitting(false);
    return;
  }

  const validationError = validateTimeSelection();
  if (validationError) {
      setError(validationError.replace('❌ ', ''));
    setSubmitting(false);
    return;
  }

  // Check if time is within babysitter's availability
  if (!isWithinBabysitterAvailability()) {
      setError('This time is outside babysitter\'s available hours on this day');
    setSubmitting(false);
    return;
  }

    if (!address.trim()) {
      setError('Please enter your address');
      setSubmitting(false);
      return;
    }

  // Check availability with the backend
  try {
    const token = sessionStorage.getItem('token');
    const formattedDate = new Date(date).toISOString().split('T')[0];
    const availabilityResponse = await fetch(
      `http://localhost:3000/api/bookings/check-availability/${babysitter._id || babysitter.id}?date=${formattedDate}&startTime=${startTime}&endTime=${endTime}`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );

    const availabilityData = await availabilityResponse.json();
    if (!availabilityData.available) {
      let errorMsg = availabilityData.message || 'Time slot is not available';
      if (availabilityData.reason === 'no_free_slots') {
        errorMsg = 'Babysitter is not available on this day';
      } else if (availabilityData.reason === 'outside_available_hours') {
        errorMsg = 'This time is outside babysitter\'s available hours';
      } else if (availabilityData.reason === 'time_conflict') {
        errorMsg = 'This time slot is already booked or pending';
      }
      setError(errorMsg);
      setSubmitting(false);
      return;
    }
  } catch (err) {
    console.error('Error checking availability:', err);
    // Continue anyway, let server validate
  }

  const formattedDate = new Date(date).toISOString().split('T')[0];
  const bookingData = {
      babysitterId: babysitter._id || babysitter.id,
      date: formattedDate,
      startTime,
      endTime,
    address: address.trim(),
    specialInstructions: specialInstructions.trim() || '',
      children: children.trim() || '1 child'
    };

    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/bookings/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bookingData)
    });

      const data = await response.json();

    if (data.success) {
      alert('Booking request sent successfully! Waiting for babysitter confirmation.');
      navigate('/parent-dashboard');
    } else {
      setError(data.message || 'Booking failed. Please try again.');
    }
  } catch (err) {
      setError('Network error. Please check your connection.');
  } finally {
    setSubmitting(false);
  }
  };

  const estimatedHours = calculateHours(startTime, endTime);
  const estimatedAmount = babysitter ? estimatedHours * babysitter.hourlyRate : 0;

  if (loading) {
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

  if (!babysitter) {
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
        <Paper sx={{ ...glassStyle, padding: 4, textAlign: 'center' }}>
          <Typography variant="h5" sx={{ color: 'white', mb: 2 }}>Babysitter not found</Typography>
          <Button variant="contained" onClick={() => navigate('/parent-dashboard')} sx={{ backgroundColor: themeColor }}>
          Back to Dashboard
          </Button>
        </Paper>
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
        <Paper sx={{ ...glassStyle, padding: 3, overflow: 'hidden' }}>

          {/* Header */}
          <Box sx={{
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
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
                <Typography variant="h4" sx={{ 
                  fontWeight: 800, 
                  color: 'white',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.4)',
                  letterSpacing: '0.5px'
                }}>
                  Booking Page
                </Typography>
                <Typography sx={{ 
                  color: 'white', 
                  fontSize: '1rem',
                  fontWeight: 500,
                  textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                  textAlign: 'left',
                  mt: 0.3
                }}>
                  Book Babysitter now.
                </Typography>
              </Box>
            </Box>
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

          {/* Page Title - Babysitter Name Only */}
          <Typography variant="h4" sx={{ 
            color: 'white', 
            fontWeight: 700, 
            textAlign: 'center', 
            mb: 3,
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
          }}>
            {babysitter.name}
          </Typography>

          <Grid container spacing={3}>
            {/* Left Column - Babysitter Profile */}
            <Grid item xs={12} md={4}>
              {/* Profile Card */}
              <Card sx={{ 
                backgroundColor: 'rgba(0, 0, 0, 0.4)', 
                borderRadius: 2, 
                padding: 2.5,
                mb: 2,
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <Avatar sx={{
                    width: 80,
                    height: 80,
                    backgroundColor: '#FFEB3B',
                    color: '#333',
                    fontSize: '2rem',
                    fontWeight: 700,
                    margin: '0 auto',
                    mb: 1,
                    border: '3px solid rgba(255,255,255,0.3)'
                  }}>
                    {babysitter.name?.charAt(0).toUpperCase()}
                  </Avatar>
                  <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>
                    {babysitter.name}
                  </Typography>
                  <Chip
                    icon={<Star sx={{ color: '#FFD700 !important' }} />}
                    label={`${babysitter.rating || '5.0'} Rating`}
                    size="small"
                    sx={{ backgroundColor: 'rgba(255,215,0,0.2)', color: 'white', mt: 1 }}
                  />
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <School sx={{ color: themeColor }} />
                    <Typography sx={{ color: 'white', fontSize: '0.9rem' }}>
                      {babysitter.university}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Person sx={{ color: themeColor }} />
                    <Typography sx={{ color: 'white', fontSize: '0.9rem' }}>
                      {babysitter.department} - Year {babysitter.year}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AttachMoney sx={{ color: '#4CAF50' }} />
                    <Typography sx={{ color: '#4CAF50', fontWeight: 700, fontSize: '1.1rem' }}>
                      ৳{babysitter.hourlyRate}/hour
                    </Typography>
                  </Box>
                </Box>

                {/* Skills */}
                <Box sx={{ mt: 2 }}>
                  <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', mb: 1 }}>
                    Skills
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(Array.isArray(babysitter.skills) ? babysitter.skills : ['Childcare']).map((skill, idx) => (
                      <Chip key={idx} label={skill} size="small" sx={{ 
                        backgroundColor: 'rgba(3,169,244,0.3)', 
                        color: 'white',
                        fontSize: '0.75rem'
                      }} />
                    ))}
                  </Box>
                </Box>
            
                {/* Stats */}
                <Box sx={{ display: 'flex', gap: 2, mt: 2, justifyContent: 'center' }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" sx={{ color: themeColor, fontWeight: 700 }}>
                      {babysitter.totalJobs || 0}
                    </Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem' }}>
                      Jobs Done
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" sx={{ color: '#FF9800', fontWeight: 700 }}>
                      {babysitter.experience || 'New'}
                    </Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem' }}>
                      Experience
                    </Typography>
                  </Box>
                </Box>
              </Card>

              {/* Guidelines Card */}
              <Card sx={{ 
                backgroundColor: 'rgba(0, 0, 0, 0.4)', 
                borderRadius: 2, 
                padding: 2,
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <Typography sx={{ color: 'white', fontWeight: 700, mb: 1.5 }}>
                  📋 Booking Guidelines
                </Typography>
                <Box component="ul" sx={{ color: 'rgba(255,255,255,0.8)', pl: 2, m: 0, fontSize: '0.85rem' }}>
              <li>Book at least 24 hours in advance</li>
              <li>Minimum booking: 2 hours</li>
              <li>Maximum booking: 8 hours per day</li>
                  <li>Payment: Cash after service</li>
                </Box>
              </Card>
            </Grid>

            {/* Right Column - Booking Form */}
            <Grid item xs={12} md={8} sx={{ overflow: 'hidden' }}>
              {/* Availability Status */}
          {availabilityMessage && (
                <Alert 
                  severity={availabilityMessage.includes('✅') ? 'success' : 'error'}
                  icon={availabilityMessage.includes('✅') ? <CheckCircle sx={{ color: 'white' }} /> : <Cancel sx={{ color: 'white' }} />}
                  sx={{ 
                    mb: 2, 
                    backgroundColor: availabilityMessage.includes('✅') ? '#2E7D32' : '#C62828',
                    color: 'white',
                    fontWeight: 600,
                    borderRadius: 2,
                    '& .MuiAlert-icon': { color: 'white' }
                  }}
                >
                  {availabilityMessage.replace('✅ ', '').replace('❌ ', '')}
                </Alert>
          )}

              {/* Cost Estimate Card */}
              <Card sx={{ 
                backgroundColor: 'rgba(0, 0, 0, 0.5)', 
                borderRadius: 2, 
                padding: 2.5,
                mb: 2,
                width: '100%',
                boxSizing: 'border-box'
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography sx={{ 
                      color: 'white', 
                      fontSize: '1rem',
                      fontWeight: 600,
                      textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
                    }}>
                      Estimated Cost
                    </Typography>
                    <Typography sx={{ 
                      color: 'rgba(255,255,255,0.9)', 
                      fontSize: '0.95rem',
                      fontWeight: 500
                    }}>
                      {estimatedHours} hours × ৳{babysitter.hourlyRate}/hr
                    </Typography>
                  </Box>
                  <Typography variant="h3" sx={{ 
                    color: '#4CAF50', 
                    fontWeight: 800,
                    textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
                  }}>
                    ৳{estimatedAmount}
                  </Typography>
                </Box>
              </Card>

              {/* Booking Form */}
              <Card sx={{ 
                backgroundColor: 'rgba(0, 0, 0, 0.4)', 
                borderRadius: 2, 
                padding: 3,
                border: '1px solid rgba(255,255,255,0.1)',
                width: '100%',
                boxSizing: 'border-box',
                overflow: 'hidden'
              }}>
                <form onSubmit={handleSubmit}>
                  {/* Date Selection */}
                  <Box sx={{ 
                    backgroundColor: 'rgba(0, 0, 0, 0.5)', 
                    borderRadius: 2, 
                    padding: 2.5,
                    mb: 3,
                    width: '100%',
                    boxSizing: 'border-box'
                  }}>
                    <Typography sx={{ color: 'white', fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CalendarMonth sx={{ color: themeColor }} /> Select Date
                    </Typography>
                    <TextField
                  type="date"
                      fullWidth
                  value={date || defaultDate}
                      onChange={(e) => setDate(e.target.value)}
                      inputProps={{ min: new Date().toISOString().split('T')[0] }}
                      sx={{ 
                        backgroundColor: '#3d3d3d',
                        borderRadius: 2,
                        '& .MuiOutlinedInput-root': {
                          color: 'white !important',
                          fontSize: '1rem',
                          fontWeight: 600,
                          '& fieldset': { borderColor: 'transparent' },
                          '&:hover fieldset': { borderColor: themeColor },
                          '&.Mui-focused fieldset': { borderColor: themeColor }
                        },
                        '& input': { 
                          color: 'white !important',
                          padding: '14px 16px',
                          backgroundColor: '#3d3d3d',
                          borderRadius: '8px',
                          '&::-webkit-calendar-picker-indicator': {
                            filter: 'invert(1) brightness(2)',
                            cursor: 'pointer',
                            padding: '4px'
                          },
                          '&::-webkit-datetime-edit': { color: 'white !important' },
                          '&::-webkit-datetime-edit-fields-wrapper': { color: 'white !important' },
                          '&::-webkit-datetime-edit-text': { color: 'white !important' },
                          '&::-webkit-datetime-edit-month-field': { color: 'white !important' },
                          '&::-webkit-datetime-edit-day-field': { color: 'white !important' },
                          '&::-webkit-datetime-edit-year-field': { color: 'white !important' }
                        }
                      }}
                    />
                  </Box>
                    
                    {/* Quick Time Slots */}
                  <Box sx={{ 
                    backgroundColor: 'rgba(0, 0, 0, 0.5)', 
                    borderRadius: 2, 
                    padding: 2.5,
                    mb: 3,
                    width: '100%',
                    boxSizing: 'border-box'
                  }}>
                    <Typography sx={{ color: 'white', fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AccessTime sx={{ color: timeSlotColor }} /> Quick Time Slots
                    </Typography>
                    <Grid container spacing={2}>
                      {quickTimeSlots.map((slot, idx) => {
                        const isSelected = startTime === slot.start && endTime === slot.end;
                        const IconComponent = slot.iconType === 'morning' ? WbSunny 
                          : slot.iconType === 'afternoon' ? LightMode 
                          : NightsStay;
                        
                        return (
                          <Grid item xs={4} key={idx}>
                            <Card
                              onClick={() => { setStartTime(slot.start); setEndTime(slot.end); }}
                              sx={{
                                backgroundColor: isSelected ? timeSlotColor : '#3d3d3d',
                                borderRadius: 2,
                                padding: 2,
                                textAlign: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                border: isSelected ? `2px solid ${timeSlotColor}` : '2px solid transparent',
                                '&:hover': { 
                                  backgroundColor: isSelected ? timeSlotColorDark : '#4a4a4a',
                                  transform: 'translateY(-2px)',
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
                                }
                              }}
                            >
                              <IconComponent sx={{ 
                                fontSize: 36, 
                                color: isSelected ? 'white' : timeSlotColor,
                                mb: 0.5
                              }} />
                              <Typography sx={{ 
                                color: 'white', 
                                fontWeight: 700, 
                                fontSize: '1rem'
                              }}>
                                {slot.label}
                              </Typography>
                              <Typography sx={{ 
                                color: 'rgba(255,255,255,0.85)', 
                                fontSize: '0.85rem',
                                fontWeight: 600
                              }}>
                                {slot.start} - {slot.end}
                              </Typography>
                            </Card>
                          </Grid>
                        );
                      })}
                    </Grid>
                  </Box>

                  {/* Custom Time Selection */}
                  <Box sx={{ 
                    backgroundColor: 'rgba(0, 0, 0, 0.5)', 
                    borderRadius: 2, 
                    padding: 2.5,
                    mb: 3,
                    width: '100%',
                    boxSizing: 'border-box'
                  }}>
                    <Typography sx={{ color: 'white', fontWeight: 600, mb: 2, fontSize: '0.95rem' }}>
                      Or select custom time:
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', mb: 1 }}>
                          Start Time
                        </Typography>
                        <FormControl fullWidth size="small">
                          <Select
                              value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            sx={{
                              backgroundColor: '#3d3d3d',
                              color: 'white',
                              fontWeight: 600,
                              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'transparent' },
                              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: themeColor },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: themeColor },
                              '& .MuiSvgIcon-root': { color: 'white' }
                            }}
                            MenuProps={{ PaperProps: { sx: { backgroundColor: '#2d2d2d' } } }}
                            >
                            {timeOptions.map(time => (
                              <MenuItem key={time} value={time} sx={{ color: 'white', '&:hover': { backgroundColor: 'rgba(3,169,244,0.3)' } }}>
                                {time} {parseInt(time) < 12 ? 'AM' : 'PM'}
                              </MenuItem>
                              ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', mb: 1 }}>
                          End Time
                        </Typography>
                        <FormControl fullWidth size="small">
                          <Select
                              value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            sx={{
                              backgroundColor: '#3d3d3d',
                              color: 'white',
                              fontWeight: 600,
                              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'transparent' },
                              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: themeColor },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: themeColor },
                              '& .MuiSvgIcon-root': { color: 'white' }
                            }}
                            MenuProps={{ PaperProps: { sx: { backgroundColor: '#2d2d2d' } } }}
                            >
                            {timeOptions.map(time => (
                              <MenuItem key={time} value={time} sx={{ color: 'white', '&:hover': { backgroundColor: 'rgba(3,169,244,0.3)' } }}>
                                {time} {parseInt(time) < 12 ? 'AM' : 'PM'}
                              </MenuItem>
                              ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>
                  </Box>

                  {/* Service Details */}
                  <Box sx={{ 
                    backgroundColor: 'rgba(0, 0, 0, 0.5)', 
                    borderRadius: 2, 
                    padding: 2.5,
                    mb: 3,
                    width: '100%',
                    boxSizing: 'border-box'
                  }}>
                    <Typography sx={{ color: 'white', fontWeight: 700, mb: 2.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocationOn sx={{ color: themeColor }} /> Service Details
                    </Typography>

                    {/* Address Field with Autocomplete */}
                    <Box sx={{ mb: 2.5, position: 'relative' }}>
                      <Typography sx={{ 
                        color: 'white', 
                        fontSize: '0.95rem', 
                        mb: 1,
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}>
                        Booking Address *
                        {searchingAddress && (
                          <CircularProgress size={14} sx={{ color: themeColor }} />
                        )}
                      </Typography>
                      <TextField
                        fullWidth
                        placeholder="Start typing address... (e.g., BRAC University, Dhaka)"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                        onFocus={() => address.length >= 3 && setShowSuggestions(addressSuggestions.length > 0)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        multiline
                        rows={2}
                    required
                        variant="standard"
                        autoComplete="off"
                        InputProps={{ 
                          disableUnderline: true,
                          autoComplete: 'off'
                        }}
                        inputProps={{
                          autoComplete: 'new-password',
                          'data-form-type': 'other'
                        }}
                        sx={{
                          backgroundColor: '#3d3d3d',
                          borderRadius: 2,
                          padding: '12px 5px',
                          '& .MuiInputBase-root': {
                            color: 'white !important',
                            fontSize: '0.95rem'
                          },
                          '& textarea': { 
                            color: 'white !important'
                          },
                          '& .MuiInputBase-input::placeholder': { 
                            color: 'rgba(255,255,255,0.5) !important',
                            opacity: 1
                          }
                        }}
                  />
                      
                      {/* Address Suggestions Dropdown */}
                      {showSuggestions && addressSuggestions.length > 0 && (
                        <Box sx={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          backgroundColor: '#2d2d2d',
                          borderRadius: 2,
                          mt: 0.5,
                          zIndex: 1000,
                          maxHeight: 200,
                          overflow: 'auto',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
                        }}>
                          {addressSuggestions.map((suggestion, idx) => (
                            <Box
                              key={idx}
                              onClick={() => selectAddress(suggestion)}
                              sx={{
                                padding: '10px 14px',
                                cursor: 'pointer',
                                borderBottom: idx < addressSuggestions.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 1,
                                '&:hover': {
                                  backgroundColor: 'rgba(3,169,244,0.2)'
                                }
                              }}
                            >
                              <LocationOn sx={{ color: themeColor, fontSize: 18, mt: 0.3 }} />
                              <Typography sx={{ 
                                color: 'white', 
                                fontSize: '0.85rem',
                                lineHeight: 1.4
                              }}>
                                {suggestion.display_name}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      )}
                      
                      <Typography sx={{ 
                        color: 'rgba(255,255,255,0.6)', 
                        fontSize: '0.8rem', 
                        mt: 0.5
                      }}>
                        This won't change your profile address • Powered by OpenStreetMap
                      </Typography>
                    </Box>

                    {/* Children Details Field */}
                    <Box sx={{ mb: 2.5 }}>
                      <Typography sx={{ 
                        color: 'white', 
                        fontSize: '0.95rem', 
                        mb: 1,
                        fontWeight: 600
                      }}>
                        Children Details *
                      </Typography>
                      <TextField
                        fullWidth
                        placeholder="e.g., 2 children (ages 5 and 7)"
                    value={children}
                    onChange={(e) => setChildren(e.target.value)}
                    required
                        variant="standard"
                        autoComplete="off"
                        InputProps={{ 
                          disableUnderline: true,
                          autoComplete: 'off'
                        }}
                        inputProps={{
                          autoComplete: 'new-password',
                          'data-form-type': 'other'
                        }}
                        sx={{
                          backgroundColor: '#3d3d3d',
                          borderRadius: 2,
                          padding: '12px 5px',
                          '& .MuiInputBase-root': {
                            color: 'white !important',
                            fontSize: '0.95rem'
                          },
                          '& input': { 
                            color: 'white !important'
                          },
                          '& .MuiInputBase-input::placeholder': { 
                            color: 'rgba(255,255,255,0.5) !important',
                            opacity: 1
                          }
                        }}
                  />
                    </Box>

                    {/* Special Instructions Field */}
                    <Box>
                      <Typography sx={{ 
                        color: 'white', 
                        fontSize: '0.95rem', 
                        mb: 1,
                        fontWeight: 600
                      }}>
                        Special Instructions (Optional)
                      </Typography>
                      <TextField
                        fullWidth
                        placeholder="Any special requirements, allergies, routines, etc."
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                        multiline
                        rows={3}
                        variant="standard"
                        autoComplete="off"
                        InputProps={{ 
                          disableUnderline: true,
                          autoComplete: 'off'
                        }}
                        inputProps={{
                          autoComplete: 'new-password',
                          'data-form-type': 'other'
                        }}
                        sx={{
                          backgroundColor: '#3d3d3d',
                          borderRadius: 2,
                          padding: '12px 5px',
                          '& .MuiInputBase-root': {
                            color: 'white !important',
                            fontSize: '0.95rem'
                          },
                          '& textarea': { 
                            color: 'white !important'
                          },
                          '& .MuiInputBase-input::placeholder': { 
                            color: 'rgba(255,255,255,0.5) !important',
                            opacity: 1
                          }
                        }}
                  />
                    </Box>
                  </Box>

                  {error && (
                    <Alert severity="error" sx={{ mb: 2, backgroundColor: 'rgba(244,67,54,0.2)', color: 'white' }}>
                      {error}
                    </Alert>
                  )}

                  {/* Action Buttons */}
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                    <Button
                      variant="outlined"
                      startIcon={<Cancel />}
                      onClick={() => navigate('/parent-dashboard')}
                disabled={submitting}
                      sx={{
                        borderColor: 'rgba(255,255,255,0.5)',
                        color: 'white',
                        '&:hover': { borderColor: 'white', backgroundColor: 'rgba(255,255,255,0.1)' }
                      }}
              >
                Cancel
                    </Button>
                    <Button
                type="submit"
                      variant="contained"
                      startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <Send />}
                      disabled={submitting || !date || availabilityMessage.includes('❌')}
                      sx={{
                        backgroundColor: themeColor,
                        color: 'white',
                        fontWeight: 600,
                        px: 3,
                        '&:hover': { backgroundColor: themeColorDark },
                        '&:disabled': { backgroundColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.5)' }
                      }}
              >
                      {submitting ? 'Sending...' : 'Send Booking Request'}
                    </Button>
                  </Box>
          </form>
              </Card>
            </Grid>
          </Grid>

        </Paper>
      </Container>
    </Box>
  );
};

export default BookBabysitterPage;
