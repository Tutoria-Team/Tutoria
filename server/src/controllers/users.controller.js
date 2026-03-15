const pool = require('../config/db.config');

// GET /api/users/me
const getMe = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, first_name, last_name, email, mobile_number,
              profile_photo_url, is_tutor
       FROM users WHERE id = $1`,
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
       SET first_name         = COALESCE($1, first_name),
           last_name          = COALESCE($2, last_name),
           mobile_number      = COALESCE($3, mobile_number),
           profile_photo_url  = COALESCE($4, profile_photo_url),
           updated_at         = NOW()
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

// PATCH /api/users/me/become-tutor
// Body (all optional — fall back to DB defaults if omitted):
//   min_duration_minutes, max_duration_minutes, duration_increment,
//   buffer_minutes, advance_booking_days, cancellation_hours, auto_confirm
const becomeATutor = async (req, res, next) => {
  const {
    min_duration_minutes  = 30,
    max_duration_minutes  = 120,
    duration_increment    = 30,
    buffer_minutes        = 0,
    advance_booking_days  = 14,
    cancellation_hours    = 24,
    auto_confirm          = false,
  } = req.body;

  // ── Validate session settings before opening a transaction ──────────────────
  if (min_duration_minutes < 15)
    return res.status(400).json({ error: 'min_duration_minutes must be at least 15.' });
  if (max_duration_minutes > 480)
    return res.status(400).json({ error: 'max_duration_minutes cannot exceed 480.' });
  if (min_duration_minutes > max_duration_minutes)
    return res.status(400).json({ error: 'min_duration_minutes cannot exceed max_duration_minutes.' });
  if (duration_increment < 15)
    return res.status(400).json({ error: 'duration_increment must be at least 15.' });
  if (min_duration_minutes % duration_increment !== 0)
    return res.status(400).json({ error: 'min_duration_minutes must be divisible by duration_increment.' });
  if (max_duration_minutes % duration_increment !== 0)
    return res.status(400).json({ error: 'max_duration_minutes must be divisible by duration_increment.' });

  // ── Run both writes in a single transaction ──────────────────────────────────
  // If the session-settings INSERT fails (e.g. a constraint violation we missed),
  // the user flag is rolled back too — no half-initialised tutor rows.
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Flip is_tutor flag
    const userResult = await client.query(
      `UPDATE users
       SET is_tutor = TRUE, updated_at = NOW()
       WHERE id = $1
       RETURNING id, first_name, last_name, email, mobile_number, profile_photo_url, is_tutor`,
      [req.user.id]
    );
    if (userResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.sendStatus(404);
    }

    const { email } = userResult.rows[0];

    // 2. Create (or update) session settings row
    //    ON CONFLICT handles the edge case where a user somehow calls this twice.
    await client.query(
      `INSERT INTO tutor_session_settings
         (tutor_email, min_duration_minutes, max_duration_minutes, duration_increment,
          buffer_minutes, advance_booking_days, cancellation_hours, auto_confirm)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (tutor_email) DO UPDATE SET
         min_duration_minutes = EXCLUDED.min_duration_minutes,
         max_duration_minutes = EXCLUDED.max_duration_minutes,
         duration_increment   = EXCLUDED.duration_increment,
         buffer_minutes       = EXCLUDED.buffer_minutes,
         advance_booking_days = EXCLUDED.advance_booking_days,
         cancellation_hours   = EXCLUDED.cancellation_hours,
         auto_confirm         = EXCLUDED.auto_confirm,
         updated_at           = NOW()`,
      [
        email,
        min_duration_minutes,
        max_duration_minutes,
        duration_increment,
        buffer_minutes,
        advance_booking_days,
        cancellation_hours,
        auto_confirm,
      ]
    );

    await client.query('COMMIT');
    res.json({ user: userResult.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

module.exports = { getMe, updateMe, becomeATutor };