// CRUD for the SQLite AuditLog table using Sequelize.
const { Op } = require('sequelize');
const AuditLog = require('../models/sql/AuditLog');
const ApiError = require('../utils/ApiError');

// POST /api/audit-logs  (manual entry, e.g. a note from an admin)
exports.createLog = async (req, res) => {
  const { action, entity, entityId, message, details } = req.body;
  const log = await AuditLog.create({ action, entity, entityId, message, details });
  res.status(201).json(log);
};

// GET /api/audit-logs
// Optional filters -> translated by Sequelize into a SQL WHERE clause:
//   ?entity=Student&action=CREATE&search=enrolled&from=2026-01-01&to=2026-12-31&limit=20&page=1
exports.getLogs = async (req, res) => {
  const { entity, action, entityId, search, from, to } = req.query;
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const page = Math.max(Number(req.query.page) || 1, 1);

  const where = {};
  if (entity) where.entity = entity;
  if (action) where.action = action.toUpperCase();
  if (entityId) where.entityId = entityId;
  if (search) where.message = { [Op.like]: `%${search}%` };
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt[Op.gte] = new Date(from);
    if (to) where.createdAt[Op.lte] = new Date(to);
  }

  // findAndCountAll -> SELECT ... LIMIT/OFFSET  +  SELECT COUNT(*)
  const { count, rows } = await AuditLog.findAndCountAll({
    where,
    order: [['createdAt', 'DESC']],
    limit,
    offset: (page - 1) * limit,
  });

  res.json({ total: count, page, limit, data: rows });
};

// GET /api/audit-logs/stats  -> GROUP BY example (count of logs per entity and action)
exports.getStats = async (req, res) => {
  const { sequelize } = AuditLog;
  const stats = await AuditLog.findAll({
    attributes: ['entity', 'action', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
    group: ['entity', 'action'],
    order: [['entity', 'ASC'], ['action', 'ASC']],
    raw: true,
  });
  res.json(stats);
};

// GET /api/audit-logs/:id
exports.getLogById = async (req, res) => {
  const log = await AuditLog.findByPk(req.params.id);
  if (!log) throw new ApiError(404, 'Audit log not found');
  res.json(log);
};

// PUT /api/audit-logs/:id
exports.updateLog = async (req, res) => {
  const log = await AuditLog.findByPk(req.params.id);
  if (!log) throw new ApiError(404, 'Audit log not found');
  // Only update the fields that were actually sent (partial update)
  const allowed = ['action', 'entity', 'entityId', 'message', 'details'];
  const changes = {};
  for (const key of allowed) if (req.body[key] !== undefined) changes[key] = req.body[key];
  await log.update(changes); // UPDATE audit_logs SET ... WHERE id = ?
  res.json(log);
};

// DELETE /api/audit-logs/:id
exports.deleteLog = async (req, res) => {
  const deleted = await AuditLog.destroy({ where: { id: req.params.id } }); // DELETE FROM ...
  if (!deleted) throw new ApiError(404, 'Audit log not found');
  res.json({ message: 'Audit log deleted', id: Number(req.params.id) });
};
