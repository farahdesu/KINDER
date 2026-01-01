import React, { useState, useEffect } from 'react';
import './ReportSubmission.css';
import api from '../services/api';

const ReportSubmission = ({ bookingId, onClose, onSuccess, userRole, booking }) => {
  const [formData, setFormData] = useState({
    category: 'misconduct',
    description: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bookingInfo, setBookingInfo] = useState(null);
  const [canReport, setCanReport] = useState(false);
  const [reportStatus, setReportStatus] = useState('not-checked');
  const [alreadyReported, setAlreadyReported] = useState(false);

  // Check payment status and booking info
  useEffect(() => {
    if (!bookingId) {
      console.log('⚠️ ReportSubmission: bookingId is undefined, skipping API calls');
      return;
    }
    checkPaymentStatus();
    fetchBookingReports();
  }, [bookingId]);

  const checkPaymentStatus = async () => {
    if (!bookingId) return;
    try {
      const response = await api.get(`/reports/check-payment/${bookingId}`);
      const data = response.data.data;
      setBookingInfo(data);
      setCanReport(data.canReport);
      setReportStatus(data.paymentStatus === 'paid' && data.bookingStatus === 'completed' ? 'ready' : 'not-ready');
    } catch (err) {
      console.error('Error checking payment status:', err);
      setReportStatus('error');
    }
  };

  const fetchBookingReports = async () => {
    if (!bookingId) return;
    try {
      const response = await api.get(`/reports/booking/${bookingId}`);
      const data = response.data.data;
      
      // Check if current user already reported
      const hasReported = data.reports.some(r => r.reporterId?._id === JSON.parse(localStorage.getItem('user'))?._id);
      setAlreadyReported(hasReported);
    } catch (err) {
      console.error('Error fetching booking reports:', err);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Determine who to report based on booking and current user
  const getReportedUserId = () => {
    const currentUser = JSON.parse(localStorage.getItem('user')) || JSON.parse(sessionStorage.getItem('user'));
    const currentUserId = currentUser?._id || currentUser?.userId || currentUser?.id;
    const currentUserRole = currentUser?.role || userRole;
    
    console.log('🔍 getReportedUserId - Current User ID:', currentUserId, 'Role:', currentUserRole);
    
    // First, try to get reportedUserId from booking object passed as prop
    if (booking) {
      console.log('📦 Using booking prop');
      console.log('  Booking structure:', { parentId: booking.parentId, babysitterId: booking.babysitterId });
      
      // Extract actual IDs - handle both string IDs and object references
      const bookingParentId = typeof booking.parentId === 'object' ? booking.parentId?._id : booking.parentId;
      const bookingBabysitterId = typeof booking.babysitterId === 'object' ? booking.babysitterId?._id : booking.babysitterId;
      
      console.log('  Extracted - Parent ID:', bookingParentId, 'Babysitter ID:', bookingBabysitterId);
      console.log('  Current User Role:', currentUserRole);
      
      // Determine based on role - don't try to match IDs since they're different types
      // (Parent/Babysitter doc IDs vs. User IDs)
      if (currentUserRole === 'parent') {
        // Parent reports babysitter
        console.log('✅ Parent reporting babysitter:', bookingBabysitterId);
        return bookingBabysitterId;
      } else if (currentUserRole === 'babysitter') {
        // Babysitter reports parent
        console.log('✅ Babysitter reporting parent:', bookingParentId);
        return bookingParentId;
      }
    }
    
    // Fallback to bookingInfo from API if booking prop not available
    if (bookingInfo) {
      console.log('🔗 Using API bookingInfo');
      console.log('  Booking Info:', { parentId: bookingInfo.parentId, babysitterId: bookingInfo.babysitterId });
      
      if (currentUserRole === 'parent') {
        console.log('✅ Parent (API) reporting babysitter:', bookingInfo.babysitterId);
        return bookingInfo.babysitterId;
      } else if (currentUserRole === 'babysitter') {
        console.log('✅ Babysitter (API) reporting parent:', bookingInfo.parentId);
        return bookingInfo.parentId;
      }
    }
    
    console.log('❌ Could not determine reportedUserId');
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate description length
      if (formData.description.length < 20) {
        setError('Description must be at least 20 characters');
        setLoading(false);
        return;
      }

      if (formData.description.length > 1000) {
        setError('Description cannot exceed 1000 characters');
        setLoading(false);
        return;
      }

      // Get the reportedUserId automatically
      const reportedUserId = getReportedUserId();
      if (!reportedUserId) {
        setError('Could not determine who to report. Please try again.');
        setLoading(false);
        return;
      }

      console.log('📤 Submitting report with:');
      console.log('  bookingId:', bookingId);
      console.log('  reportedUserId:', reportedUserId);
      console.log('  category:', formData.category);
      console.log('  description:', formData.description.substring(0, 50) + '...');

      const response = await api.post('/reports', {
        bookingId,
        reportedUserId,
        category: formData.category,
        description: formData.description
      });

      // Reset form
      setFormData({
        category: 'misconduct',
        description: ''
      });

      if (onSuccess) {
        onSuccess(response.data.data);
      }

      alert('Report submitted successfully! Our team will review it shortly.');
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to submit report';
      setError(message);
      console.error('Error submitting report:', err);
    } finally {
      setLoading(false);
    }
  };

  // Guard against undefined bookingId
  if (!bookingId) {
    return (
      <div className="report-submission">
        <div className="report-card">
          <h3>⚠️ Error</h3>
          <p>Invalid booking ID. Cannot submit report.</p>
          <button className="btn-close" onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  if (!canReport && reportStatus === 'not-ready') {
    return (
      <div className="report-submission">
        <div className="report-card">
          <h3>📋 Submit a Report</h3>
          <div className="info-message">
            <h4>⏳ Report Not Available Yet</h4>
            <p>You can submit a report after the booking is completed and payment is confirmed.</p>
            {bookingInfo && (
              <div className="booking-status">
                <div className="status-item">
                  <span>Booking Status:</span>
                  <strong style={{ color: bookingInfo.bookingStatus === 'completed' ? '#6bcf7f' : '#ffa500' }}>
                    {bookingInfo.bookingStatus}
                  </strong>
                </div>
                <div className="status-item">
                  <span>Payment Status:</span>
                  <strong style={{ color: bookingInfo.paymentStatus === 'paid' ? '#6bcf7f' : '#ffa500' }}>
                    {bookingInfo.paymentStatus}
                  </strong>
                </div>
              </div>
            )}
          </div>
          <button className="btn-close" onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  if (alreadyReported) {
    return (
      <div className="report-submission">
        <div className="report-card">
          <h3>📋 Report Already Submitted</h3>
          <div className="info-message success">
            <h4>✓ You've Already Reported This Booking</h4>
            <p>You can only submit one report per booking. Our team is reviewing your report and will take appropriate action if needed.</p>
          </div>
          <button className="btn-close" onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="report-submission">
      <div className="report-card">
        <h3>📋 Submit a Report</h3>
        <p className="subtitle">Optional: Report any issues that occurred during this booking</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="report-form">
          <div className="form-group">
            <label>
              Report Category *
              <span className="required">Required</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              disabled={loading}
            >
              <option value="misconduct">Misconduct</option>
              <option value="harassment">Harassment</option>
              <option value="safety_concern">Safety Concern</option>
              <option value="fraud">Fraud</option>
              <option value="other">Other</option>
            </select>
            <small>Select the category that best describes your report</small>
          </div>

          <div className="form-group">
            <label>
              Description *
              <span className="required">Required (20-1000 characters)</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Please provide detailed information about what happened..."
              rows="6"
              disabled={loading}
            />
            <div className="char-count">
              {formData.description.length}/1000 characters
              {formData.description.length < 20 && (
                <span className="char-warning"> - Minimum 20 characters required</span>
              )}
              {formData.description.length > 1000 && (
                <span className="char-warning"> - Maximum 1000 characters exceeded</span>
              )}
            </div>
          </div>

          <div className="info-box">
            <h4>ℹ️ Important Information</h4>
            <ul>
              <li>Reports are anonymous from the reported user's perspective</li>
              <li>Admin team will review your report thoroughly</li>
              <li>Action will be taken based on the severity and evidence</li>
              <li>False reports may result in penalties</li>
            </ul>
          </div>

          <div className="button-group">
            <button 
              type="submit" 
              className="btn-submit"
              disabled={loading || formData.description.length < 20 || formData.description.length > 1000}
            >
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>
            <button 
              type="button"
              className="btn-cancel"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportSubmission;
