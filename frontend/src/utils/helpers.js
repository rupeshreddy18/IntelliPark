import { STATUS_COLORS } from "./constants";

/**
 * Format a date string for display.
 * e.g., "2025-03-15" → "Mar 15, 2025"
 */
export const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

/**
 * Format time for display.
 * e.g., "09:00" → "9:00 AM", "14:00" → "2:00 PM"
 */
export const formatTime = (timeString) => {
  if (!timeString) return "";
  const [hours, minutes] = timeString.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(minutes).padStart(2, "0")} ${period}`;
};

/**
 * Get the CSS color for a status value.
 */
export const getStatusColor = (status) => {
  return STATUS_COLORS[status] || "#6b7280";
};

/**
 * Get today's date as YYYY-MM-DD for date input default value.
 */
export const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split("T")[0];
};

/**
 * Check if a date is in the past.
 */
export const isDateInPast = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
};
