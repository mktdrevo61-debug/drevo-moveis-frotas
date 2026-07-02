/**
 * cronService.js
 * --------------
 * Background jobs running at scheduled intervals.
 */
const cron = require('node-cron');
const { syncDataToSheet } = require('./googleSheetsService');

function startCronJobs() {
  console.log('🕒 Starting background jobs...');

  // Sync to Google Sheets every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    console.log('🔄 Running scheduled Google Sheets sync...');
    await syncDataToSheet();
  });
}

module.exports = { startCronJobs };
