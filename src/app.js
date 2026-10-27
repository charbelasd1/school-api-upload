// Builds the Express application (middleware + routes). Kept separate from server.js
// so the app can be imported without starting the server or connecting to databases.
const express = require('express');
const morgan = require('morgan');

const teacherRoutes = require('./routes/teacherRoutes');
const courseRoutes = require('./routes/courseRoutes');
const studentRoutes = require('./routes/studentRoutes');
const auditLogRoutes = require('./routes/auditLogRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(express.json()); // parse JSON request bodies into req.body
app.use(morgan('dev')); // log every request: METHOD /url status time

// Health check / API index
app.get('/', (req, res) => {
  res.json({
    name: 'School Management API',
    endpoints: ['/api/teachers', '/api/courses', '/api/students', '/api/audit-logs'],
  });
});

// MongoDB (Mongoose) entities
app.use('/api/teachers', teacherRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/students', studentRoutes);

// SQLite (Sequelize) entity
app.use('/api/audit-logs', auditLogRoutes);

app.use(notFound); // any unmatched route -> 404
app.use(errorHandler); // every error ends up here

module.exports = app;
