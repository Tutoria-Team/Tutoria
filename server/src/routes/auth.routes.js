const router = require('express').Router();
const { authLimiter } = require('../middleware/rateLimiter.middleware');
const {
  signup,
  validateOtp,
  login,
  requestPasswordReset,
  resetPassword,
} = require('../controllers/auth.controller');

router.post('/signup',                 authLimiter, signup);
router.post('/validate-otp',           authLimiter, validateOtp);
router.post('/login',                  authLimiter, login);
router.post('/request-password-reset', authLimiter, requestPasswordReset);
router.post('/reset-password',         authLimiter, resetPassword);

module.exports = router;