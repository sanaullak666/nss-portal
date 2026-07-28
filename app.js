const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const csurf = require('csurf');
const helmet = require('helmet');
const path = require('path');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// IMPORTANT: Trust Render's reverse proxy for HTTPS cookies
app.set('trust proxy', 1);

// Security Headers
app.use(helmet({ contentSecurityPolicy: false }));

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

// Session Config (Works smoothly on Render HTTPS)
app.use(session({
  secret: process.env.SESSION_SECRET || 'nss_pu_secure_secret_key_2026',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// CSRF Protection
const csrfProtection = csurf({ cookie: true });
app.use(csrfProtection);

app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken ? req.csrfToken() : '';
  next();
});

// Static Folders
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
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
  if (err.code === 'EBADCSRFTOKEN') {
    console.error('CSRF Token Mismatch Error');
    return res.status(403).render('admin/login', {
      title: 'Admin Login - PU NSS Portal',
      error: 'Session expired or invalid token. Please try logging in again.'
    });
  }
  console.error('Unhandled Application Error:', err);
  res.status(500).render('500');
});

// Boot logic
async function bootServer() {
  const host = process.env.DB_HOST || 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com';
  const port = parseInt(process.env.DB_PORT, 10) || 4000;
  const user = process.env.DB_USER || '31C3t8dhjKFJoEL.root';
  const password = process.env.DB_PASSWORD || 'R1uh8uj3atlkVeNR';
  const dbName = process.env.DB_NAME || 'nss_portal';

  try {
    const conn = await mysql.createConnection({
      host, port, user, password,
      ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: false }
    });

    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
    await conn.end();

    const db = require('./config/database');
    const connection = await db.getConnection();

    await connection.query(`
      CREATE TABLE IF NOT EXISTS registrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        registration_id VARCHAR(50) UNIQUE,
        applicant_name VARCHAR(150),
        univ_reg_no VARCHAR(50),
        email VARCHAR(100),
        contact_number VARCHAR(15),
        alt_contact_number VARCHAR(15),
        department VARCHAR(100),
        course VARCHAR(100),
        year_of_study VARCHAR(20),
        unit_number VARCHAR(20),
        gender VARCHAR(20),
        dob DATE,
        age INT,
        blood_group VARCHAR(10),
        aadhaar_number VARCHAR(20),
        native_state VARCHAR(100),
        present_address TEXT,
        permanent_address TEXT,
        is_previous_volunteer VARCHAR(10),
        certificate_path VARCHAR(255),
        interested_in_media VARCHAR(10),
        media_roles TEXT,
        languages_spoken TEXT,
        declaration_accepted TINYINT(1),
        status VARCHAR(20) DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        action VARCHAR(50) NOT NULL,
        performed_by VARCHAR(100) NOT NULL,
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        email VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    // Reset password hash to ensure exact match for Admin@NSS2026
    const hash = await bcrypt.hash('Admin@NSS2026', 10);
    await connection.query(
      `INSERT INTO admins (username, password_hash, email) 
       VALUES ('admin', ?, 'admin@pondiuni.edu.in') 
       ON DUPLICATE KEY UPDATE password_hash = ?`,
      [hash, hash]
    );

    connection.release();

    app.listen(PORT, () => {
      console.log(`🚀 PU NSS Portal Live on Port ${PORT}`);
    });

  } catch (err) {
    console.error('❌ Boot Error:', err.message);
    app.listen(PORT);
  }
}

bootServer();
