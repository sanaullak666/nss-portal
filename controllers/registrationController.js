const RegistrationModel = require('../models/registrationModel');
const constants = require('../config/constants');
const { generateRegistrationId } = require('../utils/helpers');
const { logAudit } = require('../utils/auditLogger');

exports.renderForm = (req, res) => {
  res.render('index', {
    title: 'Pondicherry University - NSS Volunteer Registration 2026',
    constants,
    csrfToken: req.csrfToken ? req.csrfToken() : '',
    errors: [],
    error: null,
    success: null,
    formData: {}
  });
};

exports.handleRegistration = async (req, res) => {
  const formData = req.body || {};
  const certificateFile = req.file;

  try {
    // Determine assigned unit from department map
    let assignedUnit = formData.unit_number;
    if (!assignedUnit) {
      for (const [unit, depts] of Object.entries(constants.DEPARTMENT_UNIT_MAP)) {
        if (depts.includes(formData.department)) {
          assignedUnit = unit;
          break;
        }
      }
    }

    if (!assignedUnit) {
      return res.render('index', {
        title: 'Pondicherry University - NSS Volunteer Registration 2026',
        constants,
        csrfToken: req.csrfToken ? req.csrfToken() : '',
        errors: [{ param: 'department', msg: 'Selected department does not belong to a valid NSS Unit.' }],
        error: null,
        success: null,
        formData
      });
    }

    // Process languages spoken array
    let languages = formData.languages_spoken || [];
    if (typeof languages === 'string') languages = [languages];
    if (!Array.isArray(languages)) languages = [];

    // Process media roles array
    let mediaRoles = formData.media_roles || [];
    if (typeof mediaRoles === 'string') mediaRoles = [mediaRoles];
    if (!Array.isArray(mediaRoles)) mediaRoles = [];

    const certificatePath = certificateFile ? certificateFile.filename : null;
    const registrationId = await generateRegistrationId(assignedUnit);

    const registrationData = {
      registration_id: registrationId,
      unit_number: assignedUnit,
      department: formData.department,
      course: formData.course,
      year_of_study: formData.year_of_study,
      applicant_name: formData.applicant_name.trim().toUpperCase(),
      univ_reg_no: formData.univ_reg_no.trim(),
      email: formData.email.trim().toLowerCase(),
      contact_number: formData.contact_number.trim(),
      alt_contact_number: formData.alt_contact_number ? formData.alt_contact_number.trim() : null,
      gender: formData.gender,
      dob: formData.dob,
      age: parseInt(formData.age, 10) || 0,
      blood_group: formData.blood_group,
      aadhaar_number: formData.aadhaar_number.trim(),
      native_state: formData.native_state.trim(),
      present_address: formData.present_address.trim(),
      permanent_address: formData.permanent_address.trim(),
      is_same_address: formData.is_same_address === 'on' || formData.is_same_address === '1' || formData.is_same_address === true,
      languages_spoken: languages,
      is_previous_volunteer: formData.is_previous_volunteer,
      certificate_path: certificatePath,
      interested_in_media: formData.interested_in_media || 'No',
      media_roles: formData.interested_in_media === 'Yes' ? mediaRoles : [],
      extra_curricular_skills: formData.extra_curricular_skills ? formData.extra_curricular_skills.trim() : null,
      interested_in_leadership: formData.interested_in_leadership || 'No',
      declaration_accepted: formData.declaration_accepted === 'on' || formData.declaration_accepted === '1' || formData.declaration_accepted === true
    };

    await RegistrationModel.create(registrationData);

    try {
      await logAudit('REGISTRATION', 'STUDENT', `New volunteer registered with ID: ${registrationId}`);
    } catch (aErr) {}

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
      error: errorMessage,
      success: null,
      formData
    });
  }
};

exports.renderSuccess = async (req, res) => {
  const { registrationId } = req.params;

  try {
    const registration = await RegistrationModel.findByRegistrationId(registrationId);

    if (!registration) {
      return res.status(404).render('404');
    }

    res.render('success', {
      title: 'Registration Successful - PU NSS Portal',
      registration
    });
  } catch (err) {
    console.error('Success Render Error:', err);
    res.redirect('/');
  }
};
