const express = require('express');
const router = express.Router();
const csurf = require('csurf');
const authController = require('../controllers/authController');
const { loginLimiter } = require('../middleware/rateLimiter');

const csrfProtection = csurf({ 
  cookie: {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: 'lax'
  },
  ignoreMethods: ['GET', 'HEAD', 'OPTIONS']
});

router.get('/admin/login', csrfProtection, authController.renderLogin);
router.post('/admin/login', loginLimiter, csrfProtection, authController.handleLogin);
router.get('/admin/logout', authController.handleLogout);
router.post('/admin/logout', authController.handleLogout);

// Admin Password Reset via Email OTP
router.get('/admin/forgot-password', csrfProtection, authController.renderForgotPassword);
router.post('/admin/send-otp', csrfProtection, authController.handleSendOTP);
router.get('/admin/verify-otp', csrfProtection, authController.renderVerifyOTP);
router.post('/admin/verify-otp', csrfProtection, authController.handleVerifyOTP);

module.exports = router;
