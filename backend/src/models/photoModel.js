const db = require('../config/database');

/**
 * Save a new photo to the database.
 * @param {{ vehicle_id: number, driver_id: number, photo_url: string }} params
 * @returns {object} The newly created photo row.
 */
async function create({ vehicle_id, driver_id, photo_url }) {
  const insertResult = await db.query(`
    INSERT INTO vehicle_photos (vehicle_id, driver_id, photo_url)
    VALUES ($1, $2, $3)
    RETURNING id
  `, [vehicle_id, driver_id, photo_url]);

  const result = await db.query(`
    SELECT p.*, u.name AS driver_name
    FROM vehicle_photos p
    JOIN users u ON u.id = p.driver_id
    WHERE p.id = $1
  `, [insertResult.rows[0].id]);
  return result.rows[0];
}

/**
 * Get all photos for a vehicle, ordered by newest first.
 * @param {number} vehicle_id
 * @returns {Array<object>}
 */
async function findByVehicle(vehicle_id) {
  const result = await db.query(`
    SELECT p.*, u.name AS driver_name
    FROM vehicle_photos p
    JOIN users u ON u.id = p.driver_id
    WHERE p.vehicle_id = $1
    ORDER BY p.created_at DESC
  `, [vehicle_id]);
  return result.rows;
}

/**
 * Delete a photo by its ID.
 * @param {number} id
 * @returns {boolean} True if a row was deleted.
 */
async function deleteById(id) {
  const result = await db.query(`DELETE FROM vehicle_photos WHERE id = $1`, [id]);
  return result.rowCount > 0;
}

module.exports = { create, findByVehicle, deleteById };
