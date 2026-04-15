const pool = require('../config/db.config');

const createTutorCoursesTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tutor_courses (
      tcid SERIAL PRIMARY KEY,
      tutor_email VARCHAR(255) NOT NULL,
      course_name VARCHAR(255) NOT NULL,
      overall_rating NUMERIC(3, 2) DEFAULT NULL,

      -- Pricing
      rate_type VARCHAR(10) DEFAULT 'hourly' CHECK (rate_type IN ('hourly', 'session', 'both')),
      hourly_rate NUMERIC(10, 2) DEFAULT NULL,
      session_rate NUMERIC(10, 2) DEFAULT NULL,

      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (tutor_email) REFERENCES users(email) ON DELETE CASCADE,
      UNIQUE (tutor_email, course_name)
    );
  `);
  
  console.log('✔ tutor_courses tables ready');
};

const seedTutorCourses = async () => {
  // 1. Make sure Alice exists
  await pool.query(`
    INSERT INTO users (first_name, last_name, email, mobile_number, password_hash, is_tutor)
    VALUES ('Alice', 'Smith', 'tutor.alice@example.com', '555-0100', 'fake_password_hash', true)
    ON CONFLICT (email) DO NOTHING;
  `);

  // 2. Add courses with all 3 pricing scenarios
  await pool.query(`
    INSERT INTO tutor_courses (tutor_email, course_name, rate_type, hourly_rate, session_rate)
    VALUES 
      -- Scenario 1: Hourly Only (session_rate is NULL)
      ('tutor.alice@example.com', 'Introduction to Web Development', 'hourly', 45.00, NULL),
      
      -- Scenario 2: Session Only (hourly_rate is NULL)
      ('tutor.alice@example.com', 'College Essay Review', 'session', NULL, 150.00),
      
      -- Scenario 3: Both Rates Provided
      ('tutor.alice@example.com', 'Intensive SAT Prep Bootcamp', 'both', 60.00, 450.00)
      
    ON CONFLICT (tutor_email, course_name) DO NOTHING;
  `);

  // 3. Add dummy sessions for Alice's courses into the EXISTING sessions table
  // We set user_email to NULL so your controller recognizes them as available!
  await pool.query(`
    INSERT INTO sessions (tcid, tutor_email, session_timestamp, cost, user_email)
    SELECT tcid, 'tutor.alice@example.com', CURRENT_TIMESTAMP + INTERVAL '1 day' + INTERVAL '2 hours', 45.00, NULL
    FROM tutor_courses WHERE course_name = 'Introduction to Web Development';
    
    INSERT INTO sessions (tcid, tutor_email, session_timestamp, cost, user_email)
    SELECT tcid, 'tutor.alice@example.com', CURRENT_TIMESTAMP + INTERVAL '3 days', 45.00, NULL
    FROM tutor_courses WHERE course_name = 'Introduction to Web Development';
    
    INSERT INTO sessions (tcid, tutor_email, session_timestamp, cost, user_email)
    SELECT tcid, 'tutor.alice@example.com', CURRENT_TIMESTAMP + INTERVAL '5 days', 150.00, NULL
    FROM tutor_courses WHERE course_name = 'College Essay Review';
  `);
  
  console.log('✔ dummy tutor, courses, and sessions seeded');
};

module.exports = { createTutorCoursesTable, seedTutorCourses };