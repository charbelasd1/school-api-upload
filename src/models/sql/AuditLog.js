// AuditLog: the standalone SQL entity (SQLite via Sequelize).
// Every create/update/delete in the API writes a row here, and the table also has its own CRUD routes.
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/sqlite');

const AuditLog = sequelize.define(
  'AuditLog',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    action: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: {
          args: [['CREATE', 'UPDATE', 'DELETE', 'ENROLL', 'UNENROLL', 'OTHER']],
          msg: 'action must be one of CREATE, UPDATE, DELETE, ENROLL, UNENROLL, OTHER',
        },
      },
    },
    entity: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: { msg: 'entity is required' } },
    },
    entityId: { type: DataTypes.STRING, allowNull: true },
    message: { type: DataTypes.STRING, allowNull: true },
    // SQLite has no JSON column type; Sequelize stores JSON as TEXT and parses it back for us
    details: { type: DataTypes.JSON, allowNull: true },
  },
  {
    tableName: 'audit_logs',
    timestamps: true, // createdAt / updatedAt columns
  }
);

module.exports = AuditLog;
