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
  try {
    require('dotenv').config();
  } catch (e) {}

  console.log(`\n==================================================`);
  console.log(`[PU NSS PORTAL] OTP GENERATED FOR ADMIN PASSWORD CHANGE`);
  console.log(`Recipient Email: ${toEmail}`);
  console.log(`OTP Code: ${otpCode}`);
  console.log(`Validity: 10 Minutes`);
  console.log(`==================================================\n`);

  const gmailUser = process.env.GMAIL_USER || 'nsspondiuni2409@gmail.com';
  const gmailPass = process.env.GMAIL_PASS || process.env.SMTP_PASS || 'qikdszaasapkypzu';

  if (!gmailPass) {
    throw new Error('Gmail App Password (GMAIL_PASS) is not configured.');
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

/**
 * Send Selection Approval Email to Student
 * @param {object} registration 
 */
async function sendSelectionApprovalEmail(registration) {
  if (!registration || !registration.email) return false;

  try {
    require('dotenv').config();
  } catch (e) {}

  const gmailUser = process.env.GMAIL_USER || 'nsspondiuni2409@gmail.com';
  const gmailPass = process.env.GMAIL_PASS || process.env.SMTP_PASS || 'qikdszaasapkypzu';

  if (!gmailPass || !nodemailer) {
    console.error('[APPROVAL EMAIL SKIPPED] Nodemailer or SMTP pass missing.');
    return false;
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
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
      <div style="background-color: #0F2042; color: #ffffff; padding: 25px 20px; text-align: center;">
        <h2 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0.5px;">PONDICHERRY UNIVERSITY</h2>
        <p style="margin: 6px 0 0 0; font-size: 13px; color: #f8fafc; text-transform: uppercase; letter-spacing: 1px;">NATIONAL SERVICE SCHEME (NSS) WING</p>
      </div>

      <div style="padding: 30px 25px; color: #1e293b; line-height: 1.6;">
        <div style="text-align: center; margin-bottom: 20px;">
          <span style="background-color: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; padding: 6px 16px; border-radius: 20px; font-weight: 800; font-size: 14px; display: inline-block;">
            🎉 APPLICATION APPROVED - VOLUNTEER SELECTED
          </span>
        </div>

        <p style="font-size: 16px; font-weight: 700; color: #0F2042; margin-top: 0;">Dear ${registration.applicant_name},</p>
        
        <p style="font-size: 15px; color: #334155;">
          We are pleased to inform you that your application for the <strong>National Service Scheme (NSS)</strong> at Pondicherry University has been <strong>APPROVED & SELECTED</strong> for the 2026 Volunteer Batch!
        </p>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #16a34a; padding: 18px; border-radius: 8px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 4px 0; color: #64748b; font-weight: 600; width: 140px;">Registration ID:</td>
              <td style="padding: 4px 0; color: #b71c1c; font-weight: 800;">${registration.registration_id}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748b; font-weight: 600;">Assigned Unit:</td>
              <td style="padding: 4px 0; color: #0F2042; font-weight: 700;">${registration.unit_number}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748b; font-weight: 600;">Univ Reg / App No:</td>
              <td style="padding: 4px 0; color: #0F2042;">${registration.univ_reg_no}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748b; font-weight: 600;">Department:</td>
              <td style="padding: 4px 0; color: #0F2042;">${registration.department}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748b; font-weight: 600;">Course & Year:</td>
              <td style="padding: 4px 0; color: #0F2042;">${registration.course} (${registration.year_of_study})</td>
            </tr>
          </table>
        </div>

        <p style="font-size: 14px; color: #334155;">
          <strong>Next Steps:</strong> Your assigned <strong>${registration.unit_number}</strong> Programme Officer / Student Coordinator will contact you directly to add you to the official NSS Volunteer WhatsApp group and brief you regarding upcoming orientation sessions and community service activities.
        </p>

        <p style="font-size: 14px; color: #334155;">
          Welcome to the Pondicherry University NSS Wing family! We look forward to your active participation in "Not Me, But You".
        </p>

        <div style="margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 18px; font-size: 13px; color: #64748b;">
          <strong>Warm regards,</strong><br>
          NSS Programme Coordinator / Unit Team<br>
          Pondicherry University, Kalapet, Puducherry - 605014<br>
          Contact Email: <a href="mailto:nsspondiuni2409@gmail.com" style="color: #0284c7;">nsspondiuni2409@gmail.com</a>
        </div>
      </div>

      <div style="background-color: #f1f5f9; padding: 14px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
        &copy; 2026 National Service Scheme - Pondicherry University. All rights reserved.
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"PU NSS Wing" <${gmailUser}>`,
      to: registration.email,
      subject: `🎉 [PU NSS Wing] Congratulations! You are Selected as NSS Volunteer 2026 - ${registration.registration_id}`,
      html: htmlContent
    });

    console.log(`[SELECTION EMAIL DELIVERED] Approval email sent to ${registration.email} for ${registration.registration_id}`);
    return true;
  } catch (err) {
    console.error(`[SELECTION EMAIL ERROR] Failed to send approval email to ${registration.email}:`, err.message);
    return false;
  }
}

/**
 * Send Unit Announcement / Alert Email to Selected Students
 * @param {object} options 
 * @param {Array} options.recipients - List of student objects { applicant_name, email, registration_id, unit_number }
 * @param {string} options.subject - Email subject
 * @param {string} options.announcementText - Announcement message content
 * @param {string} options.unitNumber - Target Unit
 */
async function sendUnitAnnouncementEmail({ recipients, subject, announcementText, unitNumber }) {
  if (!recipients || !Array.isArray(recipients) || recipients.length === 0) return { success: false, count: 0 };

  try {
    require('dotenv').config();
  } catch (e) {}

  const gmailUser = process.env.GMAIL_USER || 'nsspondiuni2409@gmail.com';
  const gmailPass = process.env.GMAIL_PASS || process.env.SMTP_PASS || 'qikdszaasapkypzu';

  if (!gmailPass || !nodemailer) {
    console.error('[ANNOUNCEMENT EMAIL SKIPPED] Nodemailer or SMTP pass missing.');
    return { success: false, count: 0, error: 'SMTP configuration or Nodemailer missing' };
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

  let successCount = 0;
  let lastError = null;

  for (const student of recipients) {
    if (!student.email) continue;

    const formattedMessage = (announcementText || '').replace(/\n/g, '<br>');

    const htmlContent = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
        <div style="background-color: #0F2042; color: #ffffff; padding: 25px 20px; text-align: center;">
          <h2 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0.5px;">PONDICHERRY UNIVERSITY</h2>
          <p style="margin: 6px 0 0 0; font-size: 13px; color: #f8fafc; text-transform: uppercase; letter-spacing: 1px;">NATIONAL SERVICE SCHEME (NSS) WING</p>
        </div>

        <div style="padding: 30px 25px; color: #1e293b; line-height: 1.6;">
          <div style="text-align: center; margin-bottom: 20px;">
            <span style="background-color: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; padding: 6px 18px; border-radius: 20px; font-weight: 800; font-size: 14px; display: inline-block;">
              📢 OFFICIAL ANNOUNCEMENT - ${unitNumber === 'All' ? 'ALL UNITS' : student.unit_number || unitNumber}
            </span>
          </div>

          <p style="font-size: 16px; font-weight: 700; color: #0F2042; margin-top: 0;">Dear ${student.applicant_name},</p>
          
          <p style="font-size: 15px; color: #334155;">
            An official announcement has been issued for your assigned NSS Unit (<strong>${student.unit_number}</strong>):
          </p>

          <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-left: 4px solid #0284c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h4 style="margin: 0 0 10px 0; color: #0F2042; font-size: 16px;">📌 ${subject}</h4>
            <div style="font-size: 14.5px; color: #334155; line-height: 1.6;">
              ${formattedMessage}
            </div>
          </div>

          <div style="background-color: #f1f5f9; padding: 12px 16px; border-radius: 6px; font-size: 13px; color: #475569; margin-bottom: 20px;">
            <strong>Volunteer Registration ID:</strong> ${student.registration_id} | <strong>Assigned Unit:</strong> ${student.unit_number}
          </div>

          <p style="font-size: 14px; color: #334155;">
            Please follow the instructions provided above. For any further queries, contact your Programme Officer / Coordinator.
          </p>

          <div style="margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 18px; font-size: 13px; color: #64748b;">
            <strong>Warm regards,</strong><br>
            NSS Programme Coordinator / Unit Team<br>
            Pondicherry University, Kalapet, Puducherry - 605014<br>
            Contact Email: <a href="mailto:nsspondiuni2409@gmail.com" style="color: #0284c7;">nsspondiuni2409@gmail.com</a>
          </div>
        </div>

        <div style="background-color: #f1f5f9; padding: 14px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
          &copy; 2026 National Service Scheme - Pondicherry University. All rights reserved.
        </div>
      </div>
    `;

    try {
      await transporter.sendMail({
        from: `"PU NSS Wing" <${gmailUser}>`,
        to: student.email,
        subject: `📢 [PU NSS Announcement] ${subject}`,
        html: htmlContent
      });
      successCount++;
    } catch (err) {
      console.error(`[ANNOUNCEMENT EMAIL ERROR] Failed for ${student.email}:`, err.message);
      lastError = err;
    }
  }

  return { success: successCount > 0, count: successCount, lastError: lastError ? lastError.message : null };
}

module.exports = { sendOTPEmail, sendSelectionApprovalEmail, sendUnitAnnouncementEmail };


