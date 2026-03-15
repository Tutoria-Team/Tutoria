const jwt  = require('jsonwebtoken');
const pool = require('../config/db.config');

/**
 * Verifies the Bearer token in the Authorization header.
 * On success, fetches the full user row from the DB and attaches it
 * to req.user so downstream controllers always have is_tutor, email, etc.
 */
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token      = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) return res.sendStatus(401);

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.sendStatus(403);
  }

  try {
    const result = await pool.query(
      'SELECT id, email, first_name, last_name, is_tutor FROM users WHERE id = $1',
      [payload.id]
    );
    if (result.rowCount === 0) return res.sendStatus(403);
    req.user = result.rows[0];
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { authenticateToken };