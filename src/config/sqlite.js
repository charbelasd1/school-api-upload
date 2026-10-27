// SQLite connection using Sequelize (an ORM for SQL databases).
// The whole database lives in a single file on disk (see SQLITE_STORAGE in .env).
const path = require('path');
const fs = require('fs');
const { Sequelize } = require('sequelize');

const storage = path.resolve(process.env.SQLITE_STORAGE || './data/audit.sqlite');
fs.mkdirSync(path.dirname(storage), { recursive: true });

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage,
  logging: false, // set to console.log to see the generated SQL statements
});

async function connectSQLite() {
  await sequelize.authenticate();
  // sync() creates the table if it does not exist (CREATE TABLE IF NOT EXISTS ...)
  await sequelize.sync();
  console.log(`SQLite connected -> ${storage}`);
}

module.exports = { sequelize, connectSQLite };
