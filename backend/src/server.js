/**
 * server.js
 * ---------
 * Application entry point.
 * Initializes the database (creates tables + seeds data) and starts
 * the HTTP server.
 */

require('dotenv').config();
const app = require('./app');
const { initializeDB } = require('./config/initDB');
const { startCronJobs } = require('./services/cronService');

const PORT = process.env.PORT || 3001;

(async () => {
  // Initialize the database before accepting connections
  await initializeDB();
  startCronJobs();

  app.listen(PORT, () => {
    console.log(`\n🚛 Drevo Móveis API rodando na porta ${PORT}`);
    console.log(`📡 Health: http://localhost:${PORT}/health`);
    console.log(`🌍 ENV   : ${process.env.NODE_ENV || 'development'}\n`);
  });
})();
