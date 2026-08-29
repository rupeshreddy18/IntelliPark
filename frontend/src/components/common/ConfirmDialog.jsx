import { FiAlertTriangle } from "react-icons/fi";

/**
 * ConfirmDialog — Modal dialog for confirming destructive actions.
 *
 * Usage:
 *   <ConfirmDialog
 *     isOpen={showConfirm}
 *     title="Cancel Booking?"
 *     message="This action cannot be undone."
 *     confirmText="Yes, Cancel"
 *     onConfirm={handleCancel}
 *     onClose={() => setShowConfirm(false)}
 *     loading={cancelling}
 *   />
 */
const ConfirmDialog = ({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onClose,
  loading = false,
  variant = "warning", // 'warning' or 'danger'
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-dialog">
          <div className={`confirm-dialog-icon ${variant}`}>
            <FiAlertTriangle />
          </div>
          <h3>{title}</h3>
          <p>{message}</p>
          <div className="confirm-dialog-actions">
            <button
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              {cancelText}
            </button>
            <button
              className={`btn ${variant === "danger" ? "btn-danger" : "btn-primary"}`}
              onClick={onConfirm}
              disabled={loading}
            >
              {loading ? "Processing..." : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
