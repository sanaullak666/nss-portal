/* public/js/main.js - Client-Side Interactive Logic for PU NSS Portal */

document.addEventListener('DOMContentLoaded', function () {
  // Elements
  const deptSelect = document.getElementById('department');
  const unitDisplay = document.getElementById('unit_number_display');
  const unitHidden = document.getElementById('unit_number');
  const dobInput = document.getElementById('dob');
  const ageInput = document.getElementById('age');
  const sameAddressCheck = document.getElementById('is_same_address');
  const presentAddress = document.getElementById('present_address');
  const permanentAddress = document.getElementById('permanent_address');
  const prevVolunteerSelect = document.getElementById('is_previous_volunteer');
  const certificateGroup = document.getElementById('certificate_group');
  const certificateInput = document.getElementById('certificate');
  const fileError = document.getElementById('file-error');
  const mediaInterestSelect = document.getElementById('interested_in_media');
  const mediaRolesGroup = document.getElementById('media_roles_group');
  const regForm = document.getElementById('registrationForm');
  const submitBtn = document.getElementById('submitBtn');
  const navToggle = document.getElementById('navToggle');
  const mainNav = document.querySelector('.main-nav');
  const univRegNoInput = document.getElementById('univ_reg_no');

  // 1. Mobile Navigation Toggle
  if (navToggle && mainNav) {
    navToggle.addEventListener('click', function () {
      mainNav.classList.toggle('open');
    });
  }

  // Auto-uppercase University Register / Application Number as typed
  if (univRegNoInput) {
    univRegNoInput.addEventListener('input', function () {
      const start = this.selectionStart;
      const end = this.selectionEnd;
      this.value = this.value.toUpperCase();
      this.setSelectionRange(start, end);
    });
  }

  // 2. Department -> NSS Unit Auto Mapping
  function updateNSSUnit() {
    if (!deptSelect) return;
    const selectedOption = deptSelect.options[deptSelect.selectedIndex];
    const unit = selectedOption ? selectedOption.getAttribute('data-unit') : '';
    if (unit) {
      if (unitDisplay) unitDisplay.value = unit;
      if (unitHidden) unitHidden.value = unit;
    } else {
      if (unitDisplay) unitDisplay.value = '';
      if (unitHidden) unitHidden.value = '';
    }
  }

  if (deptSelect) {
    deptSelect.addEventListener('change', updateNSSUnit);
    updateNSSUnit(); // Run on load in case of pre-selected values
  }

  // 3. Date of Birth -> Age Calculation
  if (dobInput && ageInput) {
    dobInput.addEventListener('change', function () {
      if (!this.value) return;
      const dob = new Date(this.value);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      if (age >= 15 && age <= 60) {
        ageInput.value = age;
      } else if (age < 15) {
        ageInput.value = age;
        alert('Volunteer must be at least 15 years of age.');
      } else {
        ageInput.value = age;
      }
    });
  }

  // 4. Same Address Checkbox Copy
  if (sameAddressCheck && presentAddress && permanentAddress) {
    sameAddressCheck.addEventListener('change', function () {
      if (this.checked) {
        permanentAddress.value = presentAddress.value;
        permanentAddress.readOnly = true;
        permanentAddress.style.backgroundColor = '#f1f5f9';
      } else {
        permanentAddress.readOnly = false;
        permanentAddress.style.backgroundColor = '';
      }
    });

    presentAddress.addEventListener('input', function () {
      if (sameAddressCheck.checked) {
        permanentAddress.value = this.value;
      }
    });
  }

  // 5. Dynamic Previous Volunteer Certificate Field
  function toggleCertificateField() {
    if (!prevVolunteerSelect || !certificateGroup) return;
    if (prevVolunteerSelect.value === 'Yes') {
      certificateGroup.style.display = 'block';
      if (certificateInput) certificateInput.setAttribute('required', 'required');
    } else {
      certificateGroup.style.display = 'none';
      if (certificateInput) {
        certificateInput.removeAttribute('required');
        certificateInput.value = '';
      }
      if (fileError) fileError.style.display = 'none';
    }
  }

  if (prevVolunteerSelect) {
    prevVolunteerSelect.addEventListener('change', toggleCertificateField);
    toggleCertificateField(); // Run on load
  }

  // 6. Dynamic Media Roles Section
  function toggleMediaRoles() {
    if (!mediaInterestSelect || !mediaRolesGroup) return;
    if (mediaInterestSelect.value === 'Yes') {
      mediaRolesGroup.style.display = 'block';
    } else {
      mediaRolesGroup.style.display = 'none';
      const checkboxes = mediaRolesGroup.querySelectorAll('input[type="checkbox"]');
      checkboxes.forEach(cb => cb.checked = false);
    }
  }

  if (mediaInterestSelect) {
    mediaInterestSelect.addEventListener('change', toggleMediaRoles);
    toggleMediaRoles(); // Run on load
  }

  // 7. Strict 150 KB File Size Guard
  if (certificateInput) {
    certificateInput.addEventListener('change', function () {
      const file = this.files[0];
      if (file) {
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
        if (!allowedTypes.includes(file.type)) {
          if (fileError) {
            fileError.textContent = 'Invalid file type. Only PDF and Image files (JPG, JPEG, PNG) are allowed.';
            fileError.style.display = 'block';
          }
          this.value = '';
          return;
        }

        if (file.size > 150 * 1024) {
          if (fileError) {
            fileError.textContent = 'File size exceeds maximum limit of 150 KB. Selected file size: ' + (file.size / 1024).toFixed(1) + ' KB.';
            fileError.style.display = 'block';
          }
          this.value = '';
          return;
        }

        if (fileError) fileError.style.display = 'none';
      }
    });
  }

  // 8. Form Submission & Global Loader Management
  if (regForm && submitBtn) {
    regForm.addEventListener('submit', function (e) {
      if (!regForm.checkValidity()) {
        return; // Allow native validation tooltips
      }

      submitBtn.disabled = true;
      submitBtn.classList.add('loading');
      submitBtn.innerHTML = '<span class="spinner"></span> Processing Registration...';
      window.showGlobalLoader('Submitting Volunteer Registration...');
    });
  }

  // Handle all other forms (Login, Track Status, Admin Filters, etc.)
  document.querySelectorAll('form').forEach(function(form) {
    if (form === regForm) return; // already handled above
    form.addEventListener('submit', function (e) {
      if (form.checkValidity && !form.checkValidity()) {
        return;
      }
      const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
      const customText = submitBtn ? (submitBtn.getAttribute('data-loading-text') || submitBtn.innerText || submitBtn.value) : 'Request';
      window.showGlobalLoader('Processing ' + customText.trim() + '...');
    });
  });

  // Hide page preloader after 3.5 seconds (3 to 4 seconds)
  setTimeout(function() {
    window.hideGlobalLoader();
  }, 3500);
});

// Window-level Global Loader Control API
window.showGlobalLoader = function (text) {
  const overlay = document.getElementById('globalLoaderOverlay');
  const textEl = document.getElementById('globalLoaderText');
  if (textEl && text) {
    textEl.textContent = text;
  }
  if (overlay) {
    overlay.classList.remove('hidden');
  }
};

window.hideGlobalLoader = function () {
  const overlay = document.getElementById('globalLoaderOverlay');
  if (overlay) {
    overlay.classList.add('hidden');
  }
};

// Handle browser Back / Forward (bfcache) navigation
window.addEventListener('pageshow', function (event) {
  window.hideGlobalLoader();

  // Force a fresh server reload when navigating via Chrome Back or Forward (Next) buttons
  var isBackForward = event.persisted || 
    (window.performance && window.performance.getEntriesByType && 
     window.performance.getEntriesByType('navigation')[0] && 
     window.performance.getEntriesByType('navigation')[0].type === 'back_forward');

  if (isBackForward) {
    window.location.reload();
  }
});

