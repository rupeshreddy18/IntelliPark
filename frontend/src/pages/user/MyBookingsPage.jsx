import { useState, useEffect } from "react";
import { bookingAPI } from "../../services/api";
import BookingCard from "../../components/booking/BookingCard";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import Loading from "../../components/common/Loading";
import ErrorMessage from "../../components/common/ErrorMessage";
import { BOOKING_STATUS } from "../../utils/constants";

/**
 * MyBookingsPage — View and manage the current user's bookings.
 *
 * Features:
 *   - Filter by status (All, Active, Completed, Cancelled)
 *   - Cancel confirmed bookings with confirmation dialog
 *   - Empty state when no bookings exist
 */
const MyBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [cancelId, setCancelId] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await bookingAPI.getMyBookings();
      setBookings(response.data.bookings);
    } catch (err) {
      setError(err.message || "Failed to load bookings.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!cancelId) return;
    setCancelling(true);
    setError("");
    try {
      await bookingAPI.cancel(cancelId);
      setSuccessMessage("Booking cancelled successfully.");
      setCancelId(null);
      await fetchBookings();
    } catch (err) {
      setError(err.message || "Failed to cancel booking.");
      setCancelId(null);
    } finally {
      setCancelling(false);
    }
  };

  const filteredBookings =
    filter === "ALL" ? bookings : bookings.filter((b) => b.status === filter);

  if (loading) return <Loading message="Loading your bookings..." />;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>My Bookings</h1>
        <p>View and manage your parking reservations</p>
      </div>

      {successMessage && (
        <div className="alert alert-success">{successMessage}</div>
      )}
      <ErrorMessage message={error} onRetry={fetchBookings} />

      {/* Filter */}
      <div className="zone-filter">
        {[
          { key: "ALL", label: "All" },
          { key: BOOKING_STATUS.CONFIRMED, label: "Active" },
          { key: BOOKING_STATUS.COMPLETED, label: "Completed" },
          { key: BOOKING_STATUS.CANCELLED, label: "Cancelled" },
        ].map(({ key, label }) => (
          <button
            key={key}
            className={`zone-filter-btn ${filter === key ? "active" : ""}`}
            onClick={() => setFilter(key)}
          >
            {label}{" "}
            {key !== "ALL" &&
              `(${bookings.filter((b) => b.status === key).length})`}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <h3>No Bookings Found</h3>
          <p>
            {filter === "ALL"
              ? "You haven't made any bookings yet. Go to Parking Slots to book your first spot!"
              : `No ${filter.toLowerCase()} bookings.`}
          </p>
        </div>
      ) : (
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
        >
          {filteredBookings.map((booking) => (
            <BookingCard
              key={booking._id}
              booking={booking}
              onCancel={(id) => setCancelId(id)}
            />
          ))}
        </div>
      )}

      {/* Cancel Confirmation */}
      <ConfirmDialog
        isOpen={!!cancelId}
        title="Cancel Booking?"
        message="Are you sure you want to cancel this booking? This action cannot be undone."
        confirmText="Yes, Cancel Booking"
        variant="danger"
        onConfirm={handleCancelBooking}
        onClose={() => setCancelId(null)}
        loading={cancelling}
      />
    </div>
  );
};

export default MyBookingsPage;
