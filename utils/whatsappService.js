const https = require('https');

/**
 * Send OTP via Meta WhatsApp Cloud API
 * @param {string} recipientPhone - Recipient phone number (with or without country code)
 * @param {string} otpCode - 6-digit OTP code
 * @returns {Promise<boolean>}
 */
async function sendWhatsAppOTP(recipientPhone, otpCode) {
  try {
    require('dotenv').config();
  } catch (e) {}

  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME || 'auth_otp';

  console.log(`\n==================================================`);
  console.log(`[PU NSS PORTAL] WHATSAPP OTP GENERATED`);
  console.log(`Target Phone: ${recipientPhone || 'Not specified'}`);
  console.log(`OTP Code: ${otpCode}`);
  console.log(`==================================================\n`);

  if (!token || !phoneNumberId) {
    console.log('[WHATSAPP SERVICE] WHATSAPP_TOKEN or WHATSAPP_PHONE_NUMBER_ID not set in .env.');
    console.log('[WHATSAPP SERVICE] WhatsApp message skipped. Configure .env to enable live WhatsApp delivery.');
    return false;
  }

  // Clean phone number (Ensure country code, default to +91 for India if 10 digits)
  let cleanPhone = (recipientPhone || '').toString().replace(/[^0-9]/g, '');
  if (cleanPhone.length === 10) {
    cleanPhone = '91' + cleanPhone;
  }

  if (!cleanPhone) {
    console.error('[WHATSAPP SERVICE ERROR] Invalid or missing recipient phone number.');
    return false;
  }

  const payload = JSON.stringify({
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: cleanPhone,
    type: "template",
    template: {
      name: templateName,
      language: { code: "en_US" },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: otpCode }
          ]
        },
        {
          type: "button",
          sub_type: "url",
          index: "0",
          parameters: [
            { type: "text", text: otpCode }
          ]
        }
      ]
    }
  });

  const options = {
    hostname: 'graph.facebook.com',
    path: `/v19.0/${phoneNumberId}/messages`,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  };

  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`[WHATSAPP SENT SUCCESSFULLY] Live WhatsApp OTP delivered to +${cleanPhone}`);
          resolve(true);
        } else {
          console.error(`[WHATSAPP DELIVERY FAILURE] Status ${res.statusCode}:`, body);
          resolve(false);
        }
      });
    });

    req.on('error', (err) => {
      console.error('[WHATSAPP NETWORK ERROR]', err.message);
      resolve(false);
    });

    req.write(payload);
    req.end();
  });
}

module.exports = { sendWhatsAppOTP };
