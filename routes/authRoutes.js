const express = require('express');
const router = express.Router();
const db = require('../config/database');
const bcrypt = require('bcryptjs');
const csurf = require('csurf');
const { logAudit } = require('../utils/auditLogger');

const csrfProtection = csurf({ 
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  }
});

router.get('/admin/login', csrfProtection, (req, res) => {
  if (req.session && req.session.admin) {
    return res.redirect('/admin/dashboard');
  }
  res.render('admin/login', {
    title: 'Admin Login - PU NSS Portal',
    csrfToken: req.csrfToken(),
    error: null
  });
});

router.post('/admin/login', csrfProtection, async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.render('admin/login', {
      title: 'Admin Login - PU NSS Portal',
      csrfToken: req.csrfToken(),
      error: 'Please enter both username and password.'
    });
  }

  try {
    const [rows] = await db.query('SELECT * FROM admins WHERE username = ? LIMIT 1', [username.trim()]);

    if (rows.length === 0) {
      return res.render('admin/login', {
        title: 'Admin Login - PU NSS Portal',
        csrfToken: req.csrfToken(),
        error: 'Invalid username or password.'
      });
    }

    const admin = rows[0];
    const isMatch = await bcrypt.compare(password, admin.password_hash);

    if (!isMatch) {
      return res.render('admin/login', {
        title: 'Admin Login - PU NSS Portal',
        csrfToken: req.csrfToken(),
        error: 'Invalid username or password.'
      });
    }

    req.session.admin = {
      id: admin.id,
      username: admin.username,
      email: admin.email
    };

    req.session.save(async (err) => {
      if (err) {
        return res.render('admin/login', {
          title: 'Admin Login - PU NSS Portal',
          csrfToken: req.csrfToken(),
          error: 'Session initialization failed. Please try again.'
        });
      }
      
      try {
        await logAudit('LOGIN', admin.username, 'Admin logged in successfully');
      } catch (aErr) {}

      res.redirect('/admin/dashboard');
    });

  } catch (err) {
    console.error('Login Error:', err.message);
    res.render('admin/login', {
      title: 'Admin Login - PU NSS Portal',
      csrfToken: req.csrfToken(),
      error: 'Server error during login. Please try again.'
    });
  }
});

router.get('/admin/logout', (req, res) => {
  if (req.session) {
    req.session.destroy(() => {
      res.redirect('/admin/login');
    });
  } else {
    res.redirect('/admin/login');
  }
});

module.exports = router;
