const assert = require('assert');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const loginOtpTemplate = require('../../src/templates/email/loginOtpTemplate');
const registerOtpTemplate = require('../../src/templates/email/registerOtpTemplate');
const forgotPasswordOtpTemplate = require('../../src/templates/email/forgotPasswordOtpTemplate');
const resetPasswordSuccessTemplate = require('../../src/templates/email/resetPasswordSuccessTemplate');
const welcomeTemplate = require('../../src/templates/email/welcomeTemplate');
const EmailService = require('../../src/services/emailService');

async function runTests() {
  console.log("🧪 --- Running Email Template & Resend Service Unit Tests ---");

  // 1. login OTP template renders logo
  console.log("➡️ Testing Login OTP Template logo rendering...");
  const loginRes = loginOtpTemplate("123456");
  assert.ok(loginRes.html.includes("Email_logo.png"), "Login OTP template should include logo image reference");
  assert.ok(loginRes.html.includes("123456"), "Login OTP template should include OTP");
  console.log("✅ Passed");

  // 2. register OTP template renders OTP block
  console.log("➡️ Testing Register OTP Template OTP block rendering...");
  const registerRes = registerOtpTemplate("654321");
  assert.ok(registerRes.html.includes("654321"), "Register OTP template should include OTP");
  console.log("✅ Passed");

  // 3. forgot password template renders correctly
  console.log("➡️ Testing Forgot Password Template rendering...");
  const forgotRes = forgotPasswordOtpTemplate("987654");
  assert.ok(forgotRes.html.includes("987654"), "Forgot password template should include OTP");
  assert.ok(forgotRes.html.includes("compromised"), "Forgot password template should include security warning");
  console.log("✅ Passed");

  // 4. reset success template renders correctly
  console.log("➡️ Testing Reset Success Template rendering...");
  const resetSuccessRes = resetPasswordSuccessTemplate();
  assert.ok(resetSuccessRes.html.includes("changed successfully"), "Reset success template should render success message");
  console.log("✅ Passed");

  // 5. plain text fallback exists
  console.log("➡️ Testing plain text fallback existence...");
  assert.ok(loginRes.text && loginRes.text.length > 0, "Login OTP should have text fallback");
  assert.ok(registerRes.text && registerRes.text.length > 0, "Register OTP should have text fallback");
  assert.ok(forgotRes.text && forgotRes.text.length > 0, "Forgot password OTP should have text fallback");
  assert.ok(resetSuccessRes.text && resetSuccessRes.text.length > 0, "Reset success should have text fallback");
  const welcomeRes = welcomeTemplate("John Doe");
  assert.ok(welcomeRes.text && welcomeRes.text.length > 0, "Welcome should have text fallback");
  console.log("✅ Passed");

  // 6 & 7 & 8: Resend mock success, mock failure, and onboarding@resend.dev restriction.
  const originalFetch = global.fetch;
  const originalNodeEnv = process.env.NODE_ENV;

  try {
    process.env.NODE_ENV = 'development';
    // 6. Resend mock success
    console.log("➡️ Testing Resend mock success...");
    global.fetch = async (url, options) => {
      assert.strictEqual(url, 'https://api.resend.com/emails');
      return {
        ok: true,
        status: 200,
        json: async () => ({ id: "re_mock_123" })
      };
    };
    
    // Set environment variables for the test
    process.env.EMAIL_PROVIDER = 'resend';
    process.env.RESEND_API_KEY = 're_test_key_123';
    process.env.EMAIL_FROM = 'noreply@verified-domain.com';
    process.env.EMAIL_SENDER_NAME = 'Smart Attendance AI';

    const sendResSuccess = await EmailService.sendEmail("recipient@example.com", "Test Subject", "Test text", "Test html");
    assert.strictEqual(sendResSuccess.success, true);
    assert.strictEqual(sendResSuccess.provider, 'resend');
    assert.strictEqual(sendResSuccess.messageId, 're_mock_123');
    console.log("✅ Passed");

    // 7. Resend mock failure
    console.log("➡️ Testing Resend mock failure...");
    global.fetch = async (url, options) => {
      return {
        ok: false,
        status: 400,
        json: async () => ({ message: "Invalid API Key", statusCode: 400 })
      };
    };

    const sendResFail = await EmailService.sendEmail("recipient@example.com", "Test Subject", "Test text", "Test html");
    assert.strictEqual(sendResFail.success, false);
    assert.strictEqual(sendResFail.statusCode, 400);
    assert.strictEqual(sendResFail.message, "Invalid API Key");
    console.log("✅ Passed");

    // 8. onboarding@resend.dev restriction handled
    console.log("➡️ Testing onboarding@resend.dev restriction handling...");
    process.env.EMAIL_FROM = 'onboarding@resend.dev';
    
    global.fetch = async (url, options) => {
      return {
        ok: false,
        status: 403,
        json: async () => ({
          message: "You can only send emails to your own email address while in sandbox mode.",
          statusCode: 403
        })
      };
    };

    const sendResRestricted = await EmailService.sendEmail("someone-else@example.com", "Test Subject", "Test text", "Test html");
    assert.strictEqual(sendResRestricted.success, false);
    assert.strictEqual(sendResRestricted.statusCode, 403);
    assert.strictEqual(sendResRestricted.message, "Resend test sender can only send to the account email. Add a verified domain for production.");
    console.log("✅ Passed");

  } finally {
    global.fetch = originalFetch;
    process.env.NODE_ENV = originalNodeEnv;
  }

  console.log("🏁 All email template and Resend unit tests completed successfully.");
  process.exit(0);
}

runTests().catch(err => {
  console.error("❌ Test suite failed:", err);
  process.exit(1);
});
