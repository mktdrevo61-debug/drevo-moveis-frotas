/**
 * roleMiddleware.js
 * -----------------
 * Role-based authorization factory.
 * Usage: router.use(authorize('manager'))
 *        router.post('/admin', authorize('manager', 'admin'), handler)
 *
 * Must be used AFTER authMiddleware so that req.user is populated.
 */

/**
 * Returns an Express middleware that allows only the specified roles.
 * @param  {...string} roles - Roles permitted to access the route.
 * @returns {import('express').RequestHandler}
 */
function authorize(...roles) {
  return (req, res, next) => {
    // authMiddleware must run first
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access forbidden. Required role(s): ${roles.join(', ')}.`,
      });
    }

    next();
  };
}

module.exports = { authorize };
