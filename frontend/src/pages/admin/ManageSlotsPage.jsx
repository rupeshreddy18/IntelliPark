import { useState, useEffect } from "react";
import { parkingAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import Loading from "../../components/common/Loading";
import ErrorMessage from "../../components/common/ErrorMessage";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import AdminGuestModal from "../../components/admin/AdminGuestModal";
import { FiPlus, FiEdit2, FiTrash2, FiX } from "react-icons/fi";
import { SLOT_STATUS } from "../../utils/constants";

/**
 * ManageSlotsPage — Admin CRUD for parking slots.
 */
const ManageSlotsPage = () => {
  const { isAdmin } = useAuth();
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Guest Protection
  const [guestAction, setGuestAction] = useState("");
  const [showGuestModal, setShowGuestModal] = useState(false);

  const requireAdmin = (action) => {
    if (!isAdmin) {
      setGuestAction(action);
      setShowGuestModal(true);
      return false;
    }
    return true;
  };

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [formData, setFormData] = useState({
    slotNumber: "",
    zone: "",
    status: "AVAILABLE",
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  // Delete confirmation
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

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

  const openAddForm = () => {
    if (!requireAdmin("add new parking slots")) return;
    setEditingSlot(null);
    setFormData({ slotNumber: "", zone: "", status: "AVAILABLE" });
    setFormError("");
    setShowForm(true);
  };

  const openEditForm = (slot) => {
    if (!requireAdmin("edit parking slots")) return;
    setEditingSlot(slot);
    setFormData({
      slotNumber: slot.slotNumber,
      zone: slot.zone,
      status: slot.status,
    });
    setFormError("");
    setShowForm(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");
    setSuccess("");

    try {
      if (editingSlot) {
        await parkingAPI.update(editingSlot._id, formData);
        setSuccess(`Slot ${formData.slotNumber} updated successfully.`);
      } else {
        await parkingAPI.create(formData);
        setSuccess(`Slot ${formData.slotNumber} created successfully.`);
      }
      setShowForm(false);
      await fetchSlots();
    } catch (err) {
      setFormError(err.message || "Operation failed.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    setError("");
    setSuccess("");
    try {
      await parkingAPI.delete(deleteId);
      setSuccess("Slot deleted successfully.");
      setDeleteId(null);
      await fetchSlots();
    } catch (err) {
      setError(err.message || "Failed to delete slot.");
      setDeleteId(null);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <Loading message="Loading parking slots..." />;

  return (
    <div className="page-container">
      <AdminGuestModal 
        isOpen={showGuestModal} 
        onClose={() => setShowGuestModal(false)} 
        actionName={guestAction} 
      />

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
          <h1>Manage Slots</h1>
          <p>Add, edit, and manage parking slots</p>
        </div>
        <button className="btn btn-primary" onClick={openAddForm}>
          <FiPlus /> Add Slot
        </button>
      </div>

      {success && <div className="alert alert-success">{success}</div>}
      <ErrorMessage message={error} />

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingSlot ? "Edit Slot" : "Add New Slot"}</h2>
              <button
                className="modal-close"
                onClick={() => setShowForm(false)}
                aria-label="Close"
              >
                <FiX />
              </button>
            </div>

            {formError && <div className="alert alert-error">{formError}</div>}

            <form onSubmit={handleFormSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="slot-number">
                  Slot Number
                </label>
                <input
                  type="text"
                  id="slot-number"
                  className="form-input"
                  placeholder="e.g., A1, B2"
                  value={formData.slotNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, slotNumber: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="slot-zone">
                  Zone
                </label>
                <input
                  type="text"
                  id="slot-zone"
                  className="form-input"
                  placeholder="e.g., A, B, C"
                  value={formData.zone}
                  onChange={(e) =>
                    setFormData({ ...formData, zone: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="slot-status">
                  Status
                </label>
                <select
                  id="slot-status"
                  className="form-select"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                >
                  <option value="AVAILABLE">Available</option>
                  <option value="OCCUPIED">Occupied</option>
                  <option value="MAINTENANCE">Maintenance</option>
                </select>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowForm(false)}
                  disabled={formLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={formLoading}
                >
                  {formLoading
                    ? "Saving..."
                    : editingSlot
                      ? "Update Slot"
                      : "Create Slot"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slots Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Slot Number</th>
              <th>Zone</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {slots.length === 0 ? (
              <tr>
                <td
                  colSpan="4"
                  style={{ textAlign: "center", padding: "2rem" }}
                >
                  No parking slots found. Click "Add Slot" to create one.
                </td>
              </tr>
            ) : (
              slots.map((slot) => (
                <tr key={slot._id}>
                  <td style={{ fontWeight: 600 }}>{slot.slotNumber}</td>
                  <td>Zone {slot.zone}</td>
                  <td>
                    <span
                      className={`slot-status-badge ${slot.status.toLowerCase()}`}
                    >
                      <span
                        className={`slot-status-dot ${slot.status.toLowerCase()}`}
                      ></span>
                      {slot.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => openEditForm(slot)}
                        aria-label={`Edit slot ${slot.slotNumber}`}
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => {
                          if (requireAdmin("delete parking slots")) {
                            setDeleteId(slot._id);
                          }
                        }}
                        aria-label={`Delete slot ${slot.slotNumber}`}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteId}
        title="Delete Parking Slot?"
        message="This will permanently remove the slot. Slots with active bookings cannot be deleted."
        confirmText="Delete Slot"
        variant="danger"
        onConfirm={handleDelete}
        onClose={() => setDeleteId(null)}
        loading={deleting}
      />
    </div>
  );
};

export default ManageSlotsPage;
