const bcrypt = require('bcryptjs');
const AdminModel = require('../models/adminModel');
const { logAudit } = require('../utils/auditLogger');

const { sendOTPEmail, sendLoginOTPEmail, sendLoginNotificationEmail } = require('../utils/emailService');

exports.renderLogin = (req, res) => {
  if (req.session && req.session.admin) {
    return res.redirect('/admin/dashboard');
  }
  if (req.session && req.session.pendingLogin) {
    return res.redirect('/admin/verify-login-otp');
  }
  res.render('admin/login', {
    title: 'Admin Login - PU NSS Portal',
    csrfToken: req.csrfToken ? req.csrfToken() : '',
    error: req.query.error || null,
    success: req.query.success || null
  });
};

exports.handleLogin = async (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.render('admin/login', {
      title: 'Admin Login - PU NSS Portal',
      csrfToken: req.csrfToken ? req.csrfToken() : '',
      error: 'Please enter both username and password.'
    });
  }

  try {
    const admin = await AdminModel.findByUsernameOrEmail(username);

    if (!admin) {
      return res.render('admin/login', {
        title: 'Admin Login - PU NSS Portal',
        csrfToken: req.csrfToken ? req.csrfToken() : '',
        error: 'Invalid username or password.'
      });
    }

    const hashToCompare = admin.password_hash || admin.password;
    const isMatch = await bcrypt.compare(password, hashToCompare);

    if (!isMatch) {
      return res.render('admin/login', {
        title: 'Admin Login - PU NSS Portal',
        csrfToken: req.csrfToken ? req.csrfToken() : '',
        error: 'Invalid username or password.'
      });
    }

    // Generate 6-digit OTP for 2FA Login Verification
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // Valid for 10 minutes
    const targetEmail = 'nsspondiuni2409@gmail.com';

    // Save OTP to DB
    await AdminModel.saveOTP(admin.id, targetEmail, otpCode, expiresAt);

    // Save pending login state in session
    req.session.pendingLogin = {
      adminId: admin.id,
      username: admin.username,
      fullName: admin.full_name || admin.username,
      email: admin.email || targetEmail,
      targetEmail: targetEmail,
      role: admin.role || 'admin'
    };

    // Send 2FA Login OTP Email
    await sendLoginOTPEmail(targetEmail, otpCode, admin.username);

    req.session.save((err) => {
      if (err) {
        return res.render('admin/login', {
          title: 'Admin Login - PU NSS Portal',
          csrfToken: req.csrfToken ? req.csrfToken() : '',
          error: 'Session initialization failed. Please try again.'
        });
      }
      res.redirect('/admin/verify-login-otp');
    });

  } catch (err) {
    console.error('Login Error:', err);
    res.render('admin/login', {
      title: 'Admin Login - PU NSS Portal',
      csrfToken: req.csrfToken ? req.csrfToken() : '',
      error: `Server error during login: ${err.message || 'Please try again.'}`
    });
  }
};

exports.renderVerifyLoginOTP = (req, res) => {
  if (!req.session || !req.session.pendingLogin) {
    return res.redirect('/admin/login');
  }
  const pending = req.session.pendingLogin;
  res.render('admin/verify-login-otp', {
    title: '2FA Login Verification - PU NSS Portal',
    csrfToken: req.csrfToken ? req.csrfToken() : '',
    email: pending.targetEmail || 'nsspondiuni2409@gmail.com',
    error: req.query.error || null,
    success: req.query.success || `A 6-digit login verification OTP has been sent to ${pending.targetEmail || 'nsspondiuni2409@gmail.com'}.`
  });
};

exports.handleVerifyLoginOTP = async (req, res) => {
  if (!req.session || !req.session.pendingLogin) {
    return res.redirect('/admin/login?error=Login+session+expired.+Please+log+in+again.');
  }

  const { otp_code } = req.body || {};
  const pending = req.session.pendingLogin;
  const targetEmail = pending.targetEmail || 'nsspondiuni2409@gmail.com';

  if (!otp_code || otp_code.trim().length !== 6) {
    return res.render('admin/verify-login-otp', {
      title: '2FA Login Verification - PU NSS Portal',
      csrfToken: req.csrfToken ? req.csrfToken() : '',
      email: targetEmail,
      error: 'Please enter the 6-digit OTP code sent to your email.',
      success: null
    });
  }

  try {
    const validOtp = await AdminModel.verifyOTP(targetEmail, otp_code.trim());

    if (!validOtp) {
      return res.render('admin/verify-login-otp', {
        title: '2FA Login Verification - PU NSS Portal',
        csrfToken: req.csrfToken ? req.csrfToken() : '',
        email: targetEmail,
        error: 'Invalid or expired OTP code. Please check your email or click Resend Login OTP.',
        success: null
      });
    }

    // Mark OTP as used
    await AdminModel.markOTPUsed(validOtp.id);

    // Promote pending login to full active admin session
    req.session.admin = {
      id: pending.adminId,
      username: pending.username,
      fullName: pending.fullName,
      email: pending.email,
      role: pending.role
    };
    req.session.lastActivity = Date.now();
    delete req.session.pendingLogin;

    req.session.save(async (err) => {
      if (err) {
        return res.render('admin/verify-login-otp', {
          title: '2FA Login Verification - PU NSS Portal',
          csrfToken: req.csrfToken ? req.csrfToken() : '',
          email: targetEmail,
          error: 'Session initialization failed. Please try again.',
          success: null
        });
      }

      try {
        await AdminModel.updateLastLogin(pending.adminId);
        await AdminModel.invalidateOtherSessions(req.sessionID, pending.username);
        await logAudit('LOGIN_2FA_SUCCESS', pending.username, 'Admin logged in via 2FA Email OTP');

        // Send Security Alert Email Notification in background
        const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown IP';
        const clientIp = rawIp.split(',')[0].trim();
        const userAgent = req.headers['user-agent'] || 'Unknown Browser';
        
        sendLoginNotificationEmail(targetEmail, {
          username: pending.username,
          ip: clientIp,
          userAgent: userAgent,
          time: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
        }).catch(() => {});

      } catch (e) {}

      res.redirect('/admin/dashboard');
    });

  } catch (err) {
    console.error('Verify Login OTP Error:', err);
    res.render('admin/verify-login-otp', {
      title: '2FA Login Verification - PU NSS Portal',
      csrfToken: req.csrfToken ? req.csrfToken() : '',
      email: targetEmail,
      error: `Verification error: ${err.message || 'Please try again.'}`,
      success: null
    });
  }
};

exports.handleResendLoginOTP = async (req, res) => {
  if (!req.session || !req.session.pendingLogin) {
    return res.redirect('/admin/login?error=Session+expired.+Please+log+in+again.');
  }

  const pending = req.session.pendingLogin;
  const targetEmail = pending.targetEmail || 'nsspondiuni2409@gmail.com';

  try {
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await AdminModel.saveOTP(pending.adminId, targetEmail, otpCode, expiresAt);
    await sendLoginOTPEmail(targetEmail, otpCode, pending.username);

    res.redirect('/admin/verify-login-otp?success=A+new+6-digit+login+OTP+has+been+sent+to+' + encodeURIComponent(targetEmail));
  } catch (err) {
    console.error('Resend Login OTP Error:', err);
    res.redirect('/admin/verify-login-otp?error=Failed+to+resend+OTP.+Please+try+again.');
  }
};

exports.handleLogout = (req, res) => {
  const username = req.session && req.session.admin ? req.session.admin.username : 'Unknown';
  if (req.session) {
    req.session.destroy(async () => {
      try {
        await logAudit('LOGOUT', username, 'Admin logged out');
      } catch (aErr) {}
      res.clearCookie('nss_session_id', { path: '/' });
      res.clearCookie('connect.sid', { path: '/' });
      res.redirect('/admin/login?success=Logged+out+successfully.');
    });
  } else {
    res.redirect('/admin/login');
  }
};

// --- ADMIN PASSWORD RESET VIA EMAIL OTP ---


exports.renderForgotPassword = (req, res) => {
  res.render('admin/forgot-password', {
    title: 'Admin Password Reset - PU NSS Portal',
    csrfToken: req.csrfToken ? req.csrfToken() : '',
    defaultEmail: '',
    error: null,
    success: null
  });
};

