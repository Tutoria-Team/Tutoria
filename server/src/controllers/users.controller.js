const pool = require('../config/db.config');

// GET /api/users/me
const getMe = async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT id, first_name, last_name, email, profile_photo_url, is_tutor FROM users WHERE id = $1',
      [req.user.id]
    );
    if (result.rowCount === 0) return res.sendStatus(404);

    res.json({ user: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/users/me
const updateMe = async (req, res, next) => {
  const { first_name, last_name, mobile_number, profile_photo_url } = req.body;

  try {
    const result = await pool.query(
      `UPDATE users
       SET first_name = COALESCE($1, first_name),
           last_name  = COALESCE($2, last_name),
           mobile_number = COALESCE($3, mobile_number),
           profile_photo_url = COALESCE($4, profile_photo_url),
           updated_at = NOW()
       WHERE id = $5
       RETURNING id, first_name, last_name, email, mobile_number, profile_photo_url, is_tutor`,
      [first_name, last_name, mobile_number, profile_photo_url, req.user.id]
    );

    if (result.rowCount === 0) return res.sendStatus(404);
    res.json({ user: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

module.exports = { getMe, updateMe };