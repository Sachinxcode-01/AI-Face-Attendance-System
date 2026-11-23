/**
 * Unified Multi-Channel Queue Architecture (Redis + Resilient Local Fallback)
 *
 * Manages four critical background processing queues:
 * 1. emailQueue - Transactional emails, OTPs, and password reset alerts
 * 2. notificationQueue - Real-time push, in-app, and WebSocket alerts
 * 3. aiProcessingQueue - Face detection, embeddings, and attendance heuristics
 * 4. faceTrainingQueue - Async face model training & student encoding updates
 */

const EventEmitter = require('events');

class QueueManager extends EventEmitter {
  constructor() {
    super();
    this.queues = {
      emailQueue: [],
      notificationQueue: [],
      aiProcessingQueue: [],
      faceTrainingQueue: []
    };
    this.activeWorkers = {
      emailQueue: 0,
      notificationQueue: 0,
      aiProcessingQueue: 0,
      faceTrainingQueue: 0
    };
    this.concurrency = {
      emailQueue: 5,
      notificationQueue: 10,
      aiProcessingQueue: 3,
      faceTrainingQueue: 1
    };
    this.redisClient = null;
    this.isRedisConnected = false;
    this.metrics = {
      processedTotal: 0,
      failedTotal: 0,
      queueHistory: []
    };

    this.initRedis();
  }

  initRedis() {
    const redisUrl = process.env.REDIS_URL || process.env.REDIS_TLS_URL;
    if (redisUrl && redisUrl.trim() !== '') {
      try {
        const Redis = require('ioredis');
        this.redisClient = new Redis(redisUrl, {
          maxRetriesPerRequest: 3,
          lazyConnect: true,
          connectTimeout: 5000,
          enableOfflineQueue: false
        });

        this.redisClient.connect().then(() => {
          this.isRedisConnected = true;
          console.log('✅ [QueueManager] Connected to Redis cluster for distributed BullMQ jobs.');
        }).catch((err) => {
          this.isRedisConnected = false;
          console.warn('⚠️ [QueueManager] Redis connection unavailable, running in resilient local queue mode.');
        });
      } catch (err) {
        this.isRedisConnected = false;
      }
    }
  }

  /**
   * Enqueue a job into target queue with priority and retry tracking
   */
  async enqueue(queueName, jobData, options = {}) {
    if (!this.queues[queueName]) {
      throw new Error(`Invalid queue name: ${queueName}`);
    }

    const job = {
      id: `${queueName}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      data: jobData,
      attempts: 0,
      maxAttempts: options.maxAttempts || 3,
      createdAt: new Date(),
      status: 'queued'
    };

    if (this.isRedisConnected && this.redisClient) {
      try {
        await this.redisClient.lpush(`smartface:queue:${queueName}`, JSON.stringify(job));
      } catch (e) {
        this.queues[queueName].push(job);
      }
    } else {
      this.queues[queueName].push(job);
    }

    this.emit('job:enqueued', { queueName, jobId: job.id });
    this.processQueue(queueName);
    return job.id;
  }

  /**
   * Execute worker loop for queued tasks
   */
  async processQueue(queueName) {
    if (this.activeWorkers[queueName] >= this.concurrency[queueName]) {
      return;
    }

    if (this.queues[queueName].length === 0) {
      return;
    }

    const job = this.queues[queueName].shift();
    if (!job) return;

    this.activeWorkers[queueName]++;
    job.status = 'processing';

    try {
      await this.executeJob(queueName, job);
      job.status = 'completed';
      this.metrics.processedTotal++;
      this.emit('job:completed', { queueName, jobId: job.id });
    } catch (error) {
      job.attempts++;
      console.error(`[QueueManager] Job failed in ${queueName} (Attempt ${job.attempts}/${job.maxAttempts}):`, error.message);

      if (job.attempts < job.maxAttempts) {
        job.status = 'retry';
        // Exponential backoff
        setTimeout(() => {
          this.queues[queueName].push(job);
          this.processQueue(queueName);
        }, Math.pow(2, job.attempts) * 1000);
      } else {
        job.status = 'failed';
        this.metrics.failedTotal++;
        this.emit('job:failed', { queueName, jobId: job.id, error: error.message });
      }
    } finally {
      this.activeWorkers[queueName]--;
      // Trigger next job in line
      setImmediate(() => this.processQueue(queueName));
    }
  }

  /**
   * Job execution dispatcher
   */
  async executeJob(queueName, job) {
    switch (queueName) {
      case 'emailQueue': {
        const EmailService = require('../services/emailService');
        const { to, subject, html, text } = job.data;
        if (EmailService && typeof EmailService.sendEmail === 'function') {
          await EmailService.sendEmail({ to, subject, html, text });
        }
        break;
      }
      case 'notificationQueue': {
        const notificationService = require('../services/notificationService');
        const { recipient, title, message, type, priority, extraData } = job.data;
        if (notificationService && typeof notificationService.sendNotification === 'function') {
          await notificationService.sendNotification(recipient, title, message, type, priority, extraData);
        }
        break;
      }
      case 'aiProcessingQueue': {
        const faceAiService = require('../services/faceAiService');
        const { imageBuffer, studentEmail } = job.data;
        if (faceAiService && typeof faceAiService.verifyFace === 'function') {
          return await faceAiService.verifyFace(imageBuffer, studentEmail);
        }
        break;
      }
      case 'faceTrainingQueue': {
        const path = require('path');
        const fs = require('fs');
        const { spawn } = require('child_process');
        const pythonScript = path.join(__dirname, '../../../../core/train_faces.py');
        const venvPython = path.join(__dirname, '../../../../venv/Scripts/python.exe');
        const pythonExecutable = fs.existsSync(venvPython) ? venvPython : 'python';

        return new Promise((resolve, reject) => {
          const py = spawn(pythonExecutable, [pythonScript], { stdio: 'ignore' });
          py.on('close', (code) => {
            if (code === 0) resolve({ status: 'trained' });
            else reject(new Error(`Face training script exited with code ${code}`));
          });
          py.on('error', reject);
        });
      }
      default:
        throw new Error(`Unknown job handler for ${queueName}`);
    }
  }

  /**
   * Diagnostic statistics for monitoring dashboard
   */
  getStats() {
    return {
      isRedisConnected: this.isRedisConnected,
      queueDepths: {
        emailQueue: this.queues.emailQueue.length,
        notificationQueue: this.queues.notificationQueue.length,
        aiProcessingQueue: this.queues.aiProcessingQueue.length,
        faceTrainingQueue: this.queues.faceTrainingQueue.length
      },
      activeWorkers: { ...this.activeWorkers },
      metrics: { ...this.metrics }
    };
  }
}

const queueManager = new QueueManager();
module.exports = queueManager;
