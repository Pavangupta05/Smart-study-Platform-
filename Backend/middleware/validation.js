// Backend/middleware/validation.js
const { body, param, validationResult } = require('express-validator');
/**
 * Utility to create a validation chain for a route.
 * Example usage:
 *   router.post('/', validate([
 *     body('name').isString().trim().notEmpty(),
 *     body('content').isString()
 *   ]), handler);
 */
function validate(validations) {
  return async (req, res, next) => {
    await Promise.all(validations.map((validation) => validation.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid request', details: errors.array() });
    }
    next();
  };
}
module.exports = { validate };
