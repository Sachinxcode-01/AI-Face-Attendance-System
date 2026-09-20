/**
 * Zod request validation middleware for Express.
 * Replaces indiscriminate string mangling with strict, RFC/OWASP-compliant schema validation.
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const dataToValidate = req[source] || {};
      const result = schema.safeParse(dataToValidate);

      if (!result.success) {
        const firstIssue = result.error.issues[0];
        const errorMessage = firstIssue ? `${firstIssue.path.join('.') || 'payload'}: ${firstIssue.message}` : 'Invalid request payload';
        return res.status(400).json({
          detail: errorMessage,
          message: errorMessage,
          errors: result.error.issues
        });
      }

      // Assign sanitized and coerced values back to request
      req[source] = result.data;
      next();
    } catch (err) {
      return res.status(400).json({
        detail: `Validation error: ${err.message}`,
        message: err.message
      });
    }
  };
};

module.exports = validate;
