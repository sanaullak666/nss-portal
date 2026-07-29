const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const os = require('os');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Database Connection Pool
const db = require('./config/database');

// Ensure local uploads directory exists if writable
const uploadDir = path.join(__dirname, 'uploads');
try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (e) {}

// Trust Reverse Proxy for Vercel / Production deployment
app.set('trust proxy', 1);

// Security Headers (Helmet with CSP for Chart.js & Google Fonts)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net"],
        styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
        fontSrc: ["'self'", "fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "blob:"],
        connectSrc: ["'self'"]
      }
    }
  })
);

// Body Parsers & String Trimming Middleware
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

// Cookie Parser & MySQL Serverless Session Store
app.use(cookieParser());

const sessionStore = new MySQLStore({
  expiration: 24 * 60 * 60 * 1000,
  createDatabaseTable: true,
  schema: {
    tableName: 'sessions',
    columnNames: {
      session_id: 'session_id',
      expires: 'expires',
      data: 'data'
    }
  }
}, db);

app.use(
  session({
    key: 'nss_session_id',
    secret: process.env.SESSION_SECRET || 'nss_pu_secure_secret_key_2026',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: {
      httpOnly: true,
      secure: false, // Ensure session cookies are sent across Vercel proxies
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 Hours
    }
  })
);

// Dynamic Certificate Uploads Route (Fetches certificate from MySQL Blob first, then static fallbacks)
app.get('/uploads/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const [rows] = await db.query(
      'SELECT certificate_data, certificate_mimetype FROM registrations WHERE certificate_path = ? LIMIT 1',
      [filename]
    );
    if (rows.length > 0 && rows[0].certificate_data) {
      res.setHeader('Content-Type', rows[0].certificate_mimetype || 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      return res.send(rows[0].certificate_data);
    }
  } catch (e) {
    console.error('Database certificate retrieval error:', e.message);
  }

  const localFile = path.join(__dirname, 'uploads', req.params.filename);
  if (fs.existsSync(localFile)) {
    return res.sendFile(localFile);
  }
  const tmpFile = path.join(os.tmpdir(), req.params.filename);
  if (fs.existsSync(tmpFile)) {
    return res.sendFile(tmpFile);
  }

  res.status(404).send('Certificate file not found');
});

// Static Asset Directories (Serve uploaded files from both local uploads/ and OS /tmp for Vercel)
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads', express.static(os.tmpdir()));

// View Engine Setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Import Routes
const registrationRoutes = require('./routes/registrationRoutes');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Mount Routes
app.use('/', registrationRoutes);
app.use('/', authRoutes);
app.use('/', adminRoutes);

// Direct Redirect from /admin to /admin/dashboard or /admin/login
app.get('/admin', (req, res) => {
  if (req.session && req.session.admin) {
    return res.redirect('/admin/dashboard');
  }
  res.redirect('/admin/login');
});

// 404 Page Not Found Handler
app.use((req, res) => {
  res.status(404).render('404', { title: '404 - Page Not Found | PU NSS Portal' });
});

// 500 Server Error Handler
app.use((err, req, res, next) => {
  console.error('SERVER ERROR LOG:', err);
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).render('403', { title: '403 - Invalid Token | PU NSS Portal' });
  }
  res.status(500).render('500', { title: '500 - Server Error | PU NSS Portal' });
});

