const router = require('express').Router();
const { authenticateToken } = require('../middleware/auth.middleware');
const {
  getAvailability,
  createAvailability,
  deleteAvailability,
} = require('../controllers/availability.controller');

router.get('/',                       authenticateToken, getAvailability);
router.post('/',                      authenticateToken, createAvailability);
router.delete('/:availability_id',    authenticateToken, deleteAvailability);

module.exports = router;