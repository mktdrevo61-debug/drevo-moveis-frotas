/**
 * googleSheetsService.js
 * ----------------------
 * Synchronizes data to a Google Sheet automatically using a Service Account.
 */
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const db = require('../config/database'); // Postgres db

async function syncDataToSheet() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const sheetId = process.env.GOOGLE_SHEET_ID;

  if (!email || !privateKey || !sheetId) {
    console.warn('⚠️ Credenciais do Google Sheets não configuradas. Pulando sincronização.');
    return;
  }

  try {
    const serviceAccountAuth = new JWT({
      email,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(sheetId, serviceAccountAuth);
    await doc.loadInfo();

    // Sincronizar Avarias (Damages)
    let damageSheet = doc.sheetsByTitle['Avarias'];
    if (!damageSheet) {
      damageSheet = await doc.addSheet({ title: 'Avarias', headerValues: ['ID', 'Veículo', 'Motorista', 'Peça', 'Gravidade', 'Status', 'Data'] });
    } else {
      await damageSheet.clear();
      await damageSheet.setHeaderRow(['ID', 'Veículo', 'Motorista', 'Peça', 'Gravidade', 'Status', 'Data']);
    }

    const { rows: damages } = await db.query(`
      SELECT d.id, v.plate, u.name as driver_name, d.part_id, d.severity, d.status, d.created_at
      FROM damages d
      JOIN vehicles v ON v.id = d.vehicle_id
      JOIN users u ON u.id = d.driver_id
      ORDER BY d.created_at DESC
    `);
    
    if (damages.length > 0) {
      await damageSheet.addRows(damages.map(d => ({
        ID: d.id,
        Veículo: d.plate,
        Motorista: d.driver_name,
        Peça: d.part_id,
        Gravidade: d.severity,
        Status: d.status,
        Data: new Date(d.created_at).toLocaleString('pt-BR')
      })));
    }

    // Sincronizar Abastecimentos (Fuel)
    let fuelSheet = doc.sheetsByTitle['Abastecimentos'];
    if (!fuelSheet) {
      fuelSheet = await doc.addSheet({ title: 'Abastecimentos', headerValues: ['ID', 'Veículo', 'Motorista', 'Litros', 'Custo Total', 'Tipo', 'Data'] });
    } else {
      await fuelSheet.clear();
      await fuelSheet.setHeaderRow(['ID', 'Veículo', 'Motorista', 'Litros', 'Custo Total', 'Tipo', 'Data']);
    }

    const { rows: fuels } = await db.query(`
      SELECT f.id, v.plate, u.name as driver_name, f.liters, f.total_cost, f.fuel_type, f.created_at
      FROM fuel_logs f
      JOIN vehicles v ON v.id = f.vehicle_id
      JOIN users u ON u.id = f.driver_id
      ORDER BY f.created_at DESC
    `);

    if (fuels.length > 0) {
      await fuelSheet.addRows(fuels.map(f => ({
        ID: f.id,
        Veículo: f.plate,
        Motorista: f.driver_name,
        Litros: f.liters,
        'Custo Total': f.total_cost,
        Tipo: f.fuel_type,
        Data: new Date(f.created_at).toLocaleString('pt-BR')
      })));
    }

    console.log('✅ Google Sheets sincronizado com sucesso!');
  } catch (error) {
    console.error('❌ Erro na sincronização com Google Sheets:', error);
  }
}

module.exports = { syncDataToSheet };
