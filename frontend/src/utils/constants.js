/**
 * Constants used across the frontend.
 *
 * These mirror the backend enum values exactly.
 * Using constants prevents typos and makes refactoring easier.
 */

// Parking slot statuses
export const SLOT_STATUS = {
  AVAILABLE: "AVAILABLE",
  OCCUPIED: "OCCUPIED",
  MAINTENANCE: "MAINTENANCE",
};

// Booking statuses
export const BOOKING_STATUS = {
  CONFIRMED: "CONFIRMED",
  CANCELLED: "CANCELLED",
  COMPLETED: "COMPLETED",
};

// User roles
export const USER_ROLES = {
  USER: "user",
  ADMIN: "admin",
};

// Status colors for visual distinction
export const STATUS_COLORS = {
  AVAILABLE: "#10b981", // Green
  OCCUPIED: "#ef4444", // Red
  MAINTENANCE: "#f59e0b", // Amber
  CONFIRMED: "#3b82f6", // Blue
  CANCELLED: "#6b7280", // Gray
  COMPLETED: "#10b981", // Green
};

// Time slots for booking (1-hour increments, 06:00 to 22:00)
export const TIME_SLOTS = [];
for (let hour = 6; hour <= 22; hour++) {
  TIME_SLOTS.push(`${String(hour).padStart(2, "0")}:00`);
}

// Billing
export const HOURLY_RATE = 5; // $5 per hour