exports.handleSendOTP = async (req, res) => {
  const targetEmail = (req.body.email || '').trim().toLowerCase();
  const ALLOWED_EMAILS = ['sanaullaamini@gmail.com', 'sanaullak294@gmail.com', 'nsspondiuni2409@gmail.com', 'mohammedajsalsadique@gmail.com'];

  // Email Authorization Check
  if (!ALLOWED_EMAILS.includes(targetEmail)) {
    return res.render('admin/forgot-password', {
      title: 'Admin Password Reset - PU NSS Portal',
      csrfToken: req.csrfToken ? req.csrfToken() : '',
      defaultEmail: targetEmail,
      error: 'Unauthorized email address. OTP can only be sent to registered admin emails.',
      success: null
    });
  }

  try {
    let activeAdmin = await AdminModel.findByUsernameOrEmail(targetEmail);
    if (!activeAdmin) {
      activeAdmin = await AdminModel.findByUsernameOrEmail('admin');
    }

    if (!activeAdmin) {
      return res.render('admin/forgot-password', {
        title: 'Admin Password Reset - PU NSS Portal',
        csrfToken: req.csrfToken ? req.csrfToken() : '',
        defaultEmail: targetEmail,
        error: 'Admin account not found in database.',
        success: null
      });
    }

    // Generate 6-digit random OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Expiration: 10 minutes from now
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Save to DB
    await AdminModel.saveOTP(activeAdmin.id, targetEmail, otpCode, expiresAt);

    // Send email
    await sendOTPEmail(targetEmail, otpCode);

    res.render('admin/verify-otp', {
      title: 'Verify OTP & Change Password - PU NSS Portal',
      csrfToken: req.csrfToken ? req.csrfToken() : '',
      email: targetEmail,
      otpCode: '',
      error: null,
      success: `A 6-digit verification OTP has been sent to ${targetEmail}. Please check your inbox/spam folder.`
    });

  } catch (err) {
    console.error('Send OTP Error:', err);
    res.render('admin/forgot-password', {
      title: 'Admin Password Reset - PU NSS Portal',
      csrfToken: req.csrfToken ? req.csrfToken() : '',
      defaultEmail: targetEmail,
      error: `Failed to send OTP email: ${err.message || 'Please try again.'}`,
      success: null
    });
  }
};

exports.renderVerifyOTP = (req, res) => {
  res.render('admin/verify-otp', {
    title: 'Verify OTP & Change Password - PU NSS Portal',
    csrfToken: req.csrfToken ? req.csrfToken() : '',
    email: req.query.email || '',
    otpCode: '',
    error: null,
    success: null
  });
};

exports.handleVerifyOTP = async (req, res) => {
  const { email, otp_code, new_password, confirm_password } = req.body || {};
  const cleanEmail = (email || '').trim().toLowerCase();

  if (!otp_code || !new_password || !confirm_password) {
    return res.render('admin/verify-otp', {
      title: 'Verify OTP & Change Password - PU NSS Portal',
      csrfToken: req.csrfToken ? req.csrfToken() : '',
      email: cleanEmail,
      otpCode: otp_code || '',
      error: 'Please fill in all required fields (OTP, New Password, Confirm Password).',
      success: null
    });
  }

  if (new_password.length < 6) {
    return res.render('admin/verify-otp', {
      title: 'Verify OTP & Change Password - PU NSS Portal',
      csrfToken: req.csrfToken ? req.csrfToken() : '',
      email: cleanEmail,
      otpCode: otp_code,
      error: 'New password must be at least 6 characters long.',
      success: null
    });
  }

  if (new_password !== confirm_password) {
    return res.render('admin/verify-otp', {
      title: 'Verify OTP & Change Password - PU NSS Portal',
      csrfToken: req.csrfToken ? req.csrfToken() : '',
      email: cleanEmail,
      otpCode: otp_code,
      error: 'New password and confirmation password do not match.',
      success: null
    });
  }

  try {
    const validOtp = await AdminModel.verifyOTP(cleanEmail, otp_code);

    if (!validOtp) {
      return res.render('admin/verify-otp', {
        title: 'Verify OTP & Change Password - PU NSS Portal',
        csrfToken: req.csrfToken ? req.csrfToken() : '',
        email: cleanEmail,
        otpCode: otp_code,
        error: 'Invalid or expired OTP code. Please request a new OTP.',
        success: null
      });
    }

    // Hash new password
    const newHash = await bcrypt.hash(new_password, 10);

    // Update password in DB
    await AdminModel.updatePassword(validOtp.admin_id, newHash);

    // Mark OTP used
    await AdminModel.markOTPUsed(validOtp.id);

    try {
      await logAudit('PASSWORD_CHANGE_OTP', cleanEmail, 'Admin password changed successfully using OTP');
    } catch (e) {}

    res.render('admin/login', {
      title: 'Admin Login - PU NSS Portal',
      csrfToken: req.csrfToken ? req.csrfToken() : '',
      error: null,
      success: 'Your admin password has been changed successfully! Please log in with your new password.'
    });

  } catch (err) {
    console.error('Verify OTP Error:', err);
    res.render('admin/verify-otp', {
      title: 'Verify OTP & Change Password - PU NSS Portal',
      csrfToken: req.csrfToken ? req.csrfToken() : '',
      email: cleanEmail,
      otpCode: otp_code,
      error: 'An error occurred while updating your password. Please try again.',
      success: null
    });
  }
};
