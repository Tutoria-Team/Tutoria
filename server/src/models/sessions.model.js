const pool = require('../config/db.config');

const createSessionsTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      session_id SERIAL PRIMARY KEY,
      tcid INTEGER NOT NULL,
      user_email VARCHAR(255) NULL,
      session_timestamp TIMESTAMPTZ NOT NULL,
      cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
      feedback TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tcid) REFERENCES tutor_courses(tcid) ON DELETE CASCADE,
      FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE SET NULL
    );
  `);
  console.log('✔ sessions table ready');
};

module.exports = { createSessionsTable };