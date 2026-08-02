const { spawn } = require('child_process');
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { awaitPendingJobs } = require('../src/utils/jobTracker');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });
process.env.NODE_ENV = 'test';

const MONGODB_URL = process.env.MONGODB_URL;
const PORT = 8000;

const unitTests = [
  'tests/unit/test_google_photo.js',
  'tests/unit/test_profile_photo.js',
  'tests/unit/test_otp.js',
  'tests/unit/test_reset_password.js',
  'tests/unit/test_email_templates.js',
  'tests/unit/test_security_controls.js',
  'tests/unit/test_face_attendance_gateway.js'
];

const integrationTests = [
  'tests/integration/run_validation.js',
  'tests/integration/run_academic_validation.js',
  'tests/integration/run_attendance_intel_validation.js',
  'tests/integration/run_ai_validation.js',
  'tests/integration/run_analytics_validation.js',
  'tests/integration/run_calendar_validation.js',
  'tests/integration/run_notification_validation.js'
];

function runScript(scriptPath, env = {}) {
  return new Promise((resolve) => {
    console.log(`\n🏃 Running: node ${scriptPath}`);
    const child = spawn(process.argv[0], [scriptPath], {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
      env: { ...process.env, ...env }
    });

    child.on('close', (code) => {
      resolve(code === 0);
    });
  });
}

async function main() {
  console.log("====================================================");
  console.log("🚀 STARTING SMARTFACE BACKEND AUDIT TEST RUNNER");
  console.log("====================================================\n");

  let passed = true;

  // 1. Connect mongoose to database
  console.log("🔋 Connecting to MongoDB Cluster...");
  try {
    await mongoose.connect(MONGODB_URL, { dbName: 'smartface' });
    console.log("✅ MongoDB Connection Successful.");
  } catch (err) {
    console.error("❌ Database Connection Failed:", err.message);
    process.exit(1);
  }

  // 2. Spin up sandboxed server for unit tests in the same process
  console.log(`🔌 Initializing sandboxed Express server on port ${PORT}...`);
  const app = express();
  app.use(express.json());
  app.use('/auth', require('../src/routes/auth'));

  const server = app.listen(PORT);
  console.log("✅ Sandboxed server is online.\n");

  try {
    // 3. Run unit tests
    console.log("🧪 --- Running Unit Tests ---");
    for (const test of unitTests) {
      const success = await runScript(test);
      if (!success) {
        console.error(`❌ Unit test failed: ${test}`);
        passed = false;
      }
    }
  } finally {
    // 4. Close sandboxed server and disconnect mongoose
    console.log("\n🔌 Awaiting pending background jobs, closing sandboxed server and disconnecting DB...");
    await awaitPendingJobs();
    server.close();
    await mongoose.disconnect();
    console.log("✅ Server closed and DB disconnected.");
  }

  // 5. Run integration tests (each handles its own server and DB connection)
  console.log("\n🧪 --- Running Integration Tests ---");
  for (const test of integrationTests) {
    const success = await runScript(test);
    if (!success) {
      console.error(`❌ Integration test failed: ${test}`);
      passed = false;
    }
  }

  console.log("\n==========================================");
  if (passed) {
    console.log("🎉 ALL UNIT AND INTEGRITY AUDIT TESTS PASSED!");
    console.log("==========================================");
    process.exit(0);
  } else {
    console.error("❌ SOME TESTS FAILED. CHECK LOGS ABOVE.");
    console.log("==========================================");
    process.exit(1);
  }
}

main().catch(err => {
  console.error("Critical failure in test runner:", err);
  process.exit(1);
});
