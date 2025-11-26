-- ==========================================================
-- Drop existing tables in correct reverse dependency order
-- ==========================================================

DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS tutor_courses;
DROP TABLE IF EXISTS users;

-- ==========================================================
-- USERS TABLE
-- ==========================================================

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    mobile_number VARCHAR(15) UNIQUE,
    password_hash TEXT NOT NULL,         
    profile_photo_url TEXT DEFAULT '/Icons/Default_Profile_Picture.png',
    is_tutor BOOLEAN DEFAULT FALSE NOT NULL,

    -- OTP Auth Flow
    otp VARCHAR(6),
    otp_expiry TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================================
-- TUTOR_COURSES TABLE
-- ==========================================================

CREATE TABLE tutor_courses (
    tcid SERIAL PRIMARY KEY,
    tutor_email VARCHAR(255) NOT NULL,
    course_name VARCHAR(255) NOT NULL,
    overall_rating NUMERIC(3, 2) DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (tutor_email) REFERENCES users(email) ON DELETE CASCADE,
    UNIQUE (tutor_email, course_name)
);

-- ==========================================================
-- REVIEWS TABLE
-- ==========================================================

CREATE TABLE reviews (
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

-- ==========================================================
-- SESSIONS TABLE
-- ==========================================================

CREATE TABLE sessions (
    session_id SERIAL PRIMARY KEY,
    tcid INTEGER NOT NULL,
    user_email VARCHAR(255) NULL,
    session_timestamp TIMESTAMPTZ NOT NULL,
    cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (tcid) REFERENCES tutor_courses(tcid) ON DELETE CASCADE,
    FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE SET NULL
);

-- ==========================================================
-- INSERT SAMPLE USERS
-- ==========================================================
-- Password hashes below are bcrypt hashes of "password123"
-- ==========================================================

INSERT INTO users (email, first_name, last_name, mobile_number, is_tutor, password_hash)
VALUES 
('tutor.alice@example.com', 'Alice', 'Smith', '1112223333', TRUE,
 '$2a$10$8.A1M.f2cK6.3.m18K1iA.eb4g9SkKo.fWJtJJQESj2qjF/fQfGOO'),

('student.bob@example.com', 'Bob', 'Johnson', '4445556666', FALSE,
 '$2a$10$EwLqC8hMqG9kG.Yp752/Q.E.hM3b4W4z8B0x5.5k.sY.j3i.A/bUe');

-- ==========================================================
-- INSERT SAMPLE COURSE
-- ==========================================================

INSERT INTO tutor_courses (tutor_email, course_name)
VALUES ('tutor.alice@example.com', 'Introduction to PERN Stack');

-- ==========================================================
-- INSERT SAMPLE REVIEW
-- tcid = 1 because the first course inserted has tcid 1
-- ==========================================================

INSERT INTO reviews (tcid, user_email, user_rating, user_comment)
VALUES (1, 'student.bob@example.com', 5, 'Great course, Alice was very helpful!');
