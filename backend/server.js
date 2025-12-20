const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

console.log('=== DEBUG INFO ===');
console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
console.log('JWT_SECRET value (first 10 chars):', process.env.JWT_SECRET ? process.env.JWT_SECRET.substring(0, 10) + '...' : 'NOT SET');
console.log('==================');

const app = express();

// ====================
// MIDDLEWARE
// ====================
app.use(cors({
  origin: 'http://localhost:3001',
  credentials: true
}));
app.use(express.json());

// Database connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.log('❌ MongoDB Error:', err.message));

// Import routes
const authRoutes = require('./routes/authRoutes');
const babysitterRoutes = require('./routes/babysitterRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const adminRoutes = require('./routes/adminRoutes');
const parentRoutes = require('./routes/parentRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const reportRoutes = require('./routes/reportRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

// ====================
// ROUTES
// ====================

// 1. Root route
app.get('/', (req, res) => {
  res.json({
    message: 'KINDER API is running!',
    status: 'success',
    time: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    available_endpoints: [
      '/api/auth/register',
      '/api/auth/login',
      '/api/auth/users',
      '/api/babysitters',
      '/api/bookings',
      '/api/bookings/available-babysitters',
      '/api/admin/login',
      '/api/admin/dashboard',
      '/api/notifications',
      '/api/payments'
    ]
  });
});

// 2. API test route
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: '✅ Backend API is connected successfully!',
    server: 'KINDER Babysitter Platform API',
    port: process.env.PORT || 3000,
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    endpoints: {
      auth: '/api/auth',
      babysitters: '/api/babysitters',
      bookings: '/api/bookings',
      health: '/health'
    }
  });
});

// 3. Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uptime: process.uptime()
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'KINDER API is running smoothly',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// 4. Auth routes
app.use('/api/auth', authRoutes);

// 5. Babysitter routes
app.use('/api/babysitters', babysitterRoutes);

// 6. Booking routes
app.use('/api/bookings', bookingRoutes);

// 7. Admin routes
app.use('/api/admin', adminRoutes);

// 8. Parent routes
app.use('/api/parents', parentRoutes);

// 9. Review routes
app.use('/api/reviews', reviewRoutes);

// 10. Report routes
app.use('/api/reports', reportRoutes);

// 11. Notification routes
app.use('/api/notifications', notificationRoutes);

// 12. Payment routes
app.use('/api/payments', paymentRoutes);

// Test if routes are loaded
app.get('/api/routes', (req, res) => {
  res.json({
    success: true,
    message: 'All routes loaded!',
    routes: {
      auth: ['/register (POST)', '/login (POST)', '/users (GET)'],
      babysitters: ['/ (GET)', '/:id (GET)', '/available-babysitters (GET)'],
      bookings: ['/ (GET)', '/ (POST)', '/:id (PUT)', '/available-babysitters (GET)'],
      admin: ['/login (POST)', '/dashboard (GET)', '/users (GET)', '/bookings (GET)', '/verifications (GET)'],
      health: ['/health', '/api/health']
    }
  });
});

// ====================
// ERROR HANDLING
// ====================

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// ====================
// START SERVER
// ====================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`=================================`);
  console.log(`🚀 Server running on: http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 CORS enabled for: http://localhost:3001`);
  console.log(`👤 Auth routes: /api/auth/register, /api/auth/login`);
  console.log(`👶 Babysitter routes: /api/babysitters`);
  console.log(`📅 Booking routes: /api/bookings`);
  console.log(`👨‍💼 Admin routes: /api/admin/login, /api/admin/dashboard`);
  console.log(`🔔 Notification routes: /api/notifications`);
  console.log(`💳 Payment routes: /api/payments`);
  console.log(`📋 Total endpoints: 60+`);
  console.log(`=================================`);
});