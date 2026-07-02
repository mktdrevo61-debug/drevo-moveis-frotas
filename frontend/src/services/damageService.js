// src/services/damageService.js
/**
 * Damage management service — CRUD for vehicle damage reports.
 */
import api from './api.js';

// ─── getVehicleDamages ────────────────────────────────────────────────────────
/**
 * Fetches all damage records for a specific vehicle.
 * @param {string|number} vehicleId
 * @returns {Promise<Array>} Array of damage objects
 */
export async function getVehicleDamages(vehicleId) {
  const { data } = await api.get(`/damages/vehicle/${vehicleId}`);
  return data.data?.damages || [];
}

// ─── createDamage ─────────────────────────────────────────────────────────────
/**
 * Creates a new damage report for a vehicle part.
 * @param {{ vehicle_id: string|number, part_id: string, severity: 'low'|'medium'|'high', notes?: string }} payload
 * @returns {Promise<object>} The created damage record
 */
export async function createDamage({ vehicle_id, part_id, severity, notes = '' }) {
  const { data } = await api.post('/damages', {
    vehicle_id: Number(vehicle_id),
    part_id,
    severity,
    notes: notes.trim(),
  });
  return data.data?.damage || data.data;
}

// ─── updateDamageStatus ───────────────────────────────────────────────────────
/**
 * Updates the status of an existing damage record (e.g., mark as repaired).
 * @param {string|number} id      Damage record ID
 * @param {string}        status  New status: 'open' | 'in_progress' | 'resolved'
 * @returns {Promise<object>} The updated damage record
 */
export async function updateDamageStatus(id, status) {
  const { data } = await api.patch(`/damages/${id}/status`, { status });
  return data.data?.damage || data.data;
}

// ─── getDamageById ────────────────────────────────────────────────────────────
/**
 * Fetches a single damage record by ID.
 * @param {string|number} id
 * @returns {Promise<object>}
 */
export async function getDamageById(id) {
  const { data } = await api.get(`/damages/${id}`);
  return data.data?.damage || data.data;
}

// ─── getAllDamages ────────────────────────────────────────────────────────────
/**
 * Fetches all damages across the fleet (manager view).
 * @param {{ status?: string, severity?: string }} filters Optional filters
 * @returns {Promise<Array>}
 */
export async function getAllDamages(filters = {}) {
  const { data } = await api.get('/damages', { params: filters });
  return data.data?.damages || [];
}

// ─── Severity → color mapping (used by 3D viewer and damage store) ─────────────
/**
 * Maps a severity level to a hex color for 3D part highlighting.
 * @param {'low'|'medium'|'high'} severity
 * @returns {string} Hex color
 */
export function severityToColor(severity) {
  const map = {
    low: '#C87B00',      // fiori-yellow
    medium: '#E76500',   // fiori-orange
    high: '#BB0000',     // fiori-red
  };
  return map[severity] ?? '#89919A';
}
