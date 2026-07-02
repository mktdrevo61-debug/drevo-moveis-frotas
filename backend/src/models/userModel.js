/**
 * userModel.js
 * ------------
 * Data-access functions for the `users` table.
 */

const db = require('../config/database');

/**
 * Find a user by their email address.
 * @param {string} email
 * @returns {object|undefined} User row or undefined if not found.
 */
async function findByEmail(email) {
  const result = await db.query(`
    SELECT id, name, email, password_hash, role, active, created_at
    FROM users
    WHERE email = $1
  `, [email]);
  return result.rows[0];
}

/**
 * Find a user by their primary key.
 * @param {number} id
 * @returns {object|undefined} User row (without password_hash) or undefined.
 */
async function findById(id) {
  const result = await db.query(`
    SELECT id, name, email, role, active, created_at
    FROM users
    WHERE id = $1
  `, [id]);
  return result.rows[0];
}

/**
 * Create a new user record.
 * @param {{ name: string, email: string, password_hash: string, role: string }} params
 * @returns {object} The newly created user (without password_hash).
 */
async function create({ name, email, password_hash, role }) {
  const insertResult = await db.query(`
    INSERT INTO users (name, email, password_hash, role)
    VALUES ($1, $2, $3, $4)
    RETURNING id
  `, [name, email, password_hash, role]);

  return await findById(insertResult.rows[0].id);
}

module.exports = { findByEmail, findById, create };
