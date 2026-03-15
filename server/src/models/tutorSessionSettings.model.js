const pool = require('../config/db.config');

/**
 * tutor_session_settings
 * ─────────────────────────────────────────────────────────────────────────────
 * One row per tutor. Stores all the scheduling preferences that control how
 * students can book sessions. Created automatically when a user becomes a tutor
 * (via the become-tutor flow) with sensible college-tutor defaults.
 *
 * Columns:
 *
 *  min_duration_minutes  — shortest session a student can book.
 *                          Default 30 min — enough for a quick concept check.
 *
 *  max_duration_minutes  — longest session a student can book in one shot.
 *                          Default 120 min (2 hours) — realistic for a study session.
 *
 *  duration_increment    — booking step size. Students pick durations in multiples
 *                          of this. Default 30 min → options are 30, 60, 90, 120.
 *
 *  buffer_minutes        — enforced gap between back-to-back sessions.
 *                          Default 0 — tutor opts in explicitly.
 *                          A 15-min buffer means if session ends at 11:00, the
 *                          next slot cannot start before 11:15.
 *
 *  advance_booking_days  — how many days ahead a student can book.
 *                          Default 14 days — keeps calendars manageable.
 *
 *  cancellation_hours    — minimum hours before a session that a student can
 *                          cancel without it counting as a no-show.
 *                          Default 24 hours.
 *
 *  auto_confirm          — if TRUE, bookings go straight to 'confirmed' status
 *                          without waiting for the tutor to manually accept.
 *                          Default FALSE (tutor reviews each request).
 */
const createTutorSessionSettingsTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tutor_session_settings (
      tutor_email           VARCHAR(255)  PRIMARY KEY,
      min_duration_minutes  INTEGER       NOT NULL DEFAULT 30
                              CHECK (min_duration_minutes >= 15),
      max_duration_minutes  INTEGER       NOT NULL DEFAULT 120
                              CHECK (max_duration_minutes <= 480),
      duration_increment    INTEGER       NOT NULL DEFAULT 30
                              CHECK (duration_increment >= 15),
      buffer_minutes        INTEGER       NOT NULL DEFAULT 0
                              CHECK (buffer_minutes >= 0),
      advance_booking_days  INTEGER       NOT NULL DEFAULT 14
                              CHECK (advance_booking_days BETWEEN 1 AND 90),
      cancellation_hours    INTEGER       NOT NULL DEFAULT 24
                              CHECK (cancellation_hours >= 0),
      auto_confirm          BOOLEAN       NOT NULL DEFAULT FALSE,
      created_at            TIMESTAMPTZ   DEFAULT CURRENT_TIMESTAMP,
      updated_at            TIMESTAMPTZ   DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tutor_email) REFERENCES users(email) ON DELETE CASCADE,
      -- Sanity check: min can never exceed max
      CHECK (min_duration_minutes <= max_duration_minutes),
      -- Increment must divide evenly into both min and max
      CHECK (min_duration_minutes % duration_increment = 0),
      CHECK (max_duration_minutes % duration_increment = 0)
    );
  `);

  console.log('✔ tutor_session_settings table ready');
};

const seedTutorSessionSettings = async () => {
  await pool.query(`
    INSERT INTO tutor_session_settings (tutor_email)
    VALUES ('tutor.alice@example.com')
    ON CONFLICT (tutor_email) DO NOTHING;
  `);
  console.log('✔ tutor_session_settings seeded');
};

module.exports = { createTutorSessionSettingsTable, seedTutorSessionSettings };