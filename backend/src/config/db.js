const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Matikan SSL untuk local development
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

pool.on('connect', () => {
  console.log('🔌 Database PostgreSQL terkoneksi dengan sukses.');
});

pool.on('error', (err) => {
  console.error('❌ Error mendadak pada pool PostgreSQL:', err.message);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
