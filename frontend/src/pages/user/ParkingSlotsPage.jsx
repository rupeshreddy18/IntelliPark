import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { parkingAPI, bookingAPI } from "../../services/api";
import ParkingSlotCard from "../../components/parking/ParkingSlotCard";
import BookingModal from "../../components/parking/BookingModal";
import Loading from "../../components/common/Loading";
import ErrorMessage from "../../components/common/ErrorMessage";
import { FiRefreshCw, FiCheckCircle, FiXCircle, FiTool, FiLogIn, FiX } from "react-icons/fi";
import { SLOT_STATUS } from "../../utils/constants";

/**
 * ParkingSlotsPage — Browse all parking slots and book available ones.
 *
 * Features:
 *   - Accessible to both guests and logged-in users
 *   - Zone filter with "All Zones" first, then Zones A, B, C, D
 *   - Live counters showing how many slots are left (available)
 *   - Color-coded slot cards
 *   - Guest prompt when attempting to book without login
 */
const ParkingSlotsPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedZone, setSelectedZone] = useState("ALL");
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    fetchSlots();
  }, []);

  const fetchSlots = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await parkingAPI.getAll();
      setSlots(response.data.slots);
    } catch (err) {
      setError(err.message || "Failed to load parking slots.");
    } finally {
      setLoading(false);
    }
  };

  const handleBookSlot = (slot) => {
    if (!isAuthenticated) {
      setSelectedSlot(slot);
      setShowGuestModal(true);
      return;
    }
    setSelectedSlot(slot);
    setSuccessMessage("");
    setError("");
  };

  const handleBookingSubmit = async (bookingData) => {
    setBookingLoading(true);
    setError("");
    try {
      await bookingAPI.create(bookingData);
      setSelectedSlot(null);
      setSuccessMessage("Booking confirmed! View it in My Bookings.");
      await fetchSlots();
    } catch (err) {
      setError(err.message || "Booking failed. Please try again.");
      setSelectedSlot(null);
    } finally {
      setBookingLoading(false);
    }
  };

  // Ensure "ALL" is always first, then sort remaining zones alphabetically
  const uniqueZones = [...new Set(slots.map((s) => s.zone))].sort();
  const zones = ["ALL", ...uniqueZones];

  // Calculate live slot counts
  const totalSlots = slots.length;
  const totalAvailable = slots.filter((s) => s.status === SLOT_STATUS.AVAILABLE).length;
  const totalOccupied = slots.filter((s) => s.status === SLOT_STATUS.OCCUPIED).length;
  const totalMaintenance = slots.filter((s) => s.status === SLOT_STATUS.MAINTENANCE).length;

  // Filter slots by selected zone
  const filteredSlots =
    selectedZone === "ALL"
      ? slots
      : slots.filter((s) => s.zone === selectedZone);

  // Helper to count available slots for a specific zone
  const getZoneAvailableCount = (zone) => {
    if (zone === "ALL") return totalAvailable;
    return slots.filter((s) => s.zone === zone && s.status === SLOT_STATUS.AVAILABLE).length;
  };

  if (loading) return <Loading message="Loading parking slots..." />;

  return (
    <div className="page-container">
      <div
        className="page-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <h1>Live Parking Slots</h1>
          <p>Real-time slot availability & reservation</p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={fetchSlots}
          aria-label="Refresh slot availability"
        >
          <FiRefreshCw /> Refresh
        </button>
      </div>

      {successMessage && (
        <div className="alert alert-success">{successMessage}</div>
      )}
      <ErrorMessage message={error} onRetry={fetchSlots} />

      {/* Real-Time Availability Stats Banner */}
      <div
        className="card"
        style={{
          marginBottom: "1.5rem",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div>
            <div style={{ fontSize: "var(--font-size-xs)", textTransform: "uppercase", letterSpacing: "1px", color: "var(--primary-400)", fontWeight: 700 }}>
              Live Availability
            </div>
            <div style={{ fontSize: "var(--font-size-2xl)", fontWeight: 800, color: "var(--text-primary)", marginTop: "0.25rem" }}>
              <span style={{ color: "var(--status-available)" }}>{totalAvailable}</span> / {totalSlots} Slots Available Left
            </div>
          </div>

          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "var(--font-size-sm)", fontWeight: 600 }}>
              <span className="slot-status-dot available"></span>
              <span>{totalAvailable} Available</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "var(--font-size-sm)", fontWeight: 600 }}>
              <span className="slot-status-dot occupied"></span>
              <span>{totalOccupied} Occupied</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "var(--font-size-sm)", fontWeight: 600 }}>
              <span className="slot-status-dot maintenance"></span>
              <span>{totalMaintenance} Maintenance</span>
            </div>
          </div>
        </div>
      </div>

      {/* Zone Filter with 'All Zones' First & Slot Counters */}
      <div className="zone-filter">
        {zones.map((zone) => {
          const availableCount = getZoneAvailableCount(zone);
          return (
            <button
              key={zone}
              className={`zone-filter-btn ${selectedZone === zone ? "active" : ""}`}
              onClick={() => setSelectedZone(zone)}
            >
              {zone === "ALL" ? "All Zones" : `Zone ${zone}`}
              <span
                style={{
                  marginLeft: "0.5rem",
                  padding: "0.15rem 0.45rem",
                  borderRadius: "999px",
                  fontSize: "0.75rem",
                  background: selectedZone === zone ? "rgba(255,255,255,0.25)" : "var(--gray-200)",
                  color: selectedZone === zone ? "#ffffff" : "var(--text-secondary)",
                }}
              >
                {availableCount} left
              </span>
            </button>
          );
        })}
      </div>

      {/* Slots Grid */}
      {filteredSlots.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🅿️</div>
          <h3>No Slots Found</h3>
          <p>No parking slots available in this zone.</p>
        </div>
      ) : (
        <div className="parking-grid">
          {filteredSlots.map((slot) => (
            <ParkingSlotCard
              key={slot._id}
              slot={slot}
              onBook={handleBookSlot}
            />
          ))}
        </div>
      )}

      {/* Logged-In User Booking Modal */}
      {selectedSlot && isAuthenticated && (
        <BookingModal
          slot={selectedSlot}
          onSubmit={handleBookingSubmit}
          onClose={() => setSelectedSlot(null)}
          loading={bookingLoading}
        />
      )}

      {/* Guest Sign-In Prompt Modal */}
      {selectedSlot && !isAuthenticated && showGuestModal && (
        <div className="modal-overlay" onClick={() => setShowGuestModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ textAlign: "center" }}>
            <div className="modal-header" style={{ justifyContent: "flex-end", marginBottom: "0.5rem" }}>
              <button className="modal-close" onClick={() => setShowGuestModal(false)} aria-label="Close">
                <FiX />
              </button>
            </div>

            <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🅿️</div>
            <h2 style={{ marginBottom: "0.5rem" }}>Sign in to Book Slot {selectedSlot.slotNumber}</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "var(--font-size-sm)", marginBottom: "1.5rem" }}>
              You are currently viewing in guest mode. Please sign in or create a free account to reserve parking slots.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <button
                className="btn btn-primary btn-lg"
                onClick={() => navigate("/login")}
                style={{ justifyContent: "center" }}
              >
                <FiLogIn /> Sign In to Continue
              </button>
              <button
                className="btn btn-outline"
                onClick={() => navigate("/register")}
                style={{ justifyContent: "center" }}
              >
                Create an Account
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setShowGuestModal(false)}
                style={{ marginTop: "0.5rem" }}
              >
                Continue Browsing as Guest
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParkingSlotsPage;
