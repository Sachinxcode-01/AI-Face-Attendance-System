/**
 * Unit test: read cache + cacheJson middleware (src/utils/cache.js).
 * Plain Node script like the rest of tests/unit — exit 0 on pass.
 */

const assert = require('assert');
const cache = require('../../src/utils/cache');

let lastBody = null;

const fakeRes = () => ({
  statusCode: 200,
  headers: {},
  set(key, value) {
    this.headers[key] = value;
    return this;
  },
  json(body) {
    lastBody = body;
    return this;
  }
});

const req = { method: 'GET', originalUrl: '/analytics/trends', userEmail: 'a@x' };
let calls = 0;
const handler = (res) => {
  calls += 1;
  res.json({ calls });
};

(async () => {
  const mw = cache.cacheJson(60000);

  const res1 = fakeRes();
  mw(req, res1, () => handler(res1));
  assert.deepStrictEqual(lastBody, { calls: 1 });
  assert.strictEqual(res1.headers['Cache-Control'], 'private, max-age=60');

  const res2 = fakeRes();
  mw(req, res2, () => handler(res2));
  assert.deepStrictEqual(lastBody, { calls: 1 }, 'repeat request must be served from cache');
  assert.strictEqual(res2.headers['X-Cache'], 'HIT');

  const res3 = fakeRes();
  mw({ ...req, userEmail: 'b@x' }, res3, () => handler(res3));
  assert.deepStrictEqual(lastBody, { calls: 2 }, 'cache must be scoped per user');

  const res4 = fakeRes();
  mw({ ...req, method: 'POST' }, res4, () => handler(res4));
  assert.deepStrictEqual(lastBody, { calls: 3 }, 'writes must bypass the cache');

  cache.invalidate('http:');
  const res5 = fakeRes();
  mw(req, res5, () => handler(res5));
  assert.deepStrictEqual(lastBody, { calls: 4 }, 'invalidate must drop cached entries');

  console.log('✅ Cache middleware tests passed');
  process.exit(0);
})().catch((err) => {
  console.error('❌ Cache middleware test failed:', err.message);
  process.exit(1);
});
