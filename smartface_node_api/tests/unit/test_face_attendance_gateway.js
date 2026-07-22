const assert = require('assert');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const AuthService = require('../../src/services/authService');
const faceAiService = require('../../src/services/faceAiService');

async function runFaceGatewayTests() {
  console.log('\n=============================================================');
  console.log('🧪 RUNNING NODE.JS FACE ATTENDANCE GATEWAY INTEGRATION TESTS');
  console.log('=============================================================');

  // Test 1: JWT token generation and identity derivation
  console.log('\n[TEST 1] JWT Student Identity Derivation...');
  const studentToken = AuthService.createAccessToken({ sub: 'student@example.com', role: 'student' });
  const payload = AuthService.decodeToken(studentToken);

  assert.strictEqual(payload.sub, 'student@example.com', 'JWT subject must equal student email');
  assert.strictEqual(payload.role, 'student', 'JWT role must equal student');
  console.log('  ✅ JWT token verification & identity extraction passed');

  // Test 2: AI Internal Token Secrecy
  console.log('\n[TEST 2] Internal AI Token Secrecy Guard...');
  assert.ok(process.env.AI_SERVICE_TOKEN, 'AI_SERVICE_TOKEN must exist in backend environment');
  assert.notStrictEqual(process.env.AI_SERVICE_TOKEN, '', 'AI_SERVICE_TOKEN must not be empty');

  // Verify that AuthService / public payload does NOT leak internal token
  assert.strictEqual(payload.AI_SERVICE_TOKEN, undefined, 'JWT payload must not contain internal token');
  console.log('  ✅ Internal AI Token is completely decoupled from client access');

  // Test 3: Face AI Service empty image validation
  console.log('\n[TEST 3] Face AI Service Empty Buffer Input...');
  const emptyRes = await faceAiService.verifyFace(Buffer.from(''), 'student@example.com');
  assert.strictEqual(emptyRes.success, false);
  assert.strictEqual(emptyRes.matched, false);
  console.log('  ✅ Empty buffer rejected cleanly');

  // Test 4: Face AI Service timeout fallback
  console.log('\n[TEST 4] Face AI Service Connection / Fallback Handling...');
  // Point to a non-existent port to test service unavailable
  const originalUrl = faceAiService.aiUrl;
  faceAiService.aiUrl = 'http://127.0.0.1:59999';

  const mockBuffer = Buffer.from('fake_jpeg_content_header');
  const unavailRes = await faceAiService.verifyFace(mockBuffer, 'student@example.com');

  assert.strictEqual(unavailRes.success, false);
  assert.strictEqual(unavailRes.status, 503);
  assert.ok(unavailRes.message.includes('unavailable'), 'Should report AI service unavailable');
  console.log('  ✅ Service unavailable handled gracefully with 503 response');

  // Restore original URL
  faceAiService.aiUrl = originalUrl;

  console.log('\n=============================================================');
  console.log('🎉 ALL NODE.JS FACE ATTENDANCE GATEWAY TESTS PASSED (4/4)');
  console.log('=============================================================\n');
}

if (require.main === module) {
  runFaceGatewayTests().catch(err => {
    console.error('❌ Node.js Face Gateway Test Failed:', err);
    process.exit(1);
  });
}

module.exports = { runFaceGatewayTests };
