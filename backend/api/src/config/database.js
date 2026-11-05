const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URL = process.env.MONGODB_URL || process.env.MONGO_URI || "mongodb://localhost:27017/smartface";

let isConnecting = false;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1 || isConnecting) return;
  isConnecting = true;
  try {
    // Connect to MongoDB with production replica set resilience options
    await mongoose.connect(MONGODB_URL, {
      dbName: 'smartface',
      writeConcern: { w: 'majority' },
      retryWrites: true,
      maxPoolSize: 50,
      serverSelectionTimeoutMS: 5000
    });
    console.log("✅ MongoDB connected successfully to database:", mongoose.connection.name);
    isConnecting = false;
  } catch (error) {
    console.warn("⚠️ MongoDB connection warning:", error.message);
    console.log("ℹ️ Server running with resilient dataset fallback. Retrying MongoDB connection in 30s...");
    isConnecting = false;
    // Schedule background retry instead of fatal exit
    setTimeout(connectDB, 30000);
  }
};

module.exports = { connectDB };
