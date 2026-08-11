/**
 * Registration Form Dynamic Interactivity & Modal Review Script
 * Handles real-time department-to-unit mapping, age calculation,
 * address copying, conditional fields, file validation, and confirmation modal logic.
 */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('nssRegistrationForm');
  if (!form) return;

  // DOM Elements
  const deptSelect = document.getElementById('department');
  const unitDisplay = document.getElementById('unit_number_display');
  const dobInput = document.getElementById('dob');
  const ageInput = document.getElementById('age');
  const presentAddressInput = document.getElementById('present_address');
  const permAddressInput = document.getElementById('permanent_address');
  const sameAddressCheckbox = document.getElementById('is_same_address');
  
  // Conditional UI Containers
  const prevVolRadios = document.querySelectorAll('input[name="is_previous_volunteer"]');
  const certContainer = document.getElementById('certificateUploadContainer');
  const certInput = document.getElementById('certificate');
  
  const mediaRadios = document.querySelectorAll('input[name="interested_in_media"]');
  const mediaRolesContainer = document.getElementById('mediaRolesContainer');
  const declarationCheckbox = document.getElementById('declaration_accepted');
  const submitModalBtn = document.getElementById('openSubmitModalBtn');

  // Confirmation Modal Elements
  const modal = document.getElementById('confirmationModal');
  const modalCancelBtn = document.getElementById('modalCancelBtn');
  const modalConfirmBtn = document.getElementById('modalConfirmBtn');
  const modalSummaryBox = document.getElementById('modalSummaryBox');

  // Department to Unit Mapping Object (Mirrors Constants)
  const DEPARTMENT_UNIT_MAP = {
    'UNIT 1': [
      'Department of Biochemistry & Molecular Biology',
      'Department of Biotechnology',
      'Department of Bioinformatics',
      'Department of Ecological Science',
      'Department of Food Science & Technology',
      'Department of Earth Sciences',
      'Department of Chemistry',
      'Department of Physics',
      'Department of Computer Science'
    ],
    'UNIT 2': [
      'Department of Anthropology',
      'Department of History',
      'Department of Politics & International Studies',
      'Department of Sociology',
      'Department of Social Work',
      'Department of Philosophy'
    ],
    'UNIT 5': [
      'Department of Management Studies',
      'Department of Commerce',
      'Department of Economics',
      'Department of Tourism Studies',
      'Department of Banking Technology'
    ],
    'UNIT 6': [
      'Department of Education',
      'Department of Physical Education',
      'Department of English',
      'Department of French',
      'Department of Hindi',
      'Department of Tamil',
      'Department of Sanskrit',
      'School of Law'
    ]
  };

  /**
   * 1. Auto-assign NSS Unit display based on selected Department
   */
  const updateUnitNumber = () => {
    const selectedDept = deptSelect.value;
    let assignedUnit = '';

    if (selectedDept) {
      for (const [unit, depts] of Object.entries(DEPARTMENT_UNIT_MAP)) {
        if (depts.includes(selectedDept)) {
          assignedUnit = unit;
          break;
        }
      }
    }

    unitDisplay.value = assignedUnit || 'Auto-Assigned';
  };

  deptSelect.addEventListener('change', updateUnitNumber);
  if (deptSelect.value) updateUnitNumber();

  /**
   * 2. Age Calculation on Date of Birth change
   */
  const calculateAge = () => {
    const dobValue = dobInput.value;
    if (!dobValue) {
      ageInput.value = '';
      return;
    }

    const { error, age } = window.NSSValidation.validateDOB(dobValue);
    if (error) {
      window.NSSValidation.showError(dobInput, error);
      ageInput.value = '';
    } else {
      window.NSSValidation.clearError(dobInput);
      ageInput.value = age;
    }
  };

  dobInput.addEventListener('change', calculateAge);
  if (dobInput.value) calculateAge();

  /**
   * 3. Copy Present Address to Permanent Address
   */
  sameAddressCheckbox.addEventListener('change', () => {
    if (sameAddressCheckbox.checked) {
      permAddressInput.value = presentAddressInput.value;
      permAddressInput.readOnly = true;
      window.NSSValidation.clearError(permAddressInput);
    } else {
      permAddressInput.readOnly = false;
    }
  });

  presentAddressInput.addEventListener('input', () => {
    if (sameAddressCheckbox.checked) {
      permAddressInput.value = presentAddressInput.value;
    }
  });

  /**
   * 4. Conditional UI: Previous Volunteer Certificate Upload
   */
  prevVolRadios.forEach((radio) => {
    radio.addEventListener('change', (e) => {
      if (e.target.value === 'Yes') {
        certContainer.style.display = 'block';
        certInput.required = true;
      } else {
        certContainer.style.display = 'none';
        certInput.required = false;
        certInput.value = '';
        window.NSSValidation.clearError(certInput);
      }
    });
  });

  /**
   * 5. Certificate File Size & Format Client Validation (Max 250 KB)
   */
  certInput.addEventListener('change', () => {
    const file = certInput.files[0];
    if (!file) return;

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg'];
    const maxSize = 250 * 1024; // 250 KB

    if (!allowedTypes.includes(file.type)) {
      window.NSSValidation.showError(certInput, 'Invalid file format. Only PDF, JPG, and JPEG allowed.');
      certInput.value = '';
      return;
    }

    if (file.size > maxSize) {
      window.NSSValidation.showError(certInput, `File exceeds maximum limit of 250 KB (Current size: ${(file.size / 1024).toFixed(1)} KB).`);
      certInput.value = '';
      return;
    }

    window.NSSValidation.clearError(certInput);
  });

  /**
   * 6. Conditional UI: Media Team Preference
   */
  mediaRadios.forEach((radio) => {
    radio.addEventListener('change', (e) => {
      if (e.target.value === 'Yes') {
        mediaRolesContainer.style.display = 'block';
      } else {
        mediaRolesContainer.style.display = 'none';
        const roleBoxes = mediaRolesContainer.querySelectorAll('input[type="checkbox"]');
        roleBoxes.forEach((box) => (box.checked = false));
      }
    });
  });

  /**
   * 7. Enable/Disable Submit Modal Button based on Declaration Checkbox
   */
  declarationCheckbox.addEventListener('change', () => {
    submitModalBtn.disabled = !declarationCheckbox.checked;
  });

  /**
   * 8. Modal Confirmation Trigger & Data Population
   */
  submitModalBtn.addEventListener('click', () => {
    // Validate required inputs prior to opening confirmation modal
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    // Populate Modal Summary
    const applicantName = document.getElementById('applicant_name').value.trim();
    const univRegNo = document.getElementById('univ_reg_no').value.trim();
    const department = deptSelect.value;
    const course = document.getElementById('course').value;
    const contact = document.getElementById('contact_number').value.trim();

    modalSummaryBox.innerHTML = `
      <div class="modal-summary-row"><strong>Applicant Name:</strong> <span>${applicantName.toUpperCase()}</span></div>
      <div class="modal-summary-row"><strong>Univ Reg / App No:</strong> <span>${univRegNo}</span></div>
      <div class="modal-summary-row"><strong>Department:</strong> <span>${department}</span></div>
      <div class="modal-summary-row"><strong>Course:</strong> <span>${course}</span></div>
      <div class="modal-summary-row"><strong>Contact Number:</strong> <span>${contact}</span></div>
      <div class="modal-summary-row"><strong>Assigned NSS Unit:</strong> <span>${unitDisplay.value}</span></div>
    `;

    modal.classList.add('is-active');
    modal.setAttribute('aria-hidden', 'false');
  });

  /**
   * Modal Dismissal Controls
   */
  const closeModal = () => {
    modal.classList.remove('is-active');
    modal.setAttribute('aria-hidden', 'true');
  };

  modalCancelBtn.addEventListener('click', closeModal);
  
  modal.querySelector('.pu-modal-overlay').addEventListener('click', closeModal);

  modalConfirmBtn.addEventListener('click', () => {
    modalConfirmBtn.disabled = true;
    modalConfirmBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting...';
    form.submit();
  });
});