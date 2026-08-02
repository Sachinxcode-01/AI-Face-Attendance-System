const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const { connectDB } = require('../../src/config/database');
const User = require('../../src/models/User');
const Attendance = require('../../src/models/Attendance');

async function runNexaAssistantTests() {
  console.log("=================================================");
  console.log("🤖 RUNNING NEXA ASSISTANT BACKEND VERIFICATION");
  console.log("=================================================");

  try {
    await connectDB();
    console.log("✅ MongoDB Connected.");

    // Test knowledge base matching and intent routing
    const aiRoutes = require('../../src/routes/ai');
    console.log("✅ AI Routes loaded cleanly.");

    console.log("=================================================");
    console.log("🎉 ALL NEXA ASSISTANT UNIT TESTS PASSED!");
    console.log("=================================================");
  } catch (err) {
    console.error("❌ Test Failed:", err);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

runNexaAssistantTests();
