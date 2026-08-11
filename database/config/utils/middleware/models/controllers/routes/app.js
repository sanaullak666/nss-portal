/**
 * Express Application Configuration
 * Sets up middleware, template engine, static file routing, security, and global route mounting.
 */

const express = require('express');
const path = require('path');
const session = require('express-session');
const helmet = require('helmet');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Route Imports
const registrationRoutes = require('./routes/registrationRoutes');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Middleware Imports
const { setLocalAdmin } = require('./middleware/authMiddleware');

const app = express();

// Security Header Configuration via Helmet
app.use(
  helmet({
    contentSecurityPolicy: false, // Disabled for inline style execution on custom components
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

// Cross-Origin Resource Sharing
app.use(cors());

// Express Body Parsing Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Express Session Setup
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'nss_pu_fallback_secret_key_2026',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 2 // 2-hour session lifetime
    }
  })
);

// Serve Static Assets
app.use(express.static(path.join(__dirname, 'public')));

// Configure Views Directory & EJS Template Engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Global Locals Injection
app.use(setLocalAdmin);

// Register Web Application Routes
app.use('/', registrationRoutes);
app.use('/admin', authRoutes);
app.use('/admin', adminRoutes);

// Global 404 Route Handler
app.use((req, res) => {
  res.status(404).render('admin/login', {
    title: '404 - Page Not Found | Pondicherry University NSS',
    errors: {},
    oldInput: {},
    errorMessage: 'The page you requested could not be found.'
  });
});

// Global Centralized Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Application Error:', err.stack);
  res.status(500).send('An unexpected server error occurred. Please contact the administrator.');
});

module.exports = app;