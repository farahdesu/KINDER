// backend/routes/authRoutes.js
const express = require('express');
const { register, getUsers, login, forgotPassword, verifyResetCode, resetPasswordWithCode } = require('../controllers/authController');
const router = express.Router();

console.log('✅ Auth routes loaded');

// POST /api/auth/register
router.post('/register', (req, res) => {
  console.log('📨 Registration endpoint hit');
  return register(req, res);
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  console.log('🔐 Login endpoint hit');
  return login(req, res);
});

// POST /api/auth/forgot-password
router.post('/forgot-password', (req, res) => {
  console.log('📧 Forgot password endpoint hit');
  return forgotPassword(req, res);
});

// POST /api/auth/verify-reset-code
router.post('/verify-reset-code', (req, res) => {
  console.log('✔️ Verify reset code endpoint hit');
  return verifyResetCode(req, res);
});

// POST /api/auth/reset-password-with-code
router.post('/reset-password-with-code', (req, res) => {
  console.log('🔑 Reset password with code endpoint hit');
  return resetPasswordWithCode(req, res);
});

// GET /api/auth/users
router.get('/users', getUsers);

module.exports = router;