const db = require('../config/database');
const bcrypt = require('bcryptjs');

async function reseedAdmin() {
  try {
    const hashedPassword = await bcrypt.hash('Admin@NSS2026', 10);

    await db.query("DELETE FROM admins WHERE username = 'admin'");

    await db.query(
      `INSERT INTO admins (username, password_hash, full_name, email, role) 
       VALUES (?, ?, ?, ?, ?)`,
      ['admin', hashedPassword, 'PU NSS Super Administrator', 'nssadmin@pondiuni.edu.in', 'superadmin']
    );

    console.log('✅ Admin credentials successfully reset!');
    console.log('🔑 Username: admin');
    console.log('🔑 Password: Admin@NSS2026');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error reseeding admin:', err);
    process.exit(1);
  }
}

reseedAdmin();
