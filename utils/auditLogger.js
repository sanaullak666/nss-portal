const AuditModel = require('../models/auditModel');

async function logAudit(action, performedBy, details) {
  return AuditModel.log(action, performedBy, details);
}

module.exports = { logAudit };
