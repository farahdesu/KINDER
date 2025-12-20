// backend/routes/authRoutes.js
const express = require('express');
const { 
  register, 
  getUsers, 
  login, 
  forgotPassword, 
  verifyResetCode, 
  resetPasswordWithCode, 
  deleteRejectedUser,
  checkVerificationStatus
} = require('../controllers/authController');

const router = express.Router();

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/forgot-password
router.post('/forgot-password', forgotPassword);

// POST /api/auth/verify-reset-code
router.post('/verify-reset-code', verifyResetCode);

// POST /api/auth/reset-password-with-code
router.post('/reset-password-with-code', resetPasswordWithCode);

// GET /api/auth/verification-status/:userId - Check user verification status
router.get('/verification-status/:userId', checkVerificationStatus);

// DELETE /api/auth/delete-rejected-user/:userId
router.delete('/delete-rejected-user/:userId', deleteRejectedUser);

// GET /api/auth/users
router.get('/users', getUsers);

module.exports = router;