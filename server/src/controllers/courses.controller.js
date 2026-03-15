const pool = require('../config/db.config');

// GET /api/courses
const getCourses = async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT * FROM tutor_courses WHERE tutor_email = $1 ORDER BY created_at ASC',
      [req.user.email]
    );

    if (result.rowCount === 0)
      return res.status(404).json({ error: 'No courses found for this tutor' });

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

// POST /api/courses
const createCourse = async (req, res, next) => {
  const { course_name, rate_type, hourly_rate, session_rate } = req.body;

  if (!course_name)
    return res.status(400).json({ error: 'course_name is required' });

  // Validate rate fields based on rate_type
  if (rate_type === 'hourly' && !hourly_rate)
    return res.status(400).json({ error: 'hourly_rate is required for hourly rate type' });
  if (rate_type === 'session' && !session_rate)
    return res.status(400).json({ error: 'session_rate is required for session rate type' });
  if (rate_type === 'both' && (!hourly_rate || !session_rate))
    return res.status(400).json({ error: 'Both hourly_rate and session_rate are required' });

  try {
    const result = await pool.query(
      `INSERT INTO tutor_courses (tutor_email, course_name, rate_type, hourly_rate, session_rate)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        req.user.email,
        course_name,
        rate_type || 'hourly',
        hourly_rate || null,
        session_rate || null,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505')
      return res.status(409).json({ error: 'You already teach a course with that name' });
    next(err);
  }
};

// PATCH /api/courses/:tcid
const updateCourse = async (req, res, next) => {
  const { tcid } = req.params;
  const { course_name, rate_type, hourly_rate, session_rate } = req.body;

  try {
    const result = await pool.query(
      `UPDATE tutor_courses
       SET course_name   = COALESCE($1, course_name),
           rate_type     = COALESCE($2, rate_type),
           hourly_rate   = COALESCE($3, hourly_rate),
           session_rate  = COALESCE($4, session_rate),
           updated_at    = NOW()
       WHERE tcid = $5 AND tutor_email = $6
       RETURNING *`,
      [course_name, rate_type, hourly_rate, session_rate, tcid, req.user.email]
    );

    if (result.rowCount === 0)
      return res.status(404).json({ error: 'Course not found' });

    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505')
      return res.status(409).json({ error: 'You already teach a course with that name' });
    next(err);
  }
};

// DELETE /api/courses/:tcid
const deleteCourse = async (req, res, next) => {
  const { tcid } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM tutor_courses WHERE tcid = $1 AND tutor_email = $2 RETURNING *',
      [tcid, req.user.email]
    );

    if (result.rowCount === 0)
      return res.status(404).json({ error: 'Course not found' });

    res.json({ message: 'Course deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getCourses, createCourse, updateCourse, deleteCourse };