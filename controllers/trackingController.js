const db = require('../config/database');
const { generateRegistrationPDF } = require('../utils/pdfGenerator');

exports.renderTrackPage = (req, res) => {
  res.render('track-registration', {
    title: 'Track Volunteer Registration - PU NSS Portal',
    registration: null,
    searched: false,
    error: null
  });
};

exports.searchRegistration = async (req, res) => {
  const { query } = req.body;
  if (!query || !query.trim()) {
    return res.render('track-registration', {
      title: 'Track Volunteer Registration - PU NSS Portal',
      registration: null,
      searched: true,
      error: 'Please enter your Registration ID or University Register Number.'
    });
  }

  try {
    const [rows] = await db.query(
      'SELECT * FROM registrations WHERE (registration_id = ? OR univ_reg_no = ?) AND status = "Active" LIMIT 1',
      [query.trim(), query.trim()]
    );

    if (rows.length === 0) {
      return res.render('track-registration', {
        title: 'Track Volunteer Registration - PU NSS Portal',
        registration: null,
        searched: true,
        error: 'No active registration record found matching your input.'
      });
    }

    res.render('track-registration', {
      title: 'Track Volunteer Registration - PU NSS Portal',
      registration: rows[0],
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
  try {
    const [rows] = await db.query('SELECT * FROM registrations WHERE registration_id = ? AND status = "Active" LIMIT 1', [registrationId]);
    if (rows.length === 0) return res.status(404).render('404');
    generateRegistrationPDF(rows[0], res);
  } catch (err) {
    console.error('Student PDF Download Error:', err);
    res.status(500).render('500');
  }
};
