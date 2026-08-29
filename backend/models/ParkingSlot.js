const mongoose = require("mongoose");

/**
 * ParkingSlot Model
 *
 * Represents a physical parking slot in the system.
 *
 * Key design decisions:
 *   - slotNumber is unique and uppercase → "a1" becomes "A1"
 *   - status uses an enum → only AVAILABLE, OCCUPIED, or MAINTENANCE allowed
 *   - The database is the SINGLE SOURCE OF TRUTH for slot availability
 *   - Status is updated when bookings are created/cancelled/completed
 */
const parkingSlotSchema = new mongoose.Schema({
  slotNumber: {
    type: String,
    required: [true, "Slot number is required"],
    unique: true,
    uppercase: true,
    trim: true,
    maxlength: [10, "Slot number cannot exceed 10 characters"],
  },
  zone: {
    type: String,
    required: [true, "Zone is required"],
    uppercase: true,
    trim: true,
    maxlength: [10, "Zone cannot exceed 10 characters"],
  },
  status: {
    type: String,
    enum: {
      values: ["AVAILABLE", "OCCUPIED", "MAINTENANCE"],
      message: "Status must be AVAILABLE, OCCUPIED, or MAINTENANCE",
    },
    default: "AVAILABLE",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index: slotNumber is already unique (defined above), creates index automatically.

const ParkingSlot = mongoose.model("ParkingSlot", parkingSlotSchema);

module.exports = ParkingSlot;
