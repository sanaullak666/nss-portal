let nodemailer;
try {
  nodemailer = require('nodemailer');
} catch (e) {
  nodemailer = null;
}

/**
 * Send OTP Email for Admin Password Change
 * @param {string} toEmail 
 * @param {string} otpCode 
 */
async function sendOTPEmail(toEmail, otpCode) {
  console.log(`\n==================================================`);
  console.log(`[PU NSS PORTAL] OTP GENERATED FOR ADMIN PASSWORD CHANGE`);
  console.log(`Recipient Email: ${toEmail}`);
  console.log(`OTP Code: ${otpCode}`);
  console.log(`Validity: 10 Minutes`);
  console.log(`==================================================\n`);

  const gmailUser = process.env.GMAIL_USER || 'sanaullaamini@gmail.com';
  const gmailPass = process.env.GMAIL_PASS || process.env.SMTP_PASS;

  if (!gmailPass) {
    throw new Error('Gmail App Password (GMAIL_PASS) is not configured in .env file. Please add GMAIL_PASS=your_16_char_app_password to .env');
  }

  if (!nodemailer) {
    throw new Error('Nodemailer package is not installed.');
  }

  const transporter = nodemailer.createTransport(
    process.env.SMTP_HOST ? {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || gmailUser,
        pass: gmailPass
      }
    } : {
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPass
      }
    }
  );

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #002B49; color: #ffffff; padding: 20px; text-align: center;">
        <h2 style="margin: 0;">Pondicherry University - NSS Portal</h2>
        <p style="margin: 5px 0 0 0; font-size: 0.9rem;">Admin Password Reset Request</p>
      </div>
      <div style="padding: 30px; background-color: #ffffff; color: #333333;">
        <p>Hello Admin,</p>
        <p>You have requested to change/reset your admin account password on the PU NSS Portal.</p>
        <p>Your One-Time Password (OTP) is:</p>
        <div style="text-align: center; margin: 25px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #b71c1c; background-color: #fee2e2; padding: 10px 24px; border-radius: 8px; border: 1px dashed #b71c1c;">
            ${otpCode}
          </span>
        </div>
        <p style="font-size: 0.85rem; color: #666666;">This OTP is valid for <strong>10 minutes</strong>. Do not share this code with anyone.</p>
        <p style="font-size: 0.85rem; color: #666666;">If you did not request this, please ignore this email.</p>
      </div>
      <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 0.8rem; color: #888888; border-top: 1px solid #e0e0e0;">
        &copy; 2026 National Service Scheme - Pondicherry University
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"PU NSS Portal" <${gmailUser}>`,
      to: toEmail,
      subject: `[PU NSS Portal] Your Admin Password Reset OTP: ${otpCode}`,
      html: htmlContent
    });

    console.log(`[EMAIL SENT SUCCESSFULLY] Live email delivered to ${toEmail}`);
    return true;
  } catch (err) {
    console.error('[EMAIL SEND FAILURE]', err.message);
    throw new Error(`Gmail delivery failed: ${err.message}`);
  }
}

module.exports = { sendOTPEmail };
