const router = require('express').Router();
const { authenticateToken } = require('../middleware/auth.middleware');
const { getMe, updateMe, becomeATutor } = require('../controllers/users.controller');

router.get('/',               authenticateToken, getMe);
router.patch('/',             authenticateToken, updateMe);
router.patch('/become-tutor', authenticateToken, becomeATutor);

module.exports = router;