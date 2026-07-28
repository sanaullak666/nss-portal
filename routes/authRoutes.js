const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { isGuest, isAuthenticated } = require('../middleware/authMiddleware');

// Admin Auth Routes
router.get('/login', isGuest, authController.renderLogin);
router.post('/login', isGuest, authController.handleLogin);
router.get('/logout', isAuthenticated, authController.handleLogout);

module.exports = router;
