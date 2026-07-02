/**
 * errorHandler.js
 * ---------------
 * Global Express error-handling middleware.
 * Logs the full error server-side for debugging but never leaks
 * stack traces or internal details to API consumers.
 *
 * Must be registered LAST in app.js (after all routes).
 */

/**
 * @param {Error}                         err
 * @param {import('express').Request}     req
 * @param {import('express').Response}    res
 * @param {import('express').NextFunction} next  — required 4-param signature
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Always log the full error server-side (stack trace, context, etc.)
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error(`[ERROR] ${new Date().toISOString()}`);
  console.error(`Route  : ${req.method} ${req.originalUrl}`);
  if (req.user) {
    console.error(`User   : ${req.user.email} (${req.user.role})`);
  }
  console.error(err);
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Determine an appropriate HTTP status code
  const statusCode = err.statusCode || err.status || 500;

  // In production, hide internal error messages for 5xx errors
  const isProduction = process.env.NODE_ENV === 'production';
  let message;

  if (statusCode >= 500 && isProduction) {
    message = 'An internal server error occurred. Please try again later.';
  } else {
    message = err.message || 'An unexpected error occurred.';
  }

  // Respond with a clean, consistent error envelope
  res.status(statusCode).json({
    success: false,
    message,
  });
}

module.exports = errorHandler;
