const pool = require('../config/db.config');
const {
  checkSessionConflict,
  checkAvailabilityCovers,
} = require('../utils/availability.util');

// ─────────────────────────────────────────────────────────────────────────────
// Shared join fragment — keeps SELECT consistent across queries
// ─────────────────────────────────────────────────────────────────────────────
const SESSION_SELECT = `
  SELECT
    s.session_id,
    s.tcid,
    s.tutor_email,
    s.user_email,
    s.session_timestamp,
    s.end_timestamp,
    s.duration_minutes,
    s.cost,
    s.status,
    s.feedback,
    s.created_at,
    s.updated_at,
    tc.course_name,
    tc.rate_type,
    tc.hourly_rate,
    tc.session_rate,
    u_tutor.first_name  AS tutor_first_name,
    u_tutor.last_name   AS tutor_last_name,
    u_student.first_name AS student_first_name,
    u_student.last_name  AS student_last_name
  FROM sessions s
  JOIN tutor_courses tc        ON tc.tcid         = s.tcid
  JOIN users u_tutor           ON u_tutor.email   = s.tutor_email
  JOIN users u_student         ON u_student.email = s.user_email
`;

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/sessions  — student: their own sessions
// ─────────────────────────────────────────────────────────────────────────────
const getSessions = async (req, res, next) => {
  try {
    const result = await pool.query(
      `${SESSION_SELECT}
       WHERE s.user_email = $1
       ORDER BY s.session_timestamp DESC`,
      [req.user.email]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/sessions/tutor  — tutor: all incoming bookings for them
// ─────────────────────────────────────────────────────────────────────────────
const getTutorSessions = async (req, res, next) => {
  if (!req.user.is_tutor)
    return res.status(403).json({ error: 'Only tutors can access this endpoint.' });

  const { status } = req.query; // optional filter: ?status=pending

  try {
    const result = await pool.query(
      `${SESSION_SELECT}
       WHERE s.tutor_email = $1
         AND ($2::text IS NULL OR s.status = $2)
       ORDER BY s.session_timestamp ASC`,
      [req.user.email, status ?? null]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/sessions  — student books a session
//
// Required body: { tcid, session_timestamp, duration_minutes }
// Optional body: { notes }   (for future use — column not in schema yet, ignored)
//
// Flow:
//  1. Look up course → derive tutor_email, rate info
//  2. Validate duration against tutor_session_settings
//  3. Enforce advance_booking_days window
//  4. Check availability covers the window (inc. blackout dates)
//  5. Check no overlap with existing sessions (+ buffer)
//  6. Compute cost
//  7. Insert with status = confirmed | pending based on auto_confirm
// ─────────────────────────────────────────────────────────────────────────────
const createSession = async (req, res, next) => {
  const { tcid, session_timestamp, duration_minutes } = req.body;

  if (!tcid || !session_timestamp || !duration_minutes)
    return res.status(400).json({ error: 'tcid, session_timestamp, and duration_minutes are required.' });

  const duration = parseInt(duration_minutes);
  if (isNaN(duration) || duration <= 0)
    return res.status(400).json({ error: 'duration_minutes must be a positive integer.' });

  const proposedStart = new Date(session_timestamp);
  if (isNaN(proposedStart.getTime()))
    return res.status(400).json({ error: 'session_timestamp is not a valid ISO datetime string.' });

  // ── 1. Look up course ─────────────────────────────────────────────────────
  let course, settings;
  try {
    const courseResult = await pool.query(
      `SELECT tc.*, tss.*
       FROM tutor_courses tc
       JOIN tutor_session_settings tss ON tss.tutor_email = tc.tutor_email
       WHERE tc.tcid = $1`,
      [tcid]
    );
    if (courseResult.rowCount === 0)
      return res.status(404).json({ error: 'Course not found.' });

    course   = courseResult.rows[0];
    settings = courseResult.rows[0];
  } catch (err) {
    return next(err);
  }

  const tutorEmail = course.tutor_email;

  // Students can't book their own sessions
  if (req.user.email === tutorEmail)
    return res.status(400).json({ error: 'You cannot book a session with yourself.' });

  // ── 2. Validate duration ──────────────────────────────────────────────────
  if (duration < settings.min_duration_minutes)
    return res.status(400).json({
      error: `Minimum session length for this tutor is ${settings.min_duration_minutes} minutes.`,
    });
  if (duration > settings.max_duration_minutes)
    return res.status(400).json({
      error: `Maximum session length for this tutor is ${settings.max_duration_minutes} minutes.`,
    });
  if (duration % settings.duration_increment !== 0)
    return res.status(400).json({
      error: `Session length must be a multiple of ${settings.duration_increment} minutes.`,
    });

  // ── 3. Advance booking window ─────────────────────────────────────────────
  const now            = new Date();
  const maxAdvanceMs   = settings.advance_booking_days * 24 * 60 * 60 * 1000;
  const maxBookableDate = new Date(now.getTime() + maxAdvanceMs);

  if (proposedStart <= now)
    return res.status(400).json({ error: 'Session must be in the future.' });
  if (proposedStart > maxBookableDate)
    return res.status(400).json({
      error: `This tutor only accepts bookings up to ${settings.advance_booking_days} days in advance.`,
    });

  // ── 4. Check availability ─────────────────────────────────────────────────
  let availCheck;
  try {
    availCheck = await checkAvailabilityCovers(tutorEmail, proposedStart, duration, settings.timezone || 'UTC');
  } catch (err) {
    return next(err);
  }

  if (!availCheck.covered)
    return res.status(409).json({ error: availCheck.reason });

  // ── 5. Conflict detection ─────────────────────────────────────────────────
  let hasConflict;
  try {
    hasConflict = await checkSessionConflict(tutorEmail, proposedStart, duration);
  } catch (err) {
    return next(err);
  }

  if (hasConflict)
    return res.status(409).json({
      error: 'That time slot is already booked. Please choose a different time.',
    });

  // ── 6. Compute cost ───────────────────────────────────────────────────────
  let cost = 0;
  if (course.rate_type === 'session' && course.session_rate) {
    // Flat per-session fee regardless of duration
    cost = parseFloat(course.session_rate);
  } else if (course.rate_type === 'hourly' && course.hourly_rate) {
    cost = (duration / 60) * parseFloat(course.hourly_rate);
  } else if (course.rate_type === 'both') {
    // When both are set, prefer hourly so longer sessions cost more fairly.
    // Tutors can override this logic by setting only one rate type.
    cost = course.hourly_rate
      ? (duration / 60) * parseFloat(course.hourly_rate)
      : parseFloat(course.session_rate ?? 0);
  }
  cost = Math.round(cost * 100) / 100; // round to 2 decimal places

  // ── 7. Insert ─────────────────────────────────────────────────────────────
  const status = settings.auto_confirm ? 'confirmed' : 'pending';

  try {
    const result = await pool.query(
      `INSERT INTO sessions
         (tcid, tutor_email, user_email, session_timestamp, duration_minutes, cost, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [tcid, tutorEmail, req.user.email, proposedStart.toISOString(), duration, cost, status]
    );

    // Re-fetch with the full join so the response is identical to getSessions
    const full = await pool.query(
      `${SESSION_SELECT} WHERE s.session_id = $1`,
      [result.rows[0].session_id]
    );

    res.status(201).json(full.rows[0]);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/sessions/:session_id/status
//
// Role-based status transitions:
//
//   Tutor  : pending  → confirmed
//   Tutor  : pending  → cancelled  (decline)
//   Tutor  : confirmed → cancelled  (cancel after confirming)
//   Student: pending  → cancelled  (within cancellation window)
//   Student: confirmed → cancelled  (within cancellation window)
//   System : confirmed → completed  (set when session window has passed —
//            done server-side; students/tutors cannot set 'completed' directly)
// ─────────────────────────────────────────────────────────────────────────────
const updateSessionStatus = async (req, res, next) => {
  const { session_id } = req.params;
  const { status }     = req.body;

  const ALLOWED_STATUSES = ['confirmed', 'cancelled'];
  if (!status || !ALLOWED_STATUSES.includes(status))
    return res.status(400).json({ error: `status must be one of: ${ALLOWED_STATUSES.join(', ')}.` });

  try {
    // Fetch session + settings for validation
    const sessionResult = await pool.query(
      `SELECT s.*, tss.cancellation_hours, tss.auto_confirm
       FROM sessions s
       JOIN tutor_session_settings tss ON tss.tutor_email = s.tutor_email
       WHERE s.session_id = $1`,
      [session_id]
    );

    if (sessionResult.rowCount === 0)
      return res.status(404).json({ error: 'Session not found.' });

    const session = sessionResult.rows[0];

    // Only tutor or student involved in this session can update it
    const isTutor   = req.user.email === session.tutor_email;
    const isStudent = req.user.email === session.user_email;

    if (!isTutor && !isStudent)
      return res.status(403).json({ error: 'You are not part of this session.' });

    // Completed/already-cancelled sessions cannot be changed
    if (session.status === 'completed')
      return res.status(409).json({ error: 'Completed sessions cannot be modified.' });
    if (session.status === 'cancelled')
      return res.status(409).json({ error: 'Session is already cancelled.' });

    // Only tutors can confirm
    if (status === 'confirmed' && !isTutor)
      return res.status(403).json({ error: 'Only the tutor can confirm a session.' });

    // Cancellation window check for students
    if (status === 'cancelled' && isStudent && !isTutor) {
      const cancellationDeadline = new Date(
        new Date(session.session_timestamp).getTime() -
        session.cancellation_hours * 60 * 60 * 1000
      );
      if (new Date() > cancellationDeadline)
        return res.status(409).json({
          error: `Cancellations must be made at least ${session.cancellation_hours} hours before the session.`,
        });
    }

    const result = await pool.query(
      `UPDATE sessions
       SET status = $1, updated_at = NOW()
       WHERE session_id = $2
       RETURNING *`,
      [status, session_id]
    );

    const full = await pool.query(
      `${SESSION_SELECT} WHERE s.session_id = $1`,
      [result.rows[0].session_id]
    );

    res.json(full.rows[0]);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/sessions/:session_id/feedback
// Only available once a session is 'completed'.
// ─────────────────────────────────────────────────────────────────────────────
const addFeedback = async (req, res, next) => {
  const { session_id } = req.params;
  const { feedback }   = req.body;

  if (!feedback)
    return res.status(400).json({ error: 'Feedback is required.' });

  try {
    // Verify session is completed and belongs to this student
    const check = await pool.query(
      `SELECT session_id, status FROM sessions
       WHERE session_id = $1 AND user_email = $2`,
      [session_id, req.user.email]
    );

    if (check.rowCount === 0)
      return res.status(404).json({ error: 'Session not found.' });

    if (check.rows[0].status !== 'completed')
      return res.status(409).json({
        error: 'Feedback can only be submitted for completed sessions.',
      });

    const result = await pool.query(
      `UPDATE sessions
       SET feedback = $1, updated_at = NOW()
       WHERE session_id = $2 AND user_email = $3
       RETURNING *`,
      [feedback, session_id, req.user.email]
    );

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/sessions/complete-past
// Internal/cron-style endpoint — marks all confirmed sessions whose
// end_timestamp has passed as 'completed'.
// Secured by checking for a server-side secret header so it can be called
// from a scheduled job without exposing it to students/tutors.
// ─────────────────────────────────────────────────────────────────────────────
const completePastSessions = async (req, res, next) => {
  const secret = req.headers['x-cron-secret'];
  if (!secret || secret !== process.env.CRON_SECRET)
    return res.status(403).json({ error: 'Forbidden.' });

  try {
    const result = await pool.query(
      `UPDATE sessions
       SET status = 'completed', updated_at = NOW()
       WHERE status = 'confirmed'
         AND end_timestamp < NOW()
       RETURNING session_id`
    );
    res.json({ completed: result.rowCount, ids: result.rows.map(r => r.session_id) });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSessions,
  getTutorSessions,
  createSession,
  updateSessionStatus,
  addFeedback,
  completePastSessions,
};