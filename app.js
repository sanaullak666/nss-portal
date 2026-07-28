const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const csurf = require('csurf');
const helmet = require('helmet');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security Headers via Helmet
app.use(helmet({
  contentSecurityPolicy: false // Allows inline Chart.js scripts
}));

// Body Parsers with Trimming
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  if (req.body) {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim();
      }
    }
  }
  next();
});

app.use(cookieParser());

// Static Folder Mappings
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Secure Session Config
app.use(session({
  secret: process.env.SESSION_SECRET || 'nss_pu_secure_secret_key_2026',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// CSRF Protection Middleware
const csrfProtection = csurf({ cookie: true });
app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken ? req.csrfToken() : '';
  next();
});

// App Routes
const authRoutes = require('./routes/authRoutes');
const registrationRoutes = require('./routes/registrationRoutes');
const adminRoutes = require('./routes/adminRoutes');

app.use('/admin', authRoutes);
app.use('/admin', adminRoutes);
app.use('/', registrationRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).render('404');
});

// 500 Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Application Error:', err);
  res.status(500).render('500');
});

// Database Connection & Boot
const db = require('./config/database');

db.getConnection()
  .then(connection => {
    console.log('✅ Database connection test successful.');
    connection.release();
    app.listen(PORT, () => {
      console.log('====================================================');
      console.log(`🚀 Pondicherry University NSS Portal Live`);
      console.log(`🌐 Active on: http://localhost:${PORT}`);
      console.log('====================================================');
    });
  })
  .catch(err => console.error('❌ Database connection failed:', err.message));
