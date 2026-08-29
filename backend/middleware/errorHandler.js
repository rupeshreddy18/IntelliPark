const mongoose = require("mongoose");

/**
 * Centralized Error Handler Middleware
 *
 * This is the LAST middleware in the Express chain.
 * All errors thrown or passed via next(error) end up here.
 *
 * It handles:
 *   1. Our custom AppError instances (operational errors)
 *   2. Mongoose validation errors (invalid fields)
 *   3. Mongoose duplicate key errors (e.g., duplicate email)
 *   4. Mongoose cast errors (e.g., invalid ObjectId)
 *   5. Unknown/programming errors (get generic 500 response)
 *
 * SECURITY: In production, we never send stack traces,
 * database details, or internal error information to the client.
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.stack = err.stack;

  // Log for development debugging
  if (process.env.NODE_ENV === "development") {
    console.error("❌ Error:", err.message);
    if (err.stack) {
      console.error(err.stack);
    }
  }

  // Mongoose validation error → 400 Bad Request
  // Triggered when a required field is missing or a value fails schema validation
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    error.message = messages.join(". ");
    error.statusCode = 400;
    error.isOperational = true;
  }

  // Mongoose duplicate key error → 409 Conflict
  // Triggered when a unique field (like email) already exists
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error.message = `This ${field} is already in use. Please sign in instead.`;
    error.statusCode = 409;
    error.isOperational = true;
  }

  // Mongoose CastError → 400 Bad Request
  // Triggered when an invalid ObjectId is passed (e.g., "abc123" instead of a valid MongoDB ID)
  if (err.name === "CastError" && err.kind === "ObjectId") {
    error.message = "Invalid resource ID format.";
    error.statusCode = 400;
    error.isOperational = true;
  }

  // JWT errors (backup — most are caught in auth middleware)
  if (err.name === "JsonWebTokenError") {
    error.message = "Invalid token.";
    error.statusCode = 401;
    error.isOperational = true;
  }

  if (err.name === "TokenExpiredError") {
    error.message = "Token expired.";
    error.statusCode = 401;
    error.isOperational = true;
  }

  // Determine the status code
  const statusCode = error.statusCode || err.statusCode || 500;

  // Build the response
  const response = {
    success: false,
    message:
      error.isOperational || err.isOperational
        ? error.message
        : "An unexpected error occurred. Please try again later.",
  };

  // In development, include the stack trace for debugging
  if (process.env.NODE_ENV === "development" && statusCode === 500) {
    response.stack = error.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
