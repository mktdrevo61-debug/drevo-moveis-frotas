/**
 * fuelController.js
 * -----------------
 * Handles fuel log registration and retrieval.
 * On registration, runs the OCR service (simulated) and uploads
 * the receipt image to S3 (simulated) before persisting the log.
 *
 * Manual overrides in the request body take precedence over OCR results.
 */

const fuelModel  = require('../models/fuelModel');
const vehicleModel = require('../models/vehicleModel');
const OcrService = require('../services/OcrService');
const S3Service  = require('../services/S3Service');
const { syncDataToSheet } = require('../services/googleSheetsService');

// ---------------------------------------------------------------------------
// POST /api/fuel
// ---------------------------------------------------------------------------

/**
 * Register a new fuel log entry.
 *
 * Body:
 *   - vehicle_id     {number}  required
 *   - receipt_image  {string}  base64 image (optional but recommended)
 *   - liters         {number}  manual override (optional)
 *   - total_cost     {number}  manual override (optional)
 *   - fuel_type      {string}  manual override (optional)
 *
 * Workflow:
 *   1. Run OCR on the receipt image to auto-fill liters, total_cost, fuel_type, CNPJ.
 *   2. Upload the image to S3.
 *   3. Merge OCR results with any manual overrides (manual wins).
 *   4. Persist the fuel log.
 */
async function registerFuel(req, res, next) {
  try {
    const {
      vehicle_id,
      current_mileage,
      receipt_image,          // base64 image string
      liters:     manualLiters,
      total_cost: manualCost,
      fuel_type:  manualFuelType,
    } = req.body;

    const driver_id = req.user.id;

    // Store base64 image directly for now
    const receipt_image_url = receipt_image || null;

    if (current_mileage) {
      await vehicleModel.updateMileage(vehicle_id, current_mileage);
    }

    // Persist the fuel log
    const fuelLog = await fuelModel.create({
      vehicle_id,
      driver_id,
      liters: manualLiters,
      total_cost: manualCost,
      fuel_type: manualFuelType || 'gasoline',
      receipt_image_url,
      ocr_cnpj_extracted: null, // Removed OCR mock
    });

    // Assíncrono: dispara sincronização para o Google Sheets (Await obrigatório para Vercel)
    await syncDataToSheet().catch(console.error);

    return res.status(201).json({
      success: true,
      message: 'Fuel log recorded successfully.',
      data: {
        fuelLog,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// GET /api/fuel
// ---------------------------------------------------------------------------

/**
 * Return all fuel logs. Manager only.
 */
async function getAllFuel(req, res, next) {
  try {
    const logs = await fuelModel.findAll();

    return res.status(200).json({
      success: true,
      data: { fuel_logs: logs },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { registerFuel, getAllFuel };
