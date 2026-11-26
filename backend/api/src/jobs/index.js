const cron = require('node-cron');
const Attendance = require('../models/Attendance');
const Session = require('../models/Session');
const Otp = require('../models/Otp');
const Announcement = require('../models/Announcement');
const AttendanceAuditLog = require('../models/AttendanceAuditLog');
const teacherService = require('../services/teacherService');

async function processDueScheduledAnnouncements(now = new Date()) {
  const candidates = await Announcement.find({
    status: 'scheduled',
    scheduled_for: { $lte: now },
  }).select('_id').limit(20).lean();

  let processed = 0;
  for (const cand of candidates) {
    const claimed = await Announcement.findOneAndUpdate(
      { _id: cand._id, status: 'scheduled', scheduled_for: { $lte: now } },
      { $set: { status: 'published', published_at: now, updated_at: now } },
      { new: true }
    );
    if (!claimed) continue;

    const ctx = await teacherService.resolveTeacherContext(claimed.author_email);
    if (ctx) {
      await teacherService.deliverAnnouncement(claimed, ctx);
    }
    await AttendanceAuditLog.create({
      actor_email: claimed.author_email,
      college_id: claimed.college_id,
      role: 'teacher',
      action: 'ANNOUNCEMENT_PUBLISHED',
      target_resource: `announcement:${claimed._id.toString()}`,
      details: {
        status: 'published',
        scheduled: true,
        scope: claimed.target_scope,
        recipients: claimed.delivery_stats?.recipients || 0,
      },
    }).catch(() => {});
    processed++;
  }
  return processed;
}

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

  // 3. Deliver due scheduled announcements every minute
  cron.schedule('* * * * *', async () => {
    try {
      await processDueScheduledAnnouncements();
    } catch (err) {
      console.error('[Cron] Scheduled announcement delivery error:', err);
    }
  });
}

module.exports = { initScheduledJobs, processDueScheduledAnnouncements };
