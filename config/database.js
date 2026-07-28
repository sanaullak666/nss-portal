const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
  port: parseInt(process.env.DB_PORT, 10) || 4000,
  user: process.env.DB_USER || '31C3t8dhjKFJoEL.root',
  password: process.env.DB_PASSWORD || 'R1uh8uj3atlkVeNR',
  database: process.env.DB_NAME || 'nss_portal',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: false
  }
};

const pool = mysql.createPool(dbConfig);

module.exports = pool;
