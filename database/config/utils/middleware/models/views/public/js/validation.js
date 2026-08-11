/**
 * Frontend Validation Engine
 * Provides real-time field validation, format checking, and dynamic error feedback.
 */

window.NSSValidation = (() => {
  const REGEX = {
    NAME: /^[A-Za-z\s]+$/,
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE: /^[6-9]\d{9}$/,
    AADHAAR: /^\d{12}$/
  };

  /**
   * Validate Name Field (Alphabets and spaces only)
   */
  const validateName = (value) => {
    if (!value || !value.trim()) return 'Applicant name is required.';
    if (!REGEX.NAME.test(value.trim())) return 'Name must contain only alphabets and spaces.';
    if (value.trim().length < 2) return 'Name must be at least 2 characters long.';
    return null;
  };

  /**
   * Validate Email Address
   */
  const validateEmail = (value) => {
    if (!value || !value.trim()) return 'Email address is required.';
    if (!REGEX.EMAIL.test(value.trim())) return 'Please enter a valid email address.';
    return null;
  };

  /**
   * Validate 10-digit Indian Mobile Number
   */
  const validatePhone = (value, isRequired = true) => {
    if (!value || !value.trim()) {
      return isRequired ? 'Contact number is required.' : null;
    }
    if (!REGEX.PHONE.test(value.trim())) {
      return 'Must be a valid 10-digit Indian mobile number starting with 6-9.';
    }
    return null;
  };

  /**
   * Validate 12-digit Aadhaar Number
   */
  const validateAadhaar = (value) => {
    if (!value || !value.trim()) return 'Aadhaar number is required.';
    if (!REGEX.AADHAAR.test(value.trim())) return 'Aadhaar must be exactly 12 numeric digits.';
    return null;
  };

  /**
   * Validate Date of Birth & Calculate Age (Must be 15-35 years)
   */
  const validateDOB = (dobValue) => {
    if (!dobValue) return { error: 'Date of birth is required.', age: null };

    const birthDate = new Date(dobValue);
    const today = new Date();
    if (isNaN(birthDate.getTime())) return { error: 'Invalid date format.', age: null };

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age < 15 || age > 35) {
      return { error: 'Age must be between 15 and 35 years for registration.', age };
    }

    return { error: null, age };
  };

  /**
   * Show error UI on input field
   */
  const showError = (inputElem, message) => {
    if (!inputElem) return;
    inputElem.classList.add('is-invalid');
    
    let feedback = inputElem.parentElement.querySelector('.pu-error-feedback');
    if (!feedback) {
      feedback = document.createElement('div');
      feedback.className = 'pu-error-feedback';
      inputElem.parentElement.appendChild(feedback);
    }
    feedback.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${message}`;
  };

  /**
   * Clear error UI from input field
   */
  const clearError = (inputElem) => {
    if (!inputElem) return;
    inputElem.classList.remove('is-invalid');
    const feedback = inputElem.parentElement.querySelector('.pu-error-feedback');
    if (feedback) feedback.remove();
  };

  return {
    validateName,
    validateEmail,
    validatePhone,
    validateAadhaar,
    validateDOB,
    showError,
    clearError
  };
})();