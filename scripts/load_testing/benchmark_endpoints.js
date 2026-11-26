/**
 * Reproducible endpoint latency benchmark (p50/p95/p99) against local Express + MongoDB.
 * Uses seeded/test JWT auth with NODE_ENV=test on an ephemeral localhost port.
 */
'use strict';

const path = require('path');
const http = require('http');
const os = require('os');
const apiNodeModules = path.resolve(__dirname, '../../backend/api/node_modules');
const dotenv = require(path.join(apiNodeModules, 'dotenv'));
const express = require(path.join(apiNodeModules, 'express'));
const mongoose = require(path.join(apiNodeModules, 'mongoose'));

dotenv.config({ path: path.resolve(__dirname, '../../backend/api/.env') });
process.env.NODE_ENV = 'test';

const AuthService = require('../../backend/api/src/services/authService');
const { cacheJson } = require('../../backend/api/src/utils/cache');

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return Number(sorted[idx].toFixed(2));
}

async function benchRoute(name, fn, iterations = 25) {
  const times = [];
  for (let i = 0; i < iterations; i++) {
    const t0 = process.hrtime.bigint();
    const ok = await fn(i);
    const ms = Number(process.hrtime.bigint() - t0) / 1e6;
    if (!ok) throw new Error(`Benchmark request failed for ${name}`);
    times.push(ms);
  }
  times.sort((a, b) => a - b);
  return {
    name,
    iterations,
    p50_ms: percentile(times, 50),
    p95_ms: percentile(times, 95),
    p99_ms: percentile(times, 99),
    min_ms: Number(times[0].toFixed(2)),
    max_ms: Number(times[times.length - 1].toFixed(2)),
  };
}

async function main() {
  const mongoUrl = process.env.MONGODB_URL;
  await mongoose.connect(mongoUrl, { dbName: 'smartface' });

  const app = express();
  app.use(express.json());
  app.use('/attendance', require('../../backend/api/src/routes/attendance'));
  app.use('/academic', require('../../backend/api/src/routes/academic'));
  app.use('/analytics', cacheJson(30 * 1000), require('../../backend/api/src/routes/analytics'));
  app.use('/api/assistant', require('../../backend/api/src/routes/ai'));

  const server = http.createServer(app);
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const studentToken = AuthService.createAccessToken({
    sub: 'alice@smartface.pro',
    email: 'alice@smartface.pro',
    role: 'student',
    name: 'Alice Cooper',
  });
  const headers = { Authorization: `Bearer ${studentToken}`, 'Content-Type': 'application/json' };

  try {
    // Warm one request for cold vs warm analytics measurement
    const tCold = process.hrtime.bigint();
    await fetch(`${baseUrl}/analytics/trends`, { headers });
    const analyticsColdMs = Number((Number(process.hrtime.bigint() - tCold) / 1e6).toFixed(2));

    const results = [];
    results.push(await benchRoute('GET /analytics/trends (warm cache)', async () => {
      const r = await fetch(`${baseUrl}/analytics/trends`, { headers });
      return r.status === 200 && r.headers.get('x-cache') === 'HIT';
    }, 30));

    results.push(await benchRoute('GET /academic/holidays (cache.getOrLoad)', async () => {
      const r = await fetch(`${baseUrl}/academic/holidays`, { headers });
      return r.status === 200;
    }, 30));

    results.push(await benchRoute('GET /academic/timetable (normalized keys)', async () => {
      const r = await fetch(`${baseUrl}/academic/timetable`, { headers });
      return r.status === 200;
    }, 20));

    results.push(await benchRoute('GET /attendance/dashboard (aggregated summary)', async () => {
      const r = await fetch(`${baseUrl}/attendance/dashboard`, { headers });
      return r.status === 200;
    }, 15));

    results.push(await benchRoute('GET /attendance/history/alice@smartface.pro', async () => {
      const r = await fetch(`${baseUrl}/attendance/history/alice@smartface.pro`, { headers });
      return r.status === 200;
    }, 15));

    results.push(await benchRoute('POST /api/assistant/chat/stream (SSE fallback)', async () => {
      const r = await fetch(`${baseUrl}/api/assistant/chat/stream`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ message: 'How do I check my attendance?', language: 'en' }),
      });
      await r.text();
      return r.status === 200;
    }, 10));

    console.log(JSON.stringify({
      environment: {
        node: process.version,
        platform: os.platform(),
        cpus: os.cpus().length,
        mongoDb: 'Atlas (smartface)',
      },
      analytics_trends_cold_ms: analyticsColdMs,
      benchmarks: results,
    }, null, 2));
  } finally {
    const { awaitPendingJobs } = require('../../backend/api/src/utils/jobTracker');
    await awaitPendingJobs();
    server.close();
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
