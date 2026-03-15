const pool = require('../config/db.config');

// GET /api/tutor-settings
// Returns the current tutor's session settings.
const getSessionSettings = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT * FROM tutor_session_settings WHERE tutor_email = $1`,
      [req.user.email]
    );
    // If no row yet (e.g. legacy tutor before settings were added) return defaults
    if (result.rowCount === 0) {
      return res.json({
        tutor_email:          req.user.email,
        min_duration_minutes: 30,
        max_duration_minutes: 120,
        duration_increment:   30,
        buffer_minutes:       0,
        advance_booking_days: 14,
        cancellation_hours:   24,
        auto_confirm:         false,
      });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/tutor-settings
// Updates one or more session settings. Validates constraints before writing.
const updateSessionSettings = async (req, res, next) => {
  const {
    min_duration_minutes,
    max_duration_minutes,
    duration_increment,
    buffer_minutes,
    advance_booking_days,
    cancellation_hours,
    auto_confirm,
  } = req.body;

  // Fetch current values so we can merge and validate the full picture
  let current;
  try {
    const r = await pool.query(
      `SELECT * FROM tutor_session_settings WHERE tutor_email = $1`,
      [req.user.email]
    );
    current = r.rows[0] ?? {
      min_duration_minutes: 30,
      max_duration_minutes: 120,
      duration_increment:   30,
      buffer_minutes:       0,
      advance_booking_days: 14,
      cancellation_hours:   24,
      auto_confirm:         false,
    };
  } catch (err) {
    return next(err);
  }

  // Merge — only override fields that were actually sent
  const merged = {
    min_duration_minutes:  min_duration_minutes  ?? current.min_duration_minutes,
    max_duration_minutes:  max_duration_minutes  ?? current.max_duration_minutes,
    duration_increment:    duration_increment    ?? current.duration_increment,
    buffer_minutes:        buffer_minutes        ?? current.buffer_minutes,
    advance_booking_days:  advance_booking_days  ?? current.advance_booking_days,
    cancellation_hours:    cancellation_hours    ?? current.cancellation_hours,
    auto_confirm:          auto_confirm          ?? current.auto_confirm,
  };

  // Validate
  if (merged.min_duration_minutes < 15)
    return res.status(400).json({ error: 'min_duration_minutes must be at least 15.' });
  if (merged.max_duration_minutes > 480)
    return res.status(400).json({ error: 'max_duration_minutes cannot exceed 480.' });
  if (merged.min_duration_minutes > merged.max_duration_minutes)
    return res.status(400).json({ error: 'min_duration_minutes cannot exceed max_duration_minutes.' });
  if (merged.duration_increment < 15)
    return res.status(400).json({ error: 'duration_increment must be at least 15.' });
  if (merged.min_duration_minutes % merged.duration_increment !== 0)
    return res.status(400).json({ error: 'min_duration_minutes must be divisible by duration_increment.' });
  if (merged.max_duration_minutes % merged.duration_increment !== 0)
    return res.status(400).json({ error: 'max_duration_minutes must be divisible by duration_increment.' });

  try {
    const result = await pool.query(
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
         updated_at           = NOW()
       RETURNING *`,
      [
        req.user.email,
        merged.min_duration_minutes,
        merged.max_duration_minutes,
        merged.duration_increment,
        merged.buffer_minutes,
        merged.advance_booking_days,
        merged.cancellation_hours,
        merged.auto_confirm,
      ]
    );
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

module.exports = { getSessionSettings, updateSessionSettings };