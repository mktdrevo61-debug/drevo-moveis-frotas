/**
 * authController.js
 * -----------------
 * Handles user authentication: login and registration.
 * Uses bcryptjs for password hashing and jsonwebtoken for JWT issuance.
 */

const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const userModel = require('../models/userModel');

const JWT_SECRET  = process.env.JWT_SECRET  || 'drevo_super_secret_jwt_key_2024';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '24h';

// Valid body part identifiers for the damage-reporting SVG diagram
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

// ---------------------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------------------

/**
 * Authenticate a user with email + password.
 * Returns a signed JWT and the user's public profile on success.
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    // Lookup user by email
    const user = await userModel.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Verify account is active
    if (!user.active) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Contact a manager.',
      });
    }

    // Compare plain-text password against stored hash
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Build JWT payload (keep it minimal — no sensitive data)
    const payload = {
      id:    user.id,
      name:  user.name,
      email: user.email,
      role:  user.role,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        token,
        user: {
          id:    user.id,
          name:  user.name,
          email: user.email,
          role:  user.role,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// POST /api/auth/register
// ---------------------------------------------------------------------------

/**
 * Register a new user.
 * Validates email uniqueness, hashes the password, and stores the record.
 */
async function register(req, res, next) {
  try {
    const { name, email, password, role = 'driver' } = req.body;

    // Ensure email is not already in use
    const existingUser = await userModel.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    // Hash the password with a strong salt
    const salt          = await bcrypt.genSalt(12);
    const password_hash = await bcrypt.hash(password, salt);

    // Persist the new user
    const newUser = await userModel.create({ name, email, password_hash, role });

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: {
        user: newUser,
      },
    });
  } catch (err) {
    next(err);
  }
}

// Export VALID_PART_IDS so other controllers can reuse it
module.exports = { login, register, VALID_PART_IDS };
