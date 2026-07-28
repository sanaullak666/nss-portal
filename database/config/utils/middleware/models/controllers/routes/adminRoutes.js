/**
 * Admin Dashboard & Management Routes
 * Protected endpoints for administrative features (dashboard, listings, single view, CSV/Excel exports).
 */

const express = require('express');
const router = express.Router();

const adminController = require('../controllers/adminController');
const { requireAdminAuth } = require('../middleware/authMiddleware');

// Apply authentication guard to all routes in this router
router.use(requireAdminAuth);

// GET /admin/dashboard - Render Main Administrative Dashboard
router.get('/dashboard', adminController.renderDashboard);

// GET /admin/registrations - Render Registrations List with Search & Filtering
router.get('/registrations', adminController.renderRegistrationsList);

// GET /admin/registrations/export/csv - Export Registrations to CSV
router.get('/registrations/export/csv', adminController.exportToCSV);

// GET /admin/registrations/export/excel - Export Registrations to Excel (.xls)
router.get('/registrations/export/excel', adminController.exportToExcel);

// GET /admin/registrations/:id - View Single Registration Details
router.get('/registrations/:id', adminController.viewRegistrationDetail);

module.exports = router;