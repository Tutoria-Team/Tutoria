const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { generalLimiter } = require('./middleware/rateLimiter.middleware');
const { notFound, errorHandler } = require('./middleware/error.middleware');

const authRoutes         = require('./routes/auth.routes');
const usersRoutes        = require('./routes/users.routes');
const coursesRoutes      = require('./routes/courses.routes');
const sessionsRoutes     = require('./routes/sessions.routes');
const availabilityRoutes = require('./routes/availability.routes');

const app = express();

// =======================
// Core Middleware
// =======================
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use('/api', generalLimiter);

// =======================
// Sanity Check
// =======================
app.get('/api/test', (req, res) => res.json({ message: 'API is working!' }));

// =======================
// Routes
// =======================
app.use('/api/auth',         authRoutes);
app.use('/api/users/me',     usersRoutes);
app.use('/api/courses',      coursesRoutes);
app.use('/api/sessions',     sessionsRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/tutor-settings', require('./routes/tutorSessionSettings.routes'));

// =======================
// Error Handling (must be last)
// =======================
app.use(notFound);
app.use(errorHandler);

module.exports = app;