/**
 * dashboardRoutes.js
 * ------------------
 * Protected dashboard routes — manager only.
 * All routes require authentication and the 'manager' role.
 */

const express  = require('express');
const authMiddleware      = require('../middlewares/authMiddleware');
const { authorize }       = require('../middlewares/roleMiddleware');
const dashboardController = require('../controllers/dashboardController');

const router = express.Router();

// All dashboard routes require authentication + manager role
router.use(authMiddleware);
router.use(authorize('manager'));

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

/**
 * @route   GET /api/dashboard/metrics
 * @access  Manager only
 */
router.get('/metrics', dashboardController.getMetrics);

// Export data as CSV
router.get('/export', dashboardController.exportData);

module.exports = router;
