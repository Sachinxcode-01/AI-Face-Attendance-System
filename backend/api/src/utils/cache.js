/**
 * Tiny in-process TTL cache for expensive read-only aggregations.
 *
 * shortcut: per-process only (each API instance caches independently); swap for
 * the Redis client already used by middleware/rateLimiter when running more than
 * one instance.
 */

'use strict';

const store = new Map();
const MAX_ENTRIES = 500;
const DEFAULT_TTL_MS = 30 * 1000;

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
  if (store.size >= MAX_ENTRIES) {
    store.delete(store.keys().next().value);
  }
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

/** Drops every entry whose key starts with `prefix`; call after writes. */
function invalidate(prefix) {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
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

module.exports = { get, set, invalidate, cacheJson, DEFAULT_TTL_MS };
