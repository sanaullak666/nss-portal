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
}

module.exports = AdminModel;
