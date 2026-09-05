/**
 * Base email layout template with professional styling and responsive design.
 * Combines standard header, footer, custom content and styles for Gmail/Outlook compatibility.
 */
const baseEmailTemplate = ({ title, heading, contentHtml, securityNote = '' }) => {
  const publicAppUrl = process.env.PUBLIC_APP_URL || 'https://ai-face-attendance-system-production.up.railway.app';
  const logoUrl = `${publicAppUrl}/static/email/Email_logo.png`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      width: 100% !important;
      background-color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    @media only screen and (max-width: 600px) {
      .container {
        border-radius: 0 !important;
        border-left: none !important;
        border-right: none !important;
        width: 100% !important;
        max-width: 100% !important;
      }
      .content {
        padding: 24px !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; width: 100%; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f1f5f9; padding: 40px 0 60px 0;">
    <tr>
      <td align="center">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" class="container" style="max-width: 500px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.02); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td align="center" style="padding: 32px 32px 20px 32px; border-bottom: 1px solid #f1f5f9;">
              <img src="${logoUrl}" alt="Smart Attendance AI" height="48" style="display: block; height: 48px; border: 0; outline: none; text-decoration: none;" />
              <div style="font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 12px; letter-spacing: -0.5px;">Smart Attendance AI</div>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td class="content" style="padding: 32px; background-color: #ffffff;">
              <h2 style="font-size: 22px; font-weight: 700; color: #1e3a8a; margin-top: 0; margin-bottom: 16px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">${heading}</h2>
              ${contentHtml}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center; font-size: 12px; color: #94a3b8; line-height: 1.5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
              ${securityNote ? `<div style="margin-bottom: 12px; color: #64748b;">${securityNote}</div>` : ''}
              <p style="margin: 0; color: #94a3b8;">© 2026 Smart Attendance AI. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

module.exports = baseEmailTemplate;
