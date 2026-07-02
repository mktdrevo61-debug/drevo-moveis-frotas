/**
 * fleetRoutes.js
 * --------------
 * Protected fleet management routes.
 * All routes require a valid JWT (authMiddleware).
 * Checkout and checkin are restricted to drivers (roleMiddleware).
 */

const express  = require('express');
const { z }    = require('zod');
const authMiddleware = require('../middlewares/authMiddleware');
const { authorize }  = require('../middlewares/roleMiddleware');
const { validate }   = require('../middlewares/validationMiddleware');
const fleetController = require('../controllers/fleetController');

const router = express.Router();

// All fleet routes require authentication
router.use(authMiddleware);

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const checkoutSchema = z.object({
  vehicle_id:    z.number({ required_error: 'vehicle_id is required.' }).int().positive(),
  start_mileage: z.number().int().nonnegative().optional(),
  destination:   z.string({ required_error: 'destination is required.' }).min(1, 'Destination cannot be empty.'),
});

/** POST /api/fleet/handover/checkin */
const checkinSchema = z.object({
  end_mileage: z.number({ required_error: 'end_mileage is required.' }).int().nonnegative(),
});

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

/**
 * @route   GET /api/fleet/vehicles
 * @access  Authenticated (manager sees all, driver sees available)
 */
router.get('/vehicles', fleetController.getVehicles);

/**
 * @route   POST /api/fleet/handover/checkout
 * @access  Driver only
 * @body    { vehicle_id, start_mileage? }
 */
router.post(
  '/handover/checkout',
  authorize('driver', 'manager'),
  validate(checkoutSchema),
  fleetController.checkout,
);

/**
 * @route   POST /api/fleet/handover/checkin
 * @access  Driver only
 * @body    { end_mileage }
 */
router.post(
  '/handover/checkin',
  authorize('driver', 'manager'),
  validate(checkinSchema),
  fleetController.checkin,
);

/**
 * @route   GET /api/fleet/handover/active
 * @access  Driver only
 */
router.get(
  '/handover/active',
  authorize('driver', 'manager'),
  fleetController.getActiveHandover,
);

module.exports = router;
