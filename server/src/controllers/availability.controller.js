const pool = require('../config/db.config');

// ─────────────────────────────────────────────────────────────────────────────
// Recurring weekly availability
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/availability
const getAvailability = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT * FROM tutor_availability
       WHERE tutor_email = $1 AND is_active = TRUE
       ORDER BY day_of_week, start_time`,
      [req.user.email]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

// POST /api/availability
const createAvailability = async (req, res, next) => {
  const { day_of_week, start_time, end_time, timezone } = req.body;
  if (day_of_week === undefined || !start_time || !end_time)
    return res.status(400).json({ error: 'day_of_week, start_time, and end_time are required' });
  try {
    const result = await pool.query(
      `INSERT INTO tutor_availability (tutor_email, day_of_week, start_time, end_time, timezone)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (tutor_email, day_of_week, start_time, end_time)
       DO UPDATE SET is_active = TRUE, timezone = EXCLUDED.timezone, updated_at = NOW()
       RETURNING *`,
      [req.user.email, day_of_week, start_time, end_time, timezone || 'UTC']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/availability/:availability_id
const deleteAvailability = async (req, res, next) => {
  const { availability_id } = req.params;
  try {
    const result = await pool.query(
      `DELETE FROM tutor_availability
       WHERE availability_id = $1 AND tutor_email = $2
       RETURNING *`,
      [availability_id, req.user.email]
    );
    if (result.rowCount === 0)
      return res.status(404).json({ error: 'Availability block not found' });
    res.json({ message: 'Availability removed' });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Blackout / unavailable dates
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/availability/blackout-dates
const getBlackoutDates = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT * FROM tutor_unavailable_dates
       WHERE tutor_email = $1
       ORDER BY unavailable_date ASC`,
      [req.user.email]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

// POST /api/availability/blackout-dates
const createBlackoutDate = async (req, res, next) => {
  const { unavailable_date, reason } = req.body;
  if (!unavailable_date)
    return res.status(400).json({ error: 'unavailable_date is required (YYYY-MM-DD)' });

  // Reject dates in the past
  if (unavailable_date < new Date().toISOString().split('T')[0])
    return res.status(400).json({ error: 'unavailable_date must be today or in the future' });

  try {
    const result = await pool.query(
      `INSERT INTO tutor_unavailable_dates (tutor_email, unavailable_date, reason)
       VALUES ($1, $2, $3)
       ON CONFLICT (tutor_email, unavailable_date)
       DO UPDATE SET reason = EXCLUDED.reason
       RETURNING *`,
      [req.user.email, unavailable_date, reason || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/availability/blackout-dates/:id
const deleteBlackoutDate = async (req, res, next) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `DELETE FROM tutor_unavailable_dates
       WHERE id = $1 AND tutor_email = $2
       RETURNING *`,
      [id, req.user.email]
    );
    if (result.rowCount === 0)
      return res.status(404).json({ error: 'Blackout date not found' });
    res.json({ message: 'Blackout date removed' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAvailability,
  createAvailability,
  deleteAvailability,
  getBlackoutDates,
  createBlackoutDate,
  deleteBlackoutDate,
};