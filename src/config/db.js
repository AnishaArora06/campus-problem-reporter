const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set in environment');

  mongoose.set('strictQuery', true);

  await mongoose.connect(uri, {
    // Keep options minimal; Mongoose 8 sets sensible defaults
  });

  console.log('MongoDB connected');
  return mongoose.connection;
}

module.exports = connectDB;
