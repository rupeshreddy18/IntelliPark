const User = require("../models/User");
const ParkingSlot = require("../models/ParkingSlot");
const Booking = require("../models/Booking");
const AppError = require("../utils/AppError");

/**
 * @route   GET /api/admin/stats
 * @desc    Get dashboard statistics
 * @access  Admin only
 *
 * All counts are real-time from the database.
 * Nothing is hardcoded or faked.
 */
const getStats = async (req, res, next) => {
  try {
    // Slot statistics
    const totalSlots = await ParkingSlot.countDocuments();
    const availableSlots = await ParkingSlot.countDocuments({
      status: "AVAILABLE",
    });
    const occupiedSlots = await ParkingSlot.countDocuments({
      status: "OCCUPIED",
    });
    const maintenanceSlots = await ParkingSlot.countDocuments({
      status: "MAINTENANCE",
    });

    // Booking statistics
    const totalBookings = await Booking.countDocuments();
    const activeBookings = await Booking.countDocuments({
      status: "CONFIRMED",
    });
    const cancelledBookings = await Booking.countDocuments({
      status: "CANCELLED",
    });
    const completedBookings = await Booking.countDocuments({
      status: "COMPLETED",
    });

    // User statistics
    const totalUsers = await User.countDocuments();
    const adminUsers = await User.countDocuments({ role: "admin" });

    res.status(200).json({
      success: true,
      stats: {
        slots: {
          total: totalSlots,
          available: availableSlots,
          occupied: occupiedSlots,
          maintenance: maintenanceSlots,
        },
        bookings: {
          total: totalBookings,
          active: activeBookings,
          cancelled: cancelledBookings,
          completed: completedBookings,
        },
        users: {
          total: totalUsers,
          admins: adminUsers,
          regular: totalUsers - adminUsers,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/users
 * @desc    Get all users
 * @access  Admin only
 *
 * Returns user data WITHOUT passwords.
 * Password has `select: false` in the schema, so it's excluded automatically.
 */
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/bookings
 * @desc    Get all bookings (with user and slot details)
 * @access  Admin only
 */
const getAllBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find()
      .populate("user", "name email")
      .populate("parkingSlot", "slotNumber zone status")
      .sort({ createdAt: -1 });

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
 * @route   PUT /api/admin/bookings/:id/complete
 * @desc    Mark a booking as completed
 * @access  Admin only
 *
 * Admin manually marks a booking as COMPLETED when the user
 * has finished using the parking slot.
 *
 * Only CONFIRMED bookings can be completed.
 */
const completeBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return next(new AppError("Booking not found.", 404));
    }

    if (booking.status !== "CONFIRMED") {
      return next(
        new AppError(
          `Cannot complete a booking that is ${booking.status.toLowerCase()}.`,
          400,
        ),
      );
    }

    booking.status = "COMPLETED";
    await booking.save();

    // Update slot status
    const ParkingSlotModel = require("../models/ParkingSlot");
    const slot = await ParkingSlotModel.findById(booking.parkingSlot);
    if (slot && slot.status !== "MAINTENANCE") {
      // Check if there's another active booking right now
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

      const anotherActive = await Booking.findOne({
        parkingSlot: slot._id,
        bookingDate: today,
        status: "CONFIRMED",
        startTime: { $lte: currentTime },
        endTime: { $gt: currentTime },
      });

      slot.status = anotherActive ? "OCCUPIED" : "AVAILABLE";
      await slot.save();
    }

    await booking.populate("user", "name email");
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
 * @route   PUT /api/admin/bookings/:id/cancel
 * @desc    Admin cancel any booking
 * @access  Admin only
 */
const adminCancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return next(new AppError("Booking not found.", 404));
    }

    if (booking.status !== "CONFIRMED") {
      return next(
        new AppError(
          `Cannot cancel a booking that is already ${booking.status.toLowerCase()}.`,
          400,
        ),
      );
    }

    booking.status = "CANCELLED";
    await booking.save();

    // Update slot status
    const slot = await ParkingSlot.findById(booking.parkingSlot);
    if (slot && slot.status !== "MAINTENANCE") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

      const anotherActive = await Booking.findOne({
        parkingSlot: slot._id,
        bookingDate: today,
        status: "CONFIRMED",
        startTime: { $lte: currentTime },
        endTime: { $gt: currentTime },
        _id: { $ne: booking._id },
      });

      slot.status = anotherActive ? "OCCUPIED" : "AVAILABLE";
      await slot.save();
    }

    await booking.populate("user", "name email");
    await booking.populate("parkingSlot", "slotNumber zone status");

    res.status(200).json({
      success: true,
      booking,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStats,
  getUsers,
  getAllBookings,
  completeBooking,
  adminCancelBooking,
};
