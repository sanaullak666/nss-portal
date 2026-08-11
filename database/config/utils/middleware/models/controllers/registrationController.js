const db = require('../config/database');
const { DEPARTMENTS, COURSES, YEAR_OF_STUDY, BLOOD_GROUPS, NATIVE_STATES, MEDIA_ROLES, DEPARTMENT_UNIT_MAP } = require('../config/constants');
const { generateRegistrationId } = require('../utils/helpers');

/**
 * Render Student Registration Form
 */
exports.renderForm = (req, res) => {
  res.render('index', {
    title: 'Pondicherry University - NSS Volunteer Registration 2026',
    constants: { DEPARTMENTS, COURSES, YEAR_OF_STUDY, BLOOD_GROUPS, NATIVE_STATES, MEDIA_ROLES, DEPARTMENT_UNIT_MAP },
    errors: [],
    formData: {}
  });
};

/**
 * Handle Registration Submission
 */
exports.handleRegistration = async (req, res) => {
  const formData = req.body;
  const certificateFile = req.file;

  try {
    // 1. Map Department to Unit
    let assignedUnit = '';
    for (const [unit, depts] of Object.entries(DEPARTMENT_UNIT_MAP)) {
      if (depts.includes(formData.department)) {
        assignedUnit = unit;
        break;
      }
    }

    if (!assignedUnit) {
      return res.render('index', {
        title: 'Pondicherry University - NSS Volunteer Registration 2026',
        constants: { DEPARTMENTS, COURSES, YEAR_OF_STUDY, BLOOD_GROUPS, NATIVE_STATES, MEDIA_ROLES, DEPARTMENT_UNIT_MAP },
        errors: [{ msg: 'Invalid department selected.' }],
        formData
      });
    }

    // 2. Format JSON Fields
    let languages = formData.languages_spoken;
    if (typeof languages === 'string') languages = [languages];
    if (!Array.isArray(languages)) languages = [];

    let mediaRoles = formData.media_roles;
    if (typeof mediaRoles === 'string') mediaRoles = [mediaRoles];
    if (!Array.isArray(mediaRoles)) mediaRoles = [];

    // 3. Certificate Path
    const certificatePath = certificateFile ? certificateFile.filename : null;

    // 4. Generate Registration ID
    const registrationId = generateRegistrationId(assignedUnit);

    // 5. Database Insert
    const insertQuery = `
      INSERT INTO registrations (
        registration_id, unit_number, department, course, year_of_study,
        applicant_name, univ_reg_no, email, contact_number, alt_contact_number,
        gender, dob, age, blood_group, aadhaar_number, native_state,
        present_address, permanent_address, is_same_address, languages_spoken,
        is_previous_volunteer, certificate_path, interested_in_media, media_roles,
        declaration_accepted
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      registrationId,
      assignedUnit,
      formData.department,
      formData.course,
      formData.year_of_study,
      formData.applicant_name.trim(),
      formData.univ_reg_no.trim(),
      formData.email.trim(),
      formData.contact_number.trim(),
      formData.alt_contact_number ? formData.alt_contact_number.trim() : null,
      formData.gender,
      formData.dob,
      parseInt(formData.age, 10),
      formData.blood_group,
      formData.aadhaar_number.trim(),
      formData.native_state,
      formData.present_address.trim(),
      formData.permanent_address.trim(),
      formData.is_same_address === 'on' || formData.is_same_address === '1' ? 1 : 0,
      JSON.stringify(languages),
      formData.is_previous_volunteer,
      certificatePath,
      formData.interested_in_media,
      formData.interested_in_media === 'Yes' ? JSON.stringify(mediaRoles) : JSON.stringify([]),
      formData.declaration_accepted === 'on' || formData.declaration_accepted === '1' ? 1 : 0
    ];

    await db.query(insertQuery, values);

    res.redirect(`/success/${registrationId}`);
  } catch (err) {
    console.error('Registration Processing Error:', err);

    // Handle Duplicate Entry SQL Errors
    let errorMessage = 'An error occurred while saving your registration. Please try again.';
    if (err.code === 'ER_DUP_ENTRY') {
      if (err.sqlMessage.includes('uk_univ_reg_no')) {
        errorMessage = 'A registration already exists with this University Register / Application Number.';
      } else if (err.sqlMessage.includes('uk_aadhaar_number')) {
        errorMessage = 'A registration already exists with this Aadhaar Number.';
      }
    }

    res.render('index', {
      title: 'Pondicherry University - NSS Volunteer Registration 2026',
      constants: { DEPARTMENTS, COURSES, YEAR_OF_STUDY, BLOOD_GROUPS, NATIVE_STATES, MEDIA_ROLES, DEPARTMENT_UNIT_MAP },
      errors: [{ msg: errorMessage }],
      formData
    });
  }
};

/**
 * Render Registration Success Page
 */
exports.renderSuccess = async (req, res) => {
  const { registrationId } = req.params;

  try {
    const [rows] = await db.query('SELECT * FROM registrations WHERE registration_id = ? LIMIT 1', [registrationId]);

    if (rows.length === 0) {
      return res.status(404).render('index', {
        title: 'Registration Not Found',
        constants: { DEPARTMENTS, COURSES, YEAR_OF_STUDY, BLOOD_GROUPS, NATIVE_STATES, MEDIA_ROLES, DEPARTMENT_UNIT_MAP },
        errors: [{ msg: 'Registration record not found.' }],
        formData: {}
      });
    }

    res.render('success', {
      title: 'Registration Successful - PU NSS Portal',
      registration: rows[0]
    });
  } catch (err) {
    console.error('Success Render Error:', err);
    res.redirect('/');
  }
};