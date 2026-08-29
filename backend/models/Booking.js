const mongoose = require("mongoose");

/**
 * Booking Model
 *
 * Represents a user's reservation for a specific parking slot, date, and time range.
 *
 * Key design decisions:
 *   - Uses ObjectId references to User and ParkingSlot (not embedded copies)
 *   - Time is stored as strings "HH:MM" for simplicity
 *   - Status enum tracks the booking lifecycle: CONFIRMED → CANCELLED or COMPLETED
 *   - Compound partial index prevents double-booking at the database level
 *
 * Relationships:
 *   - booking.user → references User._id
 *   - booking.parkingSlot → references ParkingSlot._id
 *
 * These are MongoDB "references" (like foreign keys in SQL).
 * Mongoose can "populate" them to fetch the full user/slot documents.
 */
const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "User is required"],
  },
  parkingSlot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ParkingSlot",
    required: [true, "Parking slot is required"],
  },
  bookingDate: {
    type: Date,
    required: [true, "Booking date is required"],
  },
  startTime: {
    type: String,
    required: [true, "Start time is required"],
    match: [
      /^([01]\d|2[0-3]):([0-5]\d)$/,
      "Start time must be in HH:MM format",
    ],
  },
  endTime: {
    type: String,
    required: [true, "End time is required"],
    match: [/^([01]\d|2[0-3]):([0-5]\d)$/, "End time must be in HH:MM format"],
  },
  status: {
    type: String,
    enum: {
      values: ["CONFIRMED", "CANCELLED", "COMPLETED"],
      message: "Status must be CONFIRMED, CANCELLED, or COMPLETED",
    },
    default: "CONFIRMED",
  },
  totalCost: {
    type: Number,
    required: [true, "Total cost is required"],
    min: [0, "Total cost cannot be negative"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

/**
 * Compound index for fast booking lookups by slot and date.
 * Used by the overlap check query when creating new bookings.
 */
bookingSchema.index({ parkingSlot: 1, bookingDate: 1, status: 1 });

/**
 * Index for fast lookup of a user's bookings.
 * Used by GET /api/bookings/my
 */
bookingSchema.index({ user: 1, status: 1 });

/**
 * Compound PARTIAL index for double-booking prevention.
 *
 * This is the DATABASE-LEVEL safety net.
 *
 * It ensures that for any given (parkingSlot + bookingDate + startTime),
 * there can only be ONE booking with status='CONFIRMED'.
 *
 * The `partialFilterExpression` means this index only applies to
 * documents where status is 'CONFIRMED'. Cancelled/completed bookings
 * are excluded, so the same slot+date+time can have a cancelled booking
 * AND a new confirmed booking.
 *
 * Why this matters for concurrency:
 *   Even if two requests pass the application-level overlap check
 *   simultaneously, MongoDB will reject the second insert at the
 *   database level, preventing the double-booking.
 */
bookingSchema.index(
  { parkingSlot: 1, bookingDate: 1, startTime: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "CONFIRMED" },
  },
);

const Booking = mongoose.model("Booking", bookingSchema);

module.exports = Booking;
