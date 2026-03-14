const router = require('express').Router();
const { authenticateToken } = require('../middleware/auth.middleware');
const { getSessions, createSession, addFeedback } = require('../controllers/sessions.controller');

router.get('/',                          authenticateToken, getSessions);
router.post('/',                         authenticateToken, createSession);
router.patch('/:session_id/feedback',    authenticateToken, addFeedback);

module.exports = router;