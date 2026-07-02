/**
 * maintenanceModel.js
 * -------------------
 * Data-access functions for the `maintenances` table.
 */

const db = require('../config/database');

/**
 * Return all maintenance records that are not yet done
 * (status is 'scheduled' or 'in_progress'), ordered by scheduled_date.
 * @returns {object[]}
 */
async function findPending() {
  const result = await db.query(`
    SELECT m.*, v.plate, v.model
    FROM maintenances m
    JOIN vehicles v ON v.id = m.vehicle_id
    WHERE m.status != 'done'
    ORDER BY m.scheduled_date ASC NULLS LAST, m.created_at ASC
  `);
  return result.rows;
}

/**
 * Return all maintenance records for a specific vehicle, newest first.
 * @param {number} vehicle_id
 * @returns {object[]}
 */
async function findByVehicle(vehicle_id) {
  const result = await db.query(`
    SELECT m.*, v.plate, v.model
    FROM maintenances m
    JOIN vehicles v ON v.id = m.vehicle_id
    WHERE m.vehicle_id = $1
    ORDER BY m.created_at DESC
  `, [vehicle_id]);
  return result.rows;
}

module.exports = { findPending, findByVehicle };
