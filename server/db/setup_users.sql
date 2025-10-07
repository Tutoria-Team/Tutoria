-- Enable UUID generation extension (run once per database)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop the table if it exists (for clean re-run)
DROP TABLE IF EXISTS users;

-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    mobile_number VARCHAR(15) UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    otp VARCHAR(6),
    otp_expiry TIMESTAMPTZ,
    courses_taught INTEGER DEFAULT 0,
    profile_photo_url TEXT DEFAULT '/LogoVersions/Logo.png',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample users (password_hash here is placeholder text - replace with real hashes)
INSERT INTO users (first_name, last_name, email, password_hash, courses_taught, profile_photo_url)
VALUES
('Alice', 'Smith', 'alice@rpi.edu', 'hashed_password_1', 3, 'https://example.com/photos/alice.jpg'),
('Bob', 'Johnson', 'bob@rpi.edu', 'hashed_password_2', 1, 'https://example.com/photos/bob.jpg'),
('Carol', 'Williams', 'carol@rpi.edu', 'hashed_password_3', 5, NULL);