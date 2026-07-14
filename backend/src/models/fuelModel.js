/**
 * fuelModel.js
 * ------------
 * Data-access functions for the `fuel_logs` table.
 */

const db = require('../config/database');

/**
 * Create a new fuel log entry.
 * @param {{ vehicle_id: number, driver_id: number, liters: number, total_cost: number, fuel_type: string, receipt_image_url: string|null, ocr_cnpj_extracted: string|null }} params
 * @returns {object} The newly created fuel_log row.
 */
async function create({
  vehicle_id,
  driver_id,
  liters,
  total_cost,
  fuel_type,
  current_mileage,
  receipt_image_url,
  ocr_cnpj_extracted,
}) {
  const insertResult = await db.query(`
    INSERT INTO fuel_logs
      (vehicle_id, driver_id, liters, total_cost, fuel_type, current_mileage, receipt_image_url, ocr_cnpj_extracted)
    VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id
  `, [
    vehicle_id,
    driver_id,
    liters,
    total_cost,
    fuel_type,
    current_mileage ?? null,
    receipt_image_url ?? null,
    ocr_cnpj_extracted ?? null,
  ]);

  const result = await db.query(`
    SELECT f.*, u.name AS driver_name, v.plate
    FROM fuel_logs f
    JOIN users u ON u.id = f.driver_id
    JOIN vehicles v ON v.id = f.vehicle_id
    WHERE f.id = $1
  `, [insertResult.rows[0].id]);
  return result.rows[0];
}

/**
 * Return the total fuel cost for the current calendar month.
 * Useful for the dashboard OEE / cost metrics.
 * @returns {{ monthly_total: number }}
 */
async function monthlyTotal() {
  const result = await db.query(`
    SELECT COALESCE(SUM(total_cost), 0) AS monthly_total
    FROM fuel_logs
    WHERE TO_CHAR(created_at, 'YYYY-MM') = TO_CHAR(CURRENT_DATE, 'YYYY-MM')
  `);
  return result.rows[0];
}

/**
 * Return all fuel log records, newest first, with driver and vehicle info.
 * @returns {object[]}
 */
async function findAll() {
  const result = await db.query(`
    SELECT f.*, u.name AS driver_name, v.plate, v.model
    FROM fuel_logs f
    JOIN users u ON u.id = f.driver_id
    JOIN vehicles v ON v.id = f.vehicle_id
    ORDER BY f.created_at DESC
  `);
  return result.rows;
}

module.exports = { create, monthlyTotal, findAll };
