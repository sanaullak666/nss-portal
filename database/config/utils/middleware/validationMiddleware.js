/**
 * Validation Middleware
 * Processes express-validator results and handles server-side error mapping.
 */

const { validationResult } = require('express-validator');

/**
 * Middleware to evaluate validation results for student registration
 */
const validateRegistration = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    // Structure field-specific error messages
    const formattedErrors = {};
    errors.array().forEach((error) => {
      if (!formattedErrors[error.path]) {
        formattedErrors[error.path] = error.msg;
      }
    });

    // Pass structured errors to request object for controller consumption
    req.validationErrors = formattedErrors;
  }

  next();
};

/**
 * Middleware to evaluate validation results for admin authentication
 */
const validateAdminLogin = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMap = {};
    errors.array().forEach((err) => {
      errorMap[err.path] = err.msg;
    });
    return res.status(400).render('admin/login', {
      title: 'Admin Login | Pondicherry University NSS',
      errors: errorMap,
      oldInput: req.body,
      errorMessage: 'Invalid login credentials. Please check the errors below.'
    });
  }

  next();
};

module.exports = {
  validateRegistration,
  validateAdminLogin
};