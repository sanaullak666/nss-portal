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

    // Assign session data
    req.session.admin = {
      id: admin.id,
      username: admin.username,
      email: admin.email
    };

    // Save session explicitly before redirecting
    req.session.save(async (err) => {
      if (err) {
        console.error('Session Save Error:', err);
        return res.render('admin/login', {
          title: 'Admin Login - PU NSS Portal',
          error: 'Session error. Please try again.'
        });
      }
      
      try {
        await logAudit('LOGIN', admin.username, 'Admin logged in successfully');
      } catch (aErr) {
        console.error('Audit log error:', aErr.message);
      }
      
      res.redirect('/admin/dashboard');
    });

  } catch (err) {
    console.error('Login Error:', err.message);
    res.render('admin/login', {
      title: 'Admin Login - PU NSS Portal',
      error: 'Server error during authentication.'
    });
  }
});

router.get('/logout', (req, res) => {
  if (req.session) {
    req.session.destroy(() => {
      res.redirect('/admin/login');
    });
  } else {
    res.redirect('/admin/login');
  }
});

module.exports = router;
