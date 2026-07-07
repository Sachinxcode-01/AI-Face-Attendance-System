const baseEmailTemplate = require('./baseEmailTemplate');

function welcomeTemplate(name) {
  const subject = "Welcome to Smart Attendance AI";
  const title = "Welcome";
  const heading = "Welcome aboard";
  
  const contentHtml = `
    <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-top: 0; margin-bottom: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      Hello ${name || 'there'},
    </p>
    <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      Your account is ready.
    </p>
  `;
  
  const securityNote = "Get ready to experience the next-gen biometric attendance system.";
  
  const html = baseEmailTemplate({ title, heading, contentHtml, securityNote });
  const text = `Welcome aboard\n\nHello ${name || 'there'},\n\nYour account is ready.`;
  
  return { subject, html, text };
}

module.exports = welcomeTemplate;
