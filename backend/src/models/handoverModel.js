/**
 * handoverModel.js
 * ----------------
 * Data-access functions for the `handovers` table.
 * A handover represents a vehicle checkout → checkin lifecycle.
 */

const db = require('../config/database');

/**
 * Create a new active handover record (checkout event).
 * @param {{ vehicle_id: number, driver_id: number, start_mileage: number, destination: string }} params
 * @returns {object} The newly created handover row.
 */
async function create({ vehicle_id, driver_id, start_mileage, destination }) {
  const insertResult = await db.query(`
    INSERT INTO handovers (vehicle_id, driver_id, start_mileage, destination)
    VALUES ($1, $2, $3, $4)
    RETURNING id
  `, [vehicle_id, driver_id, start_mileage, destination]);

  const result = await db.query(`
    SELECT h.*, v.plate, v.model, v.image_url, u.name AS driver_name
    FROM handovers h
    JOIN vehicles v ON v.id = h.vehicle_id
    JOIN users u ON u.id = h.driver_id
    WHERE h.id = $1
  `, [insertResult.rows[0].id]);
  return result.rows[0];
}

/**
 * Find the current active (status='active') handover for a specific driver.
 * A driver can only have one active handover at a time.
 * @param {number} driver_id
 * @returns {object|undefined}
 */
async function findActiveByDriver(driver_id) {
  const result = await db.query(`
    SELECT h.*, v.plate, v.model, v.image_url, u.name AS driver_name
    FROM handovers h
    JOIN vehicles v ON v.id = h.vehicle_id
    JOIN users u ON u.id = h.driver_id
    WHERE h.driver_id = $1 AND h.status = 'active'
  `, [driver_id]);
  return result.rows[0];
}

/**
 * Complete (close) a handover by recording the checkin data.
 * @param {{ id: number, end_mileage: number, checkin_time: string }} params
 * @returns {object} The updated handover row.
 */
async function complete({ id, end_mileage, checkin_time }) {
  await db.query(`
    UPDATE handovers
    SET status = 'completed', end_mileage = $1, checkin_time = $2
    WHERE id = $3
  `, [end_mileage, checkin_time, id]);

  const result = await db.query(`
    SELECT h.*, v.plate, v.model, v.image_url, u.name AS driver_name
    FROM handovers h
    JOIN vehicles v ON v.id = h.vehicle_id
    JOIN users u ON u.id = h.driver_id
    WHERE h.id = $1
  `, [id]);
  return result.rows[0];
}

module.exports = { create, findActiveByDriver, complete };
