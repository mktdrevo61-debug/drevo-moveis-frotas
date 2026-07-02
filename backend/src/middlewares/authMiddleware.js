/**
 * authMiddleware.js
 * -----------------
 * Verifies a JWT from the Authorization: Bearer <token> header.
 * On success, attaches `req.user = { id, name, email, role }`.
 * Returns 401 on missing or invalid tokens.
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'drevo_super_secret_jwt_key_2024';

/**
 * Express middleware that authenticates every protected route.
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];

  // Header must be present and follow the "Bearer <token>" format
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.',
    });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Malformed token.',
    });
  }

  try {
    // Verify signature and expiry
    const decoded = jwt.verify(token, JWT_SECRET);

    // Attach only the fields we care about — never the full payload
    req.user = {
      id:    decoded.id,
      name:  decoded.name,
      email: decoded.email,
      role:  decoded.role,
    };

    next();
  } catch (err) {
    // Distinguish between expired and otherwise invalid tokens
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please log in again.',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid token.',
    });
  }
}

module.exports = authMiddleware;
