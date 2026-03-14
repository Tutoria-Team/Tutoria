const pool = require('../config/db.config');
const bcrypt = require('bcrypt');

const createUsersTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      mobile_number VARCHAR(15) UNIQUE,
      password_hash TEXT NOT NULL,
      profile_photo_url TEXT DEFAULT '/Icons/Default_Profile_Picture.png',
      is_tutor BOOLEAN DEFAULT FALSE NOT NULL,
      otp VARCHAR(6),
      otp_expiry TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('✔ users table ready');
};

const seedUsers = async () => {
  const hash = await bcrypt.hash('password123', 10);
  await pool.query(`
    INSERT INTO users (email, first_name, last_name, mobile_number, is_tutor, password_hash)
    VALUES
      ('tutor.alice@example.com', 'Alice', 'Smith', '1112223333', TRUE,  $1),
      ('student.bob@example.com', 'Bob',   'Johnson', '4445556666', FALSE, $1)
    ON CONFLICT (email) DO NOTHING;
  `, [hash]);
  console.log('✔ users seeded');
};

module.exports = { createUsersTable, seedUsers };