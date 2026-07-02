/**
 * app.js
 * ------
 * Express application factory.
 * Configures middleware, mounts all route modules, and sets up
 * the 404 and global error handlers.
 *
 * This file intentionally does NOT call app.listen() so that it can
 * be imported cleanly in tests without starting a real server.
 */

const express = require('express');
const cors    = require('cors');
require('dotenv').config();

const app = express();

// ---------------------------------------------------------------------------
// Global middleware
// ---------------------------------------------------------------------------

// Enable CORS for all origins (restrict in production via CORS_ORIGIN env var)
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Parse JSON bodies; allow up to 10mb for base64 receipt images
app.use(express.json({ limit: '10mb' }));

// ---------------------------------------------------------------------------
// API routes
// ---------------------------------------------------------------------------

app.use('/api/auth',      require('./routes/authRoutes'));
app.use('/api/fleet',     require('./routes/fleetRoutes'));
app.use('/api/damages',   require('./routes/damageRoutes'));
app.use('/api/fuel',      require('./routes/fuelRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/photos',    require('./routes/photoRoutes'));

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------

app.get('/health', (req, res) => {
  res.json({
    status:    'ok',
    project:   'Drevo Móveis API',
    timestamp: new Date().toISOString(),
    env:       process.env.NODE_ENV || 'development',
  });
});

// ---------------------------------------------------------------------------
// 404 handler — must come AFTER all routes
// ---------------------------------------------------------------------------

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ---------------------------------------------------------------------------
// Global error handler — must be last (4-argument signature required)
// ---------------------------------------------------------------------------

app.use(require('./middlewares/errorHandler'));

module.exports = app;
