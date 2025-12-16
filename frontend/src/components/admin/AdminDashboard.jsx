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
  InputLabel,
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
  Refresh,
  PersonAdd,
  AdminPanelSettings
} from '@mui/icons-material';
import KinderBackground from '../../assets/KinderBackground.jpg';
import '../Dashboard.css';

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
  const navigate = useNavigate();

  useEffect(() => {
    console.log('=== 👨‍💼 ADMIN DASHBOARD LOADING ===');
    
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    
    if (storedUser && storedToken) {
      const userData = JSON.parse(storedUser);
      if (userData.role !== 'admin') {
        console.log('❌ Not an admin. Redirecting...');
        navigate('/login');
        return;
      }
      console.log('✅ Admin authenticated:', userData.name);
      setUser(userData);
      fetchDashboardData();
    } else {
      console.log('❌ No credentials found. Redirecting to login...');
      navigate('/login');
    }
  }, [navigate]);

  const fetchDashboardData = async () => {
    const token = localStorage.getItem('token');
    
    try {
      // Fetch dashboard stats
      const statsRes = await fetch('http://localhost:3001/api/admin/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const statsData = await statsRes.json();
      if (statsData.success) {
        setStats(statsData.data.statistics);
      }

      // Fetch users
      const usersRes = await fetch('http://localhost:3001/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const usersData = await usersRes.json();
      if (usersData.success) {
        setUsers(usersData.data.users);
      }

      // Fetch bookings
      const bookingsRes = await fetch('http://localhost:3001/api/admin/bookings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const bookingsData = await bookingsRes.json();
      if (bookingsData.success) {
        setBookings(bookingsData.data.bookings);
      }

      // Fetch verifications
      const verificationsRes = await fetch('http://localhost:3001/api/admin/verifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const verificationsData = await verificationsRes.json();
      if (verificationsData.success) {
        setVerifications(verificationsData.data);
      }

    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    console.log('👋 Logging out...');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
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
    const token = localStorage.getItem('token');

    try {
      const res = await fetch('http://localhost:3001/api/admin/create-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newAdminData)
      });

      const data = await res.json();

      if (data.success) {
        alert(`✅ Admin "${data.data.name}" created successfully!`);
        setOpenCreateAdminDialog(false);
        setNewAdminData({ name: '', email: '', password: '' });
        fetchDashboardData(); // Refresh stats
      } else {
        alert(`❌ Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error creating admin:', error);
      alert('❌ Error creating admin');
    } finally {
      setCreateAdminLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:3001/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setUsers(users.filter(u => u._id !== userId));
        fetchDashboardData(); // Refresh stats
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleVerifyUser = async (userId, verified, userType) => {
    const token = localStorage.getItem('token');
    
    // If rejecting, ask for reason
    let reason = '';
    if (!verified) {
      reason = window.prompt('Please provide a reason for rejection (optional):') || '';
    }
    
    try {
      const res = await fetch(`http://localhost:3001/api/admin/verify-user/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ verified, rejectionReason: reason, userType })
      });
      const data = await res.json();
      if (data.success) {
        // Immediately remove the user from the verifications list
        setVerifications(prev => prev.filter(u => u._id !== userId));
        
        // Update stats count
        if (stats) {
          setStats(prev => ({
            ...prev,
            pendingVerifications: Math.max(0, prev.pendingVerifications - 1)
          }));
        }
        
        alert(`✅ ${data.message}`);
      } else {
        alert(`❌ Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error verifying user:', error);
      alert('❌ Error processing verification');
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const filteredBookings = bookings.filter(b => {
    return statusFilter === 'all' || b.status === statusFilter;
  });

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      confirmed: 'info',
      completed: 'success',
      cancelled: 'error',
      rejected: 'error'
    };
    return colors[status] || 'default';
  };

  if (!user || loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          backgroundImage: `url(${KinderBackground})`,
          backgroundSize: 'cover',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Paper sx={{ padding: 4, textAlign: 'center', borderRadius: 3 }}>
          <CircularProgress sx={{ color: '#764ba2' }} />
          <Typography sx={{ marginTop: 2, color: '#333' }}>
            Loading admin dashboard...
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundImage: `url(${KinderBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        paddingTop: 4,
        paddingBottom: 4
      }}
    >
      <Container maxWidth="xl">
        {/* Header */}
        <Paper
          sx={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: 3,
            padding: 3,
            marginBottom: 4,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
            animation: 'slideUp 0.8s ease-out'
          }}
        >
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a2e' }}>
              Admin Dashboard
            </Typography>
            <Typography sx={{ color: 'rgba(51, 51, 51, 0.7)' }}>
              Welcome back, {user.name}! 👨‍💼
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<PersonAdd />}
              onClick={() => setOpenCreateAdminDialog(true)}
              sx={{
                backgroundColor: '#4CAF50',
                '&:hover': { backgroundColor: '#388E3C' }
              }}
            >
              Create Admin
            </Button>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={fetchDashboardData}
              sx={{
                borderColor: '#764ba2',
                color: '#764ba2',
                '&:hover': { backgroundColor: 'rgba(118, 75, 162, 0.1)' }
              }}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<Logout />}
              onClick={handleLogout}
              sx={{
                backgroundColor: '#ff5252',
                '&:hover': { backgroundColor: '#ff0000' }
              }}
            >
              Logout
            </Button>
          </Box>
        </Paper>

        {/* Statistics Cards */}
        {stats && (
          <Grid container spacing={3} sx={{ marginBottom: 4 }}>
            {[
              { icon: <People />, label: 'Total Users', value: stats.totalUsers, color: '#667eea', subtitle: '(excluding admins)' },
              { icon: <People />, label: 'Parents', value: stats.totalParents, color: '#4CAF50' },
              { icon: <People />, label: 'Babysitters', value: stats.totalBabysitters, color: '#FF9800' },
              { icon: <AdminPanelSettings />, label: 'Admins', value: stats.totalAdmins || 1, color: '#E91E63' },
              { icon: <Event />, label: 'Total Bookings', value: stats.totalBookings, color: '#2196F3' },
              { icon: <Warning />, label: 'Pending Bookings', value: stats.pendingBookings, color: '#FFC107' },
              { icon: <VerifiedUser />, label: 'Pending Verifications', value: stats.pendingVerifications, color: '#9C27B0' },
              { icon: <AttachMoney />, label: 'Total Revenue', value: `৳${stats.totalRevenue}`, color: '#00BCD4' }
            ].map((stat, idx) => (
              <Grid item xs={12} sm={6} md={3} key={idx}>
                <Paper
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: 3,
                    padding: 3,
                    textAlign: 'center',
                    animation: `slideUp 0.8s ease-out ${idx * 0.05}s both`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.15)'
                    }
                  }}
                >
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: '50%',
                      backgroundColor: stat.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px',
                      color: 'white'
                    }}
                  >
                    {stat.icon}
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#333' }}>
                    {stat.value}
                  </Typography>
                  <Typography sx={{ color: 'rgba(51, 51, 51, 0.7)', fontSize: '0.9rem' }}>
                    {stat.label}
                    {stat.subtitle && (
                      <Typography component="span" sx={{ fontSize: '0.75rem', display: 'block', color: 'rgba(51, 51, 51, 0.5)' }}>
                        {stat.subtitle}
                      </Typography>
                    )}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Tabs Section */}
        <Paper
          sx={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: 3,
            overflow: 'hidden',
            animation: 'fadeInUp 0.8s ease-out'
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{
              backgroundColor: '#1a1a2e',
              '& .MuiTab-root': { color: 'rgba(255,255,255,0.7)' },
              '& .Mui-selected': { color: '#fff !important' },
              '& .MuiTabs-indicator': { backgroundColor: '#764ba2' }
            }}
          >
            <Tab label="Users" icon={<People />} iconPosition="start" />
            <Tab label="Bookings" icon={<Event />} iconPosition="start" />
            <Tab label="Verifications" icon={<VerifiedUser />} iconPosition="start" />
          </Tabs>

          <Box sx={{ padding: 3 }}>
            {/* Users Tab */}
            {activeTab === 0 && (
              <>
                <Box sx={{ display: 'flex', gap: 2, marginBottom: 3, flexWrap: 'wrap' }}>
                  <TextField
                    placeholder="Search users..."
                    size="small"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: <Search sx={{ color: 'rgba(0,0,0,0.5)', mr: 1 }} />
                    }}
                    sx={{ minWidth: 250 }}
                  />
                  <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Role</InputLabel>
                    <Select
                      value={roleFilter}
                      label="Role"
                      onChange={(e) => setRoleFilter(e.target.value)}
                    >
                      <MenuItem value="all">All Roles</MenuItem>
                      <MenuItem value="parent">Parents</MenuItem>
                      <MenuItem value="babysitter">Babysitters</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableCell sx={{ fontWeight: 700 }}>User</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Phone</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Joined</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredUsers.map((u) => (
                        <TableRow key={u._id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar sx={{ backgroundColor: u.role === 'parent' ? '#4CAF50' : '#FF9800' }}>
                                {u.name.charAt(0)}
                              </Avatar>
                              {u.name}
                            </Box>
                          </TableCell>
                          <TableCell>{u.email}</TableCell>
                          <TableCell>
                            <Chip
                              label={u.role}
                              size="small"
                              color={u.role === 'parent' ? 'success' : 'warning'}
                            />
                          </TableCell>
                          <TableCell>{u.phone || 'N/A'}</TableCell>
                          <TableCell>
                            {new Date(u.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedUser(u);
                                setOpenDialog(true);
                              }}
                              sx={{ color: '#2196F3' }}
                            >
                              <Visibility />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteUser(u._id)}
                              sx={{ color: '#f44336' }}
                            >
                              <Delete />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}

            {/* Bookings Tab */}
            {activeTab === 1 && (
              <>
                <Box sx={{ marginBottom: 3 }}>
                  <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={statusFilter}
                      label="Status"
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <MenuItem value="all">All Status</MenuItem>
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="confirmed">Confirmed</MenuItem>
                      <MenuItem value="completed">Completed</MenuItem>
                      <MenuItem value="cancelled">Cancelled</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableCell sx={{ fontWeight: 700 }}>Booking ID</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Parent</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Babysitter</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Time</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Payment Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredBookings.map((booking) => (
                        <TableRow key={booking._id} hover>
                          <TableCell>
                            <Typography sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                              {booking._id.slice(-8)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {booking.parentId?.userId?.name || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {booking.babysitterId?.userId?.name || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {new Date(booking.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {booking.startTime} - {booking.endTime}
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontWeight: 600, color: '#4CAF50' }}>
                              ৳{booking.totalAmount}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={booking.status}
                              size="small"
                              color={getStatusColor(booking.status)}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={booking.paymentStatus || 'pending'}
                              size="small"
                              color={
                                booking.paymentStatus === 'paid' ? 'success' :
                                booking.paymentStatus === 'refunded' ? 'info' : 'warning'
                              }
                              sx={{
                                fontWeight: 600,
                                textTransform: 'capitalize'
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                {filteredBookings.length === 0 && (
                  <Box sx={{ textAlign: 'center', padding: 4 }}>
                    <Typography sx={{ color: 'rgba(0,0,0,0.6)' }}>
                      No bookings found
                    </Typography>
                  </Box>
                )}
              </>
            )}

            {/* Verifications Tab */}
            {activeTab === 2 && (
              <Grid container spacing={3}>
                {verifications.map((user) => (
                  <Grid item xs={12} sm={6} md={4} key={user._id}>
                    <Card
                      sx={{
                        padding: 3,
                        borderRadius: 2,
                        transition: 'all 0.3s',
                        border: user.type === 'parent' ? '2px solid #4CAF50' : '2px solid #FF9800',
                        '&:hover': {
                          transform: 'translateY(-5px)',
                          boxShadow: '0 10px 30px rgba(0,0,0,0.15)'
                        }
                      }}
                    >
                      {/* User Type Badge */}
                      <Chip
                        label={user.type === 'parent' ? '👨‍👩‍👧 Parent' : '🎓 Babysitter'}
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 12,
                          right: 12,
                          backgroundColor: user.type === 'parent' ? '#e8f5e9' : '#fff3e0',
                          color: user.type === 'parent' ? '#2e7d32' : '#e65100',
                          fontWeight: 600
                        }}
                      />

                      <Box sx={{ textAlign: 'center', marginBottom: 2, marginTop: 1 }}>
                        <Avatar
                          sx={{
                            width: 60,
                            height: 60,
                            margin: '0 auto 12px',
                            backgroundColor: user.type === 'parent' ? '#4CAF50' : '#FF9800'
                          }}
                        >
                          {user.userId?.name?.charAt(0) || 'U'}
                        </Avatar>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {user.userId?.name || 'Unknown'}
                        </Typography>
                        <Typography sx={{ color: 'rgba(0,0,0,0.6)', fontSize: '0.9rem' }}>
                          {user.userId?.email}
                        </Typography>
                        {user.userId?.phone && (
                          <Typography sx={{ color: 'rgba(0,0,0,0.5)', fontSize: '0.85rem' }}>
                            📞 {user.userId.phone}
                          </Typography>
                        )}
                      </Box>

                      <Box sx={{ marginBottom: 2 }}>
                        {/* Babysitter specific info */}
                        {user.type === 'babysitter' && (
                          <>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', marginBottom: 1 }}>
                              <Typography sx={{ color: 'rgba(0,0,0,0.6)', fontSize: '0.85rem' }}>
                                University
                              </Typography>
                              <Typography sx={{ fontWeight: 500, fontSize: '0.9rem' }}>
                                {user.university}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', marginBottom: 1 }}>
                              <Typography sx={{ color: 'rgba(0,0,0,0.6)', fontSize: '0.85rem' }}>
                                Student ID
                              </Typography>
                              <Typography sx={{ fontWeight: 500 }}>
                                {user.studentId}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', marginBottom: 1 }}>
                              <Typography sx={{ color: 'rgba(0,0,0,0.6)', fontSize: '0.85rem' }}>
                                Department
                              </Typography>
                              <Typography sx={{ fontWeight: 500, fontSize: '0.9rem' }}>
                                {user.department}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography sx={{ color: 'rgba(0,0,0,0.6)', fontSize: '0.85rem' }}>
                                Hourly Rate
                              </Typography>
                              <Typography sx={{ fontWeight: 600, color: '#4CAF50' }}>
                                ৳{user.hourlyRate}/hr
                              </Typography>
                            </Box>
                          </>
                        )}

                        {/* Parent specific info */}
                        {user.type === 'parent' && (
                          <>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', marginBottom: 1 }}>
                              <Typography sx={{ color: 'rgba(0,0,0,0.6)', fontSize: '0.85rem' }}>
                                Address
                              </Typography>
                              <Typography sx={{ fontWeight: 500, fontSize: '0.9rem', maxWidth: '60%', textAlign: 'right' }}>
                                {user.address || 'Not provided'}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography sx={{ color: 'rgba(0,0,0,0.6)', fontSize: '0.85rem' }}>
                                Children
                              </Typography>
                              <Typography sx={{ fontWeight: 500 }}>
                                {user.children?.length || 0} registered
                              </Typography>
                            </Box>
                          </>
                        )}

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', marginTop: 1, paddingTop: 1, borderTop: '1px solid #eee' }}>
                          <Typography sx={{ color: 'rgba(0,0,0,0.6)', fontSize: '0.85rem' }}>
                            Registered
                          </Typography>
                          <Typography sx={{ fontWeight: 500, fontSize: '0.85rem' }}>
                            {new Date(user.createdAt).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          fullWidth
                          variant="contained"
                          startIcon={<CheckCircle />}
                          onClick={() => handleVerifyUser(user._id, true, user.type)}
                          sx={{
                            backgroundColor: '#4CAF50',
                            '&:hover': { backgroundColor: '#388E3C' }
                          }}
                        >
                          Approve
                        </Button>
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<Cancel />}
                          onClick={() => handleVerifyUser(user._id, false, user.type)}
                          sx={{
                            borderColor: '#f44336',
                            color: '#f44336',
                            '&:hover': { backgroundColor: 'rgba(244,67,54,0.1)' }
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
                      <Typography variant="h6" sx={{ color: 'rgba(0,0,0,0.6)' }}>
                        ✅ No pending verifications
                      </Typography>
                      <Typography sx={{ color: 'rgba(0,0,0,0.5)', marginTop: 1 }}>
                        All users have been verified
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
            )}
          </Box>
        </Paper>

        {/* Create Admin Dialog */}
        <Dialog 
          open={openCreateAdminDialog} 
          onClose={() => setOpenCreateAdminDialog(false)} 
          maxWidth="sm" 
          fullWidth
        >
          <DialogTitle sx={{ backgroundColor: '#4CAF50', color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
            <AdminPanelSettings /> Create New Admin
          </DialogTitle>
          <DialogContent sx={{ paddingTop: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 1 }}>
              <TextField
                label="Full Name"
                fullWidth
                value={newAdminData.name}
                onChange={(e) => setNewAdminData({ ...newAdminData, name: e.target.value })}
                placeholder="Enter admin name"
              />
              <TextField
                label="Email Address"
                type="email"
                fullWidth
                value={newAdminData.email}
                onChange={(e) => setNewAdminData({ ...newAdminData, email: e.target.value })}
                placeholder="admin@example.com"
              />
              <TextField
                label="Password"
                type="password"
                fullWidth
                value={newAdminData.password}
                onChange={(e) => setNewAdminData({ ...newAdminData, password: e.target.value })}
                placeholder="Minimum 6 characters"
                helperText="Password must be at least 6 characters"
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ padding: 2 }}>
            <Button 
              onClick={() => {
                setOpenCreateAdminDialog(false);
                setNewAdminData({ name: '', email: '', password: '' });
              }}
              disabled={createAdminLoading}
            >
              Cancel
            </Button>
            <Button 
              variant="contained"
              onClick={handleCreateAdmin}
              disabled={createAdminLoading || !newAdminData.name || !newAdminData.email || !newAdminData.password}
              sx={{ backgroundColor: '#4CAF50', '&:hover': { backgroundColor: '#388E3C' } }}
            >
              {createAdminLoading ? <CircularProgress size={24} color="inherit" /> : 'Create Admin'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* User Details Dialog */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ backgroundColor: '#1a1a2e', color: 'white' }}>
            User Details
          </DialogTitle>
          <DialogContent sx={{ paddingTop: 3 }}>
            {selectedUser && (
              <Box>
                <Box sx={{ textAlign: 'center', marginBottom: 3 }}>
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      margin: '0 auto 16px',
                      backgroundColor: selectedUser.role === 'parent' ? '#4CAF50' : '#FF9800',
                      fontSize: '2rem'
                    }}
                  >
                    {selectedUser.name.charAt(0)}
                  </Avatar>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    {selectedUser.name}
                  </Typography>
                  <Chip
                    label={selectedUser.role}
                    size="small"
                    color={selectedUser.role === 'parent' ? 'success' : 'warning'}
                    sx={{ marginTop: 1 }}
                  />
                </Box>

                <Box sx={{ marginBottom: 2 }}>
                  <Typography sx={{ fontWeight: 600, marginBottom: 1 }}>Contact Information</Typography>
                  <Typography>Email: {selectedUser.email}</Typography>
                  <Typography>Phone: {selectedUser.phone || 'N/A'}</Typography>
                </Box>

                {selectedUser.profile && selectedUser.role === 'babysitter' && (
                  <Box>
                    <Typography sx={{ fontWeight: 600, marginBottom: 1 }}>Babysitter Profile</Typography>
                    <Typography>University: {selectedUser.profile.university}</Typography>
                    <Typography>Student ID: {selectedUser.profile.studentId}</Typography>
                    <Typography>Department: {selectedUser.profile.department}</Typography>
                    <Typography>Year: {selectedUser.profile.year}</Typography>
                    <Typography>Hourly Rate: ৳{selectedUser.profile.hourlyRate}</Typography>
                  </Box>
                )}

                <Box sx={{ marginTop: 2 }}>
                  <Typography sx={{ color: 'rgba(0,0,0,0.6)', fontSize: '0.85rem' }}>
                    Joined: {new Date(selectedUser.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default AdminDashboard;

