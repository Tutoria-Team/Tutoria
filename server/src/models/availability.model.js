const pool = require('../config/db.config');

const createAvailabilityTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tutor_availability (
      availability_id SERIAL PRIMARY KEY,
      tutor_email VARCHAR(255) NOT NULL,
      day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
      start_time TIME NOT NULL,
      end_time   TIME NOT NULL,
      timezone VARCHAR(64) NOT NULL DEFAULT 'UTC',
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tutor_email) REFERENCES users(email) ON DELETE CASCADE,
      UNIQUE (tutor_email, day_of_week, start_time, end_time),
      CHECK (end_time > start_time)
    );
  `);
  console.log('✔ tutor_availability table ready');
};

const seedAvailability = async () => {
  const days = [1, 2, 3, 4, 5]; // Mon–Fri
  for (const day of days) {
    await pool.query(
      `INSERT INTO tutor_availability (tutor_email, day_of_week, start_time, end_time, timezone)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (tutor_email, day_of_week, start_time, end_time) DO NOTHING`,
      ['tutor.alice@example.com', day, '09:00', '17:00', 'America/New_York']
    );
  }
  console.log('✔ tutor_availability seeded');
};

module.exports = { createAvailabilityTable, seedAvailability };