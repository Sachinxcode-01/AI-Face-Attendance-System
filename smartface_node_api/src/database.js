const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URL = process.env.MONGODB_URL || process.env.MONGO_URI || "mongodb://localhost:27017/smartface";

const connectDB = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URL, { dbName: 'smartface' });
    console.log("✅ MongoDB connected successfully to database:", mongoose.connection.name);
  } catch (error) {
    console.error("❌ Database connection error:", error.message);
    process.exit(1);
  }
};

module.exports = { connectDB };
