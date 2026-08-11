/**
 * Global Interactivity & UI Helper Scripts
 * Handles UI interactions, password toggles, alert auto-dismissal, and dynamic updates.
 */

document.addEventListener('DOMContentLoaded', () => {
  initPasswordToggles();
  initAutoDismissAlerts();
  initTableHoverHighlight();
});

/**
 * Initialize password visibility toggle for authentication forms
 */
function initPasswordToggles() {
  const toggleBtn = document.getElementById('togglePasswordBtn');
  const passwordInput = document.getElementById('password');
  const toggleIcon = document.getElementById('togglePasswordIcon');

  if (toggleBtn && passwordInput && toggleIcon) {
    toggleBtn.addEventListener('click', () => {
      const isPassword = passwordInput.getAttribute('type') === 'password';
      passwordInput.setAttribute('type', isPassword ? 'text' : 'password');

      // Toggle Icon state
      if (isPassword) {
        toggleIcon.classList.remove('fa-eye');
        toggleIcon.classList.add('fa-eye-slash');
      } else {
        toggleIcon.classList.remove('fa-eye-slash');
        toggleIcon.classList.add('fa-eye');
      }
    });
  }
}

/**
 * Auto-dismiss non-critical feedback alerts after 8 seconds
 */
function initAutoDismissAlerts() {
  const alerts = document.querySelectorAll('.pu-alert-info, .pu-alert-success');
  alerts.forEach((alert) => {
    setTimeout(() => {
      alert.style.transition = 'opacity 0.5s ease';
      alert.style.opacity = '0';
      setTimeout(() => alert.remove(), 500);
    }, 8000);
  });
}

/**
 * Enhanced table row selection highlight for administrative lists
 */
function initTableHoverHighlight() {
  const tableRows = document.querySelectorAll('.pu-table-hover tbody tr');
  tableRows.forEach((row) => {
    row.addEventListener('click', (e) => {
      // Avoid firing when clicking interactive elements (buttons, links)
      if (['A', 'BUTTON', 'INPUT', 'I'].includes(e.target.tagName)) return;

      tableRows.forEach((r) => r.classList.remove('is-selected'));
      row.classList.add('is-selected');
    });
  });
}