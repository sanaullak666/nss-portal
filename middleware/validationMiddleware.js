const db = require('../config/database');
const constants = require('../config/constants');

exports.validateRegistration = async (req, res, next) => {
  const body = req.body;
  const file = req.file;
  const errors = [];

  // Required Fields Validation
  if (!body.department) errors.push({ param: 'department', msg: 'Department / Programme is required.' });
  if (!body.course || !constants.COURSES.includes(body.course)) errors.push({ param: 'course', msg: 'Please select a valid Course.' });
  if (!body.year_of_study) errors.push({ param: 'year_of_study', msg: 'Please select Year of Study.' });
  if (!body.applicant_name || !body.applicant_name.trim()) errors.push({ param: 'applicant_name', msg: 'Applicant Name is required.' });
  if (!body.univ_reg_no || !body.univ_reg_no.trim()) errors.push({ param: 'univ_reg_no', msg: 'University Register / Application Number is required.' });
  if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) errors.push({ param: 'email', msg: 'Valid Email Address is required.' });
  if (!body.contact_number || !/^\d{10}$/.test(body.contact_number.trim())) errors.push({ param: 'contact_number', msg: 'Contact Number must be a valid 10-digit number.' });
  if (body.alt_contact_number && !/^\d{10}$/.test(body.alt_contact_number.trim())) errors.push({ param: 'alt_contact_number', msg: 'Alternative Phone Number must be 10 digits.' });
  if (!body.gender) errors.push({ param: 'gender', msg: 'Gender is required.' });
  if (!body.dob) errors.push({ param: 'dob', msg: 'Date of Birth is required.' });
  if (!body.blood_group || !constants.BLOOD_GROUPS.includes(body.blood_group)) errors.push({ param: 'blood_group', msg: 'Blood Group is required.' });
  if (!body.aadhaar_number || !/^\d{12}$/.test(body.aadhaar_number.trim())) errors.push({ param: 'aadhaar_number', msg: 'Aadhaar Number must be 12 digits.' });
  if (!body.native_state) errors.push({ param: 'native_state', msg: 'Native State / UT is required.' });
  if (!body.present_address || !body.present_address.trim()) errors.push({ param: 'present_address', msg: 'Present Address is required.' });
  if (!body.permanent_address || !body.permanent_address.trim()) errors.push({ param: 'permanent_address', msg: 'Permanent Address is required.' });
  if (body.is_previous_volunteer === 'Yes' && !file) errors.push({ param: 'certificate', msg: 'NSS Certificate upload is required for previous volunteers.' });
  if (!body.declaration_accepted) errors.push({ param: 'declaration_accepted', msg: 'Declaration acceptance is required.' });

  // Real-Time Pre-Submission Database Duplicate Checks
  if (errors.length === 0) {
    try {
      const [existingReg] = await db.query('SELECT * FROM registrations WHERE univ_reg_no = ? LIMIT 1', [body.univ_reg_no.trim()]);
      if (existingReg.length > 0) errors.push({ param: 'univ_reg_no', msg: 'A registration already exists with this Register / Application Number.' });

      const [existingAadhaar] = await db.query('SELECT * FROM registrations WHERE aadhaar_number = ? LIMIT 1', [body.aadhaar_number.trim()]);
      if (existingAadhaar.length > 0) errors.push({ param: 'aadhaar_number', msg: 'A registration already exists with this Aadhaar Number.' });

      const [existingEmail] = await db.query('SELECT * FROM registrations WHERE email = ? LIMIT 1', [body.email.trim()]);
      if (existingEmail.length > 0) errors.push({ param: 'email', msg: 'A registration already exists with this Email Address.' });
    } catch (err) {
      console.error('Validation Duplicate Check Error:', err);
    }
  }

  if (errors.length > 0) {
    return res.render('index', {
      title: 'Pondicherry University - NSS Volunteer Registration 2026',
      constants,
      csrfToken: req.csrfToken ? req.csrfToken() : '',
      errors,
      formData: body
    });
  }

  next();
};
