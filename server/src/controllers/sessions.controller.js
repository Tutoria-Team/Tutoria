const pool = require('../config/db.config');

// GET /api/sessions
const getSessions = async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT * FROM sessions WHERE user_email = $1',
      [req.user.email]
    );

    if (result.rowCount === 0)
      return res.status(404).json({ error: 'No sessions found for this user' });

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

// POST /api/sessions
const createSession = async (req, res, next) => {
  const { tcid, session_timestamp, cost } = req.body;
  if (!tcid || !session_timestamp)
    return res.status(400).json({ error: 'tcid and session_timestamp are required' });

  try {
    const result = await pool.query(
      `INSERT INTO sessions (tcid, user_email, session_timestamp, cost)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [tcid, req.user.email, session_timestamp, cost ?? 0]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/sessions/:session_id/feedback
const addFeedback = async (req, res, next) => {
  const { session_id } = req.params;
  const { feedback } = req.body;
  if (!feedback)
    return res.status(400).json({ error: 'Feedback is required' });

  try {
    const result = await pool.query(
      `UPDATE sessions SET feedback = $1, updated_at = NOW()
       WHERE session_id = $2 AND user_email = $3
       RETURNING *`,
      [feedback, session_id, req.user.email]
    );

    if (result.rowCount === 0)
      return res.status(404).json({ error: 'Session not found' });

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

module.exports = { getSessions, createSession, addFeedback };