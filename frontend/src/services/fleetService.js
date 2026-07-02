// src/services/fleetService.js
/**
 * Fleet management service — vehicle listing, checkout and check-in.
 */
import api from './api.js';

// ─── getVehicles ─────────────────────────────────────────────────────────────
/**
 * Fetches all vehicles available to the authenticated user.
 * @returns {Promise<Array>} Array of vehicle objects
 */
export async function getVehicles() {
  const { data } = await api.get('/fleet/vehicles');
  return data.data?.vehicles || [];
}

// ─── getVehicleById ───────────────────────────────────────────────────────────
/**
 * Fetches a single vehicle by ID.
 * @param {string|number} vehicleId
 * @returns {Promise<object>}
 */
export async function getVehicleById(vehicleId) {
  const { data } = await api.get(`/fleet/vehicles/${vehicleId}`);
  return data.data?.vehicle || data.data;
}

// ─── checkout ─────────────────────────────────────────────────────────────────
/**
 * Creates a new fleet handover record (driver takes vehicle).
 * @param {{ vehicle_id: string|number, start_mileage: number, destination: string }} payload
 * @returns {Promise<object>} The created handover record
 */
export async function checkout({ vehicle_id, start_mileage, destination }) {
  const { data } = await api.post('/fleet/handover/checkout', {
    vehicle_id,
    start_mileage: Number(start_mileage),
    destination,
  });
  return data.data?.handover || data.data;
}

// ─── checkin ──────────────────────────────────────────────────────────────────
/**
 * Closes the active fleet handover record (driver returns vehicle).
 * @param {{ end_mileage: number }} payload
 * @returns {Promise<object>} The updated handover record
 */
export async function checkin({ end_mileage }) {
  const { data } = await api.post('/fleet/handover/checkin', {
    end_mileage: Number(end_mileage),
  });
  return data.data?.handover || data.data;
}

// ─── getActiveHandover ────────────────────────────────────────────────────────
/**
 * Fetches the current driver's active handover, if any.
 * @returns {Promise<object|null>}
 */
export async function getActiveHandover() {
  const { data } = await api.get('/fleet/handover/active');
  return data.data;
}

// ─── recordFuel ───────────────────────────────────────────────────────────────
/**
 * Records a fuel event (liters, cost, fuel type, optional receipt image).
 * @param {{ vehicle_id: string|number, liters: number, cost: number, fuel_type: string, receipt_base64?: string }} payload
 * @returns {Promise<object>}
 */
export async function recordFuel({ vehicle_id, liters, cost, fuel_type, receipt_base64 }) {
  const { data } = await api.post('/fuel', {
    vehicle_id: Number(vehicle_id),
    liters: Number(liters),
    total_cost: Number(cost),
    fuel_type,
    receipt_image: receipt_base64,
  });
  return data.data?.fuelLog || data.data;
}

// ─── getAllFuelLogs ───────────────────────────────────────────────────────────
/**
 * Fetches all fuel logs (manager only).
 * @returns {Promise<Array>} Array of fuel log objects
 */
export async function getAllFuelLogs() {
  const { data } = await api.get('/fuel');
  return data.data?.fuel_logs || [];
}
