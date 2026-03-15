const rateLimit = require('express-rate-limit');

const isDev = process.env.NODE_ENV !== 'production';

/**
 * Strict limiter for sensitive auth endpoints.
 * Production: 20 req / 15 min. Development: 200 req / 15 min.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      isDev ? 200 : 20,
  message:  { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders:   false,
});

/**
 * General limiter applied to all /api routes.
 * Production: 200 req / 15 min. Development: 2000 req / 15 min.
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      isDev ? 2000 : 200,
  message:  { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders:   false,
});

module.exports = { authLimiter, generalLimiter };