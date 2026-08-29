import { useState, useEffect } from "react";
import { FiX } from "react-icons/fi";
import { TIME_SLOTS } from "../../utils/constants";
import { getTodayDate } from "../../utils/helpers";
import { bookingAPI } from "../../services/api";

/**
 * BookingModal — Form for creating a new parking booking.
 *
 * User selects:
 *   - Date (cannot be in the past)
 *   - Start time (1-hour increments)
 *   - End time (must be after start time)
 *
 * Validation happens here (UX) AND on the backend (security).
 * The backend is the final authority — this is just convenience.
 */
const BookingModal = ({ slot, onSubmit, onClose, loading }) => {
  const [bookingDate, setBookingDate] = useState(getTodayDate());
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [error, setError] = useState("");
  const [bookedIntervals, setBookedIntervals] = useState([]);
  const [fetchingAvailability, setFetchingAvailability] = useState(false);

  // Fetch booked times for this slot on the selected date
  useEffect(() => {
    const fetchAvailability = async () => {
      setFetchingAvailability(true);
      try {
        const res = await bookingAPI.getBookedTimesForSlot(slot._id, bookingDate);
        setBookedIntervals(res.data.bookings);
      } catch (err) {
        console.error("Failed to fetch availability:", err);
      } finally {
        setFetchingAvailability(false);
      }
    };
    
    if (bookingDate) {
      fetchAvailability();
      setStartTime("");
      setEndTime("");
    }
  }, [slot._id, bookingDate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    // Frontend validation (convenience only — backend validates too)
    if (!bookingDate) {
      setError("Please select a date.");
      return;
    }
    if (!startTime) {
      setError("Please select a start time.");
      return;
    }
    if (!endTime) {
      setError("Please select an end time.");
      return;
    }
    if (startTime >= endTime) {
      setError("End time must be after start time.");
      return;
    }

    onSubmit({
      parkingSlotId: slot._id,
      bookingDate,
      startTime,
      endTime,
    });
  };

  // Check if a specific start time is inside an already booked interval
  const isTimeBooked = (time) => {
    return bookedIntervals.some((b) => time >= b.startTime && time < b.endTime);
  };

  // Filter end times to only show valid times after start time without overlapping next booking
  let availableEndTimes = [];
  if (startTime) {
    const nextBooking = [...bookedIntervals]
      .filter((b) => b.startTime >= startTime)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))[0];
    
    const maxEndTime = nextBooking ? nextBooking.startTime : "23:59";
    
    availableEndTimes = TIME_SLOTS.filter(
      (time) => time > startTime && time <= maxEndTime
    );
  }

  let duration = 0;
  let totalCost = 0;
  if (startTime && endTime) {
    const startHour = parseInt(startTime.split(":")[0], 10);
    const endHour = parseInt(endTime.split(":")[0], 10);
    duration = endHour - startHour;
    // We import HOURLY_RATE at the top
    totalCost = duration > 0 ? duration * 5 : 0; // Using 5 directly or importing HOURLY_RATE
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Book Slot {slot.slotNumber}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <FiX />
          </button>
        </div>

        <div style={{ marginBottom: "1.25rem" }}>
          <div
            className={`slot-status-badge available`}
            style={{ marginBottom: "0.5rem" }}
          >
            <span className="slot-status-dot available"></span>
            AVAILABLE
          </div>
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "var(--font-size-sm)",
            }}
          >
            Zone {slot.zone} · Slot {slot.slotNumber}
          </p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label" htmlFor="booking-date">
              Date
            </label>
            <input
              type="date"
              id="booking-date"
              className="form-input"
              value={bookingDate}
              min={getTodayDate()}
              onChange={(e) => setBookingDate(e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="start-time">
                Start Time
              </label>
              <select
                id="start-time"
                className="form-select"
                value={startTime}
                onChange={(e) => {
                  setStartTime(e.target.value);
                  setEndTime(""); // Reset end time when start changes
                }}
                disabled={fetchingAvailability}
                required
              >
                <option value="">{fetchingAvailability ? "Loading..." : "Select"}</option>
                {TIME_SLOTS.slice(0, -1).map((time) => {
                  const booked = isTimeBooked(time);
                  return (
                    <option key={time} value={time} disabled={booked}>
                      {time} {booked ? "(Booked)" : ""}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="end-time">
                End Time
              </label>
              <select
                id="end-time"
                className="form-select"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                disabled={!startTime}
                required
              >
                <option value="">Select</option>
                {availableEndTimes.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {startTime && endTime && duration > 0 && (
            <div style={{ 
              padding: "1rem", 
              backgroundColor: "var(--gray-100)", 
              borderRadius: "var(--border-radius)", 
              marginBottom: "1.5rem",
              border: "1px solid var(--border-color)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                  Total Cost ({duration} {duration === 1 ? 'hour' : 'hours'} @ $5/hr)
                </span>
                <span style={{ fontSize: "var(--font-size-xl)", fontWeight: 800, color: "var(--primary-600)" }}>
                  ${totalCost}
                </span>
              </div>
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? "Booking..." : "Confirm Booking"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;
