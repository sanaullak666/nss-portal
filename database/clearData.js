const db = require('./config/database');

async function clearRegistrations() {
  try {
    await db.query('TRUNCATE TABLE registrations');
    console.log('✅ All registration data has been successfully deleted from the database.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error clearing registrations table:', err.message);
    process.exit(1);
  }
}

clearRegistrations();
