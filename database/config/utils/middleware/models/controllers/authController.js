const db = require('../config/database');
const bcrypt = require('bcryptjs');

/**
 * Render Admin Login Page
 */
exports.renderLogin = (req, res) => {
  res.render('admin/login', {
    title: 'Admin Login - PU NSS Portal',
    error: req.query.error || null
  });
};

/**
 * Handle Admin Login Form Submission
 */
exports.handleLogin = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.render('admin/login', {
      title: 'Admin Login - PU NSS Portal',
      error: 'Please enter both username and password.'
    });
  }

  try {
    const [rows] = await db.query(
      'SELECT * FROM admins WHERE username = ? OR email = ? LIMIT 1',
      [username.trim(), username.trim()]
    );

    if (rows.length === 0) {
      return res.render('admin/login', {
        title: 'Admin Login - PU NSS Portal',
        error: 'Invalid credentials. Please check your username and password.'
      });
    }

    const admin = rows[0];
    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return res.render('admin/login', {
        title: 'Admin Login - PU NSS Portal',
        error: 'Invalid credentials. Please check your username and password.'
      });
    }

    // Update last login timestamp
    await db.query('UPDATE admins SET last_login = NOW() WHERE id = ?', [admin.id]);

    // Create session
    req.session.admin = {
      id: admin.id,
      username: admin.username,
      fullName: admin.full_name,
      email: admin.email,
      role: admin.role
    };

    res.redirect('/admin/dashboard');
  } catch (err) {
    console.error('Login Error:', err);
    res.render('admin/login', {
      title: 'Admin Login - PU NSS Portal',
      error: 'A server error occurred during login. Please try again.'
    });
  }
};

/**
 * Handle Admin Logout
 */
exports.handleLogout = (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error('Logout Session Destroy Error:', err);
    res.clearCookie('connect.sid');
    res.redirect('/admin/login');
  });
};