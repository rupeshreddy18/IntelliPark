import React from "react";
import { FiX, FiLock } from "react-icons/fi";

/**
 * AdminGuestModal — Prevents guests from performing admin actions.
 */
const AdminGuestModal = ({ isOpen, onClose, actionName = "perform this action" }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{ textAlign: "center", maxWidth: "400px" }}
      >
        <div className="modal-header" style={{ justifyContent: "flex-end", marginBottom: "0.5rem" }}>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <FiX />
          </button>
        </div>

        <div style={{ fontSize: "2.5rem", marginBottom: "1rem", color: "var(--warning)" }}>
          <FiLock />
        </div>
        
        <h2 style={{ marginBottom: "0.5rem" }}>Admin Access Required</h2>
        
        <p style={{ color: "var(--text-secondary)", fontSize: "var(--font-size-sm)", marginBottom: "1.5rem" }}>
          You are currently viewing the Admin Dashboard in <strong>Guest Mode</strong>. 
          To {actionName}, please log in with the administrator credentials.
        </p>

        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
          <button className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              window.location.href = "/login";
            }}
          >
            Sign In as Admin
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminGuestModal;
