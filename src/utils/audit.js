// Helper that writes a row to the SQLite AuditLog table.
// A logging failure should never break the main request, so errors are only printed.
const AuditLog = require('../models/sql/AuditLog');

async function logAction(action, entity, entityId, message, details = null) {
  try {
    await AuditLog.create({
      action,
      entity,
      entityId: entityId ? String(entityId) : null,
      message,
      details,
    });
  } catch (err) {
    console.error('Audit log failed:', err.message);
  }
}

module.exports = logAction;
