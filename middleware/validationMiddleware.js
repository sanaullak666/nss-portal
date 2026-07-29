const RegistrationModel = require('../models/registrationModel');
const constants = require('../config/constants');

exports.validateRegistration = async (req, res, next) => {
  const body = req.body || {};
  const file = req.file;
  const errors = [];

  // Normalize univ_reg_no early to UPPERCASE
  if (body.univ_reg_no) {
    req.body.univ_reg_no = body.univ_reg_no.trim().toUpperCase();
  }

  // 1. Full Name Validation (10th class certificate match)
  if (!body.applicant_name || !body.applicant_name.trim()) {
    errors.push({ param: 'applicant_name', msg: 'Full Name (as given in 10th class certificate) is required.' });
  }

  // 2. University Reg / App No. Validation (Numeric or Alphanumeric, e.g., 25MCA00PY0085)
  if (!body.univ_reg_no || !body.univ_reg_no.trim()) {
    errors.push({ param: 'univ_reg_no', msg: 'University Registration / Application Number is required.' });
  } else if (!/^[A-Z0-9\/-]{4,30}$/.test(req.body.univ_reg_no)) {
    errors.push({ param: 'univ_reg_no', msg: 'Please enter a valid Registration / Application Number (e.g. 25MCA00PY0085).' });
  }

  // 3. Email Validation
  if (!body.email || !body.email.trim()) {
    errors.push({ param: 'email', msg: 'Email Address is required.' });
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) {
    errors.push({ param: 'email', msg: 'Please enter a valid Email Address.' });
  }

  // 4. Contact Number Validation (10 digits starting with 6-9)
  if (!body.contact_number || !body.contact_number.trim()) {
    errors.push({ param: 'contact_number', msg: 'Contact Mobile Number is required.' });
  } else if (!/^[6-9]\d{9}$/.test(body.contact_number.trim())) {
    errors.push({ param: 'contact_number', msg: 'Contact Number must be a valid 10-digit mobile number starting with 6, 7, 8, or 9.' });
  }

  // 5. Alternate Contact Number (Optional, 10 digits starting with 6-9)
  if (body.alt_contact_number && body.alt_contact_number.trim()) {
    if (!/^[6-9]\d{9}$/.test(body.alt_contact_number.trim())) {
      errors.push({ param: 'alt_contact_number', msg: 'Alternate Contact Number must be a 10-digit mobile number starting with 6, 7, 8, or 9.' });
    }
  }

  // 6. Gender Validation
  if (!body.gender) {
    errors.push({ param: 'gender', msg: 'Gender selection is required.' });
  }

  // 7. Date of Birth & Age Validation
  if (!body.dob) {
    errors.push({ param: 'dob', msg: 'Date of Birth is required.' });
  }

  const ageNum = parseInt(body.age, 10);
  if (isNaN(ageNum) || ageNum < 15 || ageNum > 60) {
    errors.push({ param: 'age', msg: 'Valid Age (between 15 and 60) is required.' });
  }

  // 8. Blood Group Validation
  if (!body.blood_group || !constants.BLOOD_GROUPS.includes(body.blood_group)) {
    errors.push({ param: 'blood_group', msg: 'Please select a valid Blood Group.' });
  }

  // 9. Aadhaar Number Validation (12 numeric digits)
  if (!body.aadhaar_number || !body.aadhaar_number.trim()) {
    errors.push({ param: 'aadhaar_number', msg: 'Aadhaar Number is required.' });
  } else if (!/^\d{12}$/.test(body.aadhaar_number.trim())) {
    errors.push({ param: 'aadhaar_number', msg: 'Aadhaar Number must contain exactly 12 numeric digits.' });
  }

  // 10. Native State Validation
  if (!body.native_state || !body.native_state.trim()) {
    errors.push({ param: 'native_state', msg: 'Native State / UT is required.' });
  }

  // 11. Department & Auto NSS Unit Mapping Validation
  if (!body.department || !body.department.trim()) {
    errors.push({ param: 'department', msg: 'Department / Centre is required.' });
  } else {
    let assignedUnit = '';
    for (const [unit, depts] of Object.entries(constants.DEPARTMENT_UNIT_MAP)) {
      if (depts.includes(body.department)) {
        assignedUnit = unit;
        break;
      }
    }
    if (!assignedUnit) {
      errors.push({ param: 'department', msg: 'Selected department does not belong to a valid NSS Unit.' });
    } else {
      req.body.unit_number = assignedUnit;
    }
  }

  // 12. Course Validation (Must match 22 options)
  if (!body.course || !constants.COURSES.includes(body.course)) {
    errors.push({ param: 'course', msg: 'Please select a valid Course / Programme.' });
  }

  // 13. Year of Study Validation
  if (!body.year_of_study || !constants.YEAR_OF_STUDY.includes(body.year_of_study)) {
    errors.push({ param: 'year_of_study', msg: 'Please select a valid Year of Study.' });
  }

  // 14. Present & Permanent Address Validation
  if (!body.present_address || !body.present_address.trim()) {
    errors.push({ param: 'present_address', msg: 'Present Address is required.' });
  }

  if (!body.permanent_address || !body.permanent_address.trim()) {
    errors.push({ param: 'permanent_address', msg: 'Permanent Address is required.' });
  }

  // 15. Previous NSS Volunteer & Certificate File Validation
  if (!body.is_previous_volunteer) {
    errors.push({ param: 'is_previous_volunteer', msg: 'Previous NSS Volunteer status is required.' });
  } else if (body.is_previous_volunteer === 'Yes' && !file) {
    errors.push({ param: 'certificate', msg: 'Certificate upload is required for previous NSS volunteers.' });
  }

  // 16. Mandatory Leadership Interest Validation
  if (!body.interested_in_leadership || !['Yes', 'No'].includes(body.interested_in_leadership)) {
    errors.push({ param: 'interested_in_leadership', msg: 'Please answer whether you are interested in being a leader in NSS PU (Yes/No).' });
  }

  // 17. Declaration Acceptance Validation
  if (!body.declaration_accepted) {
    errors.push({ param: 'declaration_accepted', msg: 'You must accept the declaration to submit.' });
  }

  // 18. Pre-submission Duplicate Database Checks
  if (errors.length === 0) {
    try {
      const regNoVal = (req.body.univ_reg_no || body.univ_reg_no || '').trim().toUpperCase();
      if (regNoVal) {
        const existingRegNo = await RegistrationModel.findByUnivRegNo(regNoVal);
        if (existingRegNo) {
          errors.push({ param: 'univ_reg_no', msg: 'A registration already exists with this Register / Application Number.' });
        }
      }

      const emailVal = (body.email || '').trim().toLowerCase();
      if (emailVal) {
        const existingEmail = await RegistrationModel.findByEmail(emailVal);
        if (existingEmail) {
          errors.push({ param: 'email', msg: 'A registration already exists with this Email Address.' });
        }
      }

      const aadhaarVal = (body.aadhaar_number || '').trim();
      if (aadhaarVal) {
        const existingAadhaar = await RegistrationModel.findByAadhaar(aadhaarVal);
        if (existingAadhaar) {
          errors.push({ param: 'aadhaar_number', msg: 'A registration already exists with this Aadhaar Number.' });
        }
      }
    } catch (err) {
      console.error('Validation Duplicate Check DB Error:', err);
    }
  }

  if (errors.length > 0) {
    return res.render('index', {
      title: 'Pondicherry University - NSS Volunteer Registration 2026',
      constants,
      csrfToken: req.csrfToken ? req.csrfToken() : '',
      errors,
      error: null,
      success: null,
      formData: body
    });
  }

  next();
};
