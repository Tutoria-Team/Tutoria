require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require(__dirname + '/config/db.config.js');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const app = express();
app.use(express.json());

// =======================
// JWT Authentication Middleware
// =======================
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// =======================
// Sanity Check
// =======================
app.get('/api/test', (req, res) => {
  res.send('API is working!');
});

// =======================
// Helper: Send OTP
// =======================
const sendOtp = async (email, mobile_number, otp) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`OTP for ${email || mobile_number}: ${otp}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const message = {
    from: process.env.SMTP_USER,
    to: email,
    subject: 'Your OTP Code',
    text: `Your OTP code is ${otp}. It expires in 10 minutes.`,
  };

  try {
    await transporter.sendMail(message);
    console.log(`OTP sent to ${email}`);
  } catch (error) {
    console.error('Error sending OTP:', error);
    throw new Error('Failed to send OTP');
  }
};

// =======================
// Signup Endpoint
// =======================
app.post('/api/signup', async (req, res) => {
  const { first_name, last_name, email, mobile_number, password } = req.body;
  if (!first_name || !last_name || !email || !password)
    return res.status(400).send({ error: 'Missing required fields' });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    await pool.query(
      `INSERT INTO users 
       (first_name, last_name, email, mobile_number, password_hash, otp, otp_expiry) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [first_name, last_name, email, mobile_number, hashedPassword, otp, otpExpiry]
    );

    await sendOtp(email, mobile_number, otp);

    res.status(201).send({ message: 'Signup successful. OTP sent.', email, mobile_number });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Error during signup' });
  }
});

// =======================
// OTP Validation Endpoint
// =======================
app.post('/api/validate-otp', async (req, res) => {
  const { email, mobile_number, otp } = req.body;
  try {
    const result = await pool.query(
      `SELECT * FROM users 
       WHERE (email = $1 OR mobile_number = $2) 
         AND otp = $3 
         AND otp_expiry > NOW()`,
      [email, mobile_number, otp]
    );

    if (result.rowCount === 0)
      return res.status(400).send({ error: 'Invalid or expired OTP' });

    await pool.query(
      `UPDATE users SET otp = NULL, otp_expiry = NULL 
       WHERE email = $1 OR mobile_number = $2`,
      [email, mobile_number]
    );

    res.send({ message: 'OTP validated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Error during OTP validation' });
  }
});

// =======================
// Login Endpoint
// =======================
app.post('/api/login', async (req, res) => {
  const { emailOrMobile, password } = req.body;
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 OR mobile_number = $2',
      [emailOrMobile, emailOrMobile]
    );

    if (result.rowCount === 0)
      return res.status(401).send({ error: 'Invalid credentials' });

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch)
      return res.status(401).send({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.send({
      token,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        profile_photo_url: user.profile_photo_url,
        is_tutor: user.is_tutor,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Error during login' });
  }
});

// =======================
// Get current user
// =======================
app.get('/api/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, first_name, last_name, email, profile_photo_url, is_tutor FROM users WHERE id=$1',
      [req.user.id]
    );
    if (result.rowCount === 0) return res.sendStatus(404);

    res.send({ user: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Error fetching user' });
  }
});

// =======================
// Forgot Password - Request OTP
// =======================
app.post('/api/request-password-reset', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).send({ error: 'Email required' });

  try {
    const result = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
    if (result.rowCount === 0) return res.status(404).send({ error: 'User not found' });

    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await pool.query('UPDATE users SET otp=$1, otp_expiry=$2 WHERE email=$3', [otp, otpExpiry, email]);

    await sendOtp(email, null, otp);

    res.send({ message: 'OTP sent to email' });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Error generating OTP' });
  }
});

// =======================
// Forgot Password - Reset
// =======================
app.post('/api/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) return res.status(400).send({ error: 'Missing fields' });

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email=$1 AND otp=$2 AND otp_expiry > NOW()',
      [email, otp]
    );
    if (result.rowCount === 0) return res.status(400).send({ error: 'Invalid or expired OTP' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE users SET password_hash=$1, otp=NULL, otp_expiry=NULL WHERE email=$2',
      [hashedPassword, email]
    );

    res.send({ message: 'Password reset successful' });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Error resetting password' });
  }
});

// =======================
// Start Server
// =======================
const PORT = process.env.PORT || 9000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
