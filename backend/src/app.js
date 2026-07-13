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
// Health check & Debug Routes
// ---------------------------------------------------------------------------

app.get('/api/test-sheets', async (req, res) => {
  const { GoogleSpreadsheet } = require('google-spreadsheet');
  const { JWT } = require('google-auth-library');
  
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const sheetId = process.env.GOOGLE_SHEET_ID;

  if (!email || !privateKey || !sheetId) {
    return res.status(400).json({ error: 'Faltam variáveis de ambiente (Email, Key ou Sheet ID)' });
  }

  try {
    const serviceAccountAuth = new JWT({
      email,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(sheetId, serviceAccountAuth);
    await doc.loadInfo();
    
    res.json({ 
      success: true, 
      message: 'Conexão com Google Sheets bem-sucedida!', 
      title: doc.title,
      email: email,
      sheetId: sheetId
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error_message: error.message,
      error_stack: error.stack,
      hint: 'Verifique se a chave privada está inteira, se o ID da planilha está certo e se você compartilhou a planilha com o e-mail do robô.'
    });
  }
});

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
