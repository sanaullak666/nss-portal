/**
 * Administrator Authentication Routes
 * Handles admin login, login processing, and logout endpoints.
 */

const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const { adminLoginValidationRules } = require('../utils/validators');
const { validateAdminLogin } = require('../middleware/validationMiddleware');
const { redirectIfAuthenticated } = require('../middleware/authMiddleware');

// GET /admin/login - Render Admin Login Form
router.get('/login', redirectIfAuthenticated, authController.renderLoginForm);

// POST /admin/login - Process Admin Login Submission
router.post(
  '/login',
  redirectIfAuthenticated,
  adminLoginValidationRules(),
  validateAdminLogin,
  authController.processLogin
);

// GET /admin/logout - Handle Admin Logout
router.get('/logout', authController.processLogout);

module.exports = router;