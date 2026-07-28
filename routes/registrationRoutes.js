const express = require('express');
const router = express.Router();
const db = require('../config/database');
const multer = require('multer');
const path = require('path');
const csurf = require('csurf');
const { logAudit } = require('../utils/auditLogger');

const csrfProtection = csurf({ 
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  }
});

// Configure Multer Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'cert-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Render Registration Form (Generates CSRF Token)
router.get('/', csrfProtection, (req, res) => {
  res.render('index', {
    title: 'Pondicherry University NSS Volunteer Registration 2026',
    csrfToken: req.csrfToken(),
    error: null,
    success: null
  });
});

// Process Registration: Multer parses multipart fields FIRST, then CSRF validates
router.post('/register', upload.single('certificate'), csrfProtection, async (req, res) => {
  try {
    const {
      applicant_name, univ_reg_no, email, contact_number, alt_contact_number,
      department, course, year_of_study, unit_number, gender, dob, age,
      blood_group, aadhaar_number, native_state, present_address, permanent_address,
      is_previous_volunteer, interested_in_media, declaration_accepted
    } = req.body;

    const regId = 'PU-NSS-' + Date.now().toString().slice(-6);
    const certPath = req.file ? '/uploads/' + req.file.filename : null;

    const query = `
      INSERT INTO registrations (
        registration_id, applicant_name, univ_reg_no, email, contact_number, alt_contact_number,
        department, course, year_of_study, unit_number, gender, dob, age,
        blood_group, aadhaar_number, native_state, present_address, permanent_address,
        is_previous_volunteer, certificate_path, interested_in_media, declaration_accepted
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await db.query(query, [
      regId, applicant_name, univ_reg_no, email, contact_number, alt_contact_number,
      department, course, year_of_study, unit_number, gender, dob, age,
      blood_group, aadhaar_number, native_state, present_address, permanent_address,
      is_previous_volunteer, certPath, interested_in_media, declaration_accepted ? 1 : 0
    ]);

    try {
      await logAudit('REGISTRATION', 'SYSTEM', `New volunteer registered: ${regId}`);
    } catch (aErr) {
      console.error('Audit Error:', aErr.message);
    }

    res.render('index', {
      title: 'Pondicherry University NSS Volunteer Registration 2026',
      csrfToken: req.csrfToken(),
      error: null,
      success: `Registration successful! Your Application ID is ${regId}.`
    });

  } catch (err) {
    console.error('Registration Error:', err.message);
    res.render('index', {
      title: 'Pondicherry University NSS Volunteer Registration 2026',
      csrfToken: req.csrfToken(),
      error: 'An error occurred during registration. Please check your inputs and try again.',
      success: null
    });
  }
});

// Track Registration Routes
router.get('/track-registration', csrfProtection, (req, res) => {
  res.render('track', { title: 'Track Application Status', csrfToken: req.csrfToken(), result: null, error: null });
});

router.post('/track-registration', csrfProtection, async (req, res) => {
  const { registration_id } = req.body;
  try {
    const [rows] = await db.query('SELECT * FROM registrations WHERE registration_id = ?', [registration_id.trim()]);
    if (rows.length === 0) {
      return res.render('track', { title: 'Track Application Status', csrfToken: req.csrfToken(), result: null, error: 'No application found with that ID.' });
    }
    res.render('track', { title: 'Track Application Status', csrfToken: req.csrfToken(), result: rows[0], error: null });
  } catch (err) {
    res.render('track', { title: 'Track Application Status', csrfToken: req.csrfToken(), result: null, error: 'Error retrieving status.' });
  }
});

module.exports = router;
