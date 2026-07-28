const express = require('express');
const router = express.Router();
const db = require('../config/database');
const bcrypt = require('bcryptjs');
const { logAudit } = require('../utils/auditLogger');

router.get('/login', (req, res) => {
  if (req.session && req.session.admin) {
    return res.redirect('/admin/dashboard');
  }
  res.render('admin/login', {
    title: 'Admin Login - PU NSS Portal',
    error: null
  });
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.render('admin/login', {
      title: 'Admin Login - PU NSS Portal',
      error: 'Please enter both username and password.'
    });
  }

  try {
    const [rows] = await db.query('SELECT * FROM admins WHERE username = ? LIMIT 1', [username.trim()]);

    if (rows.length === 0) {
      return res.render('admin/login', {
        title: 'Admin Login - PU NSS Portal',
        error: 'Invalid username or password.'
      });
    }

    const admin = rows[0];
    const isMatch = await bcrypt.compare(password, admin.password_hash);

    if (!isMatch) {
      return res.render('admin/login', {
        title: 'Admin Login - PU NSS Portal',
        error: 'Invalid username or password.'
      });
    }

    // Set session
    req.session.admin = {
      id: admin.id,
      username: admin.username,
      email: admin.email
    };

    await logAudit('LOGIN', admin.username, 'Admin logged in successfully');
    res.redirect('/admin/dashboard');

  } catch (err) {
    console.error('Login Error:', err.message);
    res.render('admin/login', {
      title: 'Admin Login - PU NSS Portal',
      error: 'A server error occurred during login. Please try again.'
    });
  }
});

router.get('/logout', async (req, res) => {
  if (req.session && req.session.admin) {
    await logAudit('LOGOUT', req.session.admin.username, 'Admin logged out');
    req.session.destroy();
  }
  res.redirect('/admin/login');
});

module.exports = router;
