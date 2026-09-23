const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI is not set in the environment');
  }

  mongoose.set('strictQuery', true);

  await mongoose.connect(uri, {
    // Sensible defaults for production-style connections.
    maxPoolSize: 50, // supports many concurrent requests without opening a connection per request
    serverSelectionTimeoutMS: 10000,
  });

  console.log(`[db] connected to MongoDB (${mongoose.connection.name})`);

  mongoose.connection.on('error', (err) => {
    console.error('[db] connection error:', err);
  });
}

module.exports = connectDB;
