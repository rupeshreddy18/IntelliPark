const mongoose = require("mongoose");
const AppError = require("../utils/AppError");

/**
 * Validation Middleware Factory
 *
 * Creates Express middleware that validates request body fields.
 *
 * Usage:
 *   router.post('/register', validate(['name', 'email', 'password']), register);
 *
 * This ensures required fields are present BEFORE the controller runs.
 * The controller can then focus on business logic, not input checking.
 */
const validate = (requiredFields) => {
  return (req, res, next) => {
    const missing = requiredFields.filter((field) => {
      const value = req.body[field];
      return (
        value === undefined ||
        value === null ||
        (typeof value === "string" && value.trim() === "")
      );
    });

    if (missing.length > 0) {
      return next(
        new AppError(`Missing required fields: ${missing.join(", ")}`, 400),
      );
    }

    next();
  };
};

/**
 * Validate that a route parameter is a valid MongoDB ObjectId.
 *
 * Without this, passing "abc123" as an ID would cause a Mongoose CastError.
 * Catching it here gives a cleaner, more descriptive error message.
 *
 * Usage:
 *   router.get('/:id', validateObjectId('id'), getSlot);
 */
const validateObjectId = (paramName) => {
  return (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params[paramName])) {
      return next(new AppError(`Invalid ${paramName} format.`, 400));
    }
    next();
  };
};

module.exports = { validate, validateObjectId };
