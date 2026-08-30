/**
 * Centralized API Service
 *
 * All HTTP requests go through this single axios instance.
 * This ensures consistent:
 *   - Base URL configuration
 *   - Credentials (cookies) sent with every request
 *   - Error handling
 *   - No duplicate fetch/axios code in components
 *
 * In development: Vite proxy sends /api requests to localhost:5000
 * In production: VITE_API_URL points to the deployed backend
 */
import axios from "axios";

// We intentionally omit VITE_API_URL here.
// By setting baseURL to '/api', we force all requests to go through
// the local reverse proxy (Vite in development, Vercel in production).
// This ensures the browser treats requests as SAME-ORIGIN, preventing
// strict 3rd-party cookie blocking policies (Safari, Brave, Incognito) 
// from dropping the authentication token.
const api = axios.create({
  baseURL: "/api",
  withCredentials: true, // Send cookies with every request
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Response interceptor: Handle common errors globally.
 *
 * If a 401 (Unauthenticated) response comes back, the user's
 * session has expired. We could redirect to login here, but
 * we handle it in the AuthContext instead for better UX.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Extract the error message from the backend response
    const message =
      error.response?.data?.message ||
      error.message ||
      "An unexpected error occurred";

    // Create a cleaner error object
    const enhancedError = new Error(message);
    enhancedError.status = error.response?.status;
    enhancedError.originalError = error;

    return Promise.reject(enhancedError);
  },
);

// ========================================
// AUTH API
// ========================================

export const authAPI = {
  register: (data) => api.post("/users/register", data),
  login: (data) => api.post("/users/login", data),
  logout: () => api.post("/users/logout"),
  getMe: () => api.get("/users/me"),
  updateMe: (data) => api.put("/users/me", data),
};

// ========================================
// PARKING API
// ========================================

export const parkingAPI = {
  getAll: () => api.get("/parking"),
  getOne: (id) => api.get(`/parking/${id}`),
  create: (data) => api.post("/parking", data),
  update: (id, data) => api.put(`/parking/${id}`, data),
  delete: (id) => api.delete(`/parking/${id}`),
};

// ========================================
// BOOKING API
// ========================================

export const bookingAPI = {
  create: (data) => api.post("/bookings", data),
  getMyBookings: () => api.get("/bookings/my"),
  getOne: (id) => api.get(`/bookings/${id}`),
  cancel: (id) => api.put(`/bookings/${id}/cancel`),
  getBookedTimesForSlot: (slotId, date) => api.get(`/bookings/slot/${slotId}?date=${date}`),
};

// ========================================
// ADMIN API
// ========================================

export const adminAPI = {
  getStats: () => api.get("/admin/stats"),
  getUsers: () => api.get("/admin/users"),
  getBookings: () => api.get("/admin/bookings"),
  completeBooking: (id) => api.put(`/admin/bookings/${id}/complete`),
  cancelBooking: (id) => api.put(`/admin/bookings/${id}/cancel`),
};

export default api;
