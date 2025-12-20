import React, { useState, useEffect } from 'react';
import './BookingModal.css';

const BookingModal = ({ babysitter, onClose, onConfirm }) => {
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('14:00');
  const [endTime, setEndTime] = useState('18:00');
  const [address, setAddress] = useState('');
  const [children, setChildren] = useState('1 child');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [error, setError] = useState('');
  const [availabilityMessage, setAvailabilityMessage] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);

  // Set default date to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDate = tomorrow.toISOString().split('T')[0];

  // Check availability whenever time/date changes
  useEffect(() => {
    const checkAvailability = async () => {
      const selectedDate = date || defaultDate;
      const selectedStartTime = startTime;
      const selectedEndTime = endTime;

      if (!selectedDate || !selectedStartTime || !selectedEndTime) {
        return;
      }

      // Basic validation: end time should be after start time
      if (selectedStartTime >= selectedEndTime) {
        setAvailabilityMessage('❌ End time must be after start time');
        setIsAvailable(false);
        return;
      }

      setCheckingAvailability(true);
      setAvailabilityMessage('Checking availability...');

      try {
        // Check if babysitter is available at this time
        const available = await checkBabysitterAvailability(
          babysitter.id,
          selectedDate,
          selectedStartTime,
          selectedEndTime
        );

        if (available) {
          setAvailabilityMessage('✅ Babysitter is available at this time');
          setIsAvailable(true);
        } else {
          setAvailabilityMessage('❌ Babysitter is not available at this time');
          setIsAvailable(false);
        }
      } catch (error) {
        console.log('⚠️ Availability check failed:', error);
        setAvailabilityMessage('⚠️ Could not verify availability. Please proceed with caution.');
        setIsAvailable(true); // Default to available if check fails
      } finally {
        setCheckingAvailability(false);
      }
    };

    // Debounce the availability check
    const timeoutId = setTimeout(checkAvailability, 500);
    return () => clearTimeout(timeoutId);
  }, [date, startTime, endTime, babysitter.id, defaultDate]);

  // Function to check babysitter availability
  const checkBabysitterAvailability = async (babysitterId, date, startTime, endTime) => {
    try {
      // First, try to get babysitter's existing bookings
      const token = sessionStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/bookings/babysitter/${babysitterId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.bookings) {
          const hasConflict = checkForBookingConflicts(
            { date, startTime, endTime },
            data.bookings
          );
          
          return !hasConflict; // Available if no conflict
        }
      }
      
      // If API fails, assume available (for now)
      return true;
    } catch (error) {
      console.error('Error checking availability:', error);
      return true; // Default to available
    }
  };

  // Function to check for booking conflicts
  const checkForBookingConflicts = (newBooking, existingBookings) => {
    if (!newBooking.date || !newBooking.startTime || !newBooking.endTime) {
      return false;
    }

    const newDate = new Date(newBooking.date).toDateString();
    const parseTime = (timeStr) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + (minutes || 0);
    };

    const newStartMinutes = parseTime(newBooking.startTime);
    const newEndMinutes = parseTime(newBooking.endTime);

    // Check against each existing booking
    for (const existing of existingBookings) {
      // Skip rejected, cancelled, or completed bookings
      if (['rejected', 'cancelled', 'completed'].includes(existing.status)) {
        continue;
      }

      const existingDate = new Date(existing.date).toDateString();
      
      // Check if same date
      if (existingDate !== newDate) {
        continue;
      }

      const existingStartMinutes = parseTime(existing.startTime);
      const existingEndMinutes = parseTime(existing.endTime);

      // Check for time overlap
      const hasOverlap = 
        (newStartMinutes < existingEndMinutes && newEndMinutes > existingStartMinutes);

      if (hasOverlap) {
        console.log('⏰ Conflict found with existing booking:', existing);
        return true;
      }
    }

    return false;
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  
  // Final availability check before submitting
  if (!isAvailable) {
    setError('Babysitter is not available at the selected time. Please choose another time.');
    return;
  }

  setLoading(true);

  // Format date to YYYY-MM-DD
  const formattedDate = new Date(date || defaultDate).toISOString().split('T')[0];
  
  // Match backend exactly
  const bookingData = {
    babysitterId: babysitter.id,
    date: formattedDate,
    startTime,
    endTime,
    address: address.trim() || 'BRAC University Area, Dhaka',
    specialInstructions: specialInstructions.trim() || `Booking for ${babysitter.name}`,
    children: children.trim() || '1 child'
    // DO NOT include: hours, totalAmount
  };

  console.log('📝 Booking data (backend format):', bookingData);

  try {
    await onConfirm(bookingData);
  } catch (err) {
    setError(err.message || 'Booking failed. Please try again.');
  } finally {
    setLoading(false);
  }
};

  // Helper function to calculate hours
  const calculateHours = (startTime, endTime) => {
    const start = parseInt(startTime.split(':')[0]);
    const end = parseInt(endTime.split(':')[0]);
    return Math.abs(end - start);
  };

  // Helper function to calculate amount
  const calculateAmount = (startTime, endTime, hourlyRate) => {
    const hours = calculateHours(startTime, endTime);
    return hours * hourlyRate;
  };

  // Calculate estimated amount
  const estimatedHours = calculateHours(startTime, endTime);
  const estimatedAmount = estimatedHours * babysitter.hourlyRate;

  // Generate suggested time slots (for better UX)
  const suggestedTimeSlots = [
    { start: '09:00', end: '12:00', label: 'Morning (9AM-12PM)' },
    { start: '14:00', end: '17:00', label: 'Afternoon (2PM-5PM)' },
    { start: '18:00', end: '21:00', label: 'Evening (6PM-9PM)' },
  ];

  const applyTimeSlot = (slot) => {
    setStartTime(slot.start);
    setEndTime(slot.end);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h3>Book {babysitter.name}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="babysitter-info">
          <p><strong>Rate:</strong> {babysitter.hourlyRate} BDT/hour</p>
          <p><strong>Experience:</strong> {babysitter.experience}</p>
          <p><strong>Skills:</strong> {Array.isArray(babysitter.skills) ? babysitter.skills.join(', ') : babysitter.skills}</p>
        </div>

        {/* Availability Status */}
        <div className={`availability-status ${isAvailable ? 'available' : 'unavailable'}`}>
          {checkingAvailability ? (
            <span className="checking">⏳ Checking availability...</span>
          ) : (
            <>
              <span className="status-icon">{isAvailable ? '✅' : '❌'}</span>
              <span className="status-message">{availabilityMessage}</span>
            </>
          )}
        </div>

        {/* Estimated Cost */}
        <div className="cost-estimate">
          <p><strong>Estimated Cost:</strong> {estimatedHours} hours × {babysitter.hourlyRate} BDT = <strong>{estimatedAmount} BDT</strong></p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Quick Time Slots */}
          <div className="form-group">
            <label>Quick Time Slots</label>
            <div className="time-slots">
              {suggestedTimeSlots.map((slot, index) => (
                <button
                  key={index}
                  type="button"
                  className={`time-slot-btn ${startTime === slot.start && endTime === slot.end ? 'active' : ''}`}
                  onClick={() => applyTimeSlot(slot)}
                >
                  {slot.label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Date *</label>
            <input
              type="date"
              value={date || defaultDate}
              onChange={(e) => setDate(e.target.value)}
              min={defaultDate}
              required
              disabled={loading}
            />
            <small className="hint">Bookings must be made at least 1 day in advance</small>
          </div>

          <div className="time-group">
            <div className="form-group">
              <label>Start Time *</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label>End Time *</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Address *</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter full address"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Children Details</label>
            <input
              type="text"
              value={children}
              onChange={(e) => setChildren(e.target.value)}
              placeholder="e.g., 2 children, ages 5 and 7"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Special Instructions</label>
            <textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="Any special requirements or instructions"
              rows="3"
              disabled={loading}
            />
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={loading || checkingAvailability || !isAvailable}
            >
              {loading ? 'Booking...' : checkingAvailability ? 'Checking...' : 'Confirm Booking'}
            </button>
          </div>
        </form>

        {/* Help Text */}
        <div className="help-text">
          <small>💡 The system checks the babysitter's existing bookings to prevent scheduling conflicts.</small>
          <small>⏰ If the babysitter is unavailable, please try a different time or date.</small>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;