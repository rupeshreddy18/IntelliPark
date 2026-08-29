const ParkingSlot = require("../models/ParkingSlot");
const Booking = require("../models/Booking");
const AppError = require("../utils/AppError");

/**
 * @route   GET /api/parking
 * @desc    Get all parking slots
 * @access  Private (any authenticated user)
 *
 * Returns all slots sorted by zone and slot number.
 * This is how the frontend gets the current state of all parking slots.
 * The database is the SINGLE SOURCE OF TRUTH — no hardcoded data in React.
 */
const getSlots = async (req, res, next) => {
  try {
    const slots = await ParkingSlot.find().sort({ zone: 1, slotNumber: 1 });

    res.status(200).json({
      success: true,
      count: slots.length,
      slots,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/parking/:id
 * @desc    Get a single parking slot by ID
 * @access  Private
 */
const getSlot = async (req, res, next) => {
  try {
    const slot = await ParkingSlot.findById(req.params.id);

    if (!slot) {
      return next(new AppError("Parking slot not found.", 404));
    }

    res.status(200).json({
      success: true,
      slot,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/parking
 * @desc    Create a new parking slot
 * @access  Admin only
 *
 * Admin provides slotNumber and zone. Status defaults to AVAILABLE.
 */
const createSlot = async (req, res, next) => {
  try {
    const { slotNumber, zone, status } = req.body;

    // Check if slot number already exists
    const existingSlot = await ParkingSlot.findOne({
      slotNumber: slotNumber.toUpperCase().trim(),
    });
    if (existingSlot) {
      return next(new AppError("A slot with this number already exists.", 409));
    }

    const slot = await ParkingSlot.create({
      slotNumber,
      zone,
      status: status || "AVAILABLE",
    });

    res.status(201).json({
      success: true,
      slot,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/parking/:id
 * @desc    Update a parking slot (zone, status)
 * @access  Admin only
 *
 * Used to change a slot's status (e.g., set to MAINTENANCE).
 * If setting to MAINTENANCE, we don't cancel existing bookings automatically
 * — the admin should manage those separately.
 */
const updateSlot = async (req, res, next) => {
  try {
    const { slotNumber, zone, status } = req.body;

    const slot = await ParkingSlot.findById(req.params.id);
    if (!slot) {
      return next(new AppError("Parking slot not found.", 404));
    }

    // If changing slotNumber, check for duplicates
    if (slotNumber && slotNumber.toUpperCase().trim() !== slot.slotNumber) {
      const duplicate = await ParkingSlot.findOne({
        slotNumber: slotNumber.toUpperCase().trim(),
      });
      if (duplicate) {
        return next(
          new AppError("A slot with this number already exists.", 409),
        );
      }
    }

    // Update fields
    if (slotNumber) slot.slotNumber = slotNumber;
    if (zone) slot.zone = zone;
    if (status) slot.status = status;

    await slot.save();

    res.status(200).json({
      success: true,
      slot,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/parking/:id
 * @desc    Delete a parking slot
 * @access  Admin only
 *
 * SAFETY: Cannot delete a slot that has active (CONFIRMED) bookings.
 * This prevents orphaned booking records pointing to a deleted slot.
 */
const deleteSlot = async (req, res, next) => {
  try {
    const slot = await ParkingSlot.findById(req.params.id);
    if (!slot) {
      return next(new AppError("Parking slot not found.", 404));
    }

    // Check for active bookings
    const activeBookings = await Booking.countDocuments({
      parkingSlot: slot._id,
      status: "CONFIRMED",
    });

    if (activeBookings > 0) {
      return next(
        new AppError(
          `Cannot delete this slot. It has ${activeBookings} active booking(s). Cancel them first.`,
          409,
        ),
      );
    }

    await ParkingSlot.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Parking slot deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSlots, getSlot, createSlot, updateSlot, deleteSlot };
