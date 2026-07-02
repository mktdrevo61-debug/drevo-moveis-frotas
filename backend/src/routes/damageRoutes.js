/**
 * damageRoutes.js
 * ---------------
 * Protected damage report routes.
 * All routes require a valid JWT.
 */

const express  = require('express');
const { z }    = require('zod');
const authMiddleware  = require('../middlewares/authMiddleware');
const { authorize }   = require('../middlewares/roleMiddleware');
const { validate }    = require('../middlewares/validationMiddleware');
const damageController = require('../controllers/damageController');

const router = express.Router();

// All damage routes require authentication
router.use(authMiddleware);

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

/** POST /api/damages */
const createDamageSchema = z.object({
  vehicle_id: z.number({ required_error: 'vehicle_id is required.' }).int().positive(),
  part_id:    z.string({ required_error: 'part_id is required.' }).min(1),
  severity:   z.enum(['low', 'medium', 'high'], {
    errorMap: () => ({ message: 'severity must be low, medium, or high.' }),
  }),
  notes: z.string().max(500).optional(),
});

/** PATCH /api/damages/:id/status */
const updateStatusSchema = z.object({
  status: z.enum(['reported', 'repairing', 'fixed'], {
    errorMap: () => ({ message: 'status must be reported, repairing, or fixed.' }),
  }),
});

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

/**
 * @route   POST /api/damages
 * @access  Driver only
 * @body    { vehicle_id, part_id, severity, notes? }
 */
router.post(
  '/',
  authorize('driver'),
  validate(createDamageSchema),
  damageController.createDamage,
);

/**
 * @route   GET /api/damages
 * @access  Manager only
 */
router.get(
  '/',
  authorize('manager'),
  damageController.getAllDamages
);

/**
 * @route   GET /api/damages/vehicle/:vehicle_id
 * @access  Authenticated (driver and manager)
 */
router.get('/vehicle/:vehicle_id', damageController.getVehicleDamages);

/**
 * @route   PATCH /api/damages/:id/status
 * @access  Manager only
 * @body    { status }
 */
router.patch(
  '/:id/status',
  authorize('manager'),
  validate(updateStatusSchema),
  damageController.updateDamageStatus,
);

module.exports = router;
