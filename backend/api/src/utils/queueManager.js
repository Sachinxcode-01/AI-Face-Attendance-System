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
    this.shuttingDown = false;
    this.retryTimers = new Set();
    this.seenIdempotencyKeys = new Map();
    this.deadLetter = [];
    this.metrics = {
      processedTotal: 0,
      failedTotal: 0,
      deduplicatedTotal: 0,
      deadLetterCount: 0,
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
   * Enqueue a job into target queue with priority, idempotency, and retry tracking
   */
  async enqueue(queueName, jobData, options = {}) {
    if (this.shuttingDown) {
      throw new Error('QueueManager is shutting down; refusing new jobs.');
    }
    if (!this.queues[queueName]) {
      throw new Error(`Invalid queue name: ${queueName}`);
    }

    if (options.idempotencyKey) {
      const key = `${queueName}:${options.idempotencyKey}`;
      const seenAt = this.seenIdempotencyKeys.get(key);
      if (seenAt && Date.now() - seenAt < (options.idempotencyWindowMs || 5 * 60 * 1000)) {
        this.metrics.deduplicatedTotal++;
        return null;
      }
      if (this.seenIdempotencyKeys.size >= 2000) {
        this.seenIdempotencyKeys.delete(this.seenIdempotencyKeys.keys().next().value);
      }
      this.seenIdempotencyKeys.set(key, Date.now());
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
      } catch {
        this.queues[queueName].push(job);
      }
    } else {
      this.queues[queueName].push(job);
    }

    this.emit('job:enqueued', { queueName, jobId: job.id });
    this.processQueue(queueName);
    return job.id;
  }

  async _popNextJob(queueName) {
    if (this.queues[queueName].length > 0) {
      return this.queues[queueName].shift();
    }
    if (this.isRedisConnected && this.redisClient) {
      try {
        const raw = await this.redisClient.rpop(`smartface:queue:${queueName}`);
        if (raw) return JSON.parse(raw);
      } catch {
        return null;
      }
    }
    return null;
  }

  /**
   * Execute worker loop for queued tasks
   */
  async processQueue(queueName) {
      if (this.shuttingDown || this.activeWorkers[queueName] >= this.concurrency[queueName]) {
        return;
      }

      const job = await this._popNextJob(queueName);
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

          if (job.attempts < job.maxAttempts && !this.shuttingDown) {
            job.status = 'retry';
              const timer = setTimeout(() => {
                this.retryTimers.delete(timer);
                this.queues[queueName].push(job);
                this.processQueue(queueName);
              }, Math.pow(2, job.attempts) * 1000);
              if (typeof timer.unref === 'function') timer.unref();
              this.retryTimers.add(timer);
            } else {
              job.status = 'dead_letter';
              this.metrics.failedTotal++;
              this.metrics.deadLetterCount++;
              if(this.deadLetter.length >= 200) this.deadLetter.shift();
            this.deadLetter.push({ queueName, jobId: job.id, failedAt: new Date(), error: error.message });
            this.emit('job:failed', { queueName, jobId: job.id, error: error.message });
          }
        } finally {
          this.activeWorkers[queueName]--;
          if (!this.shuttingDown) {
            setImmediate(() => this.processQueue(queueName));
          }
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
      getDeadLetters() {
        return [...this.deadLetter];
      }

  async shutdown(timeoutMs = 5000) {
        this.shuttingDown = true;
        for (const timer of this.retryTimers) {
          clearTimeout(timer);
        }
        this.retryTimers.clear();

        const started = Date.now();
        while (
          Object.values(this.activeWorkers).some((count) => count > 0) &&
          Date.now() - started < timeoutMs
        ) {
          await new Promise((resolve) => setTimeout(resolve, 50));
        }

        if (this.redisClient) {
          try {
            await this.redisClient.quit();
          } catch {
            this.redisClient.disconnect();
          }
          this.redisClient = null;
          this.isRedisConnected = false;
        }
      }
    }

    const queueManager = new QueueManager();
    module.exports = queueManager;
