const express = require('express');
const router = express.Router();
const csurf = require('csurf');
const authController = require('../controllers/authController');
const { loginLimiter } = require('../middleware/rateLimiter');

const csrfProtection = csurf({ 
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' || process.env.VERCEL === '1',
    sameSite: 'lax'
  },
  ignoreMethods: ['GET', 'HEAD', 'OPTIONS']
});

router.get('/admin/login', csrfProtection, authController.renderLogin);
router.post('/admin/login', loginLimiter, csrfProtection, authController.handleLogin);
router.get('/admin/logout', authController.handleLogout);
router.post('/admin/logout', authController.handleLogout);

module.exports = router;
