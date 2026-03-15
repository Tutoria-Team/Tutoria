const router = require('express').Router();
const { getSessionSettings, updateSessionSettings } = require('../controllers/tutorSessionSettings.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

router.get('/',   authenticateToken, getSessionSettings);
router.patch('/', authenticateToken, updateSessionSettings);

module.exports = router;