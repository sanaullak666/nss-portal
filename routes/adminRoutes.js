const express = require('express');
const router = express.Router();
const csurf = require('csurf');
const adminController = require('../controllers/adminController');
const { isAuthenticated } = require('../middleware/authMiddleware');

const csrfProtection = csurf({ 
  cookie: {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: 'lax'
  },
  ignoreMethods: ['GET', 'HEAD', 'OPTIONS']
});

// Middleware to prevent caching of admin pages in browsers & Vercel CDN
const setNoCache = (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
};

// Protect all /admin routes with authentication and no-cache middleware
router.use('/admin', setNoCache, isAuthenticated);

// Admin Dashboard & Registrations Management Routes
router.get('/admin/dashboard', adminController.renderDashboard);
router.get('/admin/api/live-stats', adminController.getLiveDashboardStats);
router.get('/admin/registrations', csrfProtection, adminController.renderRegistrationsList);
router.get('/admin/registrations/export/excel', adminController.exportExcel);
router.get('/admin/registrations/:id', csrfProtection, adminController.renderRegistrationView);
router.get('/admin/registrations/:id/edit', csrfProtection, adminController.renderRegistrationEdit);
router.post('/admin/registrations/:id/edit', csrfProtection, adminController.handleRegistrationEdit);
router.post('/admin/registrations/:id/delete', csrfProtection, adminController.deleteRegistration);
router.get('/admin/registrations/:id/pdf', adminController.downloadPDF);

// Admin Direct Change Password Routes
router.get('/admin/change-password', csrfProtection, adminController.renderChangePassword);
router.post('/admin/change-password', csrfProtection, adminController.handleChangePassword);

// Volunteer Selection Process Routes
router.get('/admin/selection', csrfProtection, adminController.renderSelectionPage);
router.post('/admin/selection/:id/status', csrfProtection, adminController.updateVolunteerStatus);
router.get('/admin/selection/export-excel', adminController.exportSelectedToExcel);

module.exports = router;


