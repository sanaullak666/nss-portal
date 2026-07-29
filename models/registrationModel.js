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
        is_previous_volunteer, certificate_path, interested_in_media, media_roles,
        extra_curricular_skills, interested_in_leadership,
        declaration_accepted, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active')
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
    const [rows] = await db.query('SELECT * FROM registrations WHERE registration_id = ? LIMIT 1', [registrationId]);
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
         AND status = 'Active' 
       LIMIT 1`,
      [q, q, q, q, q]
    );
    return rows[0] || null;
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
      const filePath = path.join(__dirname, '../uploads', registration.certificate_path);
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (e) {}
      }
    }
    const [result] = await db.query('DELETE FROM registrations WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  static async findAllFiltered({ unit, department, course, year_of_study, gender, is_previous_volunteer, interested_in_media, search, page = 1, limit = 15 }) {
    const offset = (parseInt(page, 10) - 1) * limit;
    let whereClauses = ["status = 'Active'"];
    let queryParams = [];

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

    const [[{ totalCount }]] = await db.query(`SELECT COUNT(*) as totalCount FROM registrations ${whereSQL}`, queryParams);
    const [registrations] = await db.query(`SELECT * FROM registrations ${whereSQL} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...queryParams, limit, offset]);

    return {
      registrations,
      totalCount,
      totalPages: Math.ceil(totalCount / limit) || 1,
      currentPage: parseInt(page, 10)
    };
  }

  static async getAllForExport() {
    const [registrations] = await db.query('SELECT * FROM registrations WHERE status = "Active" ORDER BY created_at DESC');
    return registrations;
  }

  static async getDashboardStats() {
    const [[{ totalRegistrations }]] = await db.query('SELECT COUNT(*) as totalRegistrations FROM registrations WHERE status = "Active"');
    const [[{ todayRegistrations }]] = await db.query('SELECT COUNT(*) as todayRegistrations FROM registrations WHERE status = "Active" AND DATE(created_at) = CURDATE()');
    const [[{ totalUnits }]] = await db.query('SELECT COUNT(DISTINCT unit_number) as totalUnits FROM registrations WHERE status = "Active"');
    const [[{ totalMediaInterested }]] = await db.query('SELECT COUNT(*) as totalMediaInterested FROM registrations WHERE status = "Active" AND interested_in_media = "Yes"');
    const [[{ totalPreviousVolunteers }]] = await db.query('SELECT COUNT(*) as totalPreviousVolunteers FROM registrations WHERE status = "Active" AND is_previous_volunteer = "Yes"');
    const [[{ totalLeadershipInterested }]] = await db.query('SELECT COUNT(*) as totalLeadershipInterested FROM registrations WHERE status = "Active" AND interested_in_leadership = "Yes"');

    const [unitCounts] = await db.query('SELECT unit_number, COUNT(*) as count FROM registrations WHERE status = "Active" GROUP BY unit_number ORDER BY unit_number');
    const [genderCounts] = await db.query('SELECT gender, COUNT(*) as count FROM registrations WHERE status = "Active" GROUP BY gender');
    const [yearCounts] = await db.query('SELECT year_of_study, COUNT(*) as count FROM registrations WHERE status = "Active" GROUP BY year_of_study');
    const [courseCounts] = await db.query('SELECT course, COUNT(*) as count FROM registrations WHERE status = "Active" GROUP BY course ORDER BY count DESC LIMIT 10');
    const [deptCounts] = await db.query('SELECT department, COUNT(*) as count FROM registrations WHERE status = "Active" GROUP BY department ORDER BY count DESC LIMIT 10');
    const [recentRegistrations] = await db.query('SELECT * FROM registrations WHERE status = "Active" ORDER BY created_at DESC LIMIT 5');

    return {
      stats: { totalRegistrations, todayRegistrations, totalUnits, totalMediaInterested, totalPreviousVolunteers, totalLeadershipInterested },
      chartData: { unitCounts, genderCounts, yearCounts, courseCounts, deptCounts },
      recentRegistrations
    };
  }
}

module.exports = RegistrationModel;
