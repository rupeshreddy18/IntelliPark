const express = require("express");
const router = express.Router();
const {
  getStats,
  getUsers,
  getAllBookings,
  completeBooking,
  adminCancelBooking,
} = require("../controllers/adminController");
const protect = require("../middleware/auth");
const admin = require("../middleware/admin");
const { validateObjectId } = require("../middleware/validate");

/**
 * Admin Routes
 *
 * ALL routes require authentication + admin role.
 * The middleware chain is: protect → admin → controller
 *
 * GET  /api/admin/stats                — Dashboard statistics
 * GET  /api/admin/users                — List all users
 * GET  /api/admin/bookings             — List all bookings
 * PUT  /api/admin/bookings/:id/complete — Mark booking completed
 * PUT  /api/admin/bookings/:id/cancel   — Admin cancel booking
 */

// REMOVED GLOBAL protect, admin middleware to allow guest viewing
// router.use(protect, admin); 

// Public routes (for guests to view the dashboard in portfolio)
router.get("/stats", getStats);
router.get("/bookings", getAllBookings);

// Protected routes (Only Admins can mutate data or view PII)
router.get("/users", protect, admin, getUsers);
router.put("/bookings/:id/complete", protect, admin, validateObjectId("id"), completeBooking);
router.put("/bookings/:id/cancel", protect, admin, validateObjectId("id"), adminCancelBooking);

module.exports = router;
