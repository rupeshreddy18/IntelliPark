import { useState, useEffect } from "react";
import { adminAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import Loading from "../../components/common/Loading";
import ErrorMessage from "../../components/common/ErrorMessage";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import AdminGuestModal from "../../components/admin/AdminGuestModal";
import { formatDate, formatTime } from "../../utils/helpers";
import { BOOKING_STATUS } from "../../utils/constants";

/**
 * ManageBookingsPage — Admin view of all bookings with actions.
 */
const ManageBookingsPage = () => {
  const { isAdmin } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filter, setFilter] = useState("ALL");

  // Guest Protection
  const [guestAction, setGuestAction] = useState("");
  const [showGuestModal, setShowGuestModal] = useState(false);

  const requireAdmin = (action) => {
    if (!isAdmin) {
      setGuestAction(action);
      setShowGuestModal(true);
      return false;
    }
    return true;
  };

  // Action states
  const [actionId, setActionId] = useState(null);
  const [actionType, setActionType] = useState(null); // 'complete' or 'cancel'
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await adminAPI.getBookings();
      setBookings(response.data.bookings);
    } catch (err) {
      setError(err.message || "Failed to load bookings.");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!actionId || !actionType) return;
    setActionLoading(true);
    setError("");
    setSuccess("");

    try {
      if (actionType === "complete") {
        await adminAPI.completeBooking(actionId);
        setSuccess("Booking marked as completed.");
      } else {
        await adminAPI.cancelBooking(actionId);
        setSuccess("Booking cancelled.");
      }
      setActionId(null);
      setActionType(null);
      await fetchBookings();
    } catch (err) {
      setError(err.message || "Action failed.");
      setActionId(null);
      setActionType(null);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredBookings =
    filter === "ALL" ? bookings : bookings.filter((b) => b.status === filter);

  if (loading) return <Loading message="Loading bookings..." />;

  return (
    <div className="page-container">
      <AdminGuestModal 
        isOpen={showGuestModal} 
        onClose={() => setShowGuestModal(false)} 
        actionName={guestAction} 
      />

      <div className="page-header">
        <h1>Manage Bookings</h1>
        <p>View and manage all system bookings</p>
      </div>

      {success && <div className="alert alert-success">{success}</div>}
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

      {/* Bookings Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>User</th>
              <th>Slot</th>
              <th>Date</th>
              <th>Time</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.length === 0 ? (
              <tr>
                <td
                  colSpan="6"
                  style={{ textAlign: "center", padding: "2rem" }}
                >
                  No bookings found.
                </td>
              </tr>
            ) : (
              filteredBookings.map((booking) => (
                <tr key={booking._id}>
                  <td>
                    <div>
                      <div style={{ fontWeight: 600 }}>
                        {booking.user?.name || "N/A"}
                      </div>
                      <div
                        style={{
                          fontSize: "var(--font-size-xs)",
                          color: "var(--text-muted)",
                        }}
                      >
                        {booking.user?.email || ""}
                      </div>
                    </div>
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    {booking.parkingSlot?.slotNumber || "N/A"}
                  </td>
                  <td>{formatDate(booking.bookingDate)}</td>
                  <td>
                    {formatTime(booking.startTime)} —{" "}
                    {formatTime(booking.endTime)}
                  </td>
                  <td>
                    <span
                      className={`booking-status ${booking.status.toLowerCase()}`}
                    >
                      {booking.status}
                    </span>
                  </td>
                  <td>
                    {booking.status === BOOKING_STATUS.CONFIRMED && (
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => {
                            if (requireAdmin("complete this booking")) {
                              setActionId(booking._id);
                              setActionType("complete");
                            }
                          }}
                        >
                          Complete
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => {
                            if (requireAdmin("cancel this booking")) {
                              setActionId(booking._id);
                              setActionType("cancel");
                            }
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Action Confirmation */}
      <ConfirmDialog
        isOpen={!!actionId}
        title={
          actionType === "complete" ? "Complete Booking?" : "Cancel Booking?"
        }
        message={
          actionType === "complete"
            ? "Mark this booking as completed? The slot will become available."
            : "Cancel this booking? The slot will become available."
        }
        confirmText={
          actionType === "complete" ? "Mark Completed" : "Cancel Booking"
        }
        variant={actionType === "cancel" ? "danger" : "warning"}
        onConfirm={handleAction}
        onClose={() => {
          setActionId(null);
          setActionType(null);
        }}
        loading={actionLoading}
      />
    </div>
  );
};

export default ManageBookingsPage;
