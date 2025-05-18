import { useNavigate } from "react-router-dom";
import "../styles/TableRoom.css";

/**
 * Notification shown when a user tries to create a table while already in one.
 * Provides a shortcut to the profile page where they can leave their current table.
 */

const TableRestrictionNotification = ({ onClose }) => {
  const navigate = useNavigate();

  const handleNavigateToProfile = () => {
    navigate("/profile");
    if (onClose) onClose();
  };

  return (
    <div className="table-end-notification">
      <div className="notification-content">
        <h3>Already in a Table</h3>
        <p>You are already participating in another table.</p>
        <p>You must leave your current table before creating a new one.</p>
        <div className="notification-actions">
          <button onClick={handleNavigateToProfile} className="redirect-button">
            Go to Profile to Leave Table
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="cancel-button"
              style={{ marginTop: "10px" }}
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TableRestrictionNotification;
