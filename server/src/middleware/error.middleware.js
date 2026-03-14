/**
 * 404 handler — catches any request that didn't match a route.
 */
const notFound = (req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found` });
};

/**
 * Global error handler — catches anything passed to next(err).
 * Keep this last in app.js middleware chain.
 */
const errorHandler = (err, req, res, next) => {
  console.error('Unhandled error:', err);
  const status = err.status || 500;
  const message = err.message || 'Internal server error';
  res.status(status).json({ error: message });
};

module.exports = { notFound, errorHandler };