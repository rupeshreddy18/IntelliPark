/**
 * Custom error class for operational errors.
 *
 * "Operational" errors are expected things that can go wrong:
 *   - Invalid user input (400)
 *   - Not authenticated (401)
 *   - Not authorized (403)
 *   - Resource not found (404)
 *   - Conflict like double-booking (409)
 *
 * "Programming" errors are bugs (e.g., undefined variable).
 * These are NOT operational and get a generic 500 response.
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    // Captures the stack trace, excluding the constructor call
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
