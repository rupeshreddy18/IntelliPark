const express = require("express");
const router = express.Router();
const {
  createBooking,
  getMyBookings,
  getBooking,
  cancelBooking,
  getBookedTimesForSlot,
} = require("../controllers/bookingController");
const protect = require("../middleware/auth");
const { validate, validateObjectId } = require("../middleware/validate");

/**
 * Booking Routes
 *
 * POST /api/bookings       — Create booking (authenticated)
 * GET  /api/bookings/my    — Get own bookings (authenticated)
 * GET  /api/bookings/slot/:slotId — Get booked times for a slot (authenticated)
 * GET  /api/bookings/:id   — Get single booking (own or admin)
 * PUT  /api/bookings/:id/cancel — Cancel booking (own or admin)
 */

router.post(
  "/",
  protect,
  validate(["parkingSlotId", "bookingDate", "startTime", "endTime"]),
  createBooking,
);
router.get("/my", protect, getMyBookings);
router.get("/slot/:slotId", protect, validateObjectId("slotId"), getBookedTimesForSlot);
router.get("/:id", protect, validateObjectId("id"), getBooking);
router.put("/:id/cancel", protect, validateObjectId("id"), cancelBooking);

module.exports = router;
