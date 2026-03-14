const { Pool } = require('pg');

const pool = new Pool();

pool.on('connect', () => console.log('📦 Connected to PostgreSQL'));
pool.on('error', (err) => console.error('PostgreSQL error:', err));

module.exports = pool;