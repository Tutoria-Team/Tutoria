const router = require('express').Router();
const { authenticateToken } = require('../middleware/auth.middleware');
const {
  getSessions,
  getTutorSessions,
  createSession,
  updateSessionStatus,
  addFeedback,
  completePastSessions,
} = require('../controllers/sessions.controller');

// ── Student endpoints ──────────────────────────────────────────────────────
// GET  /api/sessions          — student's own session history
router.get('/',                               authenticateToken, getSessions);

// POST /api/sessions          — student books a session
router.post('/',                              authenticateToken, createSession);

// PATCH /api/sessions/:id/feedback  — student submits feedback (completed only)
router.patch('/:session_id/feedback',         authenticateToken, addFeedback);

// ── Shared (tutor OR student) ──────────────────────────────────────────────
// PATCH /api/sessions/:id/status  — confirm (tutor) or cancel (either)
router.patch('/:session_id/status',           authenticateToken, updateSessionStatus);

// ── Tutor endpoints ────────────────────────────────────────────────────────
// GET  /api/sessions/tutor          — tutor's incoming bookings
// Optional query param: ?status=pending|confirmed|cancelled|completed
router.get('/tutor',                          authenticateToken, getTutorSessions);

// ── Internal / cron ───────────────────────────────────────────────────────
// PATCH /api/sessions/complete-past — marks confirmed past sessions as completed
// Protected by X-Cron-Secret header (set CRON_SECRET in your .env)
router.patch('/complete-past',                completePastSessions);

module.exports = router;