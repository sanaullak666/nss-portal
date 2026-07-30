const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const connectionString = process.env.DATABASE_URL || 
  `postgresql://${process.env.DB_USER}:${encodeURIComponent(process.env.DB_PASSWORD)}@${process.env.DB_HOST}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME}`;

const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

function convertPlaceholders(sql) {
  let paramIndex = 1;
  let inString = false;
  let result = '';
  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    if (char === "'") {
      inString = !inString;
      result += char;
    } else if (char === '?' && !inString) {
      result += `$${paramIndex++}`;
    } else {
      result += char;
    }
  }
  return result;
}

function convertSqlDialect(sql) {
  return sql
    .replace(/\bNOW\(\)/gi, 'CURRENT_TIMESTAMP')
    .replace(/\bCURDATE\(\)/gi, 'CURRENT_DATE');
}

const db = {
  pool,
  query: async (sql, params = []) => {
    let convertedSql = convertPlaceholders(convertSqlDialect(sql));
    
    const isInsert = /^\s*INSERT\s+INTO/i.test(sql);
    if (isInsert && !/RETURNING/i.test(convertedSql)) {
      convertedSql += ' RETURNING id';
    }

    const res = await pool.query(convertedSql, params);
    
    const insertId = res.rows && res.rows[0] && res.rows[0].id ? res.rows[0].id : null;
    const resultHeader = {
      affectedRows: res.rowCount,
      insertId: insertId,
      rowCount: res.rowCount
    };

    const firstElement = isInsert || /^\s*(UPDATE|DELETE)\s+/i.test(sql) ? resultHeader : res.rows;
    return [firstElement, res.fields];
  },
  execute: async (sql, params = []) => {
    return db.query(sql, params);
  }
};

module.exports = db;
