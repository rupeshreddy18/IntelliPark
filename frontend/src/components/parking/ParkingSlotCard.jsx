import { SLOT_STATUS } from "../../utils/constants";

/**
 * ParkingSlotCard — Displays a single parking slot with its status.
 *
 * Visual rules:
 *   - AVAILABLE: Green border, "Book" button enabled
 *   - OCCUPIED: Red border, booking disabled
 *   - MAINTENANCE: Amber border, booking disabled
 *
 * Both text AND color are used for status (accessibility).
 */
const ParkingSlotCard = ({ slot, onBook, bookingDisabled = false }) => {
  const statusClass = slot.status.toLowerCase();
  const isBookable = slot.status === SLOT_STATUS.AVAILABLE && !bookingDisabled;

  return (
    <div className={`parking-slot-card ${statusClass}`}>
      <div className="slot-number">{slot.slotNumber}</div>
      <div className="slot-zone">Zone {slot.zone}</div>
      <div className={`slot-status-badge ${statusClass}`}>
        <span className={`slot-status-dot ${statusClass}`}></span>
        {slot.status}
      </div>
      {onBook && (
        <button
          className={`btn ${isBookable ? "btn-primary" : "btn-secondary"} btn-sm slot-book-btn`}
          onClick={() => onBook(slot)}
          disabled={!isBookable}
          aria-label={`Book parking slot ${slot.slotNumber}`}
        >
          {slot.status === SLOT_STATUS.AVAILABLE
            ? "Book Now"
            : slot.status === SLOT_STATUS.OCCUPIED
              ? "Occupied"
              : "Maintenance"}
        </button>
      )}
    </div>
  );
};

export default ParkingSlotCard;
