const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db.config');
const { generateOtp, sendOtp } = require('../utils/otp.util');

// POST /api/auth/signup
const signup = async (req, res, next) => {
  const { first_name, last_name, email, mobile_number, password } = req.body;
  if (!first_name || !last_name || !email || !password)
    return res.status(400).json({ error: 'Missing required fields' });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const { otp, otpExpiry } = generateOtp();

    await pool.query(
      `INSERT INTO users (first_name, last_name, email, mobile_number, password_hash, otp, otp_expiry)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [first_name, last_name, email, mobile_number, hashedPassword, otp, otpExpiry]
    );

    await sendOtp(email, otp);

    res.status(201).json({ message: 'Signup successful. OTP sent.', email, mobile_number });
  } catch (err) {
    if (err.code === '23505')
      return res.status(409).json({ error: 'Email or mobile number already in use' });
    next(err);
  }
};

// POST /api/auth/validate-otp
const validateOtp = async (req, res, next) => {
  const { email, mobile_number, otp } = req.body;
  if (!otp || (!email && !mobile_number))
    return res.status(400).json({ error: 'OTP and email or mobile number are required' });

  try {
    const result = await pool.query(
      `SELECT * FROM users
       WHERE (email = $1 OR mobile_number = $2) AND otp = $3 AND otp_expiry > NOW()`,
      [email, mobile_number, otp]
    );

    if (result.rowCount === 0)
      return res.status(400).json({ error: 'Invalid or expired OTP' });

    await pool.query(
      `UPDATE users SET otp = NULL, otp_expiry = NULL WHERE email = $1 OR mobile_number = $2`,
      [email, mobile_number]
    );

    res.json({ message: 'OTP validated successfully' });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  const { emailOrMobile, password } = req.body;
  if (!emailOrMobile || !password)
    return res.status(400).json({ error: 'Email/mobile and password are required' });

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 OR mobile_number = $2',
      [emailOrMobile, emailOrMobile]
    );

    if (result.rowCount === 0)
      return res.status(401).json({ error: 'Invalid credentials' });

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch)
      return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
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
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/request-password-reset
const requestPasswordReset = async (req, res, next) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  // Always return the same message to prevent email enumeration
  const safeResponse = { message: 'If that email exists, an OTP has been sent' };

  try {
    const result = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (result.rowCount === 0) return res.json(safeResponse);

    const { otp, otpExpiry } = generateOtp();
    await pool.query(
      'UPDATE users SET otp = $1, otp_expiry = $2 WHERE email = $3',
      [otp, otpExpiry, email]
    );

    await sendOtp(email, otp);
    res.json(safeResponse);
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/reset-password
const resetPassword = async (req, res, next) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword)
    return res.status(400).json({ error: 'Missing fields' });

  try {
    const result = await pool.query(
      'SELECT id FROM users WHERE email = $1 AND otp = $2 AND otp_expiry > NOW()',
      [email, otp]
    );
    if (result.rowCount === 0)
      return res.status(400).json({ error: 'Invalid or expired OTP' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE users SET password_hash = $1, otp = NULL, otp_expiry = NULL WHERE email = $2',
      [hashedPassword, email]
    );

    res.json({ message: 'Password reset successful' });
  } catch (err) {
    next(err);
  }
};

module.exports = { signup, validateOtp, login, requestPasswordReset, resetPassword };