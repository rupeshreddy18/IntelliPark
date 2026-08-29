const Booking = require("../models/Booking");
const ParkingSlot = require("../models/ParkingSlot");
const AppError = require("../utils/AppError");

const HOURLY_RATE = 5; // $5 per hour

/**
 * Helper: Check if a booking's time range overlaps with existing confirmed bookings.
 *
 * Two time ranges overlap if:
 *   existingStart < newEnd AND existingEnd > newStart
 *
 * Example:
 *   Existing: 09:00 - 12:00
 *   New:      11:00 - 14:00
 *   → 09:00 < 14:00 AND 12:00 > 11:00 → OVERLAP ✓
 *
 *   Existing: 09:00 - 12:00
 *   New:      12:00 - 14:00
 *   → 09:00 < 14:00 AND 12:00 > 12:00 → NO OVERLAP (back-to-back is OK)
 */
const checkOverlap = async (
  parkingSlotId,
  bookingDate,
  startTime,
  endTime,
  excludeBookingId = null,
) => {
  const query = {
    parkingSlot: parkingSlotId,
    bookingDate: bookingDate,
    status: "CONFIRMED",
    startTime: { $lt: endTime },
    endTime: { $gt: startTime },
  };

  // When updating a booking, exclude itself from the overlap check
  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  const overlapping = await Booking.findOne(query);
  return overlapping;
};

/**
 * Helper: Update slot status based on current bookings.
 *
 * A slot is OCCUPIED if it has any CONFIRMED booking for today
 * that covers the current time. Otherwise it's AVAILABLE
 * (unless it's in MAINTENANCE).
 */
const updateSlotStatus = async (slotId) => {
  const slot = await ParkingSlot.findById(slotId);
  if (!slot || slot.status === "MAINTENANCE") return;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  // Check if there's a confirmed booking for this slot right now
  const activeNow = await Booking.findOne({
    parkingSlot: slotId,
    bookingDate: today,
    status: "CONFIRMED",
    startTime: { $lte: currentTime },
    endTime: { $gt: currentTime },
  });

  slot.status = activeNow ? "OCCUPIED" : "AVAILABLE";
  await slot.save();
};

/**
 * @route   POST /api/bookings
 * @desc    Create a new booking
 * @access  Private (authenticated user)
 *
 * This is the MOST CRITICAL endpoint in the system.
 *
 * Validation steps (all on the backend):
 *   1. User is authenticated (enforced by auth middleware)
 *   2. Slot exists
 *   3. Slot is not under MAINTENANCE
 *   4. Date is valid and not in the past
 *   5. Start time < End time
 *   6. No overlapping CONFIRMED booking for this slot at this time
 *   7. User doesn't have an overlapping booking (any slot) at this time
 *
 * Double-booking prevention:
 *   - Application-level: overlap check query (step 6)
 *   - Database-level: partial unique index on (parkingSlot, bookingDate, startTime)
 *     where status='CONFIRMED' rejects concurrent duplicates
 */
