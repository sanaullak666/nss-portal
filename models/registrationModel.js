const db = require('../config/database');
const fs = require('fs');
const path = require('path');

class RegistrationModel {
  static async create(data) {
    const insertQuery = `
      INSERT INTO registrations (
        registration_id, unit_number, department, course, year_of_study,
        applicant_name, univ_reg_no, email, contact_number, alt_contact_number,
        gender, dob, age, blood_group, aadhaar_number, native_state,
        present_address, permanent_address, is_same_address, languages_spoken,
        is_previous_volunteer, certificate_path, certificate_data, certificate_mimetype, interested_in_media, media_roles,
        extra_curricular_skills, interested_in_leadership,
        declaration_accepted, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active')
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
      typeof data.languages_spoken === 'string' ? data.languages_spoken : JSON.stringify(data.languages_spoken || []),
      data.is_previous_volunteer,
      data.certificate_path || null,
      data.certificate_data || null,
      data.certificate_mimetype || null,
      data.interested_in_media || 'No',
      typeof data.media_roles === 'string' ? data.media_roles : JSON.stringify(data.media_roles || []),
      data.extra_curricular_skills ? data.extra_curricular_skills.trim() : null,
      data.interested_in_leadership || 'No',
      data.declaration_accepted ? 1 : 0
    ];

    const [result] = await db.query(insertQuery, values);
    return result.insertId;
  }

  static async findById(id) {
    const [rows] = await db.query('SELECT * FROM registrations WHERE id = ? LIMIT 1', [id]);
    return rows[0] || null;
  }

  static async findByRegistrationId(registrationId) {
    if (!registrationId) return null;
    const cleanId = registrationId.trim();
    const [rows] = await db.query(
      'SELECT * FROM registrations WHERE registration_id = ? OR LOWER(registration_id) = LOWER(?) LIMIT 1',
      [cleanId, cleanId]
    );
    return rows[0] || null;
  }

  static async findByUnivRegNo(univRegNo, excludeId = null) {
    if (!univRegNo) return null;
    let sql = "SELECT * FROM registrations WHERE univ_reg_no = ? AND status = 'Active'";
    const params = [univRegNo.trim().toUpperCase()];
    if (excludeId) {
      sql += ' AND id != ?';
      params.push(excludeId);
    }
    sql += ' LIMIT 1';
    const [rows] = await db.query(sql, params);
    return rows[0] || null;
  }

  static async findByEmail(email, excludeId = null) {
    if (!email) return null;
    let sql = "SELECT * FROM registrations WHERE email = ? AND status = 'Active'";
    const params = [email.trim().toLowerCase()];
    if (excludeId) {
      sql += ' AND id != ?';
      params.push(excludeId);
    }
    sql += ' LIMIT 1';
    const [rows] = await db.query(sql, params);
    return rows[0] || null;
  }

  static async findByAadhaar(aadhaarNumber, excludeId = null) {
    if (!aadhaarNumber) return null;
    let sql = "SELECT * FROM registrations WHERE aadhaar_number = ? AND status = 'Active'";
    const params = [aadhaarNumber.trim()];
    if (excludeId) {
      sql += ' AND id != ?';
      params.push(excludeId);
    }
    sql += ' LIMIT 1';
    const [rows] = await db.query(sql, params);
    return rows[0] || null;
  }

  static async searchActive(query) {
    const q = query.trim();
    const [rows] = await db.query(
      `SELECT * FROM registrations 
       WHERE (registration_id = ? OR univ_reg_no = ? OR email = ? OR contact_number = ? OR aadhaar_number = ?)
         AND status IN ('Active', 'Selected', 'Rejected') 
       LIMIT 1`,
      [q, q, q, q, q]
    );
    return rows[0] || null;
  }

  static async updateStatus(id, newStatus) {
    if (!['Active', 'Selected', 'Rejected'].includes(newStatus)) return false;
    const [result] = await db.query("UPDATE registrations SET status = ? WHERE id = ?", [newStatus, id]);
    return result.affectedRows > 0;
  }

  static async update(id, data) {
    const query = `
      UPDATE registrations SET
        applicant_name = ?,
        univ_reg_no = ?,
        email = ?,
        contact_number = ?,
        alt_contact_number = ?,
        department = ?,
        course = ?,
        year_of_study = ?,
        unit_number = ?,
        gender = ?,
        dob = ?,
        age = ?,
        blood_group = ?,
        aadhaar_number = ?,
        native_state = ?,
        present_address = ?,
        permanent_address = ?,
        languages_spoken = ?,
        is_previous_volunteer = ?,
        interested_in_media = ?,
        media_roles = ?,
        extra_curricular_skills = ?,
        interested_in_leadership = ?
      WHERE id = ?
    `;

    const values = [
      data.applicant_name,
      data.univ_reg_no,
      data.email,
      data.contact_number,
      data.alt_contact_number || null,
      data.department,
      data.course,
      data.year_of_study,
      data.unit_number,
      data.gender,
      data.dob,
      data.age,
      data.blood_group,
      data.aadhaar_number,
      data.native_state,
      data.present_address,
      data.permanent_address,
      typeof data.languages_spoken === 'string' ? data.languages_spoken : JSON.stringify(data.languages_spoken || []),
      data.is_previous_volunteer,
      data.interested_in_media || 'No',
      typeof data.media_roles === 'string' ? data.media_roles : JSON.stringify(data.media_roles || []),
      data.extra_curricular_skills ? data.extra_curricular_skills.trim() : null,
      data.interested_in_leadership || 'No',
      id
    ];

    const [result] = await db.query(query, values);
    return result.affectedRows > 0;
  }

  static async softDelete(id) {
    return await this.hardDelete(id);
  }

  static async hardDelete(id) {
    const registration = await this.findById(id);
    if (registration && registration.certificate_path) {
      const os = require('os');
      const localPath = path.join(__dirname, '../uploads', registration.certificate_path);
      const tmpPath = path.join(os.tmpdir(), registration.certificate_path);
      try {
        if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
      } catch (e) {}
      try {
        if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
      } catch (e) {}
    }
    const [result] = await db.query('DELETE FROM registrations WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  static async findAllFiltered({ statusFilter, unit, department, course, year_of_study, gender, is_previous_volunteer, interested_in_media, search, page = 1, limit = 15 }) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 15);
    const offset = (pageNum - 1) * limitNum;
    let whereClauses = [];
    let queryParams = [];

    if (statusFilter && ['Active', 'Selected', 'Rejected'].includes(statusFilter)) {
      whereClauses.push('status = ?');
      queryParams.push(statusFilter);
    } else {
      whereClauses.push("status IN ('Active', 'Selected', 'Rejected')");
    }

    if (unit) { whereClauses.push('unit_number = ?'); queryParams.push(unit); }
    if (department) { whereClauses.push('department = ?'); queryParams.push(department); }
    if (course) { whereClauses.push('course = ?'); queryParams.push(course); }
    if (year_of_study) { whereClauses.push('year_of_study = ?'); queryParams.push(year_of_study); }
    if (gender) { whereClauses.push('gender = ?'); queryParams.push(gender); }
    if (is_previous_volunteer) { whereClauses.push('is_previous_volunteer = ?'); queryParams.push(is_previous_volunteer); }
    if (interested_in_media) { whereClauses.push('interested_in_media = ?'); queryParams.push(interested_in_media); }

    if (search && search.trim()) {
      whereClauses.push('(applicant_name LIKE ? OR univ_reg_no LIKE ? OR registration_id LIKE ? OR email LIKE ? OR contact_number LIKE ? OR aadhaar_number LIKE ? OR department LIKE ? OR extra_curricular_skills LIKE ?)');
      const term = `%${search.trim()}%`;
      queryParams.push(term, term, term, term, term, term, term, term);
    }

    const whereSQL = `WHERE ${whereClauses.join(' AND ')}`;

    const [countRows] = await db.query(`SELECT COUNT(*) as "totalCount" FROM registrations ${whereSQL}`, queryParams);
    const totalCount = parseInt(countRows[0]?.totalCount || countRows[0]?.totalcount || 0, 10);
    const [registrations] = await db.query(`SELECT * FROM registrations ${whereSQL} ORDER BY created_at ASC, id ASC LIMIT ? OFFSET ?`, [...queryParams, limitNum, offset]);

    return {
      registrations,
      totalCount,
      totalPages: Math.ceil(totalCount / limitNum) || 1,
      currentPage: pageNum
    };
  }

  static async findForSelectionFiltered({ selectionStatus, unit, department, course, search, page = 1, limit = 15 }) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 15);
    const offset = (pageNum - 1) * limitNum;

    let whereClauses = [];
    let queryParams = [];

    if (selectionStatus && ['Active', 'Selected', 'Rejected'].includes(selectionStatus)) {
      whereClauses.push('status = ?');
      queryParams.push(selectionStatus);
    } else {
      whereClauses.push("status IN ('Active', 'Selected', 'Rejected')");
    }

    if (unit) { whereClauses.push('unit_number = ?'); queryParams.push(unit); }
    if (department) { whereClauses.push('department = ?'); queryParams.push(department); }
    if (course) { whereClauses.push('course = ?'); queryParams.push(course); }

    if (search && search.trim()) {
      whereClauses.push('(applicant_name LIKE ? OR univ_reg_no LIKE ? OR registration_id LIKE ? OR email LIKE ? OR contact_number LIKE ? OR department LIKE ?)');
      const term = `%${search.trim()}%`;
      queryParams.push(term, term, term, term, term, term);
    }

    const whereSQL = `WHERE ${whereClauses.join(' AND ')}`;

    const [countRows] = await db.query(`SELECT COUNT(*) as "totalCount" FROM registrations ${whereSQL}`, queryParams);
    const totalCount = parseInt(countRows[0]?.totalCount || countRows[0]?.totalcount || 0, 10);
    const [registrations] = await db.query(`SELECT * FROM registrations ${whereSQL} ORDER BY created_at ASC, id ASC LIMIT ? OFFSET ?`, [...queryParams, limitNum, offset]);

    let unitWhereClause = unit ? ' AND unit_number = ?' : '';
    let unitParams = unit ? [unit] : [];

    const [selectedRows] = await db.query(`SELECT COUNT(*) as count FROM registrations WHERE status = 'Selected'${unitWhereClause}`, unitParams);
    const [rejectedRows] = await db.query(`SELECT COUNT(*) as count FROM registrations WHERE status = 'Rejected'${unitWhereClause}`, unitParams);
    const [activeRows] = await db.query(`SELECT COUNT(*) as count FROM registrations WHERE status = 'Active'${unitWhereClause}`, unitParams);

    return {
      registrations,
      totalCount,
      totalPages: Math.ceil(totalCount / limitNum) || 1,
      currentPage: pageNum,
      selectionStats: {
        totalSelected: parseInt(selectedRows[0]?.count || 0, 10),
        totalRejected: parseInt(rejectedRows[0]?.count || 0, 10),
        totalActive: parseInt(activeRows[0]?.count || 0, 10)
      }
    };
  }

  static async getAllForExport() {
    const [registrations] = await db.query("SELECT * FROM registrations WHERE status IN ('Active', 'Selected', 'Rejected') ORDER BY created_at ASC, id ASC");
    return registrations;
  }

  static async getSelectedForExport() {
    const [registrations] = await db.query("SELECT * FROM registrations WHERE status = 'Selected' ORDER BY created_at ASC, id ASC");
    return registrations;
  }

  static async getDashboardStats() {
    const [r1] = await db.query("SELECT COUNT(*) as \"totalRegistrations\" FROM registrations WHERE status IN ('Active', 'Selected')");
    const [r2] = await db.query("SELECT COUNT(*) as \"todayRegistrations\" FROM registrations WHERE status IN ('Active', 'Selected') AND DATE(created_at) = CURRENT_DATE");
    const [r3] = await db.query("SELECT COUNT(DISTINCT unit_number) as \"totalUnits\" FROM registrations WHERE status IN ('Active', 'Selected')");
    const [r4] = await db.query("SELECT COUNT(*) as \"totalMediaInterested\" FROM registrations WHERE status IN ('Active', 'Selected') AND interested_in_media = 'Yes'");
    const [r5] = await db.query("SELECT COUNT(*) as \"totalPreviousVolunteers\" FROM registrations WHERE status IN ('Active', 'Selected') AND is_previous_volunteer = 'Yes'");
    const [r6] = await db.query("SELECT COUNT(*) as \"totalLeadershipInterested\" FROM registrations WHERE status IN ('Active', 'Selected') AND interested_in_leadership = 'Yes'");

    const totalRegistrations = parseInt(r1[0]?.totalRegistrations || r1[0]?.totalregistrations || 0, 10);
    const todayRegistrations = parseInt(r2[0]?.todayRegistrations || r2[0]?.todayregistrations || 0, 10);
    const totalUnits = parseInt(r3[0]?.totalUnits || r3[0]?.totalunits || 0, 10);
    const totalMediaInterested = parseInt(r4[0]?.totalMediaInterested || r4[0]?.totalmediainterested || 0, 10);
    const totalPreviousVolunteers = parseInt(r5[0]?.totalPreviousVolunteers || r5[0]?.totalpreviousvolunteers || 0, 10);
    const totalLeadershipInterested = parseInt(r6[0]?.totalLeadershipInterested || r6[0]?.totalleadershipinterested || 0, 10);

    const [unitCounts] = await db.query("SELECT unit_number, COUNT(*) as count FROM registrations WHERE status IN ('Active', 'Selected') GROUP BY unit_number ORDER BY unit_number");
    const [genderCounts] = await db.query("SELECT gender, COUNT(*) as count FROM registrations WHERE status IN ('Active', 'Selected') GROUP BY gender");
    const [yearCounts] = await db.query("SELECT year_of_study, COUNT(*) as count FROM registrations WHERE status IN ('Active', 'Selected') GROUP BY year_of_study");
    const [courseCounts] = await db.query("SELECT course, COUNT(*) as count FROM registrations WHERE status IN ('Active', 'Selected') GROUP BY course ORDER BY count DESC LIMIT 10");
    const [deptCounts] = await db.query("SELECT department, COUNT(*) as count FROM registrations WHERE status IN ('Active', 'Selected') GROUP BY department ORDER BY count DESC LIMIT 10");
    const [recentRegistrations] = await db.query("SELECT * FROM registrations WHERE status IN ('Active', 'Selected', 'Rejected') ORDER BY created_at DESC, id DESC LIMIT 5");

    const [selectedRows] = await db.query("SELECT COUNT(*) as count FROM registrations WHERE status = 'Selected'");
    const [rejectedRows] = await db.query("SELECT COUNT(*) as count FROM registrations WHERE status = 'Rejected'");
    const [activeRows] = await db.query("SELECT COUNT(*) as count FROM registrations WHERE status = 'Active'");

    return {
      stats: {
        totalRegistrations,
        todayRegistrations,
        totalUnits,
        totalMediaInterested,
        totalPreviousVolunteers,
        totalLeadershipInterested
      },
      chartData: {
        unitCounts,
        genderCounts,
        yearCounts,
        courseCounts,
        deptCounts
      },
      recentRegistrations,
      selectionStats: {
        totalSelected: parseInt(selectedRows[0]?.count || 0, 10),
        totalRejected: parseInt(rejectedRows[0]?.count || 0, 10),
        totalActive: parseInt(activeRows[0]?.count || 0, 10)
      }
    };
  }
}

module.exports = RegistrationModel;


