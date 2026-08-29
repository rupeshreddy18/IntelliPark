import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { FiEye, FiEyeOff } from "react-icons/fi";

/**
 * LoginPage — User authentication form.
 *
 * If already logged in, redirects to dashboard.
 * On submit, calls the auth context login function.
 * Displays backend error messages on failure.
 */
const LoginPage = () => {
  const { login, isAuthenticated } = useAuth();
  const [demoMode, setDemoMode] = useState("user");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // If already authenticated, redirect
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      // AuthContext will update, ProtectedRoute will grant access
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-brand-icon">🅿️</div>
          <h1>IntelliPark</h1>
          <p>Smart Parking Slot Management</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          
          {/* Role Toggle for Demo Purposes */}
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", backgroundColor: "var(--gray-100)", padding: "0.25rem", borderRadius: "var(--border-radius)" }}>
            <button
              type="button"
              onClick={() => {
                setDemoMode("user");
                setEmail("");
                setPassword("");
              }}
              style={{
                flex: 1,
                padding: "0.5rem",
                borderRadius: "calc(var(--border-radius) - 2px)",
                border: "none",
                cursor: "pointer",
                fontWeight: 600,
                backgroundColor: demoMode === "user" ? "#ffffff" : "transparent",
                boxShadow: demoMode === "user" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                color: demoMode === "user" ? "var(--primary-600)" : "var(--text-secondary)",
                transition: "all 0.2s"
              }}
            >
              Continue as User
            </button>
            <button
              type="button"
              onClick={() => {
                setDemoMode("admin");
                setEmail("");
                setPassword("");
              }}
              style={{
                flex: 1,
                padding: "0.5rem",
                borderRadius: "calc(var(--border-radius) - 2px)",
                border: "none",
                cursor: "pointer",
                fontWeight: 600,
                backgroundColor: demoMode === "admin" ? "#ffffff" : "transparent",
                boxShadow: demoMode === "admin" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                color: demoMode === "admin" ? "var(--primary-600)" : "var(--text-secondary)",
                transition: "all 0.2s"
              }}
            >
              Continue as Admin
            </button>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-email">
              Email Address
            </label>
            <input
              type="email"
              id="login-email"
              className="form-input"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="off"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                id="login-password"
                className="form-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                style={{ paddingRight: "2.5rem" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-secondary)",
                  display: "flex",
                  alignItems: "center"
                }}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account? <Link to="/register">Create one</Link>
          <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border-color)" }}>
            {demoMode === "admin" ? (
              <Link to="/admin" className="btn btn-outline btn-sm" style={{ width: "100%", justifyContent: "center" }}>
                Explore Admin Dashboard (Guest Mode) →
              </Link>
            ) : (
              <Link to="/parking" className="btn btn-outline btn-sm" style={{ width: "100%", justifyContent: "center" }}>
                Explore Live Slots without Login →
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
