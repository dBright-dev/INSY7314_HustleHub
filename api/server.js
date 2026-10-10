/**
 * HustleHubt API Server 
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const gigRoutes = require('./routes/gigRoutes');
const requestLogger = require('./middleware/requestLogger');
const { apiLimiter } = require('./middleware/rateLimiter');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const logger = require('./utils/logger');

// 1. CONNECT TO DATABASE
connectDB();

// 2. INITIALIZE EXPRESS APP
const app = express();

// Trust proxy 
app.set('trust proxy', 1);

// 3. SECURITY MIDDLEWARE 

// Helmet - Security HTTP headers + CSP
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false, // Allow Postman testing
  })
);

// CORS - Allow frontend origin only
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);


// 4. BODY PARSING
app.use(express.json({ limit: '10kb' })); // Limit payload size
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 5. LOGGING
app.use(requestLogger);

// 6. RATE LIMITING (Global)
app.use('/api', apiLimiter);

// 7. HEALTH CHECK
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'HustleHubt API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// 8. API ROUTES
app.use('/api/auth', authRoutes);
app.use('/api/gigs', gigRoutes);


// 9. 404 HANDLER (must be after all routes)
app.use(notFound);


// 10. ERROR HANDLER (must be LAST)
app.use(errorHandler);


// 11. START SERVER
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`, {
    environment: process.env.NODE_ENV,
    url: `http://localhost:${PORT}`,
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection', { error: err.message });
  server.close(() => process.exit(1));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

module.exports = app; // Export for testing