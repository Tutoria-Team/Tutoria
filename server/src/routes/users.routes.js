const router = require('express').Router();
const { authenticateToken } = require('../middleware/auth.middleware');
const { getMe, updateMe } = require('../controllers/users.controller');

router.get('/',  authenticateToken, getMe);
router.patch('/', authenticateToken, updateMe);

module.exports = router;