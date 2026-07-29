const db = require('../config/database');

class AuditModel {
  static async log(action, performedBy, details) {
    try {
      const detailsStr = typeof details === 'object' ? JSON.stringify(details) : details;
      await db.query(
        'INSERT INTO audit_logs (action, performed_by, details) VALUES (?, ?, ?)',
        [action, performedBy || 'System', detailsStr]
      );
    } catch (err) {
      console.error('Audit Log DB Error:', err.message);
    }
  }

  static async getRecentLogs(limit = 20) {
    const [rows] = await db.query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ?', [limit]);
    return rows;
  }
}

module.exports = AuditModel;
