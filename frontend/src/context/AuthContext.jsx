import { createContext, useState, useEffect, useContext } from "react";
import { authAPI } from "../services/api";

/**
 * Auth Context
 *
 * Provides authentication state to the entire React app.
 *
 * How it works:
 *   1. On app load, calls GET /api/users/me to check if the cookie is valid
 *   2. If valid → sets user state (logged in)
 *   3. If 401 → no user (not logged in)
 *   4. Provides login/register/logout functions to any component
 *
 * This is React Context, which is like a global state container.
 * Any component wrapped in <AuthProvider> can access the auth state
 * without prop drilling.
 */

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true until initial auth check completes

  // Check authentication status on app load
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await authAPI.getMe();
      setUser(response.data.user);
    } catch (error) {
      // 401 means not authenticated — this is expected, not an error
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await authAPI.login({ email, password });
    setUser(response.data.user);
    return response.data;
  };

  const register = async (name, email, password) => {
    const response = await authAPI.register({ name, email, password });
    setUser(response.data.user);
    return response.data;
  };

  const logout = async () => {
    await authAPI.logout();
    setUser(null);
  };

  const updateProfile = async (data) => {
    const response = await authAPI.updateMe(data);
    setUser(response.data.user);
    return response.data;
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Custom hook to access auth context.
 * Usage: const { user, login, logout } = useAuth();
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
