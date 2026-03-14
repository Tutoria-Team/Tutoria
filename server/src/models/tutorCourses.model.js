const pool = require('../config/db.config');

const createTutorCoursesTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tutor_courses (
      tcid SERIAL PRIMARY KEY,
      tutor_email VARCHAR(255) NOT NULL,
      course_name VARCHAR(255) NOT NULL,
      overall_rating NUMERIC(3, 2) DEFAULT NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tutor_email) REFERENCES users(email) ON DELETE CASCADE,
      UNIQUE (tutor_email, course_name)
    );
  `);
  console.log('✔ tutor_courses table ready');
};

const seedTutorCourses = async () => {
  await pool.query(`
    INSERT INTO tutor_courses (tutor_email, course_name)
    VALUES ('tutor.alice@example.com', 'Introduction to PERN Stack')
    ON CONFLICT (tutor_email, course_name) DO NOTHING;
  `);
  console.log('✔ tutor_courses seeded');
};

module.exports = { createTutorCoursesTable, seedTutorCourses };