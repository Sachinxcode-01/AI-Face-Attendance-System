const { Queue } = require('bullmq');

const connection = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined
};

let emailQueue = null;
let attendanceQueue = null;
let notificationQueue = null;

try {
  emailQueue = new Queue('email-queue', { connection });
  attendanceQueue = new Queue('attendance-queue', { connection });
  notificationQueue = new Queue('notification-queue', { connection });
} catch (err) {
  console.warn('[Queue Warning] Redis connection failed, falling back to direct async jobs:', err.message);
}

module.exports = {
  emailQueue,
  attendanceQueue,
  notificationQueue,
  redisConnection: connection
};
