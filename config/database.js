const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
  port: parseInt(process.env.DB_PORT, 10) || 4000,
  user: process.env.DB_USER || 'iAWi6Qj6TFnqYt7.root',
  password: process.env.DB_PASSWORD || 'CEH38M54T9CpOijU',
  database: process.env.DB_NAME || 'test',
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
