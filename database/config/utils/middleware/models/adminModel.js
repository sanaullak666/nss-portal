/**
 * Admin Model
 * Handles data access and queries for administrator accounts and authentication.
 */

const db = require('../config/database');
const bcrypt = require('bcrypt');

class AdminModel {
  /**
   * Find an administrator by username
   * @param {string} username
   * @returns {Promise<Object|null>}
   */
  static async findByUsername(username) {
    const [rows] = await db.execute(
      'SELECT * FROM admins WHERE username = ? LIMIT 1',
      [username]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Find an administrator by primary key ID
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  static async findById(id) {
    const [rows] = await db.execute(
      'SELECT id, username, full_name, email, role, last_login, created_at FROM admins WHERE id = ? LIMIT 1',
      [id]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Validate admin password using bcrypt
   * @param {string} plainPassword
   * @param {string} hashedPassword
   * @returns {Promise<boolean>}
   */
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Update last login timestamp for an admin
   * @param {number} id
   * @returns {Promise<Object>}
   */
  static async updateLastLogin(id) {
    const [result] = await db.execute(
      'UPDATE admins SET last_login = NOW() WHERE id = ?',
      [id]
    );
    return result;
  }
}

module.exports = AdminModel;