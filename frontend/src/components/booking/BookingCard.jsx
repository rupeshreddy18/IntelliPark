import { formatDate, formatTime } from "../../utils/helpers";
import { BOOKING_STATUS } from "../../utils/constants";

/**
 * BookingCard — Displays a single booking with its details and actions.
 */
const BookingCard = ({ booking, onCancel, showUser = false }) => {
  const statusClass = booking.status.toLowerCase();
  const isCancellable = booking.status === BOOKING_STATUS.CONFIRMED;

  return (
    <div className="booking-card">
      <div className="booking-slot-info">
        <span className="booking-slot-number">
          {booking.parkingSlot?.slotNumber || "N/A"}
        </span>
        <span className="booking-slot-zone">
          Zone {booking.parkingSlot?.zone || "?"}
        </span>
      </div>

      <div className="booking-details">
        {showUser && booking.user && (
          <div
            style={{
              fontSize: "var(--font-size-xs)",
              color: "var(--text-muted)",
            }}
          >
            {booking.user.name} ({booking.user.email})
          </div>
        )}
        <div className="booking-date">{formatDate(booking.bookingDate)}</div>
        <div className="booking-time">
          {formatTime(booking.startTime)} — {formatTime(booking.endTime)}
        </div>
        {booking.totalCost !== undefined && (
          <div style={{ fontWeight: 600, color: "var(--primary-600)", marginTop: "0.25rem" }}>
            Total: ${booking.totalCost}
          </div>
        )}
        <div style={{ marginTop: "0.5rem" }}>
          <span className={`booking-status ${statusClass}`}>
            {booking.status}
          </span>
        </div>
      </div>

      <div className="booking-actions">
        {onCancel && isCancellable && (
          <button
            className="btn btn-danger btn-sm"
            onClick={() => onCancel(booking._id)}
            aria-label={`Cancel booking for slot ${booking.parkingSlot?.slotNumber}`}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};

export default BookingCard;
