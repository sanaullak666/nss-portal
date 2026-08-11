/**
 * Student Registration Routes
 * Maps public registration endpoints to registrationController methods with validation & file upload middleware.
 */

const express = require('express');
const router = express.Router();

const registrationController = require('../controllers/registrationController');
const { registrationValidationRules } = require('../utils/validators');
const { validateRegistration } = require('../middleware/validationMiddleware');
const { handleCertificateUpload } = require('../middleware/uploadMiddleware');

// GET / - Render Student Registration Form
router.get('/', registrationController.renderRegistrationForm);

// POST /register - Process Form Submission
router.post(
  '/register',
  handleCertificateUpload,
  registrationValidationRules(),
  validateRegistration,
  registrationController.processRegistration
);

// GET /success - Render Success Confirmation Page
router.get('/success', registrationController.renderSuccessPage);

module.exports = router;