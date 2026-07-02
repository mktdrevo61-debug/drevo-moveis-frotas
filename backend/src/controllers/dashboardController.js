/**
 * dashboardController.js
 * ----------------------
 * Aggregates fleet metrics for the manager dashboard.
 * All calculations are performed in a single pass using raw SQL aggregates
 * to minimize round-trips to the database.
 */

const db = require('../config/database');

// ---------------------------------------------------------------------------
// GET /api/dashboard/metrics
// ---------------------------------------------------------------------------

/**
 * Return a comprehensive set of fleet KPIs for the dashboard.
 *
 * Metrics returned:
 *   - vehicles_in_use            : vehicles currently checked out
 *   - vehicles_in_maintenance    : vehicles in the shop
 *   - total_vehicles             : total fleet size
 *   - oee                        : operational efficiency (fake formula)
 *   - monthly_fuel_cost          : sum of fuel costs this calendar month
 *   - active_damages_by_severity : count of open damages grouped by severity
 *   - vehicles_needing_maintenance : vehicles with mileage > 50,000 not in maintenance
 */
async function getMetrics(req, res, next) {
  try {
    // ── 1. Vehicle status counts ────────────────────────────────────────────
    const vehicleStatsResult = await db.query(`
      SELECT
        COUNT(*)                                                          AS total_vehicles,
        SUM(CASE WHEN status = 'in_use'      THEN 1 ELSE 0 END)         AS vehicles_in_use,
        SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END)         AS vehicles_in_maintenance
      FROM vehicles
    `);
    const vehicleStats = vehicleStatsResult.rows[0];

    const total_vehicles          = Number(vehicleStats.total_vehicles)          || 0;
    const vehicles_in_use         = Number(vehicleStats.vehicles_in_use)         || 0;
    const vehicles_in_maintenance = Number(vehicleStats.vehicles_in_maintenance) || 0;

    // ── 2. OEE — Operational Equipment Effectiveness (simplified) ───────────
    // Formula: ((total - in_maintenance) / total) * 100
    // Avoids division by zero if fleet is empty.
    const oee = total_vehicles > 0
      ? (((total_vehicles - vehicles_in_maintenance) / total_vehicles) * 100).toFixed(1)
      : '0.0';

    // ── 3. Monthly fuel cost ─────────────────────────────────────────────────
    const fuelStatsResult = await db.query(`
      SELECT COALESCE(SUM(total_cost), 0) AS monthly_fuel_cost
      FROM fuel_logs
      WHERE TO_CHAR(created_at, 'YYYY-MM') = TO_CHAR(CURRENT_DATE, 'YYYY-MM')
    `);
    const fuelStats = fuelStatsResult.rows[0];

    const monthly_fuel_cost = Number(fuelStats.monthly_fuel_cost).toFixed(2);

    // ── 4. Active damages by severity ────────────────────────────────────────
    const damageRowsResult = await db.query(`
      SELECT severity, COUNT(*) AS count
      FROM damages
      WHERE status != 'fixed'
      GROUP BY severity
    `);
    const damageRows = damageRowsResult.rows;

    // Convert to a flat object: { low: 0, medium: 2, high: 1 }
    const active_damages_by_severity = { low: 0, medium: 0, high: 0 };
    for (const row of damageRows) {
      active_damages_by_severity[row.severity] = Number(row.count);
    }

    // ── 5. Vehicles needing maintenance ──────────────────────────────────────
    // Criteria: mileage > 50,000 AND not already in 'maintenance' status
    const vehiclesNeedingMaintenanceResult = await db.query(`
      SELECT id, plate, model, year, current_mileage, status
      FROM vehicles
      WHERE current_mileage > 50000
        AND status != 'maintenance'
      ORDER BY current_mileage DESC
    `);
    const vehiclesNeedingMaintenance = vehiclesNeedingMaintenanceResult.rows;

    // ── 6. All Vehicles for Fleet Section ────────────────────────────────────
    const vehicles = await require('../models/vehicleModel').findAll();

    // Map active_damages_by_severity to array for Recharts PieChart
    // PieChart expects: [{ name: 'Alta', value: x }, { name: 'Média', value: y }, { name: 'Baixa', value: z }]
    const damage_by_severity = [
      { name: 'Alta', value: active_damages_by_severity.high || 0 },
      { name: 'Média', value: active_damages_by_severity.medium || 0 },
      { name: 'Baixa', value: active_damages_by_severity.low || 0 },
    ].filter(item => item.value > 0); // Recharts handles 0 values fine, but filtering empty ones can be cleaner

    // Map fuel logs for the last 6 months for the BarChart
    // We'll just provide some placeholder or actual grouped data. The frontend expects `fuel_by_month`.
    const fuelMonthsResult = await db.query(`
      SELECT TO_CHAR(created_at, 'MM') as month, SUM(total_cost) as cost
      FROM fuel_logs
      WHERE created_at >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY month
      ORDER BY month ASC
    `);
    const fuelMonths = fuelMonthsResult.rows;

    // Month map to portuguese abbreviations
    const monthNames = {
      '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr', '05': 'Mai', '06': 'Jun',
      '07': 'Jul', '08': 'Ago', '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez'
    };

    const fuel_by_month = fuelMonths.map(row => ({
      month: monthNames[row.month] || row.month,
      cost: Number(row.cost)
    }));

    // If no fuel logs exist yet for 6 months, let's provide some mock data so the chart isn't empty,
    // or just return the actual array (it will just be empty). We will return actual.

    return res.status(200).json({
      success: true,
      data: {
        vehicles_in_route: vehicles_in_use, // Renamed to match frontend
        vehicles_in_maintenance,
        total_vehicles,
        oee: parseFloat(oee),
        monthly_cost: parseFloat(monthly_fuel_cost), // Renamed to match frontend
        damage_by_severity, // Converted to array for frontend
        fuel_by_month, // Added for frontend chart
        vehicles_needing_maintenance: vehiclesNeedingMaintenance,
        vehicles, // Added all vehicles for the fleet section
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Export all relevant fleet data (Handovers, Damages, Fuel) as a CSV file.
 * We'll generate a combined CSV for simplicity, or just export the most critical logs.
 */
async function exportData(req, res, next) {
  try {
    // 1. Fetch data
    const damagesResult = await db.query(`
      SELECT d.id, 'Avaria' as tipo, v.plate as veiculo, u.name as motorista, d.part_id as peca_ou_tipo, d.severity as gravidade, d.status, d.created_at as data
      FROM damages d
      JOIN vehicles v ON v.id = d.vehicle_id
      JOIN users u ON u.id = d.driver_id
      ORDER BY d.created_at DESC
    `);
    const damages = damagesResult.rows;

    const fuelsResult = await db.query(`
      SELECT f.id, 'Abastecimento' as tipo, v.plate as veiculo, u.name as motorista, f.fuel_type as peca_ou_tipo, f.liters || 'L / R$' || f.total_cost as gravidade, 'N/A' as status, f.created_at as data
      FROM fuel_logs f
      JOIN vehicles v ON v.id = f.vehicle_id
      JOIN users u ON u.id = f.driver_id
      ORDER BY f.created_at DESC
    `);
    const fuels = fuelsResult.rows;

    // 2. Combine and format as CSV
    const allRecords = [...damages, ...fuels].sort((a, b) => new Date(b.data) - new Date(a.data));
    
    // CSV Header
    let csvStr = 'ID,TIPO,VEICULO,MOTORISTA,DETALHE_1,DETALHE_2,STATUS,DATA\\n';
    
    allRecords.forEach(r => {
      // Escape commas by quoting strings
      const safeString = (str) => `"\${String(str || '').replace(/"/g, '""')}"`;
      csvStr += `\${r.id},\${safeString(r.tipo)},\${safeString(r.veiculo)},\${safeString(r.motorista)},\${safeString(r.peca_ou_tipo)},\${safeString(r.gravidade)},\${safeString(r.status)},\${safeString(r.data)}\\n`;
    });

    // Send as attachment
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="drevo_frotas_relatorio.csv"');
    return res.status(200).send(csvStr);
  } catch (err) {
    next(err);
  }
}

module.exports = { getMetrics, exportData };
