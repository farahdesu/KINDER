import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../Dashboard.css';

const BabysitterDashboard = () => {
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState('');
  const [profileIdMap, setProfileIdMap] = useState({});
  const navigate = useNavigate();

  // ✅ Helper function to check if booking ID is real (MongoDB ID) or mock
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
      console.log('❌ Skill removed:', skillToRemove);
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
    console.log('✅ Skill added:', skill);
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
    console.log('🗺️ Building profile ID mapping...');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/babysitters/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.babysitters) {
          const map = {};
          console.log(`📋 Found ${data.babysitters.length} babysitters`);
          
          data.babysitters.forEach((babysitter, index) => {
            if (babysitter.userId && babysitter.id) {
              map[babysitter.userId] = babysitter.id;
              console.log(`   ${index + 1}. ${babysitter.name}: ${babysitter.userId} → ${babysitter.id}`);
            } else if (babysitter.userId && babysitter._id) {
              map[babysitter.userId] = babysitter._id;
              console.log(`   ${index + 1}. ${babysitter.name}: ${babysitter.userId} → ${babysitter._id}`);
            }
          });
          
          console.log('✅ Profile ID mapping built:', map);
          return map;
        }
      }
      console.log('⚠️ Could not fetch babysitters for mapping');
      return null;
    } catch (error) {
      console.error('❌ Error building profile map:', error);
      return null;
    }
  };

  // UPDATED: Fetch real bookings from backend with dynamic mapping
  const fetchRealBookings = async (babysitterUserId) => {
    console.log('📡 Fetching REAL bookings for babysitter USER ID:', babysitterUserId);
    
    try {
      const token = localStorage.getItem('token');
      console.log('🔑 Token available:', token ? 'YES' : 'NO');
      
      // First, build or get the profile ID mapping
      let mapping = profileIdMap;
      if (Object.keys(mapping).length === 0) {
        console.log('🔄 No mapping found, building new one...');
        mapping = await buildProfileIdMap() || {};
        setProfileIdMap(mapping);
        
        // Fallback to hardcoded mapping if dynamic fails
        if (Object.keys(mapping).length === 0) {
          console.log('⚠️ Dynamic mapping failed, using hardcoded fallback');
          mapping = {
            '693b04b68ae27726f3f5e6cb': '693b04b68ae27726f3f5e6cd', // John Babysitter
            '693b276787fe929f5d3429d3': '693b276887fe929f5d3429d5', // Test Babysitter 2
          };
        }
      }
      
      const babysitterProfileId = mapping[babysitterUserId];
      
      console.log('🎯 Profile ID lookup:', {
        userId: babysitterUserId,
        profileId: babysitterProfileId,
        mappingAvailable: Object.keys(mapping).length > 0
      });
      
      if (!babysitterProfileId) {
        console.error('❌ No profile ID found for user:', babysitterUserId);
        console.log('Available mappings:', mapping);
        setBookings([]);
        setLoading(false);
        return;
      }
      
      // Now fetch bookings
      const apiUrl = `http://localhost:3001/api/bookings/`;
      console.log('🌐 Calling bookings API:', apiUrl);
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('🌐 Bookings API status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 REAL Bookings API response received');
        
        if (data.success && data.bookings) {
          console.log(`📦 Total bookings from API: ${data.bookings.length}`);
          
          // ✅ Filter bookings: Check if booking.babysitterId matches the PROFILE ID
          const babysitterBookings = data.bookings.filter(booking => {
            const bookingBabysitterId = booking.babysitterId?.toString();
            const isMatch = bookingBabysitterId === babysitterProfileId.toString();
            
            if (isMatch) {
              console.log(`✅ Booking ${booking._id} belongs to this babysitter`);
            }
            
            return isMatch;
          });
          
          console.log(`✅ Found ${babysitterBookings.length} bookings for this babysitter`);
          
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
            
            console.log('✅ Formatted REAL bookings:', formattedBookings);
            setBookings(formattedBookings);
          } else {
            console.log('⚠️ No bookings found for this babysitter');
            console.log('🔍 Looking for bookings where babysitterId =', babysitterProfileId);
            setBookings([]);
          }
          
          setLoading(false);
        } else {
          console.log('⚠️ API returned no bookings:', data.message);
          setBookings([]);
          setLoading(false);
        }
      } else {
        console.error('❌ Bookings API error:', response.status);
        setBookings([]);
        setLoading(false);
      }
    } catch (error) {
      console.error('❌ Network error fetching bookings:', error);
      setBookings([]);
      setLoading(false);
    }
  };

  // Debug function
  const debugBookingsStructure = async () => {
    console.log('🔍 === DEBUG START ===');
    try {
      const token = localStorage.getItem('token');
      const userData = JSON.parse(localStorage.getItem('user'));
      const userId = userData?.id || userData?._id;
      
      console.log('👤 Current User ID:', userId);
      console.log('👤 Current User Data:', userData);
      
      // Show current mapping
      console.log('🗺️ Current Profile ID Mapping:', profileIdMap);
      console.log('🎯 My Profile ID:', profileIdMap[userId]);
      
      // Fetch and show all babysitters
      console.log('📋 Fetching all babysitters...');
      const response = await fetch('http://localhost:3001/api/babysitters/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 All babysitters:', data);
      }
      
      // Fetch and show all bookings
      console.log('📅 Fetching all bookings...');
      const bookingsResponse = await fetch('http://localhost:3001/api/bookings/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (bookingsResponse.ok) {
        const bookingsData = await bookingsResponse.json();
        console.log('📊 All bookings count:', bookingsData.bookings?.length || 0);
      }
      
      console.log('🔍 === DEBUG END ===');
      alert('Debug info logged to console');
      
    } catch (error) {
      console.error('Debug error:', error);
    }
  };

  useEffect(() => {
    console.log('=== 🎓 BABYSITTER DASHBOARD LOADING ===');
    
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    
    console.log('📦 Stored user:', storedUser ? 'EXISTS' : 'MISSING');
    console.log('🔑 Stored token:', storedToken ? 'EXISTS' : 'MISSING');
    
    if (storedUser && storedToken) {
      const userData = JSON.parse(storedUser);
      console.log('✅ Babysitter authenticated:', userData.name);
      console.log('👤 User ID:', userData.id || userData._id);
      console.log('👤 Full user data:', userData);
      
      setUser(userData);
      
      // Initialize skills from user profile
      const profile = userData.babysitterProfile || userData;
      const initialSkills = Array.isArray(profile.skills) ? 
        profile.skills.flatMap(skill => 
          typeof skill === 'string' ? 
            skill.split(',').map(s => s.trim()).filter(s => s) : 
            [skill]
        ) : 
        ['Childcare', 'Homework Help', 'First Aid'];
      
      console.log('🎯 Initial skills:', initialSkills);
      setSkills(initialSkills);
      
      // Fetch REAL bookings from API with correct ID
      fetchRealBookings(userData.id || userData._id);
    } else {
      console.log('❌ No credentials found. Redirecting to login...');
      navigate('/login');
    }
  }, [navigate]);

  // Accept booking
  const acceptBooking = async (id) => {
    console.log('✅ Accepting booking:', id);
    
    if (!isRealBookingId(id)) {
      alert('This appears to be an invalid booking ID. Please refresh and try again.');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      console.log('🔑 Using token for API call');
      
      const response = await fetch(`http://localhost:3001/api/bookings/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'confirmed' })
      });
      
      console.log('🌐 API Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Accept booking response:', data);
        
        if (data.success) {
          // Update local state
          setBookings(bookings.map(booking => 
            booking.id === id ? { ...booking, status: 'confirmed' } : booking
          ));
          alert('✅ Booking accepted successfully!');
          
          // Refresh bookings to get latest data
          const userData = JSON.parse(localStorage.getItem('user'));
          fetchRealBookings(userData?.id || userData?._id);
        } else {
          alert(`❌ Error: ${data.message}`);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`❌ Server error: ${errorData.message || response.statusText}`);
      }
    } catch (error) {
      console.log('⚠️ Backend API failed:', error.message);
      alert('❌ Error connecting to server. Please try again.');
    }
  };

  // Reject booking
  const rejectBooking = async (id) => {
    if (!window.confirm('Are you sure you want to reject this booking?')) {
      return;
    }
    
    console.log('❌ Rejecting booking:', id);
    
    if (!isRealBookingId(id)) {
      alert('This appears to be an invalid booking ID. Please refresh and try again.');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      console.log('🔑 Using token for API call');
      
      const response = await fetch(`http://localhost:3001/api/bookings/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'rejected' })
      });
      
      console.log('🌐 API Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Reject booking response:', data);
        
        if (data.success) {
          // Update local state
          setBookings(bookings.map(booking => 
            booking.id === id ? { ...booking, status: 'rejected' } : booking
          ));
          alert('✅ Booking rejected successfully.');
          
          // Refresh bookings to get latest data
          const userData = JSON.parse(localStorage.getItem('user'));
          fetchRealBookings(userData?.id || userData?._id);
        } else {
          alert(`❌ Error: ${data.message}`);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`❌ Server error: ${errorData.message || response.statusText}`);
      }
    } catch (error) {
      console.log('⚠️ Backend API failed:', error.message);
      alert('❌ Error connecting to server. Please try again.');
    }
  };

  const handleLogout = () => {
    console.log('👋 Logging out...');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  // Show loading while checking auth
  if (!user) {
    return (
      <div className="dashboard-container">
        <div className="loading">
          <h2>Checking authentication...</h2>
          <p>Please wait while we verify your login.</p>
        </div>
      </div>
    );
  }

  const profile = user.babysitterProfile || user;
  const userProfileId = profileIdMap[user.id || user._id];

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>🎓 Babysitter Dashboard</h1>
        <div className="header-actions">
          <span className="welcome-text">Welcome, {user.name}</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </div>

      <div className="user-info">
        <h2>Your Profile</h2>
        <div className="profile-details">
          <div className="detail-item">
            <strong>🎓 University:</strong> {profile.university || 'Not set'}
          </div>
          <div className="detail-item">
            <strong>📚 Department:</strong> {profile.department || 'Not set'}
          </div>
          <div className="detail-item">
            <strong>📅 Year:</strong> {profile.year || 'Not set'}
          </div>
          <div className="detail-item">
            <strong>💰 Hourly Rate:</strong> {profile.hourlyRate || '0'} BDT
          </div>
          <div className="detail-item">
            <strong>⭐ Experience:</strong> {profile.experience || 'Not specified'}
          </div>
          <div className="detail-item">
            <strong>📝 Student ID:</strong> {profile.studentId || 'Not set'}
          </div>
          <div className="detail-item">
            <strong>🔑 User ID:</strong> <small>{user.id || user._id}</small>
          </div>
          <div className="detail-item">
            <strong>📋 Profile ID:</strong> <small>{userProfileId || 'Loading...'}</small>
          </div>
          <div className="detail-item">
            <strong>📊 Total Bookings:</strong> {bookings.length}
          </div>
        </div>
      </div>

      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>Total Earnings</h3>
            <p className="stat-number">
              {bookings
                .filter(b => b.status === 'completed')
                .reduce((sum, b) => sum + (b.amount || 0), 0)} BDT
            </p>
            <p className="stat-label">Completed jobs</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <h3>Pending Requests</h3>
            <p className="stat-number">{bookings.filter(b => b.status === 'pending').length}</p>
            <p className="stat-label">Awaiting response</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>Confirmed Jobs</h3>
            <p className="stat-number">{bookings.filter(b => b.status === 'confirmed').length}</p>
            <p className="stat-label">Upcoming</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">👶</div>
          <div className="stat-content">
            <h3>Total Jobs</h3>
            <p className="stat-number">{bookings.length}</p>
            <p className="stat-label">All bookings</p>
          </div>
        </div>
      </div>

      <div className="dashboard-sections">
        <div className="section-card">
          <div className="section-icon">📅</div>
          <h3>Manage Availability</h3>
          <p>Set your available time slots</p>
          <button className="action-btn">Set Schedule</button>
        </div>

        <div className="section-card">
          <div className="section-icon">📋</div>
          <h3>Job Requests</h3>
          <p>View and accept/reject booking requests</p>
          <button 
            className="action-btn"
            onClick={() => {
              const pendingCount = bookings.filter(b => b.status === 'pending').length;
              alert(`You have ${pendingCount} pending booking request${pendingCount !== 1 ? 's' : ''}`);
            }}
          >
            View Requests ({bookings.filter(b => b.status === 'pending').length})
          </button>
        </div>

        <div className="section-card">
          <div className="section-icon">💰</div>
          <h3>Earnings</h3>
          <p>Track your payments and earnings</p>
          <button className="action-btn">View Earnings</button>
        </div>

        <div className="section-card">
          <div className="section-icon">⭐</div>
          <h3>My Reviews</h3>
          <p>See what parents say about you</p>
          <button className="action-btn">View Reviews</button>
        </div>
      </div>

      {/* Skills Section */}
      <div className="skills-section">
        <div className="section-header">
          <h3>🎯 Your Skills</h3>
          <span className="badge">{skills.length}/10</span>
        </div>
        
        {skills.length === 0 ? (
          <div className="no-skills">
            <p>No skills added yet. Add your first skill!</p>
          </div>
        ) : (
          <div className="skills-list">
            {skills.map((skill, index) => (
              <div key={index} className="skill-item">
                <span className="skill-tag">
                  {skill}
                  <button 
                    onClick={() => removeSkill(skill)}
                    className="remove-skill-btn"
                    title="Remove skill"
                  >
                    ×
                  </button>
                </span>
              </div>
            ))}
          </div>
        )}
        
        <div className="add-skill-form">
          <div className="input-group">
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter a skill (e.g., 'Tutoring', 'First Aid Certified')"
              maxLength="50"
              className="skill-input"
            />
            <button 
              onClick={addSkill} 
              className="add-skill-btn"
              disabled={!newSkill.trim()}
            >
              + Add Skill
            </button>
          </div>
          <small className="hint">Press Enter or click Add to save. Max 10 skills.</small>
        </div>
      </div>

      <div className="bookings-section">
        <div className="section-header">
          <h3>📋 Your Bookings ({bookings.length})</h3>
          <div className="status-filter">
            <span className="filter-badge pending">{bookings.filter(b => b.status === 'pending').length} Pending</span>
            <span className="filter-badge confirmed">{bookings.filter(b => b.status === 'confirmed').length} Confirmed</span>
            <span className="filter-badge completed">{bookings.filter(b => b.status === 'completed').length} Completed</span>
          </div>
        </div>
        
        {loading ? (
          <div className="loading">
            <p>Loading your bookings...</p>
            <small>Fetching from: http://localhost:3001/api/bookings/</small>
          </div>
        ) : (
          <div className="bookings-table">
            {bookings.length === 0 ? (
              <div className="no-bookings">
                <p>No bookings found yet.</p>
                <p className="hint">When parents book your services, their requests will appear here.</p>
                <button 
                  onClick={debugBookingsStructure}
                  className="debug-btn"
                  style={{marginTop: '10px'}}
                >
                  🔍 Debug Booking Data
                </button>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Parent</th>
                    <th>Date & Time</th>
                    <th>Children</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking.id}>
                      <td>
                        <div className="parent-info">
                          <strong>{booking.parent}</strong>
                        </div>
                      </td>
                      <td>
                        <div>{booking.date}</div>
                        <small>{booking.time} ({booking.hours} hrs)</small>
                      </td>
                      <td>{booking.children}</td>
                      <td>
                        <strong>{booking.amount} BDT</strong>
                      </td>
                      <td>
                        <span className={`status-badge ${booking.status}`}>
                          {booking.status}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          {booking.status === 'pending' && (
                            <>
                              <button 
                                className="btn-success small-btn"
                                onClick={() => acceptBooking(booking.id)}
                              >
                                Accept
                              </button>
                              <button 
                                className="btn-danger small-btn"
                                onClick={() => rejectBooking(booking.id)}
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {booking.status === 'confirmed' && (
                            <button className="btn-info small-btn">Message Parent</button>
                          )}
                          {booking.status === 'completed' && (
                            <button className="btn-outline small-btn">Leave Review</button>
                          )}
                          {(booking.status === 'cancelled' || booking.status === 'rejected') && (
                            <span className="status-text">No actions available</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      <div className="quick-actions">
        <h3>⚡ Quick Actions</h3>
        <div className="action-buttons">
          <button 
            className="quick-btn primary" 
            onClick={() => {
              console.log('Refreshing bookings...');
              const userData = JSON.parse(localStorage.getItem('user'));
              fetchRealBookings(userData?.id || userData?._id);
            }}
          >
            🔄 Refresh Bookings
          </button>
          
          <button 
            className="quick-btn debug"
            onClick={debugBookingsStructure}
          >
            🔍 Debug System
          </button>
          
          <button 
            className="quick-btn info"
            onClick={() => {
              const userData = JSON.parse(localStorage.getItem('user'));
              const userId = userData?.id || userData?._id;
              const profileId = profileIdMap[userId];
              alert(`Your IDs:\n\n👤 User ID: ${userId}\n📋 Profile ID: ${profileId || 'Not found'}\n🗺️ Mapping entries: ${Object.keys(profileIdMap).length}\n\nParents use your PROFILE ID when booking.`);
            }}
          >
            📋 Show My IDs
          </button>
        </div>
      </div>
    </div>
  );
};

export default BabysitterDashboard;