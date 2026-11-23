const { Worker } = require('bullmq');
const { redisConnection } = require('../queues');
const EmailService = require('../services/emailService');

function startEmailWorker() {
  try {
    const worker = new Worker(
      'email-queue',
      async (job) => {
        const { to, subject, body } = job.data;
        console.log(`[Worker] Processing email to: ${to}`);
        await EmailService.sendEmail({ to, subject, html: body });
      },
      { connection: redisConnection }
    );

    worker.on('failed', (job, err) => {
      console.error(`[Worker] Email job failed ${job?.id}:`, err);
    });

    return worker;
  } catch (err) {
    console.warn('[Worker] Could not start EmailWorker:', err.message);
    return null;
  }
}

module.exports = { startEmailWorker };
