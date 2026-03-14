const { createUsersTable, seedUsers }               = require('./users.model');
const { createTutorCoursesTable, seedTutorCourses } = require('./tutorCourses.model');
const { createReviewsTable, seedReviews }           = require('./reviews.model');
const { createSessionsTable }                       = require('./sessions.model');
const { createAvailabilityTable, seedAvailability } = require('./availability.model');

const initDB = async () => {
  try {
    console.log('🗄  Initializing database...');

    await createUsersTable();
    await createTutorCoursesTable();
    await createReviewsTable();
    await createSessionsTable();
    await createAvailabilityTable();

    if (process.env.NODE_ENV !== 'production') {
      console.log('🌱  Seeding sample data...');
      await seedUsers();
      await seedTutorCourses();
      await seedReviews();
      await seedAvailability();
    }

    console.log('✅  Database ready');
  } catch (err) {
    console.error('❌  Database initialization failed:', err);
    process.exit(1);
  }
};

module.exports = initDB;