import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Box,
  Typography,
  Button,
  Card,
  Grid,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tab,
  Tabs,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  Avatar
} from '@mui/material';
import {
  Logout,
  People,
  Event,
  CheckCircle,
  Cancel,
  Search,
  Delete,
  Visibility,
  VerifiedUser,
  Warning,
  AttachMoney,
  PersonAdd,
  AdminPanelSettings,
  Edit,
  ChevronLeft,
  ChevronRight
} from '@mui/icons-material';
import KinderLogo from '../../assets/KinderLogo.png';
import '../LoginPage.css';

const AdminDashboard = () => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openCreateAdminDialog, setOpenCreateAdminDialog] = useState(false);
  const [newAdminData, setNewAdminData] = useState({ name: '', email: '', password: '' });
  const [createAdminLoading, setCreateAdminLoading] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editUserData, setEditUserData] = useState({ 
    name: '', email: '', phone: '',
    address: '',
    university: '', studentId: '', department: '', year: '', hourlyRate: '', experience: ''
  });
  const [editLoading, setEditLoading] = useState(false);
  const [userStatusFilter, setUserStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(0);
  const [bookingsPage, setBookingsPage] = useState(0);
  const ITEMS_PER_PAGE = 10;
  const navigate = useNavigate();

  // Pink/Magenta theme color (matching the admin icon)
  const themeColor = '#E91E63';

  const fetchDashboardData = async () => {
    const token = sessionStorage.getItem('token');
    
    if (!token) {
      navigate('/login');
      return;
    }

    setLoading(true);

    try {
      const urls = [
        `http://localhost:3000/api/admin/dashboard`,
        `http://localhost:3000/api/admin/users?limit=100`,
        `http://localhost:3000/api/admin/bookings?limit=100`,
        `http://localhost:3000/api/admin/verifications`
      ];

      const [statsRes, usersRes, bookingsRes, verificationsRes] = await Promise.all([
        fetch(urls[0], { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(urls[1], { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(urls[2], { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(urls[3], { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (statsRes.status === 401 || usersRes.status === 401) {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        navigate('/login');
        return;
      }

      const statsData = await statsRes.json();
      const usersData = await usersRes.json();
      const bookingsData = await bookingsRes.json();
      const verificationsData = await verificationsRes.json();

      if (statsData.success) setStats(statsData.data?.statistics || statsData.data);
      if (usersData.success) setUsers(usersData.data?.users || usersData.data || []);
      if (bookingsData.success) setBookings(bookingsData.data?.bookings || bookingsData.data || []);
      if (verificationsData.success) setVerifications(verificationsData.data?.verifications || verificationsData.data || []);

    } catch (error) {
      console.error('Network error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const token = sessionStorage.getItem('token');
      const storedUser = sessionStorage.getItem('user');
      
      if (!token || !storedUser) {
        navigate('/login');
        return;
      }
      
      try {
        const userData = JSON.parse(storedUser);
        if (userData.role !== 'admin') {
          navigate('/login');
          return;
        }
        
        setUser(userData);
        await fetchDashboardData();
        
        const pollInterval = setInterval(async () => {
          const currentToken = sessionStorage.getItem('token');
          if (!currentToken) {
            clearInterval(pollInterval);
            return;
          }
          
          try {
            const [verificationsRes, usersRes, statsRes] = await Promise.all([
              fetch('http://localhost:3000/api/admin/verifications', {
              headers: { 'Authorization': `Bearer ${currentToken}` }
              }),
              fetch('http://localhost:3000/api/admin/users?limit=100', {
                headers: { 'Authorization': `Bearer ${currentToken}` }
              }),
              fetch('http://localhost:3000/api/admin/dashboard', {
                headers: { 'Authorization': `Bearer ${currentToken}` }
              })
            ]);
            
            if (verificationsRes.ok) {
              const data = await verificationsRes.json();
              if (data.success) {
                setVerifications(data.data?.verifications || data.data || []);
              }
            }
            
            if (usersRes.ok) {
              const data = await usersRes.json();
              if (data.success) {
                setUsers(data.data?.users || data.data || []);
              }
            }
            
                  if (statsRes.ok) {
              const data = await statsRes.json();
              if (data.success) {
                setStats(data.data?.statistics || data.data);
              }
            }
          } catch (error) {
            console.log('Auto-refresh: Network issue');
          }
        }, 10000);
        
        return () => clearInterval(pollInterval);
        
      } catch (error) {
        navigate('/login');
      }
    };
    
    checkAuth();
  }, [navigate]);

  const handleLogout = () => {
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
    window.location.href = '/';
  };

  const handleCreateAdmin = async () => {
    if (!newAdminData.name || !newAdminData.email || !newAdminData.password) {
      alert('Please fill in all fields');
      return;
    }

    if (newAdminData.password.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    setCreateAdminLoading(true);
    const token = sessionStorage.getItem('token');

    try {
      const res = await fetch('http://localhost:3000/api/admin/create-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newAdminData)
      });

      const data = await res.json();

      if (data.success) {
        alert(`Admin "${data.data.name}" created successfully!`);
        setOpenCreateAdminDialog(false);
        setNewAdminData({ name: '', email: '', password: '' });
        fetchDashboardData();
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      alert('Error creating admin');
    } finally {
      setCreateAdminLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    const token = sessionStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:3000/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setUsers(users.filter(u => u._id !== userId));
        alert('User deleted successfully');
        fetchDashboardData();
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      alert('Error deleting user');
    }
  };

  const handleOpenEditDialog = (userToEdit) => {
    setSelectedUser(userToEdit);
    const profile = userToEdit.profile || {};
    setEditUserData({
      name: userToEdit.name || '',
      email: userToEdit.email || '',
      phone: userToEdit.phone || '',
      address: profile.address || '',
      university: profile.university || '',
      studentId: profile.studentId || '',
      department: profile.department || '',
      year: profile.year || '',
      hourlyRate: profile.hourlyRate || '',
      experience: profile.experience || ''
    });
    setOpenEditDialog(true);
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;
    
    setEditLoading(true);
    const token = sessionStorage.getItem('token');
    
    try {
      const res = await fetch(`http://localhost:3000/api/admin/users/${selectedUser._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editUserData)
      });
      
      const data = await res.json();
      
      if (data.success) {
        alert('User updated successfully');
        setOpenEditDialog(false);
        fetchDashboardData();
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      alert('Error updating user');
    } finally {
      setEditLoading(false);
    }
  };

const handleVerifyUser = async (userId, verified, userType) => {
    const token = sessionStorage.getItem('token');
  
  let reason = '';
  if (!verified) {
      reason = window.prompt('Please provide a reason for rejection (Mandatory):');
      if (!reason || reason.trim() === '') {
        alert('Rejection reason is required. Please provide a reason.');
        return;
      }
  }
  
  try {
      const res = await fetch(`http://localhost:3000/api/admin/verify-user/${userId}`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ 
          verified,
    rejectionReason: reason,
          userType: userType
  })
});
    
    const data = await res.json();
    
    if (res.status === 403) {
        alert('Access Denied: You must be an admin');
      return;
    }
    
    if (data.success) {
      setVerifications(prev => prev.filter(v => v._id !== userId));
      fetchDashboardData();
      const action = verified ? 'approved' : 'rejected';
        alert(`User ${action} successfully!`);
    } else {
        alert(`Error: ${data.message}`);
    }
  } catch (error) {
      alert('Error processing verification');
  }
};

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    
    let matchesStatus = true;
    if (userStatusFilter === 'verified') {
      matchesStatus = u.verified === true;
    } else if (userStatusFilter === 'pending') {
      matchesStatus = u.verified !== true && u.isRejected !== true;
    } else if (userStatusFilter === 'rejected') {
      matchesStatus = u.isRejected === true;
    }
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const filteredBookings = bookings.filter(b => {
    return statusFilter === 'all' || b.status === statusFilter;
  });

  // Pagination
  const totalUserPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE);
  
  const totalBookingPages = Math.ceil(filteredBookings.length / ITEMS_PER_PAGE);
  const paginatedBookings = filteredBookings.slice(bookingsPage * ITEMS_PER_PAGE, (bookingsPage + 1) * ITEMS_PER_PAGE);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm, roleFilter, userStatusFilter]);

  useEffect(() => {
    setBookingsPage(0);
  }, [statusFilter]);

  const getStatusColor = (status) => {
    const colors = {
      pending: '#FFA726',
      confirmed: '#03A9F4',
      completed: '#4CAF50',
      cancelled: '#9E9E9E',
      rejected: '#f44336'
    };
    return colors[status] || '#9E9E9E';
  };

  // Get avatar color based on role
  const getAvatarColor = (role) => {
    return role === 'parent' ? '#03A9F4' : '#FFEB3B'; // Sky blue for parent, Bright yellow for babysitter
  };

  // Main container glass style
  const glassStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(10px)',
    border: '2px solid rgba(255, 255, 255, 0.2)',
    borderRadius: 3
  };

  // Dark glass style for stat cards
  const darkGlassStyle = {
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

  // Transparent card style for verification cards
  const whiteCardStyle = {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    backdropFilter: 'blur(8px)',
    borderRadius: 2,
    border: '1px solid rgba(255, 255, 255, 0.1)',
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateY(-3px)',
      backgroundColor: 'rgba(0, 0, 0, 0.35)'
    }
  };

  // Dropdown menu styles - transparent black
  const selectMenuProps = {
    PaperProps: {
      sx: {
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.2)',
        '& .MuiMenuItem-root': {
          color: 'white',
          '&:hover': {
            backgroundColor: 'rgba(255,255,255,0.1)'
          },
          '&.Mui-selected': {
            backgroundColor: 'rgba(233, 30, 99, 0.3)',
            '&:hover': {
              backgroundColor: 'rgba(233, 30, 99, 0.4)'
            }
          }
        }
      }
    }
  };

  if (!user || loading) {
    return (
      <Box
        className="login-page-wrapper"
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Paper sx={{ ...glassStyle, padding: 4, textAlign: 'center' }}>
          <CircularProgress sx={{ color: 'white' }} />
          <Typography sx={{ marginTop: 2, color: 'white', fontWeight: 500 }}>
            Loading dashboard...
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box
      className="login-page-wrapper"
      sx={{
        minHeight: '100vh',
        padding: 3
      }}
    >
      <Container maxWidth="xl">
        {/* Single Glassmorphism Container */}
        <Paper
          elevation={0}
          sx={{
            ...glassStyle,
            padding: 4,
            animation: 'slideUp 0.8s ease-out'
          }}
        >
          {/* Header */}
          <Box sx={{ 
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 4,
            flexWrap: 'wrap',
            gap: 2,
            backgroundColor: 'rgba(0, 0, 0, 0.35)',
            backdropFilter: 'blur(10px)',
            borderRadius: 2,
            padding: 2.5,
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box 
                component="img" 
                src={KinderLogo} 
                alt="KINDER Logo" 
                sx={{ height: 60, objectFit: 'contain' }} 
              />
          <Box>
                <Typography variant="h3" sx={{ 
                  fontWeight: 800, 
                  color: 'white',
                  textShadow: '3px 3px 6px rgba(0, 0, 0, 0.7)',
                  letterSpacing: '1px'
                }}>
              Admin Dashboard
            </Typography>
                <Typography sx={{ 
                  color: 'rgba(255, 255, 255, 0.95)', 
                  fontSize: '1rem',
                  textShadow: '1px 1px 3px rgba(0, 0, 0, 0.5)',
                  textAlign: 'left'
                }}>
                  Welcome back, {user.name}
            </Typography>
              </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<PersonAdd />}
              onClick={() => setOpenCreateAdminDialog(true)}
              sx={{
                  backgroundColor: themeColor,
                  color: 'white',
                  fontWeight: 600,
                  textTransform: 'none',
                  '&:hover': { backgroundColor: '#C2185B' }
              }}
            >
              Create Admin
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

        {/* Statistics Cards */}
        {stats && (
            <Grid container spacing={2} sx={{ marginBottom: 4 }}>
            {[
                { icon: <People />, label: 'Total Users', value: stats.totalUsers || 0, color: '#667eea' },
                { icon: <People />, label: 'Parents', value: stats.totalParents || 0, color: '#03A9F4' },
                { icon: <People />, label: 'Babysitters', value: stats.totalBabysitters || 0, color: '#FFEB3B' },
                { icon: <AdminPanelSettings />, label: 'Admins', value: stats.totalAdmins || 1, color: themeColor },
              { icon: <Event />, label: 'Total Bookings', value: stats.totalBookings || 0, color: '#2196F3' },
                { icon: <Warning />, label: 'Pending', value: stats.pendingBookings || 0, color: '#FFC107' },
                { icon: <VerifiedUser />, label: 'Verifications', value: stats.pendingVerifications || 0, color: '#9C27B0' },
                { icon: <AttachMoney />, label: 'Revenue', value: `৳${stats.totalRevenue || 0}`, color: '#00BCD4' },
                { icon: <AttachMoney />, label: 'Platform Earnings', value: `৳${stats.platformEarnings || 0}`, color: '#FF6F00' }
            ].map((stat, idx) => (
                <Grid item xs={6} sm={4} md={3} lg={1.5} key={idx}>
                  <Box sx={{ ...darkGlassStyle, padding: 2, textAlign: 'center' }}>
                  <Box
                    sx={{
                        width: 40,
                        height: 40,
                      borderRadius: '50%',
                      backgroundColor: stat.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                        margin: '0 auto 8px',
                        color: 'white',
                        boxShadow: `0 4px 15px ${stat.color}50`
                    }}
                  >
                      {React.cloneElement(stat.icon, { sx: { fontSize: 20 } })}
                  </Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: 'white', textShadow: '2px 2px 4px rgba(0,0,0,0.7)' }}>
                    {stat.value}
                  </Typography>
                    <Typography sx={{ color: 'white', fontSize: '0.85rem', fontWeight: 600, textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
                    {stat.label}
                      </Typography>
                  </Box>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Tabs Section */}
          <Box sx={{ overflow: 'hidden', borderRadius: 2 }}>
            {/* Solid Gray Tabs with Pink indicator */}
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{
                backgroundColor: 'rgba(50, 50, 50, 0.95)',
                borderRadius: '8px 8px 0 0',
                '& .MuiTab-root': {
                  color: 'white',
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '1rem',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                },
              '& .Mui-selected': { color: '#fff !important' },
                '& .MuiTabs-indicator': { backgroundColor: themeColor, height: 3 }
            }}
          >
              <Tab label="Users" icon={<People />} iconPosition="start" sx={{ '& .MuiSvgIcon-root': { color: 'white' } }} />
              <Tab label="Bookings" icon={<Event />} iconPosition="start" sx={{ '& .MuiSvgIcon-root': { color: 'white' } }} />
              <Tab label="Verifications" icon={<VerifiedUser />} iconPosition="start" sx={{ '& .MuiSvgIcon-root': { color: 'white' } }} />
          </Tabs>

            {/* Content Area */}
            <Box sx={{ 
              padding: 3, 
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
              backdropFilter: 'blur(8px)',
              borderRadius: '0 0 8px 8px'
            }}>
            {/* Users Tab */}
            {activeTab === 0 && (
              <>
                  {/* Filters - No box, just inputs */}
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 2, 
                    marginBottom: 3, 
                    flexWrap: 'wrap'
                  }}>
                  <TextField
                    placeholder="Search users..."
                    size="small"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: <Search sx={{ color: 'white', mr: 1 }} />
                      }}
                      sx={{ 
                        minWidth: 280,
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: 'rgba(60, 60, 60, 0.9) !important',
                          color: 'white !important',
                          fontWeight: 600,
                          '& fieldset': { borderColor: 'rgba(255,255,255,0.4)' },
                          '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.6)' },
                          '&.Mui-focused fieldset': { borderColor: themeColor },
                          '&.Mui-focused': { backgroundColor: 'rgba(60, 60, 60, 0.9) !important' }
                        },
                        '& .MuiOutlinedInput-input': {
                          color: 'white !important',
                          caretColor: 'white',
                          '&::placeholder': { color: 'rgba(255,255,255,0.8)', opacity: 1 },
                          '&:-webkit-autofill': {
                            WebkitBoxShadow: '0 0 0 100px rgba(60, 60, 60, 0.9) inset !important',
                            WebkitTextFillColor: 'white !important',
                            caretColor: 'white !important'
                          }
                        }
                      }}
                  />
                    <FormControl size="small" sx={{ minWidth: 140 }}>
                    <Select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                        displayEmpty
                        MenuProps={selectMenuProps}
                        sx={{
                          backgroundColor: 'rgba(60, 60, 60, 0.9)',
                          color: 'white',
                          fontWeight: 600,
                          '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.4)' },
                          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.6)' },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: themeColor },
                          '& .MuiSvgIcon-root': { color: 'white' }
                        }}
                    >
                      <MenuItem value="all">All Roles</MenuItem>
                      <MenuItem value="parent">Parents</MenuItem>
                      <MenuItem value="babysitter">Babysitters</MenuItem>
                    </Select>
                  </FormControl>
                    <FormControl size="small" sx={{ minWidth: 140 }}>
                      <Select
                        value={userStatusFilter}
                        onChange={(e) => setUserStatusFilter(e.target.value)}
                        displayEmpty
                        MenuProps={selectMenuProps}
                        sx={{
                          backgroundColor: 'rgba(60, 60, 60, 0.9)',
                          color: 'white',
                          fontWeight: 600,
                          '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.4)' },
                          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.6)' },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: themeColor },
                          '& .MuiSvgIcon-root': { color: 'white' }
                        }}
                      >
                        <MenuItem value="all">All Status</MenuItem>
                        <MenuItem value="verified">Verified</MenuItem>
                        <MenuItem value="pending">Pending</MenuItem>
                        <MenuItem value="rejected">Rejected</MenuItem>
                      </Select>
                    </FormControl>
                </Box>

                  {/* Users Table - Dark transparent background */}
                  <TableContainer sx={{ 
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    borderRadius: 2,
                    border: '1px solid rgba(255, 255, 255, 0.15)'
                  }}>
                    <Table size="small" sx={{ backgroundColor: 'transparent' }}>
                      {/* Pink Table Header */}
                    <TableHead>
                        <TableRow sx={{ backgroundColor: themeColor }}>
                          <TableCell sx={{ fontWeight: 700, color: 'white', borderBottom: 'none', py: 1.5 }}>User</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: 'white', borderBottom: 'none', py: 1.5 }}>Email</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: 'white', borderBottom: 'none', py: 1.5 }}>Role</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: 'white', borderBottom: 'none', py: 1.5 }}>Status</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: 'white', borderBottom: 'none', py: 1.5 }}>Phone</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: 'white', borderBottom: 'none', py: 1.5 }}>Joined</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: 'white', borderBottom: 'none', py: 1.5 }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                      <TableBody sx={{ backgroundColor: 'transparent' }}>
                        {paginatedUsers.map((u, index) => (
                          <TableRow
                            key={u._id}
                            sx={{
                              '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' },
                              backgroundColor: 'transparent'
                            }}
                          >
                            <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Avatar sx={{
                                  width: 40,
                                  height: 40,
                                  fontSize: '1rem',
                                  fontWeight: 700,
                                  backgroundColor: getAvatarColor(u.role),
                                  color: u.role === 'parent' ? 'white' : '#333',
                                  border: u.role === 'parent' ? '2px solid #0288D1' : '2px solid #FBC02D'
                                }}>
                                {u.name?.charAt(0) || 'U'}
                              </Avatar>
                                <Typography sx={{ fontSize: '0.9rem', color: 'white', fontWeight: 700 }}>
                              {u.name || 'Unknown'}
                                </Typography>
                            </Box>
                          </TableCell>
                            <TableCell sx={{ fontSize: '0.9rem', color: 'white', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                              {u.email || 'N/A'}
                            </TableCell>
                            <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            <Chip
                              label={u.role || 'unknown'}
                              size="small"
                                sx={{
                                  backgroundColor: u.role === 'parent' ? '#03A9F4' : '#FFEB3B',
                                  color: u.role === 'parent' ? 'white' : '#333',
                                  fontWeight: 600,
                                  fontSize: '0.75rem'
                                }}
                            />
                          </TableCell>
                            <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                              <Chip
                                label={u.verified ? 'Verified' : u.isRejected ? 'Rejected' : 'Pending'}
                                size="small"
                                sx={{
                                  backgroundColor: u.verified ? '#2E7D32' : u.isRejected ? '#f44336' : '#FDD835',
                                  color: u.verified ? 'white' : u.isRejected ? 'white' : '#333',
                                  fontWeight: 600,
                                  fontSize: '0.75rem'
                                }}
                              />
                            </TableCell>
                            <TableCell sx={{ fontSize: '0.9rem', color: 'white', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                              {u.phone || 'N/A'}
                            </TableCell>
                            <TableCell sx={{ fontSize: '0.9rem', color: 'white', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                          </TableCell>
                            <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            <IconButton
                              size="small"
                                onClick={() => { setSelectedUser(u); setOpenDialog(true); }}
                            >
                                <Visibility sx={{ color: '#00E5FF', fontSize: 22, '&:hover': { color: '#18FFFF' } }} />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleOpenEditDialog(u)}
                              >
                                <Edit sx={{ color: '#FFEA00', fontSize: 22, '&:hover': { color: '#FFFF00' } }} />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteUser(u._id)}
                            >
                                <Delete sx={{ color: '#FF5252', fontSize: 24, fontWeight: 'bold', '&:hover': { color: '#FF8A80' } }} />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                  {/* Pagination */}
                  {filteredUsers.length > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, marginTop: 3 }}>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<ChevronLeft />}
                        onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                        disabled={currentPage === 0}
                        sx={{
                          backgroundColor: themeColor,
                          color: 'white',
                          fontWeight: 600,
                          '&:hover': { backgroundColor: '#C2185B' },
                          '&:disabled': { backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }
                        }}
                      >
                        Previous
                      </Button>
                      <Typography sx={{ color: 'white', fontSize: '1rem', fontWeight: 700, textShadow: '1px 1px 3px rgba(0,0,0,0.5)' }}>
                        Page {currentPage + 1} of {totalUserPages || 1} ({filteredUsers.length} users)
                      </Typography>
                      <Button
                        variant="contained"
                        size="small"
                        endIcon={<ChevronRight />}
                        onClick={() => setCurrentPage(prev => Math.min(totalUserPages - 1, prev + 1))}
                        disabled={currentPage >= totalUserPages - 1}
                        sx={{
                          backgroundColor: themeColor,
                          color: 'white',
                          fontWeight: 600,
                          '&:hover': { backgroundColor: '#C2185B' },
                          '&:disabled': { backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }
                        }}
                      >
                        Next
                      </Button>
                    </Box>
                  )}

                  {filteredUsers.length === 0 && (
                    <Box sx={{ textAlign: 'center', padding: 4 }}>
                      <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>No users found</Typography>
                    </Box>
                  )}
              </>
            )}

            {/* Bookings Tab */}
            {activeTab === 1 && (
              <>
                  {/* Filter - No box */}
                  <Box sx={{ 
                    marginBottom: 3,
                    display: 'inline-block'
                  }}>
                  <FormControl size="small" sx={{ minWidth: 150 }}>
                    <Select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                        displayEmpty
                        MenuProps={selectMenuProps}
                        sx={{
                          backgroundColor: 'rgba(60, 60, 60, 0.9)',
                          color: 'white',
                          fontWeight: 600,
                          '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.4)' },
                          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.6)' },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: themeColor },
                          '& .MuiSvgIcon-root': { color: 'white' }
                        }}
                    >
                      <MenuItem value="all">All Status</MenuItem>
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="confirmed">Confirmed</MenuItem>
                      <MenuItem value="completed">Completed</MenuItem>
                      <MenuItem value="cancelled">Cancelled</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                  {/* Bookings Table - Dark transparent */}
                  <TableContainer sx={{ 
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    borderRadius: 2,
                    border: '1px solid rgba(255, 255, 255, 0.15)'
                  }}>
                    <Table size="small" sx={{ backgroundColor: 'transparent' }}>
                      {/* Pink Table Header */}
                    <TableHead>
                        <TableRow sx={{ backgroundColor: themeColor }}>
                          <TableCell sx={{ fontWeight: 700, color: 'white', borderBottom: 'none', py: 1.5 }}>ID</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: 'white', borderBottom: 'none', py: 1.5 }}>Parent</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: 'white', borderBottom: 'none', py: 1.5 }}>Babysitter</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: 'white', borderBottom: 'none', py: 1.5 }}>Date</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: 'white', borderBottom: 'none', py: 1.5 }}>Time</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: 'white', borderBottom: 'none', py: 1.5 }}>Amount</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: 'white', borderBottom: 'none', py: 1.5 }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                      <TableBody sx={{ backgroundColor: 'transparent' }}>
                        {paginatedBookings.map((booking, index) => (
                          <TableRow
                            key={booking._id}
                            sx={{
                              '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' },
                              backgroundColor: 'transparent'
                            }}
                          >
                            <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.9rem', color: 'white', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                              #{booking._id?.slice(-6) || 'N/A'}
                          </TableCell>
                            <TableCell sx={{ fontSize: '0.9rem', color: 'white', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            {booking.parentId?.userId?.name || booking.parentName || 'N/A'}
                          </TableCell>
                            <TableCell sx={{ fontSize: '0.9rem', color: 'white', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            {booking.babysitterId?.userId?.name || booking.babysitterName || 'N/A'}
                          </TableCell>
                            <TableCell sx={{ fontSize: '0.9rem', color: 'white', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            {booking.date ? new Date(booking.date).toLocaleDateString() : 'N/A'}
                          </TableCell>
                            <TableCell sx={{ fontSize: '0.9rem', color: 'white', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            {booking.startTime || ''} - {booking.endTime || ''}
                          </TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#81C784', fontSize: '0.95rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                              ৳{booking.totalAmount || 0}
                          </TableCell>
                            <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            <Chip
                              label={booking.status || 'unknown'}
                              size="small"
                              sx={{
                                  backgroundColor: getStatusColor(booking.status),
                                  color: 'white',
                                  fontWeight: 600
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                  {/* Bookings Pagination */}
                  {filteredBookings.length > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, marginTop: 3 }}>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<ChevronLeft />}
                        onClick={() => setBookingsPage(prev => Math.max(0, prev - 1))}
                        disabled={bookingsPage === 0}
                        sx={{
                          backgroundColor: themeColor,
                          color: 'white',
                          fontWeight: 600,
                          '&:hover': { backgroundColor: '#C2185B' },
                          '&:disabled': { backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }
                        }}
                      >
                        Previous
                      </Button>
                      <Typography sx={{ color: 'white', fontSize: '1rem', fontWeight: 700, textShadow: '1px 1px 3px rgba(0,0,0,0.5)' }}>
                        Page {bookingsPage + 1} of {totalBookingPages || 1} ({filteredBookings.length} bookings)
                      </Typography>
                      <Button
                        variant="contained"
                        size="small"
                        endIcon={<ChevronRight />}
                        onClick={() => setBookingsPage(prev => Math.min(totalBookingPages - 1, prev + 1))}
                        disabled={bookingsPage >= totalBookingPages - 1}
                        sx={{
                          backgroundColor: themeColor,
                          color: 'white',
                          fontWeight: 600,
                          '&:hover': { backgroundColor: '#C2185B' },
                          '&:disabled': { backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }
                        }}
                      >
                        Next
                      </Button>
                    </Box>
                  )}

                {filteredBookings.length === 0 && (
                  <Box sx={{ textAlign: 'center', padding: 4 }}>
                      <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>No bookings found</Typography>
                  </Box>
                )}
              </>
            )}

              {/* Verifications Tab - Transparent Cards */}
            {activeTab === 2 && (
                <Grid container spacing={2}>
                  {verifications.map((verifyUser) => (
                    <Grid item xs={12} sm={6} md={4} key={verifyUser._id}>
                      <Card sx={{ ...whiteCardStyle, padding: 2.5, position: 'relative' }}>
                        {/* Type Chip */}
                      <Chip
                          label={verifyUser.type === 'parent' ? 'Parent' : 'Babysitter'}
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 12,
                          right: 12,
                            backgroundColor: verifyUser.type === 'parent' ? '#03A9F4' : '#FFEB3B',
                            color: verifyUser.type === 'parent' ? 'white' : '#333',
                            fontWeight: 600,
                            fontSize: '0.75rem'
                        }}
                      />

                        <Box sx={{ textAlign: 'center', marginBottom: 2 }}>
                        <Avatar
                          sx={{
                            width: 60,
                            height: 60,
                            margin: '0 auto 12px',
                              backgroundColor: verifyUser.type === 'parent' ? '#03A9F4' : '#FFEB3B',
                              fontSize: '1.5rem',
                              fontWeight: 700,
                              color: verifyUser.type === 'parent' ? 'white' : '#333',
                              border: verifyUser.type === 'parent' ? '3px solid #0288D1' : '3px solid #FBC02D'
                          }}
                        >
                            {verifyUser.name?.charAt(0) || 'U'}
                        </Avatar>
                          <Typography variant="h6" sx={{ fontWeight: 700, color: 'white', textTransform: 'uppercase' }}>
                            {verifyUser.name || 'Unknown'}
                        </Typography>
                          <Typography sx={{ color: '#64B5F6', fontSize: '0.85rem' }}>
                            {verifyUser.email}
                        </Typography>
                          <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>
                            {verifyUser.phone || 'No phone'}
                          </Typography>
                      </Box>

                        <Box sx={{ borderTop: '1px solid #eee', paddingTop: 1.5, marginBottom: 1.5 }}>
                          {verifyUser.type === 'babysitter' && (
                          <>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>University</Typography>
                                <Typography sx={{ fontWeight: 500, fontSize: '0.8rem', color: 'white' }}>{verifyUser.university}</Typography>
                            </Box>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>Student ID</Typography>
                                <Typography sx={{ fontWeight: 500, fontSize: '0.8rem', color: 'white' }}>{verifyUser.studentId}</Typography>
                            </Box>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>Department</Typography>
                                <Typography sx={{ fontWeight: 500, fontSize: '0.8rem', color: 'white' }}>{verifyUser.department}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>Rate</Typography>
                                <Typography sx={{ fontWeight: 700, color: '#81C784', fontSize: '0.85rem' }}>৳{verifyUser.hourlyRate}/hr</Typography>
                            </Box>
                          </>
                        )}

                          {verifyUser.type === 'parent' && (
                          <>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>Address</Typography>
                                <Typography sx={{ fontWeight: 500, fontSize: '0.8rem', color: 'white', maxWidth: '60%', textAlign: 'right' }}>
                                  {verifyUser.address || 'Not provided'}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>Children</Typography>
                                <Typography sx={{ fontWeight: 500, fontSize: '0.8rem', color: 'white' }}>{verifyUser.children?.length || 0}</Typography>
                            </Box>
                          </>
                        )}
                      </Box>

                        {/* Approve/Reject Buttons */}
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          fullWidth
                          variant="contained"
                            size="small"
                          startIcon={<CheckCircle />}
                            onClick={() => handleVerifyUser(verifyUser._id, true, verifyUser.type)}
                          sx={{
                            backgroundColor: '#4CAF50',
                              textTransform: 'none',
                              fontWeight: 600,
                            '&:hover': { backgroundColor: '#388E3C' }
                          }}
                        >
                          Approve
                        </Button>
                        <Button
                          fullWidth
                            variant="contained"
                            size="small"
                          startIcon={<Cancel />}
                            onClick={() => handleVerifyUser(verifyUser._id, false, verifyUser.type)}
                          sx={{
                              backgroundColor: '#f44336',
                              color: 'white',
                              textTransform: 'none',
                              fontWeight: 600,
                              '&:hover': { backgroundColor: '#d32f2f' }
                          }}
                        >
                          Reject
                        </Button>
                      </Box>
                    </Card>
                  </Grid>
                ))}
                {verifications.length === 0 && (
                  <Grid item xs={12}>
                    <Box sx={{ textAlign: 'center', padding: 4 }}>
                        <CheckCircle sx={{ fontSize: 50, color: '#4CAF50', marginBottom: 1 }} />
                        <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                          No pending verifications
                      </Typography>
                        <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                        All users have been verified
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
            )}
            </Box>
          </Box>
        </Paper>

        {/* Create Admin Dialog */}
        <Dialog 
          open={openCreateAdminDialog} 
          onClose={() => setOpenCreateAdminDialog(false)} 
          maxWidth="sm" 
          fullWidth
          PaperProps={{ sx: { borderRadius: 2 } }}
        >
          <DialogTitle sx={{ backgroundColor: themeColor, color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
            <AdminPanelSettings /> Create New Admin
          </DialogTitle>
          <DialogContent sx={{ paddingTop: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 1 }}>
              <TextField label="Full Name" fullWidth value={newAdminData.name} onChange={(e) => setNewAdminData({ ...newAdminData, name: e.target.value })} />
              <TextField label="Email Address" type="email" fullWidth value={newAdminData.email} onChange={(e) => setNewAdminData({ ...newAdminData, email: e.target.value })} />
              <TextField label="Password" type="password" fullWidth value={newAdminData.password} onChange={(e) => setNewAdminData({ ...newAdminData, password: e.target.value })} helperText="Minimum 6 characters" />
            </Box>
          </DialogContent>
          <DialogActions sx={{ padding: 2 }}>
            <Button onClick={() => { setOpenCreateAdminDialog(false); setNewAdminData({ name: '', email: '', password: '' }); }}>Cancel</Button>
            <Button variant="contained" onClick={handleCreateAdmin} disabled={createAdminLoading || !newAdminData.name || !newAdminData.email || !newAdminData.password} sx={{ backgroundColor: themeColor, '&:hover': { backgroundColor: '#C2185B' } }}>
              {createAdminLoading ? <CircularProgress size={24} color="inherit" /> : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* User Details Dialog */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
          <DialogTitle sx={{ backgroundColor: '#333', color: 'white' }}>User Details</DialogTitle>
          <DialogContent sx={{ paddingTop: 3 }}>
            {selectedUser && (
              <Box>
                <Box sx={{ textAlign: 'center', marginBottom: 3 }}>
                  <Avatar sx={{ width: 70, height: 70, margin: '0 auto 12px', backgroundColor: getAvatarColor(selectedUser.role), fontSize: '1.5rem', fontWeight: 700, color: selectedUser.role === 'parent' ? 'white' : '#333', border: selectedUser.role === 'parent' ? '3px solid #0288D1' : '3px solid #FBC02D' }}>
                    {selectedUser.name?.charAt(0) || 'U'}
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>{selectedUser.name || 'Unknown'}</Typography>
                  <Chip label={selectedUser.role || 'unknown'} size="small" sx={{ backgroundColor: selectedUser.role === 'parent' ? '#03A9F4' : '#FFEB3B', color: selectedUser.role === 'parent' ? 'white' : '#333' }} />
                </Box>
                <Typography sx={{ mb: 0.5 }}><strong>Email:</strong> {selectedUser.email || 'N/A'}</Typography>
                <Typography sx={{ mb: 0.5 }}><strong>Phone:</strong> {selectedUser.phone || 'N/A'}</Typography>
                {selectedUser.profile && selectedUser.role === 'babysitter' && (
                  <>
                    <Typography sx={{ mb: 0.5 }}><strong>University:</strong> {selectedUser.profile.university || 'N/A'}</Typography>
                    <Typography sx={{ mb: 0.5 }}><strong>Student ID:</strong> {selectedUser.profile.studentId || 'N/A'}</Typography>
                    <Typography sx={{ mb: 0.5 }}><strong>Department:</strong> {selectedUser.profile.department || 'N/A'}</Typography>
                    <Typography sx={{ mb: 0.5 }}><strong>Hourly Rate:</strong> ৳{selectedUser.profile.hourlyRate || 0}</Typography>
                  </>
                )}
                <Typography sx={{ color: '#666', fontSize: '0.85rem', mt: 2 }}>
                    Joined: {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : 'N/A'}
                  </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Edit User Dialog - Pink header, white body like Create Admin */}
        <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
          <DialogTitle sx={{ backgroundColor: themeColor, color: 'white', display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700 }}>
            <Edit /> Edit User
          </DialogTitle>
          <DialogContent sx={{ paddingTop: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#666' }}>Basic Information</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}><TextField label="Full Name" fullWidth value={editUserData.name} onChange={(e) => setEditUserData({ ...editUserData, name: e.target.value })} /></Grid>
                <Grid item xs={12} sm={6}><TextField label="Email" type="email" fullWidth value={editUserData.email} onChange={(e) => setEditUserData({ ...editUserData, email: e.target.value })} /></Grid>
                <Grid item xs={12} sm={6}><TextField label="Phone" fullWidth value={editUserData.phone} onChange={(e) => setEditUserData({ ...editUserData, phone: e.target.value })} /></Grid>
              </Grid>

              {selectedUser?.role === 'parent' && (
                <>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#666', mt: 1 }}>Parent Details</Typography>
                  <TextField label="Address" fullWidth multiline rows={2} value={editUserData.address} onChange={(e) => setEditUserData({ ...editUserData, address: e.target.value })} />
                </>
              )}

              {selectedUser?.role === 'babysitter' && (
                <>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#666', mt: 1 }}>Babysitter Details</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}><TextField label="University" fullWidth value={editUserData.university} onChange={(e) => setEditUserData({ ...editUserData, university: e.target.value })} /></Grid>
                    <Grid item xs={12} sm={6}><TextField label="Student ID" fullWidth value={editUserData.studentId} onChange={(e) => setEditUserData({ ...editUserData, studentId: e.target.value })} /></Grid>
                    <Grid item xs={12} sm={6}><TextField label="Department" fullWidth value={editUserData.department} onChange={(e) => setEditUserData({ ...editUserData, department: e.target.value })} /></Grid>
                    <Grid item xs={12} sm={4}><TextField label="Year" type="number" fullWidth inputProps={{ min: 1, max: 5 }} value={editUserData.year} onChange={(e) => setEditUserData({ ...editUserData, year: e.target.value })} /></Grid>
                    <Grid item xs={12} sm={4}><TextField label="Hourly Rate (৳)" type="number" fullWidth value={editUserData.hourlyRate} onChange={(e) => setEditUserData({ ...editUserData, hourlyRate: e.target.value })} /></Grid>
                    <Grid item xs={12} sm={4}><TextField label="Experience" fullWidth value={editUserData.experience} onChange={(e) => setEditUserData({ ...editUserData, experience: e.target.value })} /></Grid>
                  </Grid>
                </>
              )}
            </Box>
          </DialogContent>
          <DialogActions sx={{ padding: 2 }}>
            <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleEditUser} disabled={editLoading || !editUserData.name || !editUserData.email} sx={{ backgroundColor: themeColor, '&:hover': { backgroundColor: '#C2185B' } }}>
              {editLoading ? <CircularProgress size={24} color="inherit" /> : 'Save'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default AdminDashboard;
