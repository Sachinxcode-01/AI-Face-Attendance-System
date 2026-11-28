const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URL = process.env.MONGODB_URL || process.env.MONGO_URI || "mongodb://localhost:27017/smartface";
const POOL_MAX = Math.max(5, parseInt(process.env.DATABASE_POOL_MAX || '50', 10) || 50);
const POOL_MIN = Math.max(0, parseInt(process.env.DATABASE_POOL_MIN || '5', 10) || 5);
const CONNECT_TIMEOUT_MS = Math.max(1000, parseInt(process.env.DATABASE_CONNECTION_TIMEOUT || '5000', 10) || 5000);
const SOCKET_TIMEOUT_MS = Math.max(2000, parseInt(process.env.DATABASE_QUERY_TIMEOUT || '15000', 10) || 15000);

let isConnecting = false;
let retryTimer = null;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1 || isConnecting) return;
  isConnecting = true;
  try {
    // Connect to MongoDB with production replica set resilience & bounded pool options
    await mongoose.connect(MONGODB_URL, {
      dbName: process.env.DATABASE_NAME || 'smartface',
      writeConcern: { w: 'majority' },
      retryWrites: true,
      maxPoolSize: POOL_MAX,
      minPoolSize: POOL_MIN,
      maxIdleTimeMS: 60000,
      serverSelectionTimeoutMS: CONNECT_TIMEOUT_MS,
      connectTimeoutMS: CONNECT_TIMEOUT_MS,
      socketTimeoutMS: SOCKET_TIMEOUT_MS,
    });
    console.log("✅ MongoDB connected successfully to database:", mongoose.connection.name);
    isConnecting = false;
  } catch (error) {
    console.warn("⚠️ MongoDB connection warning:", error.message);
    console.log("ℹ️ Server running with resilient dataset fallback. Retrying MongoDB connection in 30s...");
    isConnecting = false;
    if (!retryTimer) {
      retryTimer = setTimeout(() => {
        retryTimer = null;
        connectDB();
      }, 30000);
      if (retryTimer.unref) retryTimer.unref();
    }
  }
};

const disconnectDB = async () => {
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
};

module.exports = { connectDB, disconnectDB };
