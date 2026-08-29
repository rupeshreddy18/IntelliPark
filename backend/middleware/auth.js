const jwt = require("jsonwebtoken");
const User = require("../models/User");
const AppError = require("../utils/AppError");

/**
 * Authentication Middleware
 *
 * This middleware runs BEFORE protected route handlers.
 * It extracts the JWT from the HTTP-only cookie, verifies it,
 * and attaches the authenticated user to `req.user`.
 *
 * Flow:
 *   1. Extract token from the 'token' cookie
 *   2. Verify the JWT signature and expiry using JWT_SECRET
 *   3. Find the user in the database by the ID in the JWT payload
 *   4. Attach the user to req.user for downstream use
 *   5. If any step fails → 401 Unauthenticated
 *
 * WHY we don't trust the frontend:
 *   The frontend could send any userId in the request body.
 *   By deriving the user from the verified JWT, we guarantee
 *   that the user is who they claim to be.
 */
const protect = async (req, res, next) => {
  try {
    // 1. Get token from HTTP-only cookie
    const token = req.cookies.token;

    if (!token) {
      return next(new AppError("Not authenticated. Please log in.", 401));
    }

    // 2. Verify the token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return next(new AppError("Session expired. Please log in again.", 401));
      }
      return next(new AppError("Invalid authentication token.", 401));
    }

    // 3. Check if user still exists (they might have been deleted)
    const user = await User.findById(decoded.id);

    if (!user) {
      return next(new AppError("User no longer exists.", 401));
    }

    // 4. Attach user to request for downstream middleware/controllers
    req.user = user;
    next();
  } catch (error) {
    next(new AppError("Authentication failed.", 401));
  }
};

module.exports = protect;
