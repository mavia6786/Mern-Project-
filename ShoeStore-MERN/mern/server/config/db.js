const mongoose = require('mongoose');

const MAX_RETRIES = 5;
const BASE_DELAY = 2000; // ms

async function connectDB(attempt = 1) {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/shoestoredb';
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log('MongoDB connected:', uri);
  } catch (err) {
    console.error(`MongoDB connection error (attempt ${attempt}/${MAX_RETRIES}):`, err.message);
    if (attempt < MAX_RETRIES) {
      const delay = BASE_DELAY * Math.pow(2, attempt - 1);
      console.log(`Retrying in ${delay / 1000}s...`);
      await new Promise((r) => setTimeout(r, delay));
      return connectDB(attempt + 1);
    }
    console.error('All connection attempts failed. Server will stay running — fix your connection and restart.');
  }
}

module.exports = connectDB;
