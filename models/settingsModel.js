const db = require('../config/database');

class SettingsModel {
  static async getSetting(key, defaultValue = null) {
    try {
      const [rows] = await db.query('SELECT value FROM portal_settings WHERE key = ? LIMIT 1', [key]);
      if (rows && rows.length > 0) {
        return rows[0].value;
      }
      return defaultValue;
    } catch (err) {
      console.error('Get setting DB error:', err.message);
      return defaultValue;
    }
  }

  static async setSetting(key, value) {
    const valStr = String(value);
    try {
      const [result] = await db.query(
        'UPDATE portal_settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?',
        [valStr, key]
      );
      if (!result || result.affectedRows === 0) {
        await db.query('INSERT INTO portal_settings (key, value) VALUES (?, ?)', [key, valStr]);
      }
      return true;
    } catch (err) {
      console.error('Failed to set portal setting:', err.message);
      try {
        await db.query(`
          CREATE TABLE IF NOT EXISTS portal_settings (
            id SERIAL,
            key VARCHAR(50) UNIQUE NOT NULL,
            value TEXT NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `);
        await db.query('INSERT INTO portal_settings (key, value) VALUES (?, ?)', [key, valStr]);
        return true;
      } catch (e2) {
        return false;
      }
    }
  }

  static async isAcceptingRegistrations() {
    const val = await this.getSetting('accepting_registrations', 'true');
    return val === 'true' || val === '1' || val === true;
  }

  static async setAcceptingRegistrations(status) {
    const boolVal = status === true || status === 'true' || status === '1' || status === 1;
    return await this.setSetting('accepting_registrations', boolVal ? 'true' : 'false');
  }
}

module.exports = SettingsModel;
