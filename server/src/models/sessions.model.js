const pool = require('../config/db.config');

const createSessionsTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      session_id        SERIAL PRIMARY KEY,
      tcid              INTEGER       NOT NULL,
      tutor_email       VARCHAR(255)  NOT NULL,
      user_email        VARCHAR(255)  NULL,
      session_timestamp TIMESTAMPTZ   NOT NULL,
      duration_minutes  INTEGER       NOT NULL DEFAULT 60
                          CHECK (duration_minutes > 0),
      end_timestamp     TIMESTAMPTZ,
      cost              NUMERIC(10,2) NOT NULL DEFAULT 0.00,
      status            VARCHAR(20)   NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending','confirmed','cancelled','completed')),
      feedback          TEXT,
      created_at        TIMESTAMPTZ   DEFAULT CURRENT_TIMESTAMP,
      updated_at        TIMESTAMPTZ   DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tcid)        REFERENCES tutor_courses(tcid)  ON DELETE CASCADE,
      FOREIGN KEY (tutor_email) REFERENCES users(email)         ON DELETE CASCADE,
      FOREIGN KEY (user_email)  REFERENCES users(email)         ON DELETE SET NULL
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_sessions_tutor_time
      ON sessions (tutor_email, session_timestamp, end_timestamp);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_sessions_user_time
      ON sessions (user_email, session_timestamp);
  `);

  console.log('✔ sessions table ready');
};

module.exports = { createSessionsTable };