const baseEmailTemplate = require('./baseEmailTemplate');

function loginOtpTemplate(otp) {
  const subject = "Your Smart Attendance AI login code";
  const title = "Verify Your Login";
  const heading = "Verify your login";
  
  const contentHtml = `
    <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-top: 0; margin-bottom: 24px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      Use this code to sign in.
    </p>
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 24px 0; text-align: center;">
      <span style="font-family: Menlo, Monaco, Consolas, 'Courier New', monospace; font-size: 32px; font-weight: 700; color: #1e3a8a; letter-spacing: 6px;">${otp}</span>
    </div>
    <p style="font-size: 13px; line-height: 1.5; color: #e11d48; font-weight: 600; text-align: center; margin-top: 24px; margin-bottom: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      ⏳ This code expires in 5 minutes.
    </p>
  `;
  
  const securityNote = "If this wasn’t you, ignore this email.";
  
  const html = baseEmailTemplate({ title, heading, contentHtml, securityNote });
  const text = `Verify your login\n\nUse this code to sign in: ${otp}\n\nThis code expires in 5 minutes.\n\nIf this wasn’t you, ignore this email.`;
  
  return { subject, html, text };
}

module.exports = loginOtpTemplate;
