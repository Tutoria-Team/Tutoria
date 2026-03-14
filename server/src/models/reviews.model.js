const pool = require('../config/db.config');

const createReviewsTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS reviews (
      review_id SERIAL PRIMARY KEY,
      tcid INTEGER NOT NULL,
      user_email VARCHAR(255) NOT NULL,
      user_rating INTEGER NOT NULL,
      user_comment TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tcid) REFERENCES tutor_courses(tcid) ON DELETE CASCADE,
      FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE,
      CHECK (user_rating >= 1 AND user_rating <= 5),
      UNIQUE (tcid, user_email)
    );
  `);
  console.log('✔ reviews table ready');
};

const seedReviews = async () => {
  await pool.query(`
    INSERT INTO reviews (tcid, user_email, user_rating, user_comment)
    VALUES (1, 'student.bob@example.com', 5, 'Great course, Alice was very helpful!')
    ON CONFLICT (tcid, user_email) DO NOTHING;
  `);
  console.log('✔ reviews seeded');
};

module.exports = { createReviewsTable, seedReviews };