const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isAuthenticated } = require('../middleware/authMiddleware');

// Protected Admin Dashboard Routes
router.use(isAuthenticated);

router.get('/dashboard', adminController.renderDashboard);
router.get('/registrations', adminController.renderRegistrationsList);
router.get('/registrations/export/excel', adminController.exportExcel);
router.get('/registrations/:id', adminController.renderRegistrationView);
router.get('/registrations/:id/pdf', adminController.downloadPDF);

module.exports = router;
