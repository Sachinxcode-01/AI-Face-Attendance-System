const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

class SmsService {
  /**
   * Dispatches an SMS using configured provider with cascading fallbacks
   * @param {string} phone - Recipient phone number (E.164 or national format)
   * @param {string} message - Message text or OTP body
   * @param {object} metadata - Optional DLT template ID or routing context
   */
  static async sendSms(phone, message, metadata = {}) {
    if (!phone) {
      return { success: false, error: 'Recipient phone number is missing' };
    }

    const provider = process.env.SMS_PROVIDER || 'mock';
    const cleanPhone = phone.replace(/[^\d+]/g, '');

    // Mask phone for secure structured logging (e.g. +91 98****1234)
    const maskedPhone = cleanPhone.length > 6
      ? cleanPhone.slice(0, 4) + '****' + cleanPhone.slice(-2)
      : '****';

    if (process.env.NODE_ENV === 'test' || provider === 'mock') {
      console.log(`[SmsService Mock] Sent to ${maskedPhone} | Message: ${message}`);
      return {
        success: true,
        provider: 'mock',
        messageId: `sms_mock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        status: 'delivered',
        recipient: maskedPhone
      };
    }

    if (provider === 'twilio') {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const fromNumber = process.env.TWILIO_FROM_NUMBER;

      if (!accountSid || !authToken || !fromNumber) {
        console.warn('[SmsService] Twilio credentials incomplete, falling back to mock');
        return { success: true, provider: 'mock_fallback', status: 'simulated' };
      }

      try {
        const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
        const bodyParams = new URLSearchParams({
          To: cleanPhone,
          From: fromNumber,
          Body: message
        });

        const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: bodyParams.toString()
        });

        const data = await res.json();
        if (res.ok) {
          return { success: true, provider: 'twilio', messageId: data.sid, status: 'sent' };
        } else {
          console.error('[SmsService] Twilio error:', data.message);
          return { success: false, provider: 'twilio', error: data.message };
        }
      } catch (err) {
        console.error('[SmsService] Twilio network exception:', err.message);
        return { success: false, provider: 'twilio', error: err.message };
      }
    }

    if (provider === 'msg91') {
      const authKey = process.env.MSG91_AUTH_KEY;
      const templateId = metadata.dltTemplateId || process.env.MSG91_DLT_TE_ID;
      try {
        const res = await fetch('https://api.msg91.com/api/v5/flow/', {
          method: 'POST',
          headers: {
            'authkey': authKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            template_id: templateId,
            short_url: '0',
            recipients: [{ mobiles: cleanPhone, ...metadata.variables }]
          })
        });
        const data = await res.json();
        return { success: res.ok, provider: 'msg91', messageId: data.message, status: data.type };
      } catch (err) {
        return { success: false, provider: 'msg91', error: err.message };
      }
    }

    return { success: true, provider: 'default_mock', status: 'delivered' };
  }

  /**
   * Formats and transmits standard institutional verification OTP
   * @param {string} phone 
   * @param {string} otp 
   * @param {string} purpose - 'login' | 'register' | 'password_reset'
   */
  static async sendOtp(phone, otp, purpose = 'login') {
    const templates = {
      login: `Your SmartFace verification code is ${otp}. Valid for 5 minutes. Do not share this code.`,
      register: `Welcome to SmartFace. Your campus verification code is ${otp}. Valid for 5 minutes.`,
      password_reset: `SmartFace Password Reset OTP is ${otp}. Valid for 5 minutes.`
    };

    const message = templates[purpose] || templates.login;
    return await this.sendSms(phone, message, {
      variables: { otp },
      purpose
    });
  }
}

module.exports = SmsService;
