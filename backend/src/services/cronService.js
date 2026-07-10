/**
 * cronService.js
 * --------------
 * Gerencia tarefas agendadas (cron jobs) do sistema.
 */
const cron = require('node-cron');
const { syncDataToSheet } = require('./googleSheetsService');

function startCronJobs() {
  console.log('⏳ Iniciando serviço de agendamentos (Cron Jobs)...');

  // Roda todos os dias às 20:00 no fuso horário do sistema
  // "0 20 * * *" = minuto 0, hora 20, todos os dias
  cron.schedule('0 20 * * *', async () => {
    console.log('⏰ [20:00] Iniciando rotina diária de sincronização (sem apagar histórico)...');
    try {
      await syncDataToSheet();
      console.log('✅ Sincronização concluída com sucesso!');
    } catch (error) {
      console.error('❌ Erro na rotina diária:', error);
    }
  }, {
    timezone: "America/Sao_Paulo"
  });

  console.log('✅ Cron Jobs configurados com sucesso.');
}

module.exports = { startCronJobs };
