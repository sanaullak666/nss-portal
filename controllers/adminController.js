const db = require('../config/database');
const { UNITS, DEPARTMENTS, COURSES, YEAR_OF_STUDY } = require('../config/constants');
const { exportRegistrationsToExcel } = require('../utils/excelExporter');
const { generateRegistrationPDF } = require('../utils/pdfGenerator');

exports.renderDashboard = async (req, res) => {
  try {
    const [[{ totalRegistrations }]] = await db.query('SELECT COUNT(*) as totalRegistrations FROM registrations');
    const [[{ todayRegistrations }]] = await db.query('SELECT COUNT(*) as todayRegistrations FROM registrations WHERE DATE(created_at) = CURDATE()');
    const [[{ totalUnits }]] = await db.query('SELECT COUNT(DISTINCT unit_number) as totalUnits FROM registrations');
    const [[{ totalMediaInterested }]] = await db.query('SELECT COUNT(*) as totalMediaInterested FROM registrations WHERE interested_in_media = "Yes"');
    const [[{ totalPreviousVolunteers }]] = await db.query('SELECT COUNT(*) as totalPreviousVolunteers FROM registrations WHERE is_previous_volunteer = "Yes"');

    // Chart aggregations
    const [unitCounts] = await db.query('SELECT unit_number, COUNT(*) as count FROM registrations GROUP BY unit_number ORDER BY unit_number');
    const [genderCounts] = await db.query('SELECT gender, COUNT(*) as count FROM registrations GROUP BY gender');
    const [yearCounts] = await db.query('SELECT year_of_study, COUNT(*) as count FROM registrations GROUP BY year_of_study');
    const [courseCounts] = await db.query('SELECT course, COUNT(*) as count FROM registrations GROUP BY course ORDER BY count DESC LIMIT 8');
    const [recentRegistrations] = await db.query('SELECT * FROM registrations ORDER BY created_at DESC LIMIT 5');

    res.render('admin/dashboard', {
      title: 'Admin Analytics & Dashboard - PU NSS Portal',
      admin: req.session.admin,
      stats: { totalRegistrations, todayRegistrations, totalUnits, totalMediaInterested, totalPreviousVolunteers },
      chartData: { unitCounts, genderCounts, yearCounts, courseCounts },
      recentRegistrations
    });
  } catch (err) {
    console.error('Dashboard Error:', err);
    res.status(500).render('500');
  }
};

exports.renderRegistrationsList = async (req, res) => {
  const { unit, department, course, year_of_study, gender, is_previous_volunteer, interested_in_media, search, page = 1 } = req.query;
  const limit = 15;
  const offset = (parseInt(page, 10) - 1) * limit;

  let whereClauses = [];
  let queryParams = [];

  if (unit) { whereClauses.push('unit_number = ?'); queryParams.push(unit); }
  if (department) { whereClauses.push('department = ?'); queryParams.push(department); }
  if (course) { whereClauses.push('course = ?'); queryParams.push(course); }
  if (year_of_study) { whereClauses.push('year_of_study = ?'); queryParams.push(year_of_study); }
  if (gender) { whereClauses.push('gender = ?'); queryParams.push(gender); }
  if (is_previous_volunteer) { whereClauses.push('is_previous_volunteer = ?'); queryParams.push(is_previous_volunteer); }
  if (interested_in_media) { whereClauses.push('interested_in_media = ?'); queryParams.push(interested_in_media); }

  if (search) {
    whereClauses.push('(applicant_name LIKE ? OR univ_reg_no LIKE ? OR registration_id LIKE ? OR email LIKE ? OR contact_number LIKE ? OR aadhaar_number LIKE ? OR department LIKE ?)');
    const term = `%${search.trim()}%`;
    queryParams.push(term, term, term, term, term, term, term);
  }

  const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  try {
    const [[{ totalCount }]] = await db.query(`SELECT COUNT(*) as totalCount FROM registrations ${whereSQL}`, queryParams);
    const [registrations] = await db.query(`SELECT * FROM registrations ${whereSQL} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...queryParams, limit, offset]);

    res.render('admin/registrations', {
      title: 'Manage Registrations - PU NSS Portal',
      admin: req.session.admin,
      registrations,
      pagination: { currentPage: parseInt(page, 10), totalPages: Math.ceil(totalCount / limit) || 1, totalCount },
      filters: { unit: unit || '', department: department || '', course: course || '', year_of_study: year_of_study || '', gender: gender || '', is_previous_volunteer: is_previous_volunteer || '', interested_in_media: interested_in_media || '', search: search || '' },
      UNITS,
      DEPARTMENTS,
      COURSES,
      YEAR_OF_STUDY
    });
  } catch (err) {
    console.error('Registrations List Error:', err);
    res.status(500).render('500');
  }
};

exports.renderRegistrationView = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM registrations WHERE id = ? LIMIT 1', [req.params.id]);
    if (rows.length === 0) return res.status(404).render('404');
    res.render('admin/registration-view', { title: `View Profile - PU NSS Portal`, admin: req.session.admin, registration: rows[0] });
  } catch (err) {
    console.error('View Registration Error:', err);
    res.status(500).render('500');
  }
};

exports.exportExcel = async (req, res) => {
  try {
    const [registrations] = await db.query('SELECT * FROM registrations ORDER BY created_at DESC');
    await exportRegistrationsToExcel(registrations, res);
  } catch (err) {
    console.error('Excel Export Error:', err);
    res.status(500).render('500');
  }
};

exports.downloadPDF = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM registrations WHERE id = ? LIMIT 1', [req.params.id]);
    if (rows.length === 0) return res.status(404).render('404');
    generateRegistrationPDF(rows[0], res);
  } catch (err) {
    console.error('PDF Download Error:', err);
    res.status(500).render('500');
  }
};
