const pool = require('../config/db.config');

// GET /api/courses
const getCourses = async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT * FROM tutor_courses WHERE tutor_email = $1',
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
  const { course_name } = req.body;
  if (!course_name)
    return res.status(400).json({ error: 'course_name is required' });

  try {
    const result = await pool.query(
      `INSERT INTO tutor_courses (tutor_email, course_name)
       VALUES ($1, $2)
       RETURNING *`,
      [req.user.email, course_name]
    );

    res.status(201).json(result.rows[0]);
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

module.exports = { getCourses, createCourse, deleteCourse };