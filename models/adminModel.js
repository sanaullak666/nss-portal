const db = require('../config/database');

class AdminModel {
  static async findByUsernameOrEmail(identifier) {
    const clean = identifier.trim();
    const [rows] = await db.query(
      'SELECT * FROM admins WHERE username = ? OR email = ? LIMIT 1',
      [clean, clean]
    );
    return rows[0] || null;
  }

  static async updateLastLogin(id) {
    await db.query('UPDATE admins SET last_login = NOW() WHERE id = ?', [id]);
  }

  static async create({ username, password_hash, full_name, email, role = 'admin' }) {
    const query = `
      INSERT INTO admins (username, password_hash, full_name, email, role)
      VALUES (?, ?, ?, ?, ?)
    `;
    const [result] = await db.query(query, [username, password_hash, full_name, email, role]);
    return result.insertId;
  }

  static async findById(id) {
    const [rows] = await db.query('SELECT * FROM admins WHERE id = ? LIMIT 1', [id]);
    return rows[0] || null;
  }

  static async saveOTP(adminId, email, otpCode, expiresAt) {
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS admin_otps (
          id SERIAL PRIMARY KEY,
          admin_id INT NOT NULL,
          email VARCHAR(150) NOT NULL,
          otp_code VARCHAR(10) NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          used SMALLINT DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
    } catch (e) {}

    try {
      await db.query('UPDATE admin_otps SET used = 1 WHERE email = ? AND used = 0', [email.trim().toLowerCase()]);
    } catch (e) {}
    
    const query = `
      INSERT INTO admin_otps (admin_id, email, otp_code, expires_at, used)
      VALUES (?, ?, ?, ?, 0)
    `;
    const [result] = await db.query(query, [adminId, email.trim().toLowerCase(), otpCode, expiresAt]);
    return result ? result.insertId : null;
  }

  static async verifyOTP(email, otpCode) {
    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otpCode.trim();
    const [rows] = await db.query(
      `SELECT * FROM admin_otps 
       WHERE email = ? AND otp_code = ? AND used = 0 AND expires_at > CURRENT_TIMESTAMP 
       ORDER BY created_at DESC LIMIT 1`,
      [cleanEmail, cleanOtp]
    );
    return rows[0] || null;
  }

  static async markOTPUsed(otpId) {
    await db.query('UPDATE admin_otps SET used = 1 WHERE id = ?', [otpId]);
  }

  static async updatePassword(adminId, newPasswordHash) {
    const [result] = await db.query(
      'UPDATE admins SET password_hash = ? WHERE id = ?',
      [newPasswordHash, adminId]
    );
    return result.affectedRows > 0;
  }
}

module.exports = AdminModel;
