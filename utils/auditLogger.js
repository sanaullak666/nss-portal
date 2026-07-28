const db = require('../config/database');

async function logAudit(action, performedBy, details) {
  try {
    await db.query(
      'INSERT INTO audit_logs (action, performed_by, details) VALUES (?, ?, ?)',
      [action, performedBy || 'System', typeof details === 'object' ? JSON.stringify(details) : details]
    );
  } catch (err) {
    console.error('Audit Log Error:', err);
  }
}

module.exports = { logAudit };
