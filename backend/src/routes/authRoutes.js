/**
 * authRoutes.js
 * -------------
 * Public routes for authentication.
 * Zod schemas are defined inline and applied via the validate middleware.
 */

const express  = require('express');
const { z }    = require('zod');
const { validate } = require('../middlewares/validationMiddleware');
const authController = require('../controllers/authController');

const router = express.Router();

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

/** POST /api/auth/login */
const loginSchema = z.object({
  email:    z.string().min(2, 'O usuário deve ter pelo menos 2 caracteres.'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.'),
});

/** POST /api/auth/register */
const registerSchema = z.object({
  name:     z.string().min(2, 'Name must be at least 2 characters.').max(100),
  email:    z.string().min(2, 'O usuário deve ter pelo menos 2 caracteres.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  role:     z.enum(['driver', 'manager']).optional().default('driver'),
});

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

/**
 * @route   POST /api/auth/login
 * @access  Public
 * @body    { email, password }
 */
router.post('/login', validate(loginSchema), authController.login);

/**
 * @route   POST /api/auth/register
 * @access  Public
 * @body    { name, email, password, role? }
 */
router.post('/register', validate(registerSchema), authController.register);

module.exports = router;
