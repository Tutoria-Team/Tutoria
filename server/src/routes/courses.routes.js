const router = require('express').Router();
const { authenticateToken } = require('../middleware/auth.middleware');
const { getCourses, createCourse, updateCourse, deleteCourse, getAllTutorCourses } = require('../controllers/courses.controller');

router.get('/',         authenticateToken, getCourses);
router.post('/',        authenticateToken, createCourse);
router.patch('/:tcid',  authenticateToken, updateCourse);
router.delete('/:tcid', authenticateToken, deleteCourse);
router.get('/all-tutor-courses', getAllTutorCourses);

module.exports = router;