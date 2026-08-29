import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/routing/ProtectedRoute";
import AdminRoute from "./components/routing/AdminRoute";
import Navbar from "./components/common/Navbar";
import Sidebar from "./components/common/Sidebar";

// Auth pages
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";

// User pages
import Dashboard from "./pages/user/Dashboard";
import ParkingSlotsPage from "./pages/user/ParkingSlotsPage";
import MyBookingsPage from "./pages/user/MyBookingsPage";
import ProfilePage from "./pages/user/ProfilePage";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageSlotsPage from "./pages/admin/ManageSlotsPage";
import ManageBookingsPage from "./pages/admin/ManageBookingsPage";
import ManageUsersPage from "./pages/admin/ManageUsersPage";

import "./App.css";

/**
 * AppLayout — Wraps authenticated pages with Navbar + Sidebar.
 *
 * The layout only renders for logged-in users.
 * Login and Register pages render without the layout.
 */
const AppLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Navbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        {children}
      </div>
    </div>
  );
};

/**
 * App — Root component with routing configuration.
 *
 * Route structure:
 *   /login       → Public (redirects if logged in)
 *   /register    → Public (redirects if logged in)
 *   /dashboard   → Protected (any authenticated user)
 *   /parking     → Protected
 *   /bookings    → Protected
 *   /profile     → Protected
 *   /admin/*     → Admin only (protected + admin role check)
 *   /            → Redirects to /dashboard
 *   *            → Redirects to /dashboard
 */
const App = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public routes — No layout */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Parking Slots — Accessible to both guests and logged-in users */}
          <Route
            path="/parking"
            element={
              <AppLayout>
                <ParkingSlotsPage />
              </AppLayout>
            }
          />

          {/* Protected user routes — With layout */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/bookings"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <MyBookingsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ProfilePage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Admin routes — Public for Guest Demo */}
          <Route
            path="/admin"
            element={
              <AppLayout>
                <AdminDashboard />
              </AppLayout>
            }
          />
          <Route
            path="/admin/slots"
            element={
              <AppLayout>
                <ManageSlotsPage />
              </AppLayout>
            }
          />
          <Route
            path="/admin/bookings"
            element={
              <AppLayout>
                <ManageBookingsPage />
              </AppLayout>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AppLayout>
                <ManageUsersPage />
              </AppLayout>
            }
          />

          {/* Default redirects */}
          <Route path="/" element={<Navigate to="/parking" replace />} />
          <Route path="*" element={<Navigate to="/parking" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;
