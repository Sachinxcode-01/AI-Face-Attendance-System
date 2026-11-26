/**
 * Tenant- and user-aware TTL cache with optional Redis backing and stampede protection.
 * Falls back cleanly to bounded in-process storage whenever Redis is not configured or down.
 * Never store passwords, tokens, raw images, or biometric embeddings in this cache.
 */

'use strict';

const store = new Map();
const inFlight = new Map();
const MAX_ENTRIES = 1000;
const DEFAULT_TTL_MS = 30 * 1000;

let redisClient = null;
let redisReady = false;

const redisUrl = process.env.REDIS_URL || process.env.REDIS_TLS_URL;
if (redisUrl && redisUrl.trim() !== '') {
  try {
    const Redis = require('ioredis');
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 2,
      lazyConnect: true,
      connectTimeout: 2000,
      enableOfflineQueue: false,
    });
    redisClient.on('ready', () => {
      redisReady = true;
    });
    redisClient.on('error', () => {
      redisReady = false;
    });
    redisClient.connect().catch(() => {
      redisReady = false;
    });
  } catch {
    redisClient = null;
  }
}

function tenantKey(tenantId, scope, id = '') {
  const cleanTenant = String(tenantId || 'global').trim().toLowerCase().replace(/[^a-z0-9._-]/g, '_');
  const cleanScope = String(scope || 'item').trim().toLowerCase();
  const cleanId = String(id || '').trim().toLowerCase();
  return cleanId ? `t:${cleanTenant}:${cleanScope}:${cleanId}` : `t:${cleanTenant}:${cleanScope}`;
}

function get(key) {
  const hit = store.get(key);
  if (!hit) return undefined;
  if (Date.now() > hit.expiresAt) {
    store.delete(key);
    return undefined;
  }
  return hit.value;
}

function set(key, value, ttlMs = DEFAULT_TTL_MS) {
    if (store.size >= MAX_ENTRIES && !store.has(key)) {
      store.delete(store.keys().next().value);
    }
    store.set(key, { value, expiresAt: Date.now() + ttlMs });
    if (redisReady && redisClient && ttlMs >= 1000) {
      redisClient.set(`sf:${key}`, JSON.stringify(value), 'PX', ttlMs).catch(() => { });
    }
  }

  async function getAsync(key) {
    const local = get(key);
    if (local !== undefined) return local;
    if (redisReady && redisClient) {
      try {
        const raw = await redisClient.get(`sf:${key}`);
        if (raw !== null) {
          const parsed = JSON.parse(raw);
          set(key, parsed, DEFAULT_TTL_MS);
          return parsed;
        }
      } catch {
        // Fall through cleanly on cache read failure
      }
    }
    return undefined;
  }

  /**
   * Coalesces concurrent misses for the same key to prevent cache stampedes.
   */
  async function getOrLoad(key, loader, ttlMs = DEFAULT_TTL_MS) {
    const cached = await getAsync(key);
    if (cached !== undefined) return cached;

    if (inFlight.has(key)) {
      return inFlight.get(key);
    }

    const promise = Promise.resolve()
      .then(() => loader())
      .then((value) => {
        if (value !== undefined && value !== null) {
          set(key, value, ttlMs);
        }
        return value;
      })
      .finally(() => {
        inFlight.delete(key);
      });

    inFlight.set(key, promise);
    return promise;
  }

  /** Drops every entry whose key starts with `prefix`; call after writes. */
  function invalidate(prefix) {
    for (const key of store.keys()) {
      if (key.startsWith(prefix)) store.delete(key);
    }
    if (redisReady && redisClient) {
      redisClient.keys(`sf:${prefix}*`).then((keys) => {
        if (keys.length > 0) return redisClient.del(...keys);
      }).catch(() => { });
    }
  }

  function invalidateAnalyticsForUser(email) {
    const clean = String(email || '').trim().toLowerCase();
    if (!clean) return;
    invalidate(`http:/analytics`);
    invalidate(`http:/api/analytics`);
    invalidate(`student:summary:${clean}`);
  }

  /**
   * Express middleware caching JSON responses per user + URL.
   * Only for read-only routers: writes must bypass or invalidate the cache.
   */
  function cacheJson(ttlMs = DEFAULT_TTL_MS) {
    return (req, res, next) => {
      if (req.method !== 'GET') return next();
      const key = `http:${req.originalUrl}:${req.userEmail || req.userRole || 'anon'}`;
      const hit = get(key);
      if (hit !== undefined) {
        res.set('X-Cache', 'HIT');
        return res.json(hit);
      }
      const sendJson = res.json.bind(res);
      res.json = (body) => {
        if (res.statusCode < 400) set(key, body, ttlMs);
        return sendJson(body);
      };
      res.set('Cache-Control', `private, max-age=${Math.floor(ttlMs / 1000)}`);
      return next();
    };
  }

  async function shutdown() {
    inFlight.clear();
    if (redisClient) {
      try {
        await redisClient.quit();
      } catch {
        redisClient.disconnect();
      }
      redisClient = null;
      redisReady = false;
    }
  }

  module.exports = {
    tenantKey,
    get,
    set,
    getAsync,
    getOrLoad,
    invalidate,
    invalidateAnalyticsForUser,
    cacheJson,
    shutdown,
    DEFAULT_TTL_MS,
  };
