const baseEmailTemplate = require('./baseEmailTemplate');

function resetPasswordSuccessTemplate() {
  const subject = "Your Smart Attendance AI password was changed";
  const title = "Password Changed Successfully";
  const heading = "Password changed successfully";
  
  const contentHtml = `
    <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-top: 0; margin-bottom: 24px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      Your password was changed. If this wasn’t you, contact support immediately.
    </p>
    <div style="text-align: center; margin: 24px 0;">
      <span style="font-size: 48px;">🔒</span>
    </div>
  `;
  
  const securityNote = "If this wasn’t you, contact support immediately.";
  
  const html = baseEmailTemplate({ title, heading, contentHtml, securityNote });
  const text = `Password changed successfully\n\nYour password was changed. If this wasn’t you, contact support immediately.`;
  
  return { subject, html, text };
}

module.exports = resetPasswordSuccessTemplate;
