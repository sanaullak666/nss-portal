const express = require('express');
const router = express.Router();
const csurf = require('csurf');
const registrationController = require('../controllers/registrationController');
const trackingController = require('../controllers/trackingController');
const upload = require('../middleware/uploadMiddleware');
const { validateRegistration } = require('../middleware/validationMiddleware');
const { registrationLimiter, trackingLimiter, pdfLimiter } = require('../middleware/rateLimiter');
const constants = require('../config/constants');

const csrfProtection = csurf({ 
  cookie: {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: 'lax'
  },
  ignoreMethods: ['GET', 'HEAD', 'OPTIONS']
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
          error: err.message || 'File upload failed. Ensure file size is within 150 KB (PDF, JPG, JPEG, PNG).',
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

// Middleware to prevent caching of dynamic status tracking pages
const setNoCache = (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
};

// Volunteer Tracking Routes
router.get('/track-registration', setNoCache, csrfProtection, trackingController.renderTrackPage);
router.post('/track-registration', setNoCache, trackingLimiter, csrfProtection, trackingController.searchRegistration);
router.get('/track-registration/pdf/:registrationId', setNoCache, pdfLimiter, trackingController.downloadStudentReceipt);

module.exports = router;
