/**
 * Administrative Portal Management Scripts
 * Handles table filtering, quick search clear, auto-submit on selection,
 * and bulk action handles for administrative dashboards.
 */

document.addEventListener('DOMContentLoaded', () => {
  initFilterFormControls();
  initRegistrationRowInteractions();
});

/**
 * Filter Form UX Enhancements
 * Auto-submits search/filter form on select input changes
 */
function initFilterFormControls() {
  const filterForm = document.getElementById('filterForm');
  if (!filterForm) return;

  const selectFilters = filterForm.querySelectorAll('select');
  selectFilters.forEach((select) => {
    select.addEventListener('change', () => {
      filterForm.submit();
    });
  });

  // Debounce search input submission to avoid excessive HTTP requests
  const searchInput = document.getElementById('search');
  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (searchInput.value.length >= 3 || searchInput.value.length === 0) {
          filterForm.submit();
        }
      }, 600);
    });
  }
}

/**
 * Handle administrative action shortcuts for registration profiles
 */
function initRegistrationRowInteractions() {
  const viewButtons = document.querySelectorAll('.pu-btn-view-profile');
  viewButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent trigger conflict with row selections
    });
  });
}