const AppError = require("../utils/AppError");

/**
 * Admin Authorization Middleware
 *
 * MUST be used AFTER the `protect` (auth) middleware.
 *
 * Checks that the authenticated user has the 'admin' role.
 * This is the BACKEND enforcement of admin-only access.
 *
 * WHY this is critical:
 *   Hiding an admin page in React is NOT security.
 *   Anyone can call the API directly with curl/Postman.
 *   This middleware ensures that even if someone discovers
 *   an admin endpoint, they get a 403 Forbidden response.
 *
 * Usage in routes:
 *   router.get('/admin/stats', protect, admin, getStats);
 *
 *   protect runs first → sets req.user
 *   admin runs second → checks req.user.role
 */
const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    next(new AppError("Access denied. Admin privileges required.", 403));
  }
};

module.exports = admin;
