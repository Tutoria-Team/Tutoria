const pool = require('../config/db.config');

const createTutorUnavailableDatesTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tutor_unavailable_dates (
      id               SERIAL PRIMARY KEY,
      tutor_email      VARCHAR(255) NOT NULL,
      unavailable_date DATE         NOT NULL,
      reason           VARCHAR(255),
      created_at       TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tutor_email) REFERENCES users(email) ON DELETE CASCADE,
      UNIQUE (tutor_email, unavailable_date)
    );
  `);
  console.log('✔ tutor_unavailable_dates table ready');
};

// No seed data needed — blackout dates are inherently future-specific

module.exports = { createTutorUnavailableDatesTable };