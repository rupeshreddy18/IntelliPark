import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { FiMenu, FiLogOut, FiSun, FiMoon, FiBell, FiChevronDown } from "react-icons/fi";

/**
 * Navbar — Top navigation bar.
 */
const Navbar = ({ onMenuToggle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isDark, setIsDark] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    return savedTheme === "dark" || (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches);
  });

  useEffect(() => {
    if (isDark) {
      document.body.classList.add("dark-theme");
      localStorage.setItem("theme", "dark");
    } else {
      document.body.classList.remove("dark-theme");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Helper to get nice page title from path
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === "/dashboard") return "Dashboard";
    if (path === "/parking") return "Live Parking Slots";
    if (path === "/bookings") return "My Bookings";
    if (path === "/profile") return "User Profile";
    if (path === "/admin") return "Admin Dashboard";
    if (path === "/admin/slots") return "Manage Slots";
    if (path === "/admin/bookings") return "Manage Bookings";
    if (path === "/admin/users") return "Manage Users";
    return "IntelliPark";
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <button
          className="menu-toggle"
          onClick={onMenuToggle}
          aria-label="Toggle navigation menu"
        >
          <FiMenu />
        </button>
        <div className="navbar-breadcrumb">
          <span className="breadcrumb-brand">IntelliPark</span>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">{getPageTitle()}</span>
        </div>
      </div>

      <div className="navbar-right">
        {/* Theme Toggle Button */}
        <button
          onClick={() => setIsDark(!isDark)}
          className="navbar-icon-btn"
          aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
        >
          {isDark ? <FiSun /> : <FiMoon />}
        </button>

        {/* Notification Bell (Visual only for portfolio) */}
        <button className="navbar-icon-btn notification-btn">
          <FiBell />
          <span className="notification-badge"></span>
        </button>

        {user ? (
          <div className="navbar-profile-wrapper">
            <div className="navbar-user-pill">
              <div className="navbar-user-avatar">{getInitials(user?.name)}</div>
              <div className="navbar-user-info">
                <span className="navbar-user-name">{user?.name}</span>
                <span className="navbar-user-role">{user?.role}</span>
              </div>
              <FiChevronDown className="navbar-pill-icon" />
            </div>
            
            {/* Hover Dropdown */}
            <div className="navbar-dropdown">
              <button onClick={() => navigate("/profile")} className="dropdown-item">
                Profile Settings
              </button>
              <div className="dropdown-divider"></div>
              <button onClick={handleLogout} className="dropdown-item text-danger">
                <FiLogOut style={{ marginRight: "0.5rem" }} />
                Logout
              </button>
            </div>
          </div>
        ) : (
          <div className="navbar-guest-actions">
            <button
              className="btn btn-outline btn-sm"
              onClick={() => navigate("/login")}
            >
              Sign In
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => navigate("/register")}
            >
              Create Account
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
