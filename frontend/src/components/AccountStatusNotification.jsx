import React from 'react';

const AccountStatusNotification = ({ user }) => {
  if (!user || !user.accountStatus || user.accountStatus === 'active') {
    return null;
  }

  const isWarned = user.accountStatus === 'warned';
  const isBanned = user.accountStatus === 'banned';

  return (
    <div style={{
      background: isBanned ? '#f8d7da' : '#fff3cd',
      border: `1px solid ${isBanned ? '#f5c6cb' : '#ffc107'}`,
      borderRadius: '4px',
      padding: '12px 15px',
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    }}>
      <span style={{ fontSize: '20px' }}>
        {isBanned ? '🚫' : '⚠️'}
      </span>
      <div>
        <strong style={{ color: isBanned ? '#721c24' : '#856404' }}>
          {isBanned ? 'Account Banned' : 'Account Warning'}
        </strong>
        <p style={{ 
          margin: '4px 0 0 0', 
          fontSize: '13px', 
          color: isBanned ? '#721c24' : '#856404'
        }}>
          {isBanned 
            ? 'Your account has been banned. You can only view your profile.' 
            : 'Your account has received a warning. Please follow our community guidelines.'}
          {user.accountStatusReason && ` Reason: ${user.accountStatusReason}`}
        </p>
      </div>
    </div>
  );
};

export default AccountStatusNotification;
