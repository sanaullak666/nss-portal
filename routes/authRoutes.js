const express = require('express');
const router = express.Router();
const csurf = require('csurf');
const authController = require('../controllers/authController');
const { isGuest } = require('../middleware/authMiddleware');
const { loginLimiter } = require('../middleware/rateLimiter');

const csrfProtection = csurf({ 
  cookie: {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: 'lax'
  },
  ignoreMethods: ['GET', 'HEAD', 'OPTIONS']
});

router.get('/admin/login', isGuest, csrfProtection, authController.renderLogin);
router.post('/admin/login', isGuest, loginLimiter, csrfProtection, authController.handleLogin);
router.get('/admin/logout', authController.handleLogout);
router.post('/admin/logout', authController.handleLogout);

// Admin Password Reset via Email OTP
router.get('/admin/forgot-password', isGuest, csrfProtection, authController.renderForgotPassword);
router.post('/admin/send-otp', isGuest, csrfProtection, authController.handleSendOTP);
router.get('/admin/verify-otp', isGuest, csrfProtection, authController.renderVerifyOTP);
router.post('/admin/verify-otp', isGuest, csrfProtection, authController.handleVerifyOTP);

module.exports = router;
