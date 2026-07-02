/**
 * fuelRoutes.js
 * -------------
 * Protected fuel log routes.
 * All routes require a valid JWT.
 */

const express  = require('express');
const { z }    = require('zod');
const authMiddleware  = require('../middlewares/authMiddleware');
const { authorize }   = require('../middlewares/roleMiddleware');
const { validate }    = require('../middlewares/validationMiddleware');
const fuelController  = require('../controllers/fuelController');

const router = express.Router();

// All fuel routes require authentication
router.use(authMiddleware);

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

/** POST /api/fuel */
const registerFuelSchema = z.object({
  vehicle_id:     z.number({ required_error: 'vehicle_id is required.' }).int().positive(),
  receipt_image:  z.string().optional(),   // base64 image string
  // Manual overrides — if not provided, OCR values are used
  liters:         z.number().positive().optional(),
  total_cost:     z.number().positive().optional(),
  fuel_type:      z.enum(['gasoline', 'diesel', 'ethanol']).optional(),
});

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

/**
 * @route   POST /api/fuel
 * @access  Driver only
 * @body    { vehicle_id, receipt_image?, liters?, total_cost?, fuel_type? }
 */
router.post(
  '/',
  authorize('driver'),
  validate(registerFuelSchema),
  fuelController.registerFuel,
);

/**
 * @route   GET /api/fuel
 * @access  Manager only
 */
router.get(
  '/',
  authorize('manager'),
  fuelController.getAllFuel,
);

module.exports = router;
