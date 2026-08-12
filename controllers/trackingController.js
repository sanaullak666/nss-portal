const RegistrationModel = require('../models/registrationModel');
const { generateRegistrationPDF } = require('../utils/pdfGenerator');

exports.renderTrackPage = (req, res) => {
  res.render('track-registration', {
    title: 'Track Volunteer Registration - PU NSS Portal',
    csrfToken: req.csrfToken ? req.csrfToken() : '',
    registration: null,
    searched: false,
    error: null
  });
};

exports.searchRegistration = async (req, res) => {
  const { query } = req.body || {};
  const cleanQuery = query ? query.trim() : '';

  if (!cleanQuery) {
    return res.render('track-registration', {
      title: 'Track Volunteer Registration - PU NSS Portal',
      csrfToken: req.csrfToken ? req.csrfToken() : '',
      registration: null,
      searched: true,
      error: 'Please enter your Registration ID, Register Number, Email, Mobile, or Aadhaar Number.'
    });
  }

  try {
    const registration = await RegistrationModel.searchActive(cleanQuery);

    if (!registration) {
      return res.render('track-registration', {
        title: 'Track Volunteer Registration - PU NSS Portal',
        csrfToken: req.csrfToken ? req.csrfToken() : '',
        registration: null,
        searched: true,
        error: 'No active registration record found matching your input.'
      });
    }

    // Set verified student tracking session authorization
    if (req.session) {
      req.session.verifiedStudentRegId = registration.registration_id;
      req.session.verifiedCertificates = req.session.verifiedCertificates || [];
      if (registration.certificate_path && !req.session.verifiedCertificates.includes(registration.certificate_path)) {
        req.session.verifiedCertificates.push(registration.certificate_path);
      }
    }

    res.render('track-registration', {
      title: 'Track Volunteer Registration - PU NSS Portal',
      csrfToken: req.csrfToken ? req.csrfToken() : '',
      registration,
      searched: true,
      error: null
    });
  } catch (err) {
    console.error('Tracking Query Error:', err);
    res.status(500).render('500');
  }
};

exports.downloadStudentReceipt = async (req, res) => {
  const { registrationId } = req.params;
  const cleanId = registrationId ? registrationId.trim() : '';

  try {
    let registration = await RegistrationModel.findByRegistrationId(cleanId);
    if (!registration) {
      registration = await RegistrationModel.searchActive(cleanId);
    }

    if (!registration || !['Active', 'Selected', 'Rejected'].includes(registration.status)) {
      return res.status(404).render('404');
    }

    // Authorization check: Must be admin or have performed a verified tracking search for this registration
    const isAdmin = req.session && req.session.admin;
    const isOwnerStudent = req.session && req.session.verifiedStudentRegId === registration.registration_id;

    if (!isAdmin && !isOwnerStudent) {
      return res.status(403).send('Access Denied: Please search your application first on the Track Registration page to verify your identity before downloading your PDF receipt.');
    }

    generateRegistrationPDF(registration, res);
  } catch (err) {
    console.error('Student PDF Download Error:', err);
    res.status(500).render('500');
  }
};
