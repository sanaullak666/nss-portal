const db = require('../config/database');

class SettingsModel {
  static async initTable() {
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS portal_settings (
          id SERIAL,
          key VARCHAR(50) UNIQUE NOT NULL,
          value TEXT NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Ensure id column exists if table was previously created with key as primary key
      try {
        await db.query(`ALTER TABLE portal_settings ADD COLUMN IF NOT EXISTS id SERIAL;`);
      } catch (e) {}

      const [existing] = await db.query('SELECT value FROM portal_settings WHERE key = ? LIMIT 1', ['accepting_registrations']);
      if (!existing || existing.length === 0) {
        await db.query('INSERT INTO portal_settings (key, value) VALUES (?, ?)', ['accepting_registrations', 'true']);
      }
    } catch (err) {
      console.error('Settings table initialization error:', err.message);
    }
  }

  static async getSetting(key, defaultValue = null) {
    try {
      const [rows] = await db.query('SELECT value FROM portal_settings WHERE key = ? LIMIT 1', [key]);
      if (rows && rows.length > 0) {
        return rows[0].value;
      }
      return defaultValue;
    } catch (err) {
      await this.initTable();
      try {
        const [rows] = await db.query('SELECT value FROM portal_settings WHERE key = ? LIMIT 1', [key]);
        if (rows && rows.length > 0) {
          return rows[0].value;
        }
      } catch (e) {}
      return defaultValue;
    }
  }

  static async setSetting(key, value) {
    try {
      await this.initTable();
      const valStr = String(value);
      const [existing] = await db.query('SELECT value FROM portal_settings WHERE key = ? LIMIT 1', [key]);
      if (existing && existing.length > 0) {
        await db.query('UPDATE portal_settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?', [valStr, key]);
      } else {
        await db.query('INSERT INTO portal_settings (key, value) VALUES (?, ?)', [key, valStr]);
      }
      return true;
    } catch (err) {
      console.error('Failed to set portal setting:', err.message);
      return false;
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

// Automatically ensure table structure exists without touching existing tables
SettingsModel.initTable().catch(() => {});

module.exports = SettingsModel;
