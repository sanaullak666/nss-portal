const db = require('../config/database');

async function updateSchema() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS registrations (
        id SERIAL PRIMARY KEY,
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
        is_same_address SMALLINT DEFAULT 0,
        languages_spoken TEXT NOT NULL,
        is_previous_volunteer VARCHAR(10) NOT NULL,
        certificate_path VARCHAR(255) DEFAULT NULL,
        certificate_data BYTEA DEFAULT NULL,
        certificate_mimetype VARCHAR(100) DEFAULT NULL,
        interested_in_media VARCHAR(10) NOT NULL DEFAULT 'No',
        media_roles TEXT DEFAULT NULL,
        extra_curricular_skills TEXT DEFAULT NULL,
        interested_in_leadership VARCHAR(10) NOT NULL DEFAULT 'No',
        declaration_accepted SMALLINT NOT NULL DEFAULT 1,
        status VARCHAR(20) NOT NULL DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ PostgreSQL Schema updated successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Schema update error:', err.message);
    process.exit(1);
  }
}

updateSchema();
