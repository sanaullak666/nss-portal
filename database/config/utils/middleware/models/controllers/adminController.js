const db = require('../config/database');
const { UNITS, DEPARTMENTS } = require('../config/constants');
const { exportRegistrationsToExcel } = require('../utils/excelExporter');
const { generateRegistrationPDF } = require('../utils/pdfGenerator');

/**
 * Render Admin Dashboard
 */
exports.renderDashboard = async (req, res) => {
  try {
    const [[{ totalRegistrations }]] = await db.query('SELECT COUNT(*) as totalRegistrations FROM registrations');
    const [[{ totalUnits }]] = await db.query('SELECT COUNT(DISTINCT unit_number) as totalUnits FROM registrations');
    const [[{ totalMediaInterested }]] = await db.query('SELECT COUNT(*) as totalMediaInterested FROM registrations WHERE interested_in_media = "Yes"');
    const [[{ totalPreviousVolunteers }]] = await db.query('SELECT COUNT(*) as totalPreviousVolunteers FROM registrations WHERE is_previous_volunteer = "Yes"');

    const [unitCounts] = await db.query('SELECT unit_number, COUNT(*) as count FROM registrations GROUP BY unit_number ORDER BY unit_number');
    const [recentRegistrations] = await db.query('SELECT * FROM registrations ORDER BY created_at DESC LIMIT 5');

    res.render('admin/dashboard', {
      title: 'Admin Dashboard - PU NSS Portal',
      admin: req.session.admin,
      stats: {
        totalRegistrations,
        totalUnits,
        totalMediaInterested,
        totalPreviousVolunteers
      },
      unitCounts,
      recentRegistrations
    });
  } catch (err) {
    console.error('Dashboard Error:', err);
    res.status(500).send('Internal Server Error');
  }
};

/**
 * Render All Registrations Table
 */
exports.renderRegistrationsList = async (req, res) => {
  const { unit, department, search, page = 1 } = req.query;
  const limit = 15;
  const offset = (parseInt(page, 10) - 1) * limit;

  let whereClauses = [];
  let queryParams = [];

  if (unit) {
    whereClauses.push('unit_number = ?');
    queryParams.push(unit);
  }

  if (department) {
    whereClauses.push('department = ?');
    queryParams.push(department);
  }

  if (search) {
    whereClauses.push('(applicant_name LIKE ? OR univ_reg_no LIKE ? OR registration_id LIKE ? OR email LIKE ?)');
    const term = `%${search.trim()}%`;
    queryParams.push(term, term, term, term);
  }

  const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  try {
    const [[{ totalCount }]] = await db.query(`SELECT COUNT(*) as totalCount FROM registrations ${whereSQL}`, queryParams);
    const [registrations] = await db.query(
      `SELECT * FROM registrations ${whereSQL} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    const totalPages = Math.ceil(totalCount / limit);

    res.render('admin/registrations', {
      title: 'Manage Registrations - PU NSS Portal',
      admin: req.session.admin,
      registrations,
      pagination: {
        currentPage: parseInt(page, 10),
        totalPages,
        totalCount
      },
      filters: { unit: unit || '', department: department || '', search: search || '' },
      UNITS,
      DEPARTMENTS
    });
  } catch (err) {
    console.error('Registrations List Error:', err);
    res.status(500).send('Internal Server Error');
  }
};

/**
 * Render Single Registration Details Page
 */
exports.renderRegistrationView = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.query('SELECT * FROM registrations WHERE id = ? LIMIT 1', [id]);

    if (rows.length === 0) {
      return res.status(404).send('Registration profile not found.');
    }

    res.render('admin/registration-view', {
      title: `View ${rows[0].registration_id} - PU NSS Portal`,
      admin: req.session.admin,
      registration: rows[0]
    });
  } catch (err) {
    console.error('View Registration Error:', err);
    res.status(500).send('Internal Server Error');
  }
};

/**
 * Export Registrations to Excel
 */
exports.exportExcel = async (req, res) => {
  try {
    const [registrations] = await db.query('SELECT * FROM registrations ORDER BY created_at DESC');
    await exportRegistrationsToExcel(registrations, res);
  } catch (err) {
    console.error('Excel Export Error:', err);
    res.status(500).send('Could not generate Excel export.');
  }
};

/**
 * Generate PDF Application Slip
 */
exports.downloadPDF = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.query('SELECT * FROM registrations WHERE id = ? LIMIT 1', [id]);

    if (rows.length === 0) {
      return res.status(404).send('Registration not found.');
    }

    generateRegistrationPDF(rows[0], res);
  } catch (err) {
    console.error('PDF Download Error:', err);
    res.status(500).send('Could not generate PDF document.');
  }
};