const express = require('express');
const router = express.Router();
const csurf = require('csurf');
const registrationController = require('../controllers/registrationController');
const trackingController = require('../controllers/trackingController');
const upload = require('../middleware/uploadMiddleware');
const { validateRegistration } = require('../middleware/validationMiddleware');
const { registrationLimiter } = require('../middleware/rateLimiter');
const constants = require('../config/constants');

const csrfProtection = csurf({ 
  cookie: {
    httpOnly: true,
    secure: false,
    sameSite: 'lax'
  }
});

// Render Registration Form
router.get('/', csrfProtection, registrationController.renderForm);

// Redirect /register GET requests to home page
router.get('/register', (req, res) => res.redirect('/'));

// Handle Volunteer Registration Submission
router.post(
  '/register',
  registrationLimiter,
  (req, res, next) => {
    upload.single('certificate')(req, res, (err) => {
      if (err) {
        return res.render('index', {
          title: 'Pondicherry University - NSS Volunteer Registration 2026',
          constants,
          csrfToken: req.csrfToken ? req.csrfToken() : '',
          formData: req.body || {},
          error: err.message || 'File upload failed. Ensure file size is within 250 KB (PDF, JPG, JPEG, PNG).',
          errors: [{ param: 'certificate', msg: err.message || 'Invalid certificate file.' }],
          success: null
        });
      }
      next();
    });
  },
  csrfProtection,
  validateRegistration,
  registrationController.handleRegistration
);

// Success Confirmation Page
router.get('/success/:registrationId', registrationController.renderSuccess);

// Volunteer Tracking Routes
router.get('/track-registration', csrfProtection, trackingController.renderTrackPage);
router.post('/track-registration', csrfProtection, trackingController.searchRegistration);
router.get('/track-registration/pdf/:registrationId', trackingController.downloadStudentReceipt);

module.exports = router;