const createBooking = async (req, res, next) => {
  try {
    const { parkingSlotId, bookingDate, startTime, endTime } = req.body;

    // --- Validation ---

    // 1. Validate slot exists
    const slot = await ParkingSlot.findById(parkingSlotId);
    if (!slot) {
      return next(new AppError("Parking slot not found.", 404));
    }

    // 2. Check slot is not under maintenance
    if (slot.status === "MAINTENANCE") {
      return next(
        new AppError(
          "This slot is currently under maintenance and cannot be booked.",
          400,
        ),
      );
    }

    // 3. Parse and validate the booking date
    const parsedDate = new Date(bookingDate);
    if (isNaN(parsedDate.getTime())) {
      return next(new AppError("Invalid booking date.", 400));
    }

    // Normalize to midnight (remove time component)
    const normalizedDate = new Date(
      parsedDate.getFullYear(),
      parsedDate.getMonth(),
      parsedDate.getDate(),
    );

    // 4. Check booking is not in the past
    const today = new Date();
    const todayNormalized = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );

    if (normalizedDate < todayNormalized) {
      return next(new AppError("Cannot book a slot in the past.", 400));
    }

    // 5. Validate time format (HH:MM)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return next(
        new AppError("Time must be in HH:MM format (e.g., 09:00).", 400),
      );
    }

    // 6. Start time must be before end time
    if (startTime >= endTime) {
      return next(new AppError("Start time must be before end time.", 400));
    }

    // 7. If booking is today, start time must not be in the past
    if (normalizedDate.getTime() === todayNormalized.getTime()) {
      const currentTime = `${String(today.getHours()).padStart(2, "0")}:${String(today.getMinutes()).padStart(2, "0")}`;
      if (startTime < currentTime) {
        return next(new AppError("Start time cannot be in the past.", 400));
      }
    }

    // 8. Check for overlapping bookings on this slot
    const slotOverlap = await checkOverlap(
      parkingSlotId,
      normalizedDate,
      startTime,
      endTime,
    );
    if (slotOverlap) {
      return next(
        new AppError(
          "This slot is already booked for the selected time period.",
          409,
        ),
      );
    }

    // 9. Check if the USER already has a booking at this time (any slot)
    const userOverlap = await Booking.findOne({
      user: req.user._id,
      bookingDate: normalizedDate,
      status: "CONFIRMED",
      startTime: { $lt: endTime },
      endTime: { $gt: startTime },
    });

    if (userOverlap) {
      return next(
        new AppError(
          "You already have a booking during this time period.",
          409,
        ),
      );
    }

    // --- Calculate Total Cost ---
    const startHour = parseInt(startTime.split(":")[0], 10);
    const endHour = parseInt(endTime.split(":")[0], 10);
    const durationHours = endHour - startHour;
    const totalCost = durationHours * HOURLY_RATE;

    // --- Create the booking ---
    // The partial unique index provides database-level double-booking protection
    let booking;
    try {
      booking = await Booking.create({
        user: req.user._id,
        parkingSlot: parkingSlotId,
        bookingDate: normalizedDate,
        startTime,
        endTime,
        totalCost,
        status: "CONFIRMED",
      });
    } catch (error) {
      // If the partial unique index catches a concurrent duplicate
      if (error.code === 11000) {
        return next(
          new AppError(
            "This slot was just booked by someone else. Please try another slot.",
            409,
          ),
        );
      }
      throw error;
    }

    // Update slot status
    await updateSlotStatus(parkingSlotId);

    // Populate slot details for the response
    await booking.populate("parkingSlot", "slotNumber zone status");

    res.status(201).json({
      success: true,
      booking,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/bookings/my
 * @desc    Get current user's bookings
 * @access  Private
 *
 * USER DATA ISOLATION: Only returns bookings where booking.user === req.user._id
 * A user can NEVER see another user's bookings through this endpoint.
 */
const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate("parkingSlot", "slotNumber zone status")
      .sort({ bookingDate: -1, startTime: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/bookings/:id
 * @desc    Get a single booking by ID
 * @access  Private
 *
 * USER DATA ISOLATION: The backend verifies that the booking
 * belongs to the requesting user. User A cannot fetch User B's
 * booking by guessing/modifying the booking ID.
 */
const getBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).populate(
      "parkingSlot",
      "slotNumber zone status",
    );

    if (!booking) {
      return next(new AppError("Booking not found.", 404));
    }

    // Ownership check — admin can view any booking
    if (
      booking.user.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return next(new AppError("Not authorized to view this booking.", 403));
    }

    res.status(200).json({
      success: true,
      booking,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/bookings/:id/cancel
 * @desc    Cancel a booking
 * @access  Private (own booking only, or admin)
 *
 * Rules:
 *   - Only CONFIRMED bookings can be cancelled
 *   - Users can only cancel their OWN bookings
 *   - After cancellation, slot status is updated
 */
const cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return next(new AppError("Booking not found.", 404));
    }

    // Ownership check
    if (
      booking.user.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return next(new AppError("Not authorized to cancel this booking.", 403));
    }

    // Status check
    if (booking.status !== "CONFIRMED") {
      return next(
        new AppError(
          `Cannot cancel a booking that is already ${booking.status.toLowerCase()}.`,
          400,
        ),
      );
    }

    // Cancel the booking
    booking.status = "CANCELLED";
    await booking.save();

    // Update slot status (may become AVAILABLE)
    await updateSlotStatus(booking.parkingSlot);

    await booking.populate("parkingSlot", "slotNumber zone status");

    res.status(200).json({
      success: true,
      booking,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/bookings/slot/:slotId?date=YYYY-MM-DD
 * @desc    Get booked times for a specific slot on a specific date
 * @access  Private (any authenticated user)
 */
const getBookedTimesForSlot = async (req, res, next) => {
  try {
    const { slotId } = req.params;
    const { date } = req.query;

    if (!date) {
      return next(new AppError("Date query parameter is required", 400));
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return next(new AppError("Invalid date format", 400));
    }

    // Normalize to midnight (remove time component) using the same logic as createBooking
    const normalizedDate = new Date(
      parsedDate.getFullYear(),
      parsedDate.getMonth(),
      parsedDate.getDate(),
    );

    const bookings = await Booking.find({
      parkingSlot: slotId,
      bookingDate: normalizedDate,
      status: "CONFIRMED",
    }).select("startTime endTime -_id");

    res.status(200).json({
      success: true,
      bookings,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getBooking,
  cancelBooking,
  getBookedTimesForSlot,
};
