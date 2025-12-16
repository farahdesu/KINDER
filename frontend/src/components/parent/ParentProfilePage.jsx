import React from 'react';
import { useNavigate } from 'react-router-dom';

const ParentProfilePage = () => {
  const navigate = useNavigate();

  return (
    <div style={{ padding: '20px' }}>
      <button onClick={() => navigate('/parent-dashboard')}>← Back to Dashboard</button>
      <h1>My Profile</h1>
      <p>This page is under construction. Coming soon!</p>
    </div>
  );
};

export default ParentProfilePage;