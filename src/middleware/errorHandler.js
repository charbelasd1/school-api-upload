// Central error handler: turns every kind of error into a clean JSON response.
const mongoose = require('mongoose');
const { ValidationError: SequelizeValidationError } = require('sequelize');

function notFound(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Mongoose schema validation (required, min, max, match...)
  if (err instanceof mongoose.Error.ValidationError) {
    const errors = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }
  // Invalid ObjectId such as /api/students/123
  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({ error: `Invalid ${err.path}: ${err.value}` });
  }
  // MongoDB unique index violation (duplicate email / code)
  if (err.code === 11000) {
    return res.status(409).json({ error: 'Duplicate value', fields: err.keyValue });
  }
  // Sequelize validation (SQLite side)
  if (err instanceof SequelizeValidationError) {
    return res
      .status(400)
      .json({ error: 'Validation failed', details: err.errors.map((e) => e.message) });
  }
  // Malformed JSON body
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Malformed JSON body' });
  }

  const status = err.status || 500;
  if (status === 500) console.error(err);
  res.status(status).json({ error: err.message || 'Internal Server Error' });
}

module.exports = { notFound, errorHandler };
