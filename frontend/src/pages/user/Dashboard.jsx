import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { parkingAPI, bookingAPI } from "../../services/api";
import Loading from "../../components/common/Loading";
import ErrorMessage from "../../components/common/ErrorMessage";
import { FiGrid, FiBookOpen, FiCheckCircle, FiClock } from "react-icons/fi";
import { SLOT_STATUS, BOOKING_STATUS } from "../../utils/constants";

/**
 * Dashboard — User's landing page after login.
 *
 * Shows:
 *   - Quick stats (available slots, active bookings, completed, cancelled)
 *   - Active bookings summary
 *   - Quick link to book a slot
 */
const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError("");
    try {
      const [slotsRes, bookingsRes] = await Promise.all([
        parkingAPI.getAll(),
        bookingAPI.getMyBookings(),
      ]);

      const slots = slotsRes.data.slots;
      const bookings = bookingsRes.data.bookings;

      setStats({
        availableSlots: slots.filter((s) => s.status === SLOT_STATUS.AVAILABLE)
          .length,
        totalSlots: slots.length,
        activeBookings: bookings.filter(
          (b) => b.status === BOOKING_STATUS.CONFIRMED,
        ).length,
        completedBookings: bookings.filter(
          (b) => b.status === BOOKING_STATUS.COMPLETED,
        ).length,
        cancelledBookings: bookings.filter(
          (b) => b.status === BOOKING_STATUS.CANCELLED,
        ).length,
      });

      // Show the 3 most recent bookings
      setRecentBookings(bookings.slice(0, 3));
    } catch (err) {
      setError(err.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading message="Loading dashboard..." />;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Welcome, {user?.name}!</h1>
        <p>Here's your parking overview</p>
      </div>

      <ErrorMessage message={error} onRetry={fetchDashboardData} />

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon green">
              <FiGrid />
            </div>
            <div className="stat-info">
              <span className="stat-value">{stats.availableSlots}</span>
              <span className="stat-label">Available Slots</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon blue">
              <FiBookOpen />
            </div>
            <div className="stat-info">
              <span className="stat-value">{stats.activeBookings}</span>
              <span className="stat-label">Active Bookings</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon green">
              <FiCheckCircle />
            </div>
            <div className="stat-info">
              <span className="stat-value">{stats.completedBookings}</span>
              <span className="stat-label">Completed</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon amber">
              <FiClock />
            </div>
            <div className="stat-info">
              <span className="stat-value">{stats.totalSlots}</span>
              <span className="stat-label">Total Slots</span>
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "1.5rem",
        }}
      >
        {/* Quick Actions */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Quick Actions</h3>
          </div>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
          >
            <Link
              to="/parking"
              className="btn btn-primary"
              style={{ justifyContent: "center" }}
            >
              <FiGrid /> Browse Parking Slots
            </Link>
            <Link
              to="/bookings"
              className="btn btn-outline"
              style={{ justifyContent: "center" }}
            >
              <FiBookOpen /> View My Bookings
            </Link>
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Bookings</h3>
            <Link to="/bookings" className="btn btn-sm btn-secondary">
              View All
            </Link>
          </div>
          {recentBookings.length === 0 ? (
            <div className="empty-state" style={{ padding: "1.5rem 0" }}>
              <p>No bookings yet. Book your first slot!</p>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              {recentBookings.map((booking) => (
                <div
                  key={booking._id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.625rem 0",
                    borderBottom: "1px solid var(--border-color)",
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 600 }}>
                      {booking.parkingSlot?.slotNumber || "N/A"}
                    </span>
                    <span
                      style={{
                        color: "var(--text-muted)",
                        marginLeft: "0.5rem",
                        fontSize: "var(--font-size-sm)",
                      }}
                    >
                      Zone {booking.parkingSlot?.zone || "?"}
                    </span>
                  </div>
                  <span
                    className={`booking-status ${booking.status.toLowerCase()}`}
                  >
                    {booking.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
