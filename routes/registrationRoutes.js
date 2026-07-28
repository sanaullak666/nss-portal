const express = require('express');
const router = express.Router();
const db = require('../config/database');
const multer = require('multer');
const path = require('path');
const csurf = require('csurf');
const { logAudit } = require('../utils/auditLogger');

let constants = {};
try {
  constants = require('../utils/constants');
} catch (e) {
  try {
    constants = require('../config/constants');
  } catch (err) {
    constants = {
      DEPARTMENT_UNIT_MAP: {
        'Unit I': ['Computer Science', 'Information Technology'],
        'Unit II': ['Chemistry', 'Physics'],
        'Unit III': ['Commerce', 'Management']
      }
    };
  }
}

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

// 3. Allowed Formats: PDF, JPG, JPEG, PNG | Max Size: 250 KB
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 250 * 1024 }, // 250 KB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeType = allowedTypes.test(file.mimetype);
    if (extName && mimeType) {
      return cb(null, true);
    }
    cb(new Error('Only .pdf, .jpg, .jpeg, and .png files under 250 KB are allowed!'));
  }
});

// Render Registration Form
router.get('/', csrfProtection, (req, res) => {
  res.render('index', {
    title: 'Pondicherry University NSS Volunteer Registration 2026',
    csrfToken: req.csrfToken(),
    constants: constants,
    formData: {},
    error: null,
    errors: [],
    success: null
  });
});

// Process Registration
router.post('/register', (req, res, next) => {
  upload.single('certificate')(req, res, (err) => {
    if (err) {
      return res.render('index', {
        title: 'Pondicherry University NSS Volunteer Registration 2026',
        csrfToken: req.csrfToken ? req.csrfToken() : '',
        constants: constants,
        formData: req.body || {},
        error: err.message || 'File upload failed. Ensure file size is within 250 KB (PDF, JPG, JPEG, PNG).',
        errors: [],
        success: null
      });
    }
    if (!req.body) req.body = {};
    if (!req.body._csrf && req.query._csrf) {
      req.body._csrf = req.query._csrf;
    }
    csrfProtection(req, res, next);
  });
}, async (req, res) => {
  try {
    const {
      applicant_name, univ_reg_no, email, contact_number, alt_contact_number,
      department, course, year_of_study, unit_number, gender, dob, age,
      blood_group, aadhaar_number, native_state, present_address, permanent_address,
      languages_spoken, media_roles, is_previous_volunteer, declaration_accepted
    } = req.body;

    // 4. Convert languages_spoken[] and media_roles[] arrays to strings for database storage
    const langsString = Array.isArray(languages_spoken) ? languages_spoken.join(', ') : (languages_spoken || '');
    const rolesString = Array.isArray(media_roles) ? media_roles.join(', ') : (media_roles || '');

    const regId = 'PU-NSS-' + Date.now().toString().slice(-6);
    const certPath = req.file ? '/uploads/' + req.file.filename : null;

    const query = `
      INSERT INTO registrations (
        registration_id, applicant_name, univ_reg_no, email, contact_number, alt_contact_number,
        department, course, year_of_study, unit_number, gender, dob, age,
        blood_group, aadhaar_number, native_state, present_address, permanent_address,
        languages_spoken, media_roles, is_previous_volunteer, certificate_path, declaration_accepted
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // 2. unit_number is submitted and inserted into the database
    await db.query(query, [
      regId, applicant_name, univ_reg_no, email, contact_number, alt_contact_number || null,
      department, course, year_of_study, unit_number, gender, dob, age,
      blood_group, aadhaar_number, native_state, present_address, permanent_address,
      langsString, rolesString, is_previous_volunteer, certPath, declaration_accepted ? 1 : 0
    ]);

    try {
      await logAudit('REGISTRATION', 'SYSTEM', `New volunteer registered: ${regId}`);
    } catch (aErr) {
      console.error('Audit Error:', aErr.message);
    }

    res.render('index', {
      title: 'Pondicherry University NSS Volunteer Registration 2026',
      csrfToken: req.csrfToken(),
      constants: constants,
      formData: {},
      error: null,
      errors: [],
      success: `Registration successful! Your Application ID is ${regId}.`
    });

  } catch (err) {
    console.error('Registration Database Insert Error:', err);
    res.render('index', {
      title: 'Pondicherry University NSS Volunteer Registration 2026',
      csrfToken: req.csrfToken(),
      constants: constants,
      formData: req.body || {},
      error: 'Registration failed due to invalid data input. Please check all fields and try again.',
      errors: [],
      success: null
    });
  }
});

// Track Registration Routes
router.get('/track-registration', csrfProtection, (req, res) => {
  res.render('track', { title: 'Track Application Status', csrfToken: req.csrfToken(), result: null, error: null, errors: [] });
});

router.post('/track-registration', csrfProtection, async (req, res) => {
  const { registration_id } = req.body;
  try {
    const [rows] = await db.query('SELECT * FROM registrations WHERE registration_id = ?', [registration_id.trim()]);
    if (rows.length === 0) {
      return res.render('track', { title: 'Track Application Status', csrfToken: req.csrfToken(), result: null, error: 'No application found with that ID.', errors: [] });
    }
    res.render('track', { title: 'Track Application Status', csrfToken: req.csrfToken(), result: rows[0], error: null, errors: [] });
  } catch (err) {
    res.render('track', { title: 'Track Application Status', csrfToken: req.csrfToken(), result: null, error: 'Error retrieving status.', errors: [] });
  }
});

module.exports = router;
