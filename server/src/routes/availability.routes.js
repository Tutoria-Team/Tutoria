const router = require('express').Router();
const { authenticateToken } = require('../middleware/auth.middleware');
const {
  getAvailability, createAvailability, deleteAvailability,
  getBlackoutDates, createBlackoutDate, deleteBlackoutDate 
} = require('../controllers/availability.controller');

router.get('/',                       authenticateToken, getAvailability);
router.post('/',                      authenticateToken, createAvailability);
router.delete('/:availability_id',    authenticateToken, deleteAvailability);
router.get('/blackout-dates',        authenticateToken, getBlackoutDates);
router.post('/blackout-dates',       authenticateToken, createBlackoutDate);
router.delete('/blackout-dates/:id', authenticateToken, deleteBlackoutDate);

module.exports = router;