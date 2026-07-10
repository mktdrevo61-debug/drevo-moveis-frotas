/**
 * vehicleModel.js
 * ---------------
 * Data-access functions for the `vehicles` table.
 */

const db = require('../config/database');

/**
 * Return all vehicles ordered by plate.
 * @returns {object[]}
 */
async function findAll() {
  const result = await db.query(`
    SELECT v.id, v.plate, v.model, v.year, v.status, v.current_mileage, v.image_url, v.created_at,
           u.name AS current_driver_name,
           h.destination AS current_destination,
           lh.start_mileage as initial_km,
           lh.end_mileage as final_km
    FROM vehicles v
    LEFT JOIN handovers h ON h.vehicle_id = v.id AND h.status = 'active'
    LEFT JOIN users u ON u.id = h.driver_id
    LEFT JOIN (
        SELECT DISTINCT ON (vehicle_id) vehicle_id, start_mileage, end_mileage
        FROM handovers
        ORDER BY vehicle_id, created_at DESC
    ) lh ON lh.vehicle_id = v.id
    ORDER BY v.plate ASC
  `);
  return result.rows;
}

/**
 * Return only vehicles with status = 'available'.
 * @returns {object[]}
 */
async function findAvailable() {
  const result = await db.query(`
    SELECT id, plate, model, year, status, current_mileage, image_url, created_at
    FROM vehicles
    WHERE status = 'available'
    ORDER BY plate ASC
  `);
  return result.rows;
}

/**
 * Find a single vehicle by its primary key.
 * @param {number} id
 * @returns {object|undefined}
 */
async function findById(id) {
  const result = await db.query(`
    SELECT id, plate, model, year, status, current_mileage, image_url, created_at
    FROM vehicles
    WHERE id = $1
  `, [id]);
  return result.rows[0];
}

/**
 * Update a vehicle's operational status.
 * @param {number} id
 * @param {'available'|'in_use'|'maintenance'} status
 * @returns {object} The updated vehicle row.
 */
async function updateStatus(id, status) {
  await db.query(`
    UPDATE vehicles
    SET status = $1
    WHERE id = $2
  `, [status, id]);
  return await findById(id);
}

/**
 * Update a vehicle's current mileage reading.
 * @param {number} id
 * @param {number} mileage
 * @returns {object} The updated vehicle row.
 */
async function updateMileage(id, mileage) {
  await db.query(`
    UPDATE vehicles
    SET current_mileage = $1
    WHERE id = $2
  `, [mileage, id]);
  return await findById(id);
}

module.exports = { findAll, findAvailable, findById, updateStatus, updateMileage };
