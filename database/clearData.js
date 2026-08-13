const db = require('../config/database');

async function clearRegistrations() {
  try {
    await db.query('TRUNCATE TABLE registrations RESTART IDENTITY CASCADE');
    try {
      await db.query('TRUNCATE TABLE audit_logs RESTART IDENTITY CASCADE');
    } catch (e) {}
    try {
      await db.query('TRUNCATE TABLE admin_otps RESTART IDENTITY CASCADE');
    } catch (e) {}
    console.log('✅ All registration, audit log, and OTP data has been successfully deleted from the database.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error clearing database:', err.message);
    process.exit(1);
  }
}

clearRegistrations();

