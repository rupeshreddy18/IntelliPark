import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  FiHome,
  FiGrid,
  FiBookOpen,
  FiUser,
  FiSettings,
  FiUsers,
  FiBarChart2,
  FiCalendar,
} from "react-icons/fi";

/**
 * Sidebar — Navigation menu for the application.
 *
 * Shows different links based on user role:
 *   - Regular users: Dashboard, Parking Slots, My Bookings, Profile
 *   - Admins: Additional admin management links
 *
 * The active link is highlighted based on the current URL.
 */
const Sidebar = ({ isOpen, onClose }) => {
  const { user, isAdmin } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={`sidebar-overlay ${isOpen ? "open" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">🅿️</div>
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-name">IntelliPark</span>
            <span className="sidebar-brand-subtitle">Smart Parking</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="sidebar-section-title">Main Menu</div>

          {user && (
            <>
              {/* Hide User Dashboard for Admins */}
              {!isAdmin && (
                <Link
                  to="/dashboard"
                  className={`sidebar-link ${isActive("/dashboard") ? "active" : ""}`}
                  onClick={onClose}
                >
                  <span className="sidebar-link-icon">
                    <FiHome />
                  </span>
                  Dashboard
                </Link>
              )}

              <Link
                to="/parking"
                className={`sidebar-link ${isActive("/parking") ? "active" : ""}`}
                onClick={onClose}
              >
                <span className="sidebar-link-icon">
                  <FiGrid />
                </span>
                Parking Slots
              </Link>

              {/* Hide My Bookings for Admins */}
              {!isAdmin && (
                <Link
                  to="/bookings"
                  className={`sidebar-link ${isActive("/bookings") ? "active" : ""}`}
                  onClick={onClose}
                >
                  <span className="sidebar-link-icon">
                    <FiBookOpen />
                  </span>
                  My Bookings
                </Link>
              )}

              <Link
                to="/profile"
                className={`sidebar-link ${isActive("/profile") ? "active" : ""}`}
                onClick={onClose}
              >
                <span className="sidebar-link-icon">
                  <FiUser />
                </span>
                Profile
              </Link>
            </>
          )}

          {/* Administration Section - Visible to Admins OR Guests exploring admin pages */}
          {(isAdmin || (!user && location.pathname.startsWith("/admin"))) && (
            <>
              <div className="sidebar-section-title" style={{ marginTop: user ? "0" : "1rem" }}>Administration</div>

              <Link
                to="/admin"
                className={`sidebar-link ${isActive("/admin") && !isActive("/admin/slots") && !isActive("/admin/bookings") && !isActive("/admin/users") ? "active" : ""}`}
                onClick={onClose}
              >
                <span className="sidebar-link-icon">
                  <FiBarChart2 />
                </span>
                Admin Dashboard
              </Link>

              <Link
                to="/admin/slots"
                className={`sidebar-link ${isActive("/admin/slots") ? "active" : ""}`}
                onClick={onClose}
              >
                <span className="sidebar-link-icon">
                  <FiSettings />
                </span>
                Manage Slots
              </Link>

              <Link
                to="/admin/users"
                className={`sidebar-link ${isActive("/admin/users") ? "active" : ""}`}
                onClick={onClose}
              >
                <span className="sidebar-link-icon">
                  <FiUsers />
                </span>
                Manage Users
              </Link>
            </>
          )}

          {!user && !location.pathname.startsWith("/admin") && (
            <>
              <Link
                to="/parking"
                className={`sidebar-link ${isActive("/parking") ? "active" : ""}`}
                onClick={onClose}
              >
                <span className="sidebar-link-icon">
                  <FiGrid />
                </span>
                Live Parking Slots
              </Link>

              <div className="sidebar-section-title" style={{ marginTop: "1rem" }}>
                Account
              </div>

              <Link
                to="/login"
                className={`sidebar-link ${isActive("/login") ? "active" : ""}`}
                onClick={onClose}
              >
                <span className="sidebar-link-icon">
                  <FiUser />
                </span>
                Sign In
              </Link>

              <Link
                to="/register"
                className={`sidebar-link ${isActive("/register") ? "active" : ""}`}
                onClick={onClose}
              >
                <span className="sidebar-link-icon">
                  <FiUser />
                </span>
                Create Account
              </Link>
            </>
          )}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
