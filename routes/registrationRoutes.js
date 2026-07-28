const express = require('express');
const router = express.Router();
const registrationController = require('../controllers/registrationController');
const trackingController = require('../controllers/trackingController');
const upload = require('../middleware/uploadMiddleware');
const { validateRegistration } = require('../middleware/validationMiddleware');

router.get('/', registrationController.renderForm);
router.post('/register', upload.single('certificate'), validateRegistration, registrationController.handleRegistration);
router.get('/success/:registrationId', registrationController.renderSuccess);

// Tracking Routes
router.get('/track-registration', trackingController.renderTrackPage);
router.post('/track-registration', trackingController.searchRegistration);
router.get('/track-registration/pdf/:registrationId', trackingController.downloadStudentReceipt);

module.exports = router;
