import { useState, useEffect } from "react";
import { adminAPI } from "../../services/api";
import Loading from "../../components/common/Loading";
import ErrorMessage from "../../components/common/ErrorMessage";
import { formatDate } from "../../utils/helpers";
import { useAuth } from "../../context/AuthContext";
import AdminGuestModal from "../../components/admin/AdminGuestModal";

/**
 * ManageUsersPage — Admin view of all registered users.
 */
const ManageUsersPage = () => {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await adminAPI.getUsers();
      setUsers(response.data.users);
    } catch (err) {
      setError(err.message || "Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading message="Loading users..." />;

  if (!isAdmin) {
    return (
      <div className="page-container">
        <AdminGuestModal 
          isOpen={true} 
          onClose={() => window.history.back()} 
          actionName="view registered user data" 
        />
        <div className="page-header">
          <h1>Manage Users</h1>
          <p>View all registered users</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Manage Users</h1>
        <p>View all registered users</p>
      </div>

      <ErrorMessage message={error} onRetry={fetchUsers} />

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Registered</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td
                  colSpan="4"
                  style={{ textAlign: "center", padding: "2rem" }}
                >
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user._id}>
                  <td style={{ fontWeight: 600 }}>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <span
                      className={`slot-status-badge ${user.role === "admin" ? "maintenance" : "available"}`}
                      style={{ textTransform: "capitalize" }}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td>{formatDate(user.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageUsersPage;
