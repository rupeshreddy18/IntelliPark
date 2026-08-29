import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import ErrorMessage from "../../components/common/ErrorMessage";
import { formatDate } from "../../utils/helpers";

/**
 * ProfilePage — View and edit the user's profile.
 */
const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await updateProfile({ name });
      setSuccess("Profile updated successfully.");
      setEditing(false);
    } catch (err) {
      setError(err.message || "Failed to update profile.");
    } finally {
      setLoading(false);
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

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Profile</h1>
        <p>Manage your account information</p>
      </div>

      {success && <div className="alert alert-success">{success}</div>}
      <ErrorMessage message={error} />

      <div className="card profile-card">
        <div className="profile-avatar-large">{getInitials(user?.name)}</div>

        {editing ? (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="profile-name">
                Name
              </label>
              <input
                type="text"
                id="profile-name"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setEditing(false);
                  setName(user?.name || "");
                  setError("");
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="profile-info-item">
              <span className="profile-info-label">Name</span>
              <span className="profile-info-value">{user?.name}</span>
            </div>
            <div className="profile-info-item">
              <span className="profile-info-label">Email</span>
              <span className="profile-info-value">{user?.email}</span>
            </div>
            <div className="profile-info-item">
              <span className="profile-info-label">Role</span>
              <span
                className="profile-info-value"
                style={{ textTransform: "capitalize" }}
              >
                {user?.role}
              </span>
            </div>
            <div className="profile-info-item">
              <span className="profile-info-label">Member Since</span>
              <span className="profile-info-value">
                {formatDate(user?.createdAt)}
              </span>
            </div>

            <button
              className="btn btn-primary"
              onClick={() => setEditing(true)}
              style={{ marginTop: "1rem" }}
            >
              Edit Profile
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
