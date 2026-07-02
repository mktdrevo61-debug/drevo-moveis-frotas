/**
 * validationMiddleware.js
 * -----------------------
 * Zod schema validation factory.
 * Usage: router.post('/route', validate(myZodSchema), handler)
 *
 * Returns 400 with human-readable field errors if validation fails.
 */

const { ZodError } = require('zod');

/**
 * Returns an Express middleware that validates req.body against a Zod schema.
 * @param {import('zod').ZodSchema} schema
 * @returns {import('express').RequestHandler}
 */
function validate(schema) {
  return (req, res, next) => {
    try {
      // Parse and coerce the body; replaces req.body with the validated & typed value
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        // Flatten Zod errors into a clean map: { field: 'message' }
        const fieldErrors = {};
        for (const issue of err.issues) {
          const field = issue.path.join('.') || '_root';
          fieldErrors[field] = issue.message;
        }

        return res.status(400).json({
          success: false,
          message: 'Validation failed.',
          errors: fieldErrors,
        });
      }

      // Re-throw unexpected errors to the global error handler
      next(err);
    }
  };
}

module.exports = { validate };
