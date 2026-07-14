/**
 * googleSheetsService.js
 * ----------------------
 * Synchronizes data to a Google Sheet automatically using a Service Account.
 */
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const db = require('../config/database');

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

    // ── 1. Sincronizar Viagens (Handovers) ──
    let viagensSheet = doc.sheetsByTitle['Viagens'];
    const viagensHeaders = ['ID', 'Veículo', 'Motorista', 'Destino', 'KM Inicial', 'KM Final', 'Status', 'Data Saída', 'Data Retorno'];
    if (!viagensSheet) {
      viagensSheet = await doc.addSheet({ title: 'Viagens', headerValues: viagensHeaders });
    } else {
      await viagensSheet.clear();
      await viagensSheet.setHeaderRow(viagensHeaders);
    }

    const { rows: viagens } = await db.query(`
      SELECT h.id, v.plate, u.name as driver_name, h.destination, h.start_mileage, h.end_mileage, h.status, h.checkout_time, h.checkin_time
      FROM handovers h
      JOIN vehicles v ON v.id = h.vehicle_id
      JOIN users u ON u.id = h.driver_id
      ORDER BY h.checkout_time DESC
    `);
    
    if (viagens.length > 0) {
      await viagensSheet.addRows(viagens.map(v => ({
        ID: v.id,
        Veículo: v.plate,
        Motorista: v.driver_name,
        Destino: v.destination || 'N/A',
        'KM Inicial': v.start_mileage,
        'KM Final': v.end_mileage || 'Em Rota',
        Status: v.status === 'active' ? 'Em Rota' : 'Concluída',
        'Data Saída': new Date(v.checkout_time).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
        'Data Retorno': v.checkin_time ? new Date(v.checkin_time).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : '-'
      })));
    }

    // ── 2. Sincronizar Avarias (Damages) ──
    let damageSheet = doc.sheetsByTitle['Avarias'];
    const damageHeaders = ['ID', 'Veículo', 'Motorista', 'Peça', 'Gravidade', 'Status', 'Data'];
    if (!damageSheet) {
      damageSheet = await doc.addSheet({ title: 'Avarias', headerValues: damageHeaders });
    } else {
      await damageSheet.clear();
      await damageSheet.setHeaderRow(damageHeaders);
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
        Gravidade: d.severity === 'high' ? 'Alta' : (d.severity === 'medium' ? 'Média' : 'Baixa'),
        Status: d.status === 'fixed' ? 'Resolvido' : (d.status === 'repairing' ? 'Em Conserto' : 'Pendente'),
        Data: new Date(d.created_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
      })));
    }

    // ── 3. Sincronizar Abastecimentos (Fuel) ──
    let fuelSheet = doc.sheetsByTitle['Abastecimentos'];
    const fuelHeaders = ['ID', 'Veículo', 'Motorista', 'Litros', 'Custo Total', 'Tipo', 'KM Atual', 'Data'];
    if (!fuelSheet) {
      fuelSheet = await doc.addSheet({ title: 'Abastecimentos', headerValues: fuelHeaders });
    } else {
      await fuelSheet.clear();
      await fuelSheet.setHeaderRow(fuelHeaders);
    }

    const { rows: fuels } = await db.query(`
      SELECT f.id, v.plate, u.name as driver_name, f.liters, f.total_cost, f.fuel_type, f.current_mileage, f.created_at
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
        'Custo Total': 'R$ ' + f.total_cost,
        Tipo: f.fuel_type,
        'KM Atual': f.current_mileage || '-',
        Data: new Date(f.created_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
      })));
    }

    console.log('✅ Google Sheets sincronizado com sucesso! (Viagens, Avarias e Abastecimentos)');
  } catch (error) {
    console.error('❌ Erro na sincronização com Google Sheets:', error);
  }
}

module.exports = { syncDataToSheet };
