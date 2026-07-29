const bcrypt = require('bcryptjs');
const AdminModel = require('../models/adminModel');
const { logAudit } = require('../utils/auditLogger');

exports.renderLogin = (req, res) => {
  if (req.session && req.session.admin) {
    return res.redirect('/admin/dashboard');
  }
  res.render('admin/login', {
    title: 'Admin Login - PU NSS Portal',
    csrfToken: req.csrfToken ? req.csrfToken() : '',
    error: req.query.error || null
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

    await AdminModel.updateLastLogin(admin.id);

    req.session.admin = {
      id: admin.id,
      username: admin.username,
      fullName: admin.full_name || admin.username,
      email: admin.email,
      role: admin.role || 'admin'
    };

    req.session.save(async (err) => {
      if (err) {
        return res.render('admin/login', {
          title: 'Admin Login - PU NSS Portal',
          csrfToken: req.csrfToken ? req.csrfToken() : '',
          error: 'Session initialization failed. Please try again.'
        });
      }

      try {
        await logAudit('LOGIN', admin.username, 'Admin logged in successfully');
      } catch (aErr) {}

      res.redirect('/admin/dashboard');
    });

  } catch (err) {
    console.error('Login Error:', err);
    res.render('admin/login', {
      title: 'Admin Login - PU NSS Portal',
      csrfToken: req.csrfToken ? req.csrfToken() : '',
      error: 'Server error during login. Please try again.'
    });
  }
};

exports.handleLogout = (req, res) => {
  const username = req.session && req.session.admin ? req.session.admin.username : 'Unknown';
  if (req.session) {
    req.session.destroy(async () => {
      try {
        await logAudit('LOGOUT', username, 'Admin logged out');
      } catch (aErr) {}
      res.clearCookie('connect.sid');
      res.redirect('/admin/login');
    });
  } else {
    res.redirect('/admin/login');
  }
};
