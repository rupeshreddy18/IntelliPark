import { useState, useEffect } from "react";
import { adminAPI } from "../../services/api";
import Loading from "../../components/common/Loading";
import ErrorMessage from "../../components/common/ErrorMessage";
import {
  FiGrid,
  FiBookOpen,
  FiUsers,
  FiCheckCircle,
  FiXCircle,
  FiTool,
  FiActivity,
} from "react-icons/fi";

/**
 * AdminDashboard — Overview of the entire parking system.
 *
 * All statistics come from GET /api/admin/stats.
 * Nothing is hardcoded or faked in the frontend.
 */
const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await adminAPI.getStats();
      setStats(response.data.stats);
    } catch (err) {
      setError(err.message || "Failed to load statistics.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading message="Loading admin dashboard..." />;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p>System overview and statistics</p>
      </div>

      <ErrorMessage message={error} onRetry={fetchStats} />

      {stats && (
        <>
          {/* Parking Slot Stats */}
          <h4 style={{ marginBottom: "1rem", color: "var(--text-secondary)" }}>
            Parking Slots
          </h4>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon blue">
                <FiGrid />
              </div>
              <div className="stat-info">
                <span className="stat-value">{stats.slots.total}</span>
                <span className="stat-label">Total Slots</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon green">
                <FiCheckCircle />
              </div>
              <div className="stat-info">
                <span className="stat-value">{stats.slots.available}</span>
                <span className="stat-label">Available</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon red">
                <FiXCircle />
              </div>
              <div className="stat-info">
                <span className="stat-value">{stats.slots.occupied}</span>
                <span className="stat-label">Occupied</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon amber">
                <FiTool />
              </div>
              <div className="stat-info">
                <span className="stat-value">{stats.slots.maintenance}</span>
                <span className="stat-label">Maintenance</span>
              </div>
            </div>
          </div>

          {/* Booking Stats */}
          <h4
            style={{
              marginBottom: "1rem",
              marginTop: "1.5rem",
              color: "var(--text-secondary)",
            }}
          >
            Bookings
          </h4>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon blue">
                <FiBookOpen />
              </div>
              <div className="stat-info">
                <span className="stat-value">{stats.bookings.total}</span>
                <span className="stat-label">Total Bookings</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon blue">
                <FiActivity />
              </div>
              <div className="stat-info">
                <span className="stat-value">{stats.bookings.active}</span>
                <span className="stat-label">Active</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon green">
                <FiCheckCircle />
              </div>
              <div className="stat-info">
                <span className="stat-value">{stats.bookings.completed}</span>
                <span className="stat-label">Completed</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon red">
                <FiXCircle />
              </div>
              <div className="stat-info">
                <span className="stat-value">{stats.bookings.cancelled}</span>
                <span className="stat-label">Cancelled</span>
              </div>
            </div>
          </div>

          {/* User Stats */}
          <h4
            style={{
              marginBottom: "1rem",
              marginTop: "1.5rem",
              color: "var(--text-secondary)",
            }}
          >
            Users
          </h4>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon blue">
                <FiUsers />
              </div>
              <div className="stat-info">
                <span className="stat-value">{stats.users.total}</span>
                <span className="stat-label">Total Users</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon green">
                <FiUsers />
              </div>
              <div className="stat-info">
                <span className="stat-value">{stats.users.regular}</span>
                <span className="stat-label">Regular Users</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon amber">
                <FiUsers />
              </div>
              <div className="stat-info">
                <span className="stat-value">{stats.users.admins}</span>
                <span className="stat-label">Admins</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
