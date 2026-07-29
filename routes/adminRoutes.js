const express = require('express');
const router = express.Router();
const csurf = require('csurf');
const adminController = require('../controllers/adminController');
const { isAuthenticated } = require('../middleware/authMiddleware');

const csrfProtection = csurf({ 
  cookie: {
    httpOnly: true,
    secure: false,
    sameSite: 'lax'
  }
});

// Protect only /admin routes
router.use('/admin', isAuthenticated);

router.get('/admin/dashboard', adminController.renderDashboard);
router.get('/admin/registrations', csrfProtection, adminController.renderRegistrationsList);
router.get('/admin/registrations/export/excel', adminController.exportExcel);
router.get('/admin/registrations/:id', csrfProtection, adminController.renderRegistrationView);
router.get('/admin/registrations/:id/edit', csrfProtection, adminController.renderRegistrationEdit);
router.post('/admin/registrations/:id/edit', csrfProtection, adminController.handleRegistrationEdit);
router.post('/admin/registrations/:id/delete', csrfProtection, adminController.deleteRegistration);
router.get('/admin/registrations/:id/pdf', adminController.downloadPDF);

module.exports = router;
