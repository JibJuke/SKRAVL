import "../styles/Modal.css";
import "../styles/UserListContent.css";

/**
 * UserListContent Component
 *
 * Displays the list of users in a table.
 * Shows user avatars, names, and statuses.
 * Includes creator badge and status badges.
 *
 * @param {array} users - Array of user objects
 * @param {boolean} isLoading - Loading state indicator
 * @param {object} table - Table data including participation history
 */

const UserListContent = ({ users = [], isLoading = false, table }) => {
  // Show loading state
  if (isLoading) {
    return <p className="empty-state">Loading participants...</p>;
  }

  // Show empty state if no users
  if (!users || users.length === 0) {
    return <p className="empty-state">No participants found</p>;
  }

  // Get all participants from the table history
  const allParticipants = table?.participationHistory || [];

  // Create a map of user status from participation history
  const participantStatus = {};
  allParticipants.forEach((participant) => {
    participantStatus[participant.userId] = participant.status;
  });

  return (
    <div className="user-list">
      {users.map((user) => {
        const userId = user.uid || user.id;
        const status = participantStatus[userId] || "active";

        return (
          <div
            key={userId}
            className={`user-item ${user.isCreator ? "creator" : ""} ${status}`}
          >
            {/* User avatar/profile image */}
            <div className="user-avatar">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || "User"} />
              ) : (
                <div className="default-avatar">
                  {(user.displayName || "U").charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* User information */}
            <div className="user-info">
              <span className="user-name">
                {user.displayName || "Anonymous User"}
              </span>
              <div className="user-badges">
                {/* Creator badge */}
                {user.isCreator && (
                  <span className="creator-badge">Creator</span>
                )}
                {/* Status badge */}
                <span className={`status-badge ${status}`}>
                  {status === "active" ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default UserListContent;
