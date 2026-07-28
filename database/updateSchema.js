const db = require('./config/database');

async function updateSchema() {
  try {
    const connection = await db.getConnection();
    
    // Add Soft Delete Status column if missing
    try {
      await connection.query(`ALTER TABLE registrations ADD COLUMN status VARCHAR(20) DEFAULT 'Active' AFTER declaration_accepted`);
      console.log('✅ Added status column to registrations table.');
    } catch (e) {
      console.log('ℹ️ Status column already exists.');
    }

    // Add Database Constraints & Indexes
    try {
      await connection.query(`ALTER TABLE registrations ADD INDEX idx_dept (department), ADD INDEX idx_course (course), ADD INDEX idx_unit (unit_number), ADD INDEX idx_reg_id (registration_id)`);
      console.log('✅ Created database indexes on department, course, unit_number, and registration_id.');
    } catch (e) {
      console.log('ℹ️ Indexes already present or created.');
    }

    // Create Audit Logs Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        action VARCHAR(50) NOT NULL,
        performed_by VARCHAR(100) NOT NULL,
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Audit logs table ready.');

    connection.release();
    process.exit(0);
  } catch (err) {
    console.error('❌ Schema update error:', err.message);
    process.exit(1);
  }
}

updateSchema();
