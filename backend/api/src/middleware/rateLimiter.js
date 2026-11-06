const Redis = require('ioredis');

const APP_ENV = process.env.APP_ENV || 'development';
const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = APP_ENV === 'production' || NODE_ENV === 'production';
const REDIS_URL = process.env.REDIS_URL || process.env.REDIS_URI;

// ── Redis Client Initialization (Optional Drop-in) ───────────────────────────
let redisClient = null;
let isRedisReady = false;

if (REDIS_URL) {
  try {
    redisClient = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 1,
      connectTimeout: 3000,
      lazyConnect: true
    });
    redisClient.connect()
      .then(() => {
        isRedisReady = true;
        console.log("✅ Redis connected for distributed rate limiting.");
      })
      .catch((err) => {
        console.warn("⚠️ Redis connection failed. Falling back to in-memory rate limiter:", err.message);
        isRedisReady = false;
      });
  } catch (err) {
    console.warn("⚠️ Redis initialization failed. Using in-memory fallback:", err.message);
  }
}

// ── Leak-Proof In-Memory Rate Limiter (Fallback / Dev) ────────────────────────
class MemoryRateLimiter {
  constructor(maxCalls, periodSeconds, prefix = 'rl') {
    this.maxCalls = maxCalls;
    this.periodMs = periodSeconds * 1000;
    this.periodSeconds = periodSeconds;
    this.prefix = prefix;
    this.hits = new Map(); // key -> [timestamps]

    // Periodic sweep to evict stale keys and prevent memory leaks
    this.sweepInterval = setInterval(() => {
      const now = Date.now();
      const cutoff = now - this.periodMs;
      for (const [key, timestamps] of this.hits.entries()) {
        const active = timestamps.filter(t => t > cutoff);
        if (active.length === 0) {
          this.hits.delete(key);
        } else {
          this.hits.set(key, active);
        }
      }
      // Safety cap: if map somehow exceeds 20,000 keys, drop oldest
      if (this.hits.size > 20000) {
        const keysToRemove = Array.from(this.hits.keys()).slice(0, 5000);
        keysToRemove.forEach(k => this.hits.delete(k));
      }
    }, 60000);

    if (this.sweepInterval.unref) {
      this.sweepInterval.unref(); // Prevent blocking process exit in tests
    }
  }

  async check(key) {
    const fullKey = `${this.prefix}:${key}`;
    const now = Date.now();

    // 1. Try Redis if connected
    if (isRedisReady && redisClient) {
      try {
        const multi = redisClient.multi();
        multi.incr(fullKey);
        multi.ttl(fullKey);
        const results = await multi.exec();

        const count = results[0][1];
        let ttl = results[1][1];

        if (ttl === -1 || count === 1) {
          await redisClient.expire(fullKey, this.periodSeconds);
          ttl = this.periodSeconds;
        }

        if (count > this.maxCalls) {
          return { allowed: false, remainingSeconds: Math.max(1, ttl) };
        }
        return { allowed: true, remainingSeconds: 0 };
      } catch (err) {
        // Redis failure -> fall through to in-memory check
      }
    }

    // 2. In-Memory Fallback
    const windowStart = now - this.periodMs;
    let timestamps = this.hits.get(fullKey) || [];
    timestamps = timestamps.filter(t => t > windowStart);

    if (timestamps.length >= this.maxCalls) {
      const oldest = Math.min(...timestamps);
      const remainingSeconds = Math.max(1, Math.ceil((this.periodMs - (now - oldest)) / 1000));
      this.hits.set(fullKey, timestamps);
      return { allowed: false, remainingSeconds };
    }

    timestamps.push(now);
    this.hits.set(fullKey, timestamps);
    return { allowed: true, remainingSeconds: 0 };
  }
}

// ── Limit Instances ─────────────────────────────────────────────────────────
const otpSendLimiter = new MemoryRateLimiter(5, 15 * 60, 'otp_send');
const otpVerifyLimiter = new MemoryRateLimiter(5, 15 * 60, 'otp_verify');
const registerLimiter = new MemoryRateLimiter(5, 15 * 60, 'register');
const loginPasswordLimiter = new MemoryRateLimiter(5, 15 * 60, 'login_pw');
const generalApiLimiter = new MemoryRateLimiter(60, 60, 'api_general');

// ── Middleware Generators ───────────────────────────────────────────────────
const createRateLimitMiddleware = (limiter, messageFn, extractKeyFn) => {
  return async (req, res, next) => {
    // In test environment, skip unless specifically tested
    if (process.env.NODE_ENV === 'test' && !req.headers['x-test-ratelimit']) {
      return next();
    }

    const rawKey = extractKeyFn ? extractKeyFn(req) : (req.body?.email || req.ip || 'unknown_client');
    const key = typeof rawKey === 'string' ? rawKey.toLowerCase().trim() : rawKey;
    const result = await limiter.check(key);

    if (!result.allowed) {
      res.setHeader('Retry-After', result.remainingSeconds);
      const msg = typeof messageFn === 'function' ? messageFn(result.remainingSeconds) : `Too many requests. Please retry in ${result.remainingSeconds}s.`;
      return res.status(429).json({
        detail: msg,
        message: msg,
        retry_after: result.remainingSeconds
      });
    }

    next();
  };
};

const limitOtpSend = createRateLimitMiddleware(
  otpSendLimiter,
  (sec) => `Too many OTP requests. Please wait ${sec}s before requesting again.`,
  (req) => req.ip || 'unknown_client'
);

const limitOtpVerify = createRateLimitMiddleware(
  otpVerifyLimiter,
  (sec) => `Too many verification attempts. Please wait ${sec}s.`,
  (req) => req.ip || 'unknown_client'
);

const limitRegister = createRateLimitMiddleware(
  registerLimiter,
  (sec) => `Too many registration attempts. Please wait ${sec}s before trying again.`,
  (req) => req.ip || 'unknown_client'
);

const limitLoginPassword = createRateLimitMiddleware(
  loginPasswordLimiter,
  (sec) => `Too many login attempts. Please wait ${sec}s before trying again.`,
  (req) => req.ip || 'unknown_client'
);

const limitGeneralApi = createRateLimitMiddleware(
  generalApiLimiter,
  (sec) => `Too many requests. Please wait ${sec}s.`,
  (req) => req.ip || 'unknown_client'
);

module.exports = {
  limitOtpSend,
  limitOtpVerify,
  limitRegister,
  limitLoginPassword,
  limitGeneralApi,
  MemoryRateLimiter
};
