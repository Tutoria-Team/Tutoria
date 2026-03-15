const router = require('express').Router();
const { authenticateToken } = require('../middleware/auth.middleware');
const { getCourses, createCourse, updateCourse, deleteCourse } = require('../controllers/courses.controller');

router.get('/',         authenticateToken, getCourses);
router.post('/',        authenticateToken, createCourse);
router.patch('/:tcid',  authenticateToken, updateCourse);
router.delete('/:tcid', authenticateToken, deleteCourse);

module.exports = router;