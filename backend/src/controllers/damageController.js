/**
 * damageController.js
 * -------------------
 * Handles damage report creation, querying, and status updates.
 * Includes color hints for the vehicle diagram UI.
 */

const damageModel  = require('../models/damageModel');
const handoverModel = require('../models/handoverModel');
const { syncDataToSheet } = require('../services/googleSheetsService');

// Valid body part identifiers — must match the SVG diagram in the frontend
const VALID_PART_IDS = [
  'hood', 'roof', 'trunk',
  'door_front_left', 'door_front_right',
  'door_rear_left',  'door_rear_right',
  'bumper_front',    'bumper_rear',
  'fender_front_left', 'fender_front_right',
  'fender_rear_left',  'fender_rear_right',
  'windshield_front',  'windshield_rear',
  'wheel_front_left',  'wheel_front_right',
  'wheel_rear_left',   'wheel_rear_right',
];

/**
 * Map severity to a hex color for the UI diagram.
 * @param {'low'|'medium'|'high'} severity
 * @returns {string} Hex color string.
 */
function getColorHint(severity) {
  switch (severity) {
    case 'high':   return '#ef4444'; // red-500
    case 'medium': return '#f97316'; // orange-500
    case 'low':    return '#eab308'; // yellow-500
    default:       return '#94a3b8'; // slate-400 (fallback)
  }
}

// ---------------------------------------------------------------------------
// POST /api/damages
// ---------------------------------------------------------------------------

/**
 * Create a new damage report.
 * Body: { vehicle_id, part_id, severity, notes? }
 *
 * Automatically links to the driver's current active handover if one exists.
 */
async function createDamage(req, res, next) {
  try {
    const { vehicle_id, part_id, severity, notes } = req.body;
    const driver_id = req.user.id;

    // Attempt to find the driver's active handover for this vehicle
    // (the handover is optional — a damage can be reported without one)
    const activeHandover = await handoverModel.findActiveByDriver(driver_id);
    const handover_id = (activeHandover && activeHandover.vehicle_id === vehicle_id)
      ? activeHandover.id
      : null;

    // Create the damage record
    const damage = await damageModel.create({
      vehicle_id,
      driver_id,
      handover_id,
      part_id,
      severity,
      notes: notes ?? null,
    });

    // Assíncrono: dispara sincronização para o Google Sheets (Await obrigatório para Vercel)
    await syncDataToSheet().catch(console.error);

    return res.status(201).json({
      success: true,
      message: 'Damage report created successfully.',
      data: {
        damage: {
          ...damage,
          colorHint: getColorHint(damage.severity),
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// GET /api/damages/vehicle/:vehicle_id
// ---------------------------------------------------------------------------

/**
 * Return all non-fixed damage records for a vehicle, enriched with color hints.
 */
async function getVehicleDamages(req, res, next) {
  try {
    const { vehicle_id } = req.params;

    const damages = await damageModel.findByVehicle(Number(vehicle_id));

    // Attach color hints for the vehicle diagram
    const enriched = damages.map((damage) => ({
      ...damage,
      colorHint: getColorHint(damage.severity),
    }));

    return res.status(200).json({
      success: true,
      data: { damages: enriched },
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// GET /api/damages
// ---------------------------------------------------------------------------

/**
 * Return all damage records for the manager dashboard.
 */
async function getAllDamages(req, res, next) {
  try {
    const damages = await damageModel.findAll();

    const enriched = damages.map((damage) => ({
      ...damage,
      colorHint: getColorHint(damage.severity),
    }));

    return res.status(200).json({
      success: true,
      data: { damages: enriched },
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/damages/:id/status
// ---------------------------------------------------------------------------

/**
 * Update a damage record's status. Manager only.
 * Body: { status }  — one of 'reported', 'repairing', 'fixed'
 *
 * When status becomes 'fixed', resolved_at is set to the current timestamp.
 */
async function updateDamageStatus(req, res, next) {
  try {
    const { id }     = req.params;
    const { status } = req.body;

    const VALID_STATUSES = ['reported', 'repairing', 'fixed'];
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status: "\${status}". Must be one of: \${VALID_STATUSES.join(', ')}.`,
      });
    }

    // Set resolved_at if the damage is being marked as fixed
    const resolved_at = status === 'fixed' ? new Date().toISOString() : null;

    const updated = await damageModel.updateStatus(Number(id), status, resolved_at);

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: `Damage record with ID \${id} not found.`,
      });
    }

    // Assíncrono: dispara sincronização para o Google Sheets (Await obrigatório para Vercel)
    await syncDataToSheet().catch(console.error);

    return res.status(200).json({
      success: true,
      message: `Damage status updated to "${status}".`,
      data: {
        damage: {
          ...updated,
          colorHint: getColorHint(updated.severity),
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { createDamage, getVehicleDamages, getAllDamages, updateDamageStatus, VALID_PART_IDS };
