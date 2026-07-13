/**
 * fleetController.js
 * ------------------
 * Handles vehicle listing, checkout (vehicle handover), and checkin.
 * Business rules:
 *   - Managers see all vehicles; drivers see only 'available' ones.
 *   - Checkout is only possible when the vehicle is 'available'.
 *   - Checkin closes the active handover for the authenticated driver.
 */

const vehicleModel  = require('../models/vehicleModel');
const handoverModel = require('../models/handoverModel');
const { syncDataToSheet } = require('../services/googleSheetsService');

// ---------------------------------------------------------------------------
// GET /api/fleet/vehicles
// ---------------------------------------------------------------------------

/**
 * Return the vehicle list.
 * Managers see all vehicles. Drivers see only available ones.
 */
async function getVehicles(req, res, next) {
  try {
    let vehicles;

    // Everyone sees all vehicles to know who is using them
    vehicles = await vehicleModel.findAll();

    return res.status(200).json({
      success: true,
      data: { vehicles },
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// POST /api/fleet/handover/checkout
// ---------------------------------------------------------------------------

/**
 * Driver checks out a vehicle.
 * Body: { vehicle_id, start_mileage }
 *
 * Validates:
 *   - vehicle_id is provided
 *   - vehicle exists
 *   - vehicle status is 'available'
 *   - driver doesn't already have an active handover
 *
 * On success:
 *   - Creates a handover record (status='active')
 *   - Sets vehicle status to 'in_use'
 */
async function checkout(req, res, next) {
  try {
    const { vehicle_id, start_mileage, destination } = req.body;
    const driver_id = req.user.id;

    // Verify vehicle exists
    const vehicle = await vehicleModel.findById(vehicle_id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: `Vehicle with ID \${vehicle_id} not found.`,
      });
    }

    // Verify vehicle is available
    if (vehicle.status !== 'available') {
      return res.status(409).json({
        success: false,
        message: `Vehicle \${vehicle.plate} is currently \${vehicle.status} and cannot be checked out.`,
      });
    }

    // Verify driver doesn't already have an active handover
    const existingHandover = await handoverModel.findActiveByDriver(driver_id);
    if (existingHandover) {
      return res.status(409).json({
        success: false,
        message: `You already have an active handover for vehicle \${existingHandover.plate}. Check in first.`,
      });
    }

    if (!destination) {
      return res.status(400).json({
        success: false,
        message: `Destination is required.`,
      });
    }

    // Create handover
    const handover = await handoverModel.create({
      vehicle_id,
      driver_id,
      start_mileage: start_mileage ?? vehicle.current_mileage,
      destination,
    });

    // Mark vehicle as in-use
    await vehicleModel.updateStatus(vehicle_id, 'in_use');

    // Assíncrono: dispara sincronização para o Google Sheets (Await obrigatório para Vercel)
    await syncDataToSheet().catch(console.error);

    return res.status(201).json({
      success: true,
      message: `Vehicle ${vehicle.plate} checked out successfully.`,
      data: { handover },
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// POST /api/fleet/handover/checkin
// ---------------------------------------------------------------------------

/**
 * Driver checks in a vehicle.
 * Body: { end_mileage }
 *
 * Validates:
 *   - Driver has an active handover
 *   - end_mileage >= start_mileage
 *
 * On success:
 *   - Closes the handover (status='completed')
 *   - Updates vehicle mileage and sets status back to 'available'
 */
async function checkin(req, res, next) {
  try {
    const { end_mileage } = req.body;
    const driver_id = req.user.id;

    // Find the driver's active handover
    const handover = await handoverModel.findActiveByDriver(driver_id);
    if (!handover) {
      return res.status(404).json({
        success: false,
        message: 'No active handover found. Please check out a vehicle first.',
      });
    }

    // Validate end_mileage is not less than start_mileage
    if (end_mileage < handover.start_mileage) {
      return res.status(400).json({
        success: false,
        message: `End mileage (${end_mileage}) cannot be less than start mileage (${handover.start_mileage}).`,
      });
    }

    const checkin_time = new Date().toISOString();

    // Complete the handover
    const completedHandover = await handoverModel.complete({
      id: handover.id,
      end_mileage,
      checkin_time,
    });

    // Update vehicle: new mileage + available status
    await vehicleModel.updateMileage(handover.vehicle_id, end_mileage);
    await vehicleModel.updateStatus(handover.vehicle_id, 'available');

    // Assíncrono: dispara sincronização para o Google Sheets (Await obrigatório para Vercel)
    await syncDataToSheet().catch(console.error);

    return res.status(200).json({
      success: true,
      message: `Vehicle ${handover.plate} checked in successfully.`,
      data: { handover: completedHandover },
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// GET /api/fleet/handover/active
// ---------------------------------------------------------------------------

/**
 * Return the active handover for the current driver.
 */
async function getActiveHandover(req, res, next) {
  try {
    const driver_id = req.user.id;
    const handover = await handoverModel.findActiveByDriver(driver_id);
    
    // Return null if no active handover, not a 404 error, because the frontend expects it.
    return res.status(200).json({
      success: true,
      data: handover || null,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getVehicles, checkout, checkin, getActiveHandover };
