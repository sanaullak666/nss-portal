const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

async function createDatabase() {
  const config = {
    host: process.env.DB_HOST || 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
    port: parseInt(process.env.DB_PORT, 10) || 4000,
    user: process.env.DB_USER || '31C3t8dhjKFJoEL.root',
    password: process.env.DB_PASSWORD || 'R1uh8uj3atlkVeNR',
    ssl: {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: false
    }
  };

  try {
    const connection = await mysql.createConnection(config);
    console.log('⚡ Connected to TiDB Cluster...');
    await connection.query('CREATE DATABASE IF NOT EXISTS nss_portal;');
    console.log('✅ Database "nss_portal" created successfully!');
    await connection.end();

    // Run updateSchema and resetAdmin
    require('./updateSchema');
  } catch (err) {
    console.error('❌ Failed to create database:', err.message);
  }
}

createDatabase();
