const db = require('../config/database');

async function checkCloudDb() {
  try {
    const [rows] = await db.query('SELECT 1 as connected');
    console.log('⚡ Connected to PostgreSQL Database successfully!');
  } catch (err) {
    console.error('❌ Failed to connect to database:', err.message);
  }
}

checkCloudDb();
