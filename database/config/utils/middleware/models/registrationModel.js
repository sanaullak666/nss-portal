/**
 * Registration Model
 * Handles data persistence and database interactions for NSS registrations.
 */

const db = require('../config/database');

class RegistrationModel {
  /**
   * Create a new student registration record
   * @param {Object} data Registration details
   * @returns {Promise<Object>} Insert result
   */
  static async create(data) {
    const query = `
      INSERT INTO registrations (
        registration_id,
        unit_number,
        department,
        course,
        year_of_study,
        applicant_name,
        univ_reg_no,
        email,
        contact_number,
        alt_contact_number,
        gender,
        dob,
        age,
        blood_group,
        aadhaar_number,
        native_state,
        present_address,
        permanent_address,
        is_same_address,
        languages_spoken,
        is_previous_volunteer,
        certificate_path,
        interested_in_media,
        media_roles,
        declaration_accepted
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      data.registration_id,
      data.unit_number,
      data.department,
      data.course,
      data.year_of_study,
      data.applicant_name,
      data.univ_reg_no,
      data.email,
      data.contact_number,
      data.alt_contact_number || null,
      data.gender,
      data.dob,
      data.age,
      data.blood_group,
      data.aadhaar_number,
      data.native_state,
      data.present_address,
      data.permanent_address,
      data.is_same_address ? 1 : 0,
      JSON.stringify(data.languages_spoken),
      data.is_previous_volunteer,
      data.certificate_path || null,
      data.interested_in_media,
      data.media_roles ? JSON.stringify(data.media_roles) : null,
      data.declaration_accepted ? 1 : 0
    ];

    const [result] = await db.execute(query, values);
    return result;
  }

  /**
   * Check if University Registration Number already exists
   * @param {string} univRegNo
   * @returns {Promise<boolean>}
   */
  static async existsByUnivRegNo(univRegNo) {
    const [rows] = await db.execute(
      'SELECT id FROM registrations WHERE univ_reg_no = ? LIMIT 1',
      [univRegNo]
    );
    return rows.length > 0;
  }

  /**
   * Check if Aadhaar Number already exists
   * @param {string} aadhaarNumber
   * @returns {Promise<boolean>}
   */
  static async existsByAadhaar(aadhaarNumber) {
    const [rows] = await db.execute(
      'SELECT id FROM registrations WHERE aadhaar_number = ? LIMIT 1',
      [aadhaarNumber]
    );
    return rows.length > 0;
  }

  /**
   * Find a single registration record by primary key ID
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  static async findById(id) {
    const [rows] = await db.execute(
      'SELECT * FROM registrations WHERE id = ? LIMIT 1',
      [id]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Find a single registration record by Registration ID (NSS-PU-YYYY-XXXX)
   * @param {string} registrationId
   * @returns {Promise<Object|null>}
   */
  static async findByRegistrationId(registrationId) {
    const [rows] = await db.execute(
      'SELECT * FROM registrations WHERE registration_id = ? LIMIT 1',
      [registrationId]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Get filtered, searched, and paginated list of registrations
   * @param {Object} filters
   * @returns {Promise<{registrations: Array, total: number}>}
   */
  static async findAll(filters = {}) {
    let query = 'SELECT * FROM registrations WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as total FROM registrations WHERE 1=1';
    const params = [];

    // Search filter (Name, Univ Reg No, Email, Registration ID)
    if (filters.search) {
      const searchTerm = `%${filters.search.trim()}%`;
      const searchSql = ` AND (
        applicant_name LIKE ? OR 
        univ_reg_no LIKE ? OR 
        email LIKE ? OR 
        registration_id LIKE ?
      )`;
      query += searchSql;
      countQuery += searchSql;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Unit filter
    if (filters.unit) {
      query += ' AND unit_number = ?';
      countQuery += ' AND unit_number = ?';
      params.push(filters.unit);
    }

    // Department filter
    if (filters.department) {
      query += ' AND department = ?';
      countQuery += ' AND department = ?';
      params.push(filters.department);
    }

    // Course filter
    if (filters.course) {
      query += ' AND course = ?';
      countQuery += ' AND course = ?';
      params.push(filters.course);
    }

    // Year filter
    if (filters.year) {
      query += ' AND year_of_study = ?';
      countQuery += ' AND year_of_study = ?';
      params.push(filters.year);
    }

    // Order By
    query += ' ORDER BY id DESC';

    // Pagination
    if (filters.limit) {
      const limit = parseInt(filters.limit, 10);
      const page = parseInt(filters.page, 10) || 1;
      const offset = (page - 1) * limit;

      query += ' LIMIT ? OFFSET ?';
      
      // Execute count query with current params
      const [countRows] = await db.execute(countQuery, params);
      const total = countRows[0].total;

      // Execute data query with pagination params appended
      const dataParams = [...params, limit, offset];
      const [rows] = await db.query(query, dataParams);

      return { registrations: rows, total };
    }

    // Unpaginated full query
    const [countRows] = await db.execute(countQuery, params);
    const total = countRows[0].total;
    const [rows] = await db.execute(query, params);

    return { registrations: rows, total };
  }

  /**
   * Get registration statistics for dashboard cards
   * @returns {Promise<Object>} Statistics summary
   */
  static async getDashboardStats() {
    // Total Registrations
    const [totalRows] = await db.execute(
      'SELECT COUNT(*) as total FROM registrations'
    );
    const totalRegistrations = totalRows[0].total;

    // Today's Registrations
    const [todayRows] = await db.execute(
      'SELECT COUNT(*) as today FROM registrations WHERE DATE(created_at) = CURDATE()'
    );
    const todayRegistrations = todayRows[0].today;

    // Unit-wise Count
    const [unitRows] = await db.execute(
      `SELECT unit_number, COUNT(*) as count 
       FROM registrations 
       GROUP BY unit_number 
       ORDER BY unit_number ASC`
    );

    const unitCounts = {
      'UNIT 1': 0,
      'UNIT 2': 0,
      'UNIT 5': 0,
      'UNIT 6': 0
    };

    unitRows.forEach((row) => {
      if (unitCounts.hasOwnProperty(row.unit_number)) {
        unitCounts[row.unit_number] = row.count;
      }
    });

    // Recent 5 registrations
    const [recentRows] = await db.execute(
      'SELECT id, registration_id, applicant_name, unit_number, department, course, created_at FROM registrations ORDER BY id DESC LIMIT 5'
    );

    return {
      totalRegistrations,
      todayRegistrations,
      unitCounts,
      recentRegistrations: recentRows
    };
  }
}

module.exports = RegistrationModel;