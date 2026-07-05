const APP_ENV = process.env.APP_ENV || 'development';
const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = APP_ENV === 'production' || NODE_ENV === 'production';

class RateLimiter {
  constructor(maxCalls, periodSeconds) {
    this.maxCalls = maxCalls;
    this.period = periodSeconds * 1000; // in milliseconds
    this.hits = new Map();
  }

  isAllowed(key) {
    if (!isProduction) {
      return true;
    }
    const now = Date.now();
    const windowStart = now - this.period;
    
    let timestamps = this.hits.get(key) || [];
    timestamps = timestamps.filter(t => t > windowStart);
    
    if (timestamps.length >= this.maxCalls) {
      this.hits.set(key, timestamps);
      return false;
    }
    
    timestamps.push(now);
    this.hits.set(key, timestamps);
    return true;
  }

  remainingSeconds(key) {
    const timestamps = this.hits.get(key) || [];
    if (timestamps.length === 0) return 0;
    const now = Date.now();
    const windowStart = now - this.period;
    const activeTimestamps = timestamps.filter(t => t > windowStart);
    if (activeTimestamps.length === 0) return 0;
    const oldestInWindow = Math.min(...activeTimestamps);
    return Math.max(0, Math.ceil((this.period - (now - oldestInWindow)) / 1000));
  }
}

const otpSendLimiter = new RateLimiter(3, 60);
const otpVerifyLimiter = new RateLimiter(5, 60);
const registerLimiter = new RateLimiter(3, 300);
const loginPasswordLimiter = new RateLimiter(5, 60);

const limitOtpSend = (req, res, next) => {
  const key = req.body.email || req.ip;
  if (!otpSendLimiter.isAllowed(key)) {
    const retryAfter = otpSendLimiter.remainingSeconds(key);
    return res.status(429).json({ detail: `Too many OTP requests. Please wait ${retryAfter}s before requesting again.` });
  }
  next();
};

const limitOtpVerify = (req, res, next) => {
  const key = req.body.email || req.ip;
  if (!otpVerifyLimiter.isAllowed(key)) {
    const retryAfter = otpVerifyLimiter.remainingSeconds(key);
    return res.status(429).json({ detail: `Too many verification attempts. Please wait ${retryAfter}s.` });
  }
  next();
};

const limitRegister = (req, res, next) => {
  const key = req.body.email || req.ip;
  if (!registerLimiter.isAllowed(key)) {
    const retryAfter = registerLimiter.remainingSeconds(key);
    return res.status(429).json({ detail: `Too many registration attempts. Please wait ${retryAfter}s before trying again.` });
  }
  next();
};

const limitLoginPassword = (req, res, next) => {
  const key = req.body.email || req.ip;
  if (!loginPasswordLimiter.isAllowed(key)) {
    const retryAfter = loginPasswordLimiter.remainingSeconds(key);
    return res.status(429).json({ detail: `Too many login attempts. Please wait ${retryAfter}s before trying again.` });
  }
  next();
};

module.exports = { limitOtpSend, limitOtpVerify, limitRegister, limitLoginPassword };
