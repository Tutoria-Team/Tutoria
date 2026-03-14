const pool = require('../config/db.config');

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

module.exports = { getAvailability, createAvailability, deleteAvailability };