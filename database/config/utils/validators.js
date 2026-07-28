/**
 * Express Validator & Input Validation Rules
 * Encapsulates validation schemas and custom sanitizers for clean input processing.
 */

const { body, check } = require('express-validator');
const {
  INDIAN_STATES_AND_UTS,
  INDIAN_LANGUAGES,
  BLOOD_GROUPS,
  PU_COURSES,
  MEDIA_TEAM_ROLES,
  DEPARTMENT_UNIT_MAPPING
} = require('./helpers');

/**
 * Custom Validator: Check if department belongs to valid list
 */
const isValidDepartment = (dept) => {
  const allDepartments = Object.values(DEPARTMENT_UNIT_MAPPING).flat();
  return allDepartments.includes(dept);
};

/**
 * Validation rules for Student Registration Form
 */
const registrationValidationRules = () => {
  return [
    // Academic Details
    body('department')
      .trim()
      .notEmpty()
      .withMessage('Department / Programme is required.')
      .custom((value) => {
        if (!isValidDepartment(value)) {
          throw new Error('Selected Department / Programme is invalid.');
        }
        return true;
      }),

    body('course')
      .trim()
      .notEmpty()
      .withMessage('Course is required.')
      .isIn(PU_COURSES)
      .withMessage('Invalid Course selected.'),

    body('year_of_study')
      .trim()
      .notEmpty()
      .withMessage('Year of Study is required.')
      .isIn(['First Year', 'Second Year', 'Third Year'])
      .withMessage('Invalid Year of Study selected.'),

    // Personal Details
    body('applicant_name')
      .trim()
      .notEmpty()
      .withMessage('Name of Applicant is required.')
      .matches(/^[A-Za-z\s.]+$/)
      .withMessage('Applicant Name can only contain alphabets, spaces, and dots.')
      .customSanitizer((value) => value.toUpperCase()),

    body('univ_reg_no')
      .trim()
      .notEmpty()
      .withMessage('Registration / Application Number is required.')
      .isAlphanumeric('en-US', { ignore: '-_/' })
      .withMessage('Registration Number can only contain letters, numbers, hyphens, and slashes.')
      .customSanitizer((value) => value.toUpperCase()),

    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email address is required.')
      .isEmail()
      .withMessage('Please provide a valid email address.')
      .normalizeEmail(),

    body('contact_number')
      .trim()
      .notEmpty()
      .withMessage('Contact Number is required.')
      .matches(/^[6-9]\d{9}$/)
      .withMessage('Contact Number must be 10 digits starting with 6, 7, 8, or 9.'),

    body('alt_contact_number')
      .optional({ checkFalsy: true })
      .trim()
      .matches(/^[6-9]\d{9}$/)
      .withMessage('Alternative Contact Number must be 10 digits starting with 6, 7, 8, or 9.')
      .custom((value, { req }) => {
        if (value && value === req.body.contact_number) {
          throw new Error('Alternative contact number must be different from primary contact number.');
        }
        return true;
      }),

    body('gender')
      .trim()
      .notEmpty()
      .withMessage('Gender is required.')
      .isIn(['Male', 'Female', 'Transgender', 'Prefer not to say'])
      .withMessage('Invalid Gender selection.'),

    body('dob')
      .trim()
      .notEmpty()
      .withMessage('Date of Birth is required.')
      .isISO8601()
      .withMessage('Date of Birth must be a valid date (YYYY-MM-DD).')
      .custom((value) => {
        const birthDate = new Date(value);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        if (age < 15 || age > 60) {
          throw new Error('Age must be between 15 and 60 years based on Date of Birth.');
        }
        return true;
      }),

    body('blood_group')
      .trim()
      .notEmpty()
      .withMessage('Blood Group is required.')
      .isIn(BLOOD_GROUPS)
      .withMessage('Invalid Blood Group selected.'),

    body('aadhaar_number')
      .trim()
      .notEmpty()
      .withMessage('Aadhaar Number is required.')
      .matches(/^\d{12}$/)
      .withMessage('Aadhaar Number must be exactly 12 digits.'),

    // Address Details
    body('native_state')
      .trim()
      .notEmpty()
      .withMessage('Native State / UT is required.')
      .isIn(INDIAN_STATES_AND_UTS)
      .withMessage('Invalid Native State / Union Territory selected.'),

    body('present_address')
      .trim()
      .notEmpty()
      .withMessage('Present Address is required.')
      .isLength({ min: 10, max: 500 })
      .withMessage('Present Address must be between 10 and 500 characters.'),

    body('permanent_address')
      .trim()
      .notEmpty()
      .withMessage('Permanent Address is required.')
      .isLength({ min: 10, max: 500 })
      .withMessage('Permanent Address must be between 10 and 500 characters.'),

    // Languages Spoken (Can be array or single string)
    body('languages_spoken')
      .custom((value) => {
        let languages = value;
        if (!languages) {
          throw new Error('At least one language must be selected.');
        }
        if (typeof languages === 'string') {
          languages = [languages];
        }
        if (!Array.isArray(languages) || languages.length === 0) {
          throw new Error('At least one language must be selected.');
        }
        const invalidLangs = languages.filter((lang) => !INDIAN_LANGUAGES.includes(lang));
        if (invalidLangs.length > 0) {
          throw new Error('One or more selected languages are invalid.');
        }
        return true;
      }),

    // NSS Volunteer Info
    body('is_previous_volunteer')
      .trim()
      .notEmpty()
      .withMessage('Please specify if you are a previous NSS Volunteer.')
      .isIn(['Yes', 'No'])
      .withMessage('Invalid option for Previous Volunteer.'),

    // Media Team
    body('interested_in_media')
      .trim()
      .notEmpty()
      .withMessage('Please answer the Media Team interest question.')
      .isIn(['Yes', 'No'])
      .withMessage('Invalid option for Media Team interest.'),

    body('media_roles')
      .custom((value, { req }) => {
        if (req.body.interested_in_media === 'Yes') {
          let roles = value;
          if (!roles) {
            throw new Error('Please select at least one role for the Media Team.');
          }
          if (typeof roles === 'string') {
            roles = [roles];
          }
          if (!Array.isArray(roles) || roles.length === 0) {
            throw new Error('Please select at least one role for the Media Team.');
          }
          const invalidRoles = roles.filter((role) => !MEDIA_TEAM_ROLES.includes(role));
          if (invalidRoles.length > 0) {
            throw new Error('One or more selected Media Team roles are invalid.');
          }
        }
        return true;
      }),

    // Declaration
    body('declaration_accepted')
      .notEmpty()
      .withMessage('You must accept the declaration to proceed.')
      .custom((value) => {
        if (value !== '1' && value !== 1 && value !== 'true' && value !== true && value !== 'on') {
          throw new Error('You must accept the declaration to proceed.');
        }
        return true;
      })
  ];
};

/**
 * Validation rules for Admin Login
 */
const adminLoginValidationRules = () => {
  return [
    body('username')
      .trim()
      .notEmpty()
      .withMessage('Username is required.')
      .isAlphanumeric()
      .withMessage('Username must contain letters and numbers only.'),

    body('password')
      .notEmpty()
      .withMessage('Password is required.')
  ];
};

module.exports = {
  registrationValidationRules,
  adminLoginValidationRules
};