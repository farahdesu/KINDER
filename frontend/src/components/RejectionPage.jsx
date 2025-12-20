import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import API from '../services/api';
import './RejectionPage.css';

const RejectionPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [reapplyLoading, setReapplyLoading] = useState(false);
  const [error, setError] = useState('');

  const userData = location.state?.userData || {};
  const userId = userData?.id || null;
  const rejectionReason = userData?.rejectionReason || 'Your account has been rejected by the admin team.';

  const handleReapply = async () => {
    if (!userId) {
      setError('User ID not found. Unable to proceed.');
      return;
    }

    setReapplyLoading(true);
    setError('');

    try {
      // Delete the rejected account
      await API.delete(`/auth/delete-rejected-user/${userId}`);
      
      // Clear localStorage
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      
      // Redirect to registration page
      navigate('/register', { 
        state: { 
          message: 'Your previous account has been removed. You can now register again!' 
        } 
      });
    } catch (error) {
      console.error('🔥 REAPPLY ERROR:', error);
      setError(
        error.response?.data?.message || 
        'Failed to proceed. Please try again.'
      );
    } finally {
      setReapplyLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!userId) {
      setError('User ID not found. Unable to delete account.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await API.delete(`/auth/delete-rejected-user/${userId}`);
      
      if (response.data.success) {
        // Clear localStorage
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        
        // Redirect to login with success message
        navigate('/login', { 
          state: { 
            message: 'Your account has been deleted.' 
          } 
        });
      }
    } catch (error) {
      console.error('🔥 DELETE ERROR:', error);
      setError(
        error.response?.data?.message || 
        'Failed to delete account. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rejection-container">
      <div className="rejection-card">
        <div className="rejection-icon">📧</div>
        
        <h1>Application Status: Under Review</h1>
        
        <div className="rejection-details">
          <div className="detail-section">
            <h3>Notification from KINDER</h3>
            <p className="user-name">Hello, {userData?.name || 'User'}!</p>
            <p className="rejection-message">
              {rejectionReason}
            </p>
            
            <div className="user-info">
              <div className="info-row">
                <span className="info-label">Email:</span>
                <span className="info-value">{userData?.email}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Account Type:</span>
                <span className="info-value">{userData?.role?.charAt(0).toUpperCase() + userData?.role?.slice(1)}</span>
              </div>
            </div>
          </div>

          <div className="support-section">
            <h3>Need Help?</h3>
            <p className="support-text">
              If you have any questions or would like to appeal this decision, please contact our support team:
            </p>
            <div className="support-contact">
              <a href="mailto:support@kinder.com" className="support-email">
                ✉️ support@kinder.com
              </a>
            </div>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="rejection-actions">
            <div className="action-group">
              <h4>What would you like to do?</h4>
              
              <button 
                className="btn btn-primary btn-reapply"
                onClick={handleReapply}
                disabled={reapplyLoading}
              >
                {reapplyLoading ? '🔄 Preparing...' : '🔄 Re-apply with New Information'}
              </button>
              <p className="action-description">
                Your current account will be deleted and you can register again with updated information.
              </p>

              <button 
                className="btn btn-secondary btn-close"
                onClick={handleDeleteAccount}
                disabled={loading}
              >
                {loading ? '⏳ Closing Account...' : '🚪 Close My Account'}
              </button>
              <p className="action-description">
                Permanently delete your account without re-applying.
              </p>
            </div>

            <div className="warning-section">
              <p className="warning-text">
                ⚠️ Both actions will permanently delete your current account and all associated data.
              </p>
              <p className="warning-text secondary">
                If you re-apply, you'll need to provide all information again during registration.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RejectionPage;