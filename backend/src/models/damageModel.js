/**
 * damageModel.js
 * --------------
 * Data-access functions for the `damages` table.
 */

const db = require('../config/database');

/**
 * Create a new damage report.
 * @param {{ vehicle_id: number, driver_id: number, handover_id: number|null, part_id: string, severity: string, notes: string|null }} params
 * @returns {object} The newly created damage row.
 */
async function create({ vehicle_id, driver_id, handover_id, part_id, severity, notes }) {
  const insertResult = await db.query(`
    INSERT INTO damages (vehicle_id, driver_id, handover_id, part_id, severity, notes)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id
  `, [
    vehicle_id,
    driver_id,
    handover_id ?? null,
    part_id,
    severity,
    notes ?? null,
  ]);

  const result = await db.query(`
    SELECT d.*, u.name AS driver_name, v.plate
    FROM damages d
    JOIN users u ON u.id = d.driver_id
    JOIN vehicles v ON v.id = d.vehicle_id
    WHERE d.id = $1
  `, [insertResult.rows[0].id]);
  return result.rows[0];
}

/**
 * Return all non-fixed damage records for a specific vehicle.
 * @param {number} vehicle_id
 * @returns {object[]}
 */
async function findByVehicle(vehicle_id) {
  const result = await db.query(`
    SELECT d.*, u.name AS driver_name
    FROM damages d
    JOIN users u ON u.id = d.driver_id
    WHERE d.vehicle_id = $1 AND d.status != 'fixed'
    ORDER BY d.created_at DESC
  `, [vehicle_id]);
  return result.rows;
}

/**
 * Update the status of a damage record.
 * When the new status is 'fixed', resolved_at is set to the provided timestamp.
 * @param {number} id
 * @param {'reported'|'repairing'|'fixed'} status
 * @param {string|null} resolved_at ISO datetime string or null.
 * @returns {object} The updated damage row.
 */
async function updateStatus(id, status, resolved_at) {
  await db.query(`
    UPDATE damages
    SET status = $1, resolved_at = $2
    WHERE id = $3
  `, [status, resolved_at ?? null, id]);

  const result = await db.query(`
    SELECT d.*, u.name AS driver_name, v.plate
    FROM damages d
    JOIN users u ON u.id = d.driver_id
    JOIN vehicles v ON v.id = d.vehicle_id
    WHERE d.id = $1
  `, [id]);
  return result.rows[0];
}

/**
 * Return all damage records across the fleet.
 * @returns {object[]}
 */
async function findAll() {
  const result = await db.query(`
    SELECT d.*, u.name AS driver_name, v.plate,
           (SELECT photo_url FROM vehicle_photos vp WHERE vp.vehicle_id = d.vehicle_id ORDER BY created_at DESC LIMIT 1) as latest_photo
    FROM damages d
    JOIN users u ON u.id = d.driver_id
    JOIN vehicles v ON v.id = d.vehicle_id
    ORDER BY d.created_at DESC
  `);
  return result.rows;
}

module.exports = { create, findByVehicle, updateStatus, findAll };
