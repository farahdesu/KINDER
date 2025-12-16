import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import './BookBabysitterPage.css';

const BookBabysitterPage = () => {
  const { babysitterId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [babysitter, setBabysitter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);

  // Booking form state
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('14:00');
  const [endTime, setEndTime] = useState('17:00');
  const [address, setAddress] = useState('');
  const [children, setChildren] = useState('1 child');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [availabilityMessage, setAvailabilityMessage] = useState('');
  const [timeSelectionMode, setTimeSelectionMode] = useState('none'); // 'manual', 'quick', or 'none'

  // Set default date to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDate = tomorrow.toISOString().split('T')[0];

  // Time options for manual selection (whole hours only)
  const timeOptions = Array.from({ length: 13 }, (_, i) => {
    const hour = i + 9; // From 9 AM (09:00) to 9 PM (21:00)
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  // Quick time slots
  const quickTimeSlots = [
    { start: '09:00', end: '12:00', label: 'Morning', duration: '3 hours' },
    { start: '14:00', end: '17:00', label: 'Afternoon', duration: '3 hours' },
    { start: '18:00', end: '21:00', label: 'Evening', duration: '3 hours' },
  ];

  // Fetch babysitter details
  useEffect(() => {
    const fetchBabysitterDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3001/api/babysitters/${babysitterId}`, {
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
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3001/api/bookings/', {
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
    if (startTime >= endTime) {
      return '❌ End time must be after start time';
    }

    const startHour = parseInt(startTime.split(':')[0]);
    const endHour = parseInt(endTime.split(':')[0]);
    const duration = endHour - startHour;

    if (duration < 2) {
      return '❌ Minimum booking is 2 hours';
    }

    if (duration > 8) {
      return '❌ Maximum booking is 8 hours per day';
    }

    return null;
  };

  // Check availability when form changes
  useEffect(() => {
    if (!babysitter || !date) return;

    const selectedDate = date || defaultDate;

    // Check 24-hour rule
    if (!is24HoursInAdvance(selectedDate)) {
      setAvailabilityMessage('❌ Bookings must be made at least 24 hours in advance');
      return;
    }

    // Validate time selection
    const validationError = validateTimeSelection();
    if (validationError) {
      setAvailabilityMessage(validationError);
      return;
    }

    // Check for booking conflicts
    if (bookings.length > 0) {
      const hasConflict = checkForBookingConflicts(
        { date: selectedDate, startTime, endTime },
        bookings
      );

      if (hasConflict) {
        setAvailabilityMessage('❌ Babysitter is already booked at this time');
      } else {
        setAvailabilityMessage('✅ Time slot is available');
      }
    } else {
      setAvailabilityMessage('✅ Time slot is available');
    }
  }, [date, startTime, endTime, babysitter, bookings, defaultDate]);

  // Function to check for booking conflicts
  const checkForBookingConflicts = (newBooking, existingBookings) => {
    const newDate = new Date(newBooking.date).toDateString();
    const parseTime = (timeStr) => {
      const [hours] = timeStr.split(':').map(Number);
      return hours;
    };

    const newStartHour = parseTime(newBooking.startTime);
    const newEndHour = parseTime(newBooking.endTime);

    for (const existing of existingBookings) {
      if (['rejected', 'cancelled'].includes(existing.status)) continue;

      const existingDate = new Date(existing.date).toDateString();
      if (existingDate !== newDate) continue;

      const existingStartHour = parseTime(existing.startTime);
      const existingEndHour = parseTime(existing.endTime);

      const hasOverlap = (
        newStartHour < existingEndHour &&
        newEndHour > existingStartHour
      );

      if (hasOverlap) return true;
    }

    return false;
  };

  // Calculate hours and amount
  const calculateHours = (start, end) => {
    const startHour = parseInt(start.split(':')[0]);
    const endHour = parseInt(end.split(':')[0]);
    return Math.abs(endHour - startHour);
  };

  // Handle quick time slot selection
  const handleQuickTimeSlotSelect = (slot) => {
    setStartTime(slot.start);
    setEndTime(slot.end);
    setTimeSelectionMode('quick');
  };

  // Handle manual time selection
  const handleManualTimeSelect = (type, value) => {
    if (type === 'start') {
      setStartTime(value);
    } else {
      setEndTime(value);
    }
    setTimeSelectionMode('manual');
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  setSubmitting(true);

  // Final validation
  if (!date) {
    setError('❌ Please select a date');
    setSubmitting(false);
    return;
  }

  if (!is24HoursInAdvance(date)) {
    setError('❌ Bookings must be made at least 24 hours in advance');
    setSubmitting(false);
    return;
  }

  const validationError = validateTimeSelection();
  if (validationError) {
    setError(validationError);
    setSubmitting(false);
    return;
  }

  // Get user info from localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  // Format date to YYYY-MM-DD
  const formattedDate = new Date(date).toISOString().split('T')[0];
  
  // EXACTLY match what the backend expects (from bookingRoutes.js)
  const bookingData = {
    babysitterId: babysitter._id || babysitter.id, // Must match exactly
    date: formattedDate,          // Must be YYYY-MM-DD
    startTime: startTime,         // Format: "14:00"
    endTime: endTime,             // Format: "17:00"
    address: address.trim(),
    specialInstructions: specialInstructions.trim() || '',
    children: children.trim() || '1 child'  // Optional but good to include
    // DO NOT include: hours, totalAmount, status, etc.
    // The backend calculates hours and totalAmount automatically
  };

  console.log('📤 Sending booking data (backend format):', bookingData);
  console.log('📤 Stringified:', JSON.stringify(bookingData));

  try {
    const token = localStorage.getItem('token');
    console.log('🔑 Token exists:', !!token);
    
    const response = await fetch('http://localhost:3001/api/bookings/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bookingData)
    });

    console.log('📥 API Response status:', response.status);
    
    let data;
    try {
      data = await response.json();
      console.log('📥 API Response data:', data);
    } catch (parseError) {
      console.error('❌ Failed to parse JSON:', parseError);
      const text = await response.text();
      console.log('📥 Response text:', text);
      throw new Error(`Invalid server response: ${text}`);
    }

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    if (data.success) {
      alert('✅ Booking request sent successfully! Waiting for babysitter confirmation.');
      navigate('/parent-dashboard');
    } else {
      setError(data.message || 'Booking failed. Please try again.');
    }
  } catch (err) {
    console.error('❌ Booking error:', err);
    setError(err.message || 'Network error. Please check your connection and try again.');
  } finally {
    setSubmitting(false);
  }
};
  const handleCancel = () => {
    navigate('/parent-dashboard');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <h2>Loading babysitter details...</h2>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!babysitter) {
    return (
      <div className="error-container">
        <h2>Babysitter not found</h2>
        <button className="back-button" onClick={() => navigate('/parent-dashboard')}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  const estimatedHours = calculateHours(startTime, endTime);
  const estimatedAmount = estimatedHours * babysitter.hourlyRate;

  return (
    <div className="book-babysitter-container">
      <div className="header-section">
        <button className="back-button" onClick={handleCancel}>
          ← Back to Dashboard
        </button>
        <h1 className="page-title">Book {babysitter.name}</h1>
        <div className="babysitter-summary">
          <span className="rate-badge">{babysitter.hourlyRate} BDT/hour</span>
          <span className="experience-badge">{babysitter.experience || 'Experienced'}</span>
        </div>
      </div>

      <div className="booking-layout">
        {/* Left column */}
        <div className="left-column">
          <div className="profile-section">
            <h2>👤 Babysitter Profile</h2>
            <div className="university-info">
              <h4>University</h4>
              <p>{babysitter.university || 'BRAC University'}</p>
            </div>
            <div className="department-info">
              <h4>Department</h4>
              <p>{babysitter.department || 'Computer Science'}</p>
            </div>
            <div className="year-info">
              <h4>Year</h4>
              <p>{babysitter.year || '2nd Year'}</p>
            </div>
            <div className="student-id">
              <h4>Student ID</h4>
              <p>{babysitter.studentId || '20241953'}</p>
            </div>
            
            <div className="skills-section">
              <h4>Skills</h4>
              <div className="skills-list">
                {Array.isArray(babysitter.skills)
                  ? babysitter.skills.map((skill, index) => (
                      <span key={index} className="skill-tag">{skill}</span>
                    ))
                  : <span className="skill-tag">{babysitter.skills || 'Child Care'}</span>
                }
              </div>
            </div>
            
            <div className="status-cards">
              <div className="status-card">
                <h4>Total Jobs</h4>
                <div className="value">{babysitter.totalJobs || 0}</div>
              </div>
              <div className="status-card">
                <h4>Rating</h4>
                <div className="value">{babysitter.rating || '4.5'}/5</div>
              </div>
            </div>
          </div>

          <div className="guidelines-section">
            <h2>📋 Booking Guidelines</h2>
            <ul className="guidelines-list">
              <li>Book at least 24 hours in advance</li>
              <li>Minimum booking: 2 hours</li>
              <li>Maximum booking: 8 hours per day</li>
              <li>Cancellation: Free up to 12 hours before</li>
              <li>Payment: Cash after service completion</li>
            </ul>
          </div>
        </div>

        {/* Right column */}
        <div className="right-column">
          {availabilityMessage && (
            <div className={`availability-status ${
              availabilityMessage.includes('✅') ? 'available' : 'unavailable'
            }`}>
              {availabilityMessage}
            </div>
          )}

          <div className="cost-section">
            <h2>💰 Estimated Cost</h2>
            <div className="cost-breakdown">
              <p>{estimatedHours} hours × {babysitter.hourlyRate} BDT/hour</p>
              <div className="total-cost">{estimatedAmount} BDT</div>
              <p className="payment-note">Total payable after service completion</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="booking-form">
            <div className="form-section">
              <h3>📅 Booking Details</h3>
              
              <div className="form-group">
                <label>Date *</label>
                <input
                  type="date"
                  value={date || defaultDate}
                  onChange={(e) => {
                    setDate(e.target.value);
                    setTimeSelectionMode('none');
                  }}
                  min={defaultDate}
                  required
                  disabled={submitting}
                />
                <small className="hint">Select a future date</small>
              </div>

              {/* Time Selection (only show if date is selected) */}
              {date && (
                <>
                  <div className="time-selection-section">
                    <h4>Select Time Slot</h4>
                    
                    {/* Quick Time Slots */}
                    <div className="form-group">
                      <label className="section-label">
                        <input
                          type="radio"
                          name="timeMode"
                          checked={timeSelectionMode === 'quick'}
                          onChange={() => {}}
                          className="mode-radio"
                        />
                        Quick Time Slots
                      </label>
                      <div className="time-slots-grid">
                        {quickTimeSlots.map((slot, index) => (
                          <div
                            key={index}
                            className={`time-slot ${
                              timeSelectionMode === 'quick' && 
                              startTime === slot.start && 
                              endTime === slot.end ? 'selected' : ''
                            }`}
                            onClick={() => handleQuickTimeSlotSelect(slot)}
                          >
                            <strong>{slot.label}</strong>
                            <div className="time-range">{slot.start} - {slot.end}</div>
                            <div className="duration">{slot.duration}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* OR separator */}
                    <div className="or-separator">
                      <span>OR</span>
                    </div>

                    {/* Manual Time Selection */}
                    <div className="form-group">
                      <label className="section-label">
                        <input
                          type="radio"
                          name="timeMode"
                          checked={timeSelectionMode === 'manual'}
                          onChange={() => setTimeSelectionMode('manual')}
                          className="mode-radio"
                        />
                        Select Custom Time
                      </label>
                      <div className="manual-time-selection">
                        <div className="time-input-group">
                          <div className="time-input">
                            <label>Start Time *</label>
                            <select
                              value={startTime}
                              onChange={(e) => handleManualTimeSelect('start', e.target.value)}
                              disabled={submitting}
                              className="time-select"
                            >
                              {timeOptions.map((time, index) => (
                                <option key={index} value={time}>
                                  {time} ({time <= '12:00' ? 'AM' : 'PM'})
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="time-input">
                            <label>End Time *</label>
                            <select
                              value={endTime}
                              onChange={(e) => handleManualTimeSelect('end', e.target.value)}
                              disabled={submitting}
                              className="time-select"
                            >
                              {timeOptions.map((time, index) => (
                                <option key={index} value={time}>
                                  {time} ({time <= '12:00' ? 'AM' : 'PM'})
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="duration-info">
                          Selected Duration: <strong>{calculateHours(startTime, endTime)} hours</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Service Details (only show if time is selected) */}
            {timeSelectionMode !== 'none' && (
              <div className="form-section">
                <h3>📍 Service Details</h3>
                
                <div className="form-group">
                  <label>Address *</label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter full address where service is needed"
                    rows="3"
                    required
                    disabled={submitting}
                  />
                </div>

                <div className="form-group">
                  <label>Children Details *</label>
                  <input
                    type="text"
                    value={children}
                    onChange={(e) => setChildren(e.target.value)}
                    placeholder="e.g., 2 children (ages 5 and 7)"
                    required
                    disabled={submitting}
                  />
                </div>

                <div className="form-group">
                  <label>Special Instructions</label>
                  <textarea
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    placeholder="Any special requirements, allergies, routines, etc."
                    rows="4"
                    disabled={submitting}
                  />
                </div>
              </div>
            )}

            {error && <div className="alert alert-error">{error}</div>}

            <div className="form-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={handleCancel}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="submit-button"
                disabled={submitting || 
                  !date || 
                  timeSelectionMode === 'none' || 
                  availabilityMessage.includes('❌') ||
                  !is24HoursInAdvance(date)}
              >
                {submitting ? 'Submitting...' : '📤 Send Booking Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookBabysitterPage;
{/* Add this button somewhere in your JSX */}
<div style={{ textAlign: 'center', margin: '20px' }}>
  <button
    onClick={async () => {
      // Hardcoded test using the exact ID from your console
      const testData = {
        babysitterId: "693b276887fe929f5d3429d5", // From your earlier console log
        date: "2025-12-14",
        startTime: "14:00",
        endTime: "17:00",
        address: "Test Address",
        specialInstructions: "Test booking from debug button",
        children: "1 child"
      };
      
      console.log('🧪 DEBUG: Testing with hardcoded data:', testData);
      
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3001/api/bookings/', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(testData)
        });
        
        console.log('🧪 DEBUG: Response status:', response.status);
        const data = await response.json();
        console.log('🧪 DEBUG: Response data:', data);
        
        if (data.success) {
          alert('✅ Test booking successful!');
        } else {
          alert(`❌ Test failed: ${data.message}`);
        }
      } catch (err) {
        console.error('🧪 DEBUG: Test error:', err);
        alert(`❌ Test error: ${err.message}`);
      }
    }}
    style={{
      padding: '12px 24px',
      background: '#ffcc00',
      border: 'none',
      borderRadius: '8px',
      fontWeight: 'bold',
      cursor: 'pointer',
      fontSize: '16px'
    }}
  >
    🧪 DEBUG: Test Booking API
  </button>
</div>