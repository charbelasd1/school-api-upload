// Optional: fills both databases with sample data.  Run with:  npm run seed
require('dotenv').config();
const mongoose = require('mongoose');
const connectMongo = require('./config/mongo');
const { sequelize, connectSQLite } = require('./config/sqlite');
const Teacher = require('./models/mongo/Teacher');
const Course = require('./models/mongo/Course');
const Student = require('./models/mongo/Student');
const AuditLog = require('./models/sql/AuditLog');

async function seed() {
  await connectMongo(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/school_db');
  await connectSQLite();

  // Clear old data
  await Promise.all([Teacher.deleteMany({}), Course.deleteMany({}), Student.deleteMany({})]);
  await AuditLog.destroy({ where: {}, truncate: true });

  const [smith, haddad] = await Teacher.create([
    { name: 'John Smith', email: 'john.smith@school.edu', department: 'Computer Science' },
    { name: 'Rima Haddad', email: 'rima.haddad@school.edu', department: 'Mathematics' },
  ]);

  const [web, db, calc] = await Course.create([
    { code: 'CSC456', title: 'Advanced Web Programming', credits: 3, teacher: smith._id },
    { code: 'CSC375', title: 'Database Systems', credits: 3, teacher: smith._id },
    { code: 'MTH201', title: 'Calculus III', credits: 4, teacher: haddad._id },
  ]);

  await Student.create([
    { firstName: 'Maya', lastName: 'Khoury', email: 'maya@student.edu', major: 'Computer Science', year: 3, courses: [web._id, db._id] },
    { firstName: 'Karim', lastName: 'Saad', email: 'karim@student.edu', major: 'Computer Science', year: 2, courses: [web._id, calc._id] },
    { firstName: 'Lea', lastName: 'Nassar', email: 'lea@student.edu', major: 'Mathematics', year: 1, courses: [calc._id] },
  ]);

  await AuditLog.create({ action: 'OTHER', entity: 'System', message: 'Database seeded' });

  console.log('Seed complete: 2 teachers, 3 courses, 3 students, 1 audit log');
  await mongoose.disconnect();
  await sequelize.close();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
