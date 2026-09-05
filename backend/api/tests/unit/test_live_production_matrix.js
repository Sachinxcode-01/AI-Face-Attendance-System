const https = require('https');

const NODE_PROD_URL = 'https://ai-face-attendance-system-production.up.railway.app';
const PYTHON_PROD_URL = 'https://smartface-pro-api-production.up.railway.app';

async function measureRequest(url, options = {}) {
  const start = Date.now();
  try {
    const res = await fetch(url, options);
    const duration = Date.now() - start;
    let body = {};
    try {
      body = await res.json();
    } catch (e) {}
    return { status: res.status, duration, body, headers: Object.fromEntries(res.headers) };
  } catch (err) {
    return { status: 0, duration: Date.now() - start, error: err.message };
  }
}

async function runLiveAudit() {
  console.log('====================================================');
  console.log('📡 STARTING LIVE PRODUCTION VERIFICATION MATRIX');
  console.log('====================================================');

  // 1. Node Production Health
  console.log('\n1. Testing Node Production Health GET /health...');
  const nodeHealth = await measureRequest(`${NODE_PROD_URL}/health`);
  console.log(`Status: ${nodeHealth.status} | Latency: ${nodeHealth.duration}ms`);
  console.log('Response:', JSON.stringify(nodeHealth.body));

  // 2. Node Security Headers
  console.log('\n2. Testing Node Production Security Headers...');
  console.log('X-Content-Type-Options:', nodeHealth.headers['x-content-type-options']);
  console.log('X-Frame-Options:', nodeHealth.headers['x-frame-options']);

  // 3. Node Login OTP Anti-Enumeration Test
  console.log('\n3. Testing Node Production OTP Anti-Enumeration (unknown user)...');
  const otpRes = await measureRequest(`${NODE_PROD_URL}/auth/login-otp/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'nonexistent_test_user_2026@smartface.pro' })
  });
  console.log(`Status: ${otpRes.status} | Latency: ${otpRes.duration}ms`);
  console.log('Response:', JSON.stringify(otpRes.body));

  // 4. Python Health (GET /health)
  console.log('\n4. Testing Python Production Health GET /health...');
  const pyHealth = await measureRequest(`${PYTHON_PROD_URL}/health`);
  console.log(`Status: ${pyHealth.status} | Latency: ${pyHealth.duration}ms`);
  console.log('Response:', JSON.stringify(pyHealth.body));

  // 5. Python Readiness (GET /ready)
  console.log('\n5. Testing Python Production Readiness GET /ready...');
  const pyReady = await measureRequest(`${PYTHON_PROD_URL}/ready`);
  console.log(`Status: ${pyReady.status} | Latency: ${pyReady.duration}ms`);
  console.log('Response:', JSON.stringify(pyReady.body));

  // 6. Python Unauthenticated Face Verification Guard (POST /v1/face/verify)
  console.log('\n6. Testing Python Unauthenticated Face Verification Guard...');
  const pyUnauth = await measureRequest(`${PYTHON_PROD_URL}/v1/face/verify`, {
    method: 'POST'
  });
  console.log(`Status: ${pyUnauth.status} | Latency: ${pyUnauth.duration}ms`);
  console.log('Response:', JSON.stringify(pyUnauth.body));

  console.log('\n====================================================');
  console.log('🎉 LIVE VERIFICATION RUN COMPLETED');
  console.log('====================================================');
}

runLiveAudit();
