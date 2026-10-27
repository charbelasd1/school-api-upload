// Entry point: load env vars, connect BOTH databases, then start listening.
require('dotenv').config();

const app = require('./app');
const connectMongo = require('./config/mongo');
const { connectSQLite } = require('./config/sqlite');

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/school_db';

async function start() {
  try {
    await connectMongo(MONGO_URI);
    await connectSQLite();
    app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
  } catch (err) {
    console.error('Failed to start:', err.message);
    process.exit(1);
  }
}

start();
