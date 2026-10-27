// MongoDB connection using Mongoose
const mongoose = require('mongoose');

async function connectMongo(uri) {
  await mongoose.connect(uri);
  console.log(`MongoDB connected -> ${mongoose.connection.name}`);
}

module.exports = connectMongo;