// Auto-Migrate Database Schema Safely
async function autoMigrate(connection) {
  // 1. Ensure registrations table & columns
  await connection.query(`
    CREATE TABLE IF NOT EXISTS registrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      registration_id VARCHAR(50) UNIQUE NOT NULL,
      unit_number VARCHAR(20) NOT NULL,
      department VARCHAR(150) NOT NULL,
      course VARCHAR(100) NOT NULL,
      year_of_study VARCHAR(30) NOT NULL,
      applicant_name VARCHAR(150) NOT NULL,
      univ_reg_no VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(150) UNIQUE NOT NULL,
      contact_number VARCHAR(15) NOT NULL,
      alt_contact_number VARCHAR(15) DEFAULT NULL,
      gender VARCHAR(30) NOT NULL,
      dob DATE NOT NULL,
      age INT NOT NULL,
      blood_group VARCHAR(30) NOT NULL,
      aadhaar_number VARCHAR(20) UNIQUE NOT NULL,
      native_state VARCHAR(100) NOT NULL,
      present_address TEXT NOT NULL,
      permanent_address TEXT NOT NULL,
      is_same_address TINYINT(1) DEFAULT 0,
      languages_spoken TEXT NOT NULL,
      is_previous_volunteer VARCHAR(10) NOT NULL,
      certificate_path VARCHAR(255) DEFAULT NULL,
      certificate_data MEDIUMBLOB DEFAULT NULL,
      certificate_mimetype VARCHAR(100) DEFAULT NULL,
      interested_in_media VARCHAR(10) NOT NULL DEFAULT 'No',
      media_roles TEXT DEFAULT NULL,
      extra_curricular_skills TEXT DEFAULT NULL,
      interested_in_leadership VARCHAR(10) NOT NULL DEFAULT 'No',
      declaration_accepted TINYINT(1) NOT NULL DEFAULT 1,
      status VARCHAR(20) NOT NULL DEFAULT 'Active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  try {
    const [certDataCol] = await connection.query(`SHOW COLUMNS FROM registrations LIKE 'certificate_data'`);
    if (certDataCol.length === 0) {
      await connection.query(`ALTER TABLE registrations ADD COLUMN certificate_data MEDIUMBLOB DEFAULT NULL AFTER certificate_path`);
    }

    const [certMimeCol] = await connection.query(`SHOW COLUMNS FROM registrations LIKE 'certificate_mimetype'`);
    if (certMimeCol.length === 0) {
      await connection.query(`ALTER TABLE registrations ADD COLUMN certificate_mimetype VARCHAR(100) DEFAULT NULL AFTER certificate_data`);
    }

    const [extraSkillsCol] = await connection.query(`SHOW COLUMNS FROM registrations LIKE 'extra_curricular_skills'`);
    if (extraSkillsCol.length === 0) {
      await connection.query(`ALTER TABLE registrations ADD COLUMN extra_curricular_skills TEXT DEFAULT NULL AFTER media_roles`);
    }

    const [leadershipCol] = await connection.query(`SHOW COLUMNS FROM registrations LIKE 'interested_in_leadership'`);
    if (leadershipCol.length === 0) {
      await connection.query(`ALTER TABLE registrations ADD COLUMN interested_in_leadership VARCHAR(10) NOT NULL DEFAULT 'No' AFTER extra_curricular_skills`);
    }

    const [statusCol] = await connection.query(`SHOW COLUMNS FROM registrations LIKE 'status'`);
    if (statusCol.length === 0) {
      await connection.query(`ALTER TABLE registrations ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'Active' AFTER declaration_accepted`);
    }

    await connection.query("DELETE FROM registrations WHERE status = 'Deleted'");
  } catch (e) {}

  // 2. Ensure audit_logs table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      action VARCHAR(50) NOT NULL,
      performed_by VARCHAR(100) NOT NULL,
      details TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // 3. Ensure admins table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS admins (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      full_name VARCHAR(100) NOT NULL DEFAULT 'PU NSS Super Administrator',
      email VARCHAR(150) UNIQUE NOT NULL,
      role VARCHAR(30) NOT NULL DEFAULT 'superadmin',
      last_login DATETIME DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  try {
    const [passHashCol] = await connection.query(`SHOW COLUMNS FROM admins LIKE 'password_hash'`);
    if (passHashCol.length === 0) {
      const [oldPassCol] = await connection.query(`SHOW COLUMNS FROM admins LIKE 'password'`);
      if (oldPassCol.length > 0) {
        await connection.query(`ALTER TABLE admins CHANGE COLUMN \`password\` \`password_hash\` VARCHAR(255) NOT NULL`);
      } else {
        await connection.query(`ALTER TABLE admins ADD COLUMN \`password_hash\` VARCHAR(255) NOT NULL`);
      }
    }

    const [fullNameCol] = await connection.query(`SHOW COLUMNS FROM admins LIKE 'full_name'`);
    if (fullNameCol.length === 0) {
      await connection.query(`ALTER TABLE admins ADD COLUMN \`full_name\` VARCHAR(100) NOT NULL DEFAULT 'PU NSS Super Administrator'`);
    }

    const [roleCol] = await connection.query(`SHOW COLUMNS FROM admins LIKE 'role'`);
    if (roleCol.length === 0) {
      await connection.query(`ALTER TABLE admins ADD COLUMN \`role\` VARCHAR(30) NOT NULL DEFAULT 'superadmin'`);
    }

    const [lastLoginCol] = await connection.query(`SHOW COLUMNS FROM admins LIKE 'last_login'`);
    if (lastLoginCol.length === 0) {
      await connection.query(`ALTER TABLE admins ADD COLUMN \`last_login\` DATETIME DEFAULT NULL`);
    }
  } catch (mErr) {
    console.error('Admin table migration notice:', mErr.message);
  }

  // Seed default admin user
  const adminHash = await bcrypt.hash('Admin@NSS2026', 10);
  await connection.query(
    `INSERT INTO admins (username, password_hash, full_name, email, role) 
     VALUES ('admin', ?, 'PU NSS Super Administrator', 'nssadmin@pondiuni.edu.in', 'superadmin') 
     ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
    [adminHash]
  );
}

// Database Auto-Initialization
let migrationDone = false;
async function initDb() {
  if (migrationDone) return;
  try {
    const connection = await db.getConnection();
    await autoMigrate(connection);
    connection.release();
    migrationDone = true;
    console.log('✅ Database schema verified and migrated successfully.');
  } catch (err) {
    console.error('⚠️ Database connection/migration warning:', err.message);
  }
}

// Ensure database is initialized
initDb();

// Start HTTP Server when running locally
if (require.main === module || process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`🚀 PU NSS Volunteer Registration Portal running on http://localhost:${PORT}`);
  });
}

module.exports = app;
