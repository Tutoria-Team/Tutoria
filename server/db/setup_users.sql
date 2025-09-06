-- Enable UUID generation extension (run once per database)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop the table if it exists (for clean re-run)
DROP TABLE IF EXISTS users;

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    courses_taught INTEGER DEFAULT 0,
    profile_photo_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert sample users (password_hash here is placeholder text - replace with real hashes)
INSERT INTO users (first_name, last_name, email, password_hash, courses_taught, profile_photo_url)
VALUES
('Alice', 'Smith', 'alice@rpi.edu', 'hashed_password_1', 3, 'https://example.com/photos/alice.jpg'),
('Bob', 'Johnson', 'bob@rpi.edu', 'hashed_password_2', 1, 'https://example.com/photos/bob.jpg'),
('Carol', 'Williams', 'carol@rpi.edu', 'hashed_password_3', 5, NULL);