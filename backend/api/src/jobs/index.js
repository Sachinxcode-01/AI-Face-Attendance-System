const cron = require('node-cron');
const Attendance = require('../models/Attendance');
const Session = require('../models/Session');
const Otp = require('../models/Otp');

function initScheduledJobs() {
  console.log('[Cron] Initializing background scheduled jobs...');

  // 1. Cleanup expired OTPs every hour
  cron.schedule('0 * * * *', async () => {
    try {
      const result = await Otp.deleteMany({ expires_at: { $lt: new Date() } });
      if (result.deletedCount > 0) {
        console.log(`[Cron] Cleaned up ${result.deletedCount} expired OTPs`);
      }
    } catch (err) {
      console.error('[Cron] OTP cleanup error:', err);
    }
  });

  // 2. Mark old unattended sessions as inactive at midnight
  cron.schedule('0 0 * * *', async () => {
    try {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const result = await Session.updateMany(
        { is_active: true, start_time: { $lt: yesterday } },
        { is_active: false }
      );
      if (result.modifiedCount > 0) {
        console.log(`[Cron] Deactivated ${result.modifiedCount} lingering sessions`);
      }
    } catch (err) {
      console.error('[Cron] Session cleanup error:', err);
    }
  });
}

module.exports = { initScheduledJobs };
