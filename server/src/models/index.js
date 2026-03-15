const { createUsersTable, seedUsers }                             = require('./users.model');
const { createTutorCoursesTable, seedTutorCourses }               = require('./tutorCourses.model');
const { createReviewsTable, seedReviews }                         = require('./reviews.model');
const { createSessionsTable }                                      = require('./sessions.model');
const { createAvailabilityTable, seedAvailability }               = require('./availability.model');
const { createTutorSessionSettingsTable, seedTutorSessionSettings } = require('./tutorSessionSettings.model');
const { createTutorUnavailableDatesTable }                         = require('./tutorUnavailableDates.model');

/**
 * initDB
 * ─────────────────────────────────────────────────────────────────────────────
 * Table creation order matters — FK references must exist before the
 * table that uses them is created.
 *
 * Dependency graph:
 *
 *   users
 *     ├── tutor_courses          (tutor_email → users.email)
 *     │     └── sessions         (tcid → tutor_courses.tcid)
 *     │     └── reviews          (tcid → tutor_courses.tcid)
 *     ├── tutor_availability     (tutor_email → users.email)
 *     ├── tutor_session_settings (tutor_email → users.email)
 *     └── tutor_unavailable_dates(tutor_email → users.email)
 *
 *   sessions also references:
 *     ├── users.email  (tutor_email)
 *     └── users.email  (user_email)
 */
const initDB = async () => {
  try {
    console.log('🗄  Initializing database...');
    // ── Tier 1: no dependencies ──────────────────────────────
    await createUsersTable();

    // ── Tier 2: depend only on users ────────────────────────
    await createTutorCoursesTable();
    await createAvailabilityTable();
    await createTutorSessionSettingsTable();
    await createTutorUnavailableDatesTable();

    // ── Tier 3: depend on tutor_courses (and users) ──────────
    await createReviewsTable();
    await createSessionsTable();   // references tutor_courses + users (×2)

    // ── Seed data (order mirrors creation order) ─────────────
    // Each seed uses ON CONFLICT DO NOTHING so re-runs are safe.
    if (process.env.NODE_ENV !== 'production') {
      console.log('🌱  Seeding sample data...');
      await seedUsers();
      await seedTutorCourses();
      await seedReviews();
      await seedAvailability();
      await seedTutorSessionSettings();
    }
    // No seed for sessions, reviews, or unavailable_dates —
    // these are created by real user interactions.

    console.log('✔ Database initialised');
  } catch (err) {
    console.error('✖ Database initialisation failed:', err);
    throw err;
  }
};

module.exports = { initDB };