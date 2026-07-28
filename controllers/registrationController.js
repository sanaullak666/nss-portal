const db = require('../config/database');
const constants = require('../config/constants');
const { generateRegistrationId } = require('../utils/helpers');

exports.renderForm = (req, res) => {
  res.render('index', {
    title: 'Pondicherry University - NSS Volunteer Registration 2026',
    constants,
    csrfToken: req.csrfToken ? req.csrfToken() : '',
    errors: [],
    formData: {}
  });
};

exports.handleRegistration = async (req, res) => {
  const formData = req.body;
  const certificateFile = req.file;

  try {
    // Determine NSS Unit from Department Mapping
    let assignedUnit = '';
    for (const [unit, depts] of Object.entries(constants.DEPARTMENT_UNIT_MAP)) {
      if (depts.includes(formData.department)) {
        assignedUnit = unit;
        break;
      }
    }

    if (!assignedUnit) {
      return res.render('index', {
        title: 'Pondicherry University - NSS Volunteer Registration 2026',
        constants,
        csrfToken: req.csrfToken ? req.csrfToken() : '',
        errors: [{ msg: 'Invalid department selected.' }],
        formData
      });
    }

    // Process languages spoken array
    let languages = formData.languages_spoken;
    if (typeof languages === 'string') languages = [languages];
    if (!Array.isArray(languages)) languages = [];

    // Process media roles array
    let mediaRoles = formData.media_roles;
    if (typeof mediaRoles === 'string') mediaRoles = [mediaRoles];
    if (!Array.isArray(mediaRoles)) mediaRoles = [];

    const certificatePath = certificateFile ? certificateFile.filename : null;
    
    // Fix: Await the async function to resolve the Promise to a string!
    const registrationId = await generateRegistrationId(assignedUnit);

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
      formData.applicant_name.trim().toUpperCase(),
      formData.univ_reg_no.trim(),
      formData.email.trim(),
      formData.contact_number.trim(),
      formData.alt_contact_number ? formData.alt_contact_number.trim() : null,
      formData.gender,
      formData.dob,
      parseInt(formData.age, 10) || 0,
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

    let errorMessage = 'An error occurred while saving your registration. Please try again.';
    if (err.code === 'ER_DUP_ENTRY') {
      if (err.sqlMessage && err.sqlMessage.includes('univ_reg_no')) {
        errorMessage = 'A registration already exists with this Register / Application Number.';
      } else if (err.sqlMessage && err.sqlMessage.includes('aadhaar_number')) {
        errorMessage = 'A registration already exists with this Aadhaar Number.';
      } else if (err.sqlMessage && err.sqlMessage.includes('email')) {
        errorMessage = 'A registration already exists with this Email Address.';
      }
    }

    res.render('index', {
      title: 'Pondicherry University - NSS Volunteer Registration 2026',
      constants,
      csrfToken: req.csrfToken ? req.csrfToken() : '',
      errors: [{ msg: errorMessage }],
      formData
    });
  }
};

exports.renderSuccess = async (req, res) => {
  const { registrationId } = req.params;

  try {
    const [rows] = await db.query('SELECT * FROM registrations WHERE registration_id = ? LIMIT 1', [registrationId]);

    if (rows.length === 0) {
      return res.status(404).render('index', {
        title: 'Registration Not Found',
        constants,
        csrfToken: req.csrfToken ? req.csrfToken() : '',
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
