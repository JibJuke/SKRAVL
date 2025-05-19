import { FaSignOutAlt, FaTrash, FaDoorOpen, FaUndoAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { updateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { db } from "../firebaseConfig";
import { useEffect } from "react";
import "../styles/Profile.css";
import { leaveTable } from "../utils/tableOperations";
import { formatDate } from "../utils/formatters";

/**
 * Profile Component
 *
 * User profile page that displays user information, current table status,
 * table participation history, and account management options.
 *
 * Features:
 * - User stats display (tables joined, user level, tables created)
 * - Current table section with rejoin/leave functionality
 * - Participation history section
 * - Account management (logout, account deletion)
 * - UI for email/password updating (functionality not fully implemented yet)
 */

const Profile = () => {
  const { user, logout, deleteAccount } = useAuth();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [leavingTable, setLeavingTable] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const [isPasswordEditable, setIsPasswordEditable] = useState(false);
  const [isEmailEditable, setIsEmailEditable] = useState(false);
  const [email, setEmail] = useState("");
  const [oldEmail, setOldEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState(""); // for reauth

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [password, setPassword] = useState("******");

  // Fetch user data from Firestore when component mounts
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (user) {
          const userRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userRef);

          if (userDoc.exists()) {
            setUserData(userDoc.data());
            setEmail(user?.email || "");
          }
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  // Handles user logout and redirects to auth page
  const handleLogout = async () => {
    try {
      await logout();
      navigate("/auth");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  // Handles account deletion and redirects to landing page
  const handleDeleteAccount = async () => {
    try {
      await deleteAccount();
      navigate("/landing");
    } catch (error) {
      console.error("Error deleting account:", error);
    }
  };

  /**
   * Handles leaving the current table
   * Updates both Firestore and local state
   */
  const handleLeaveTable = async () => {
    if (!userData?.currentTable) return;

    setLeavingTable(true);
    try {
      // Use the centralized utility function
      await leaveTable(
        user.uid,
        userData.currentTable,
        userData.currentTable.isCreator,
        "Left from profile page"
      );

      // Update local state
      setUserData({
        ...userData,
        currentTable: null,
        tableHistory: [
          ...(userData.tableHistory || []),
          {
            id: userData.currentTable.id,
            title: userData.currentTable.title,
            locationId: userData.currentTable.locationId,
            locationName: userData.currentTable.locationName || "",
            date: new Date(),
            role: userData.currentTable.isCreator ? "creator" : "participant",
          },
        ],
      });
    } catch (error) {
      console.error("Error leaving table:", error);
    } finally {
      setLeavingTable(false);
    }
  };

  /**
   * Handles rejoining the current table
   * Fetches latest table data and navigates to table room
   */
  const handleRejoinTable = async () => {
    if (!userData?.currentTable) return;

    try {
      // Verify we have location ID
      if (!userData.currentTable.locationId) {
        throw new Error("Missing location information for this table");
      }

      // Fetch the latest table data to ensure we have up-to-date information
      const tableRef = doc(
        db,
        `locations/${userData.currentTable.locationId}/tables`,
        userData.currentTable.id
      );

      const tableDoc = await getDoc(tableRef);

      // Handle case when table no longer exists
      if (!tableDoc.exists()) {
        alert("This table no longer exists");

        // Update user document to clear the non-existent table
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, { currentTable: null });

        // Update local state
        setUserData({
          ...userData,
          currentTable: null,
        });

        return;
      }

      const tableData = tableDoc.data();

      // Handle case when table is no longer active
      if (tableData.status !== "active") {
        alert("This table is no longer active");

        // Update user document to clear the inactive table
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          currentTable: null,
          tableHistory: arrayUnion({
            id: userData.currentTable.id,
            title: userData.currentTable.title,
            locationId: userData.currentTable.locationId,
            locationName: userData.currentTable.locationName || "",
            date: new Date(),
          }),
        });

        // Update local state
        setUserData({
          ...userData,
          currentTable: null,
          tableHistory: [
            ...(userData.tableHistory || []),
            {
              id: userData.currentTable.id,
              title: userData.currentTable.title,
              locationId: userData.currentTable.locationId,
              locationName: userData.currentTable.locationName || "",
              date: new Date(),
            },
          ],
        });

        return;
      }

      // Fetch location data to include in the table
      const locationRef = doc(
        db,
        "locations",
        userData.currentTable.locationId
      );
      const locationDoc = await getDoc(locationRef);

      let locationData = {
        id: userData.currentTable.locationId,
        name: userData.currentTable.locationName || "",
      };

      if (locationDoc.exists()) {
        locationData = {
          ...locationDoc.data(),
          id: userData.currentTable.locationId,
        };
      }

      // Navigate to the table room with complete data
      navigate("/table-room", {
        state: {
          table: {
            ...tableData,
            id: userData.currentTable.id,
            locationId: userData.currentTable.locationId,
            locationName: userData.currentTable.locationName,
            location: locationData,
          },
          isCreator: userData.currentTable.isCreator,
        },
      });
    } catch (err) {
      console.error("Error rejoining table:", err);
      alert(err.message || "Error rejoining table");
    }
  };

  // UI state handlers for email/password editing
  const handleEmailChange = async () => {
    try {
      if (!oldEmail || !newEmail || !emailPassword) {
        alert("Please fill in all fields.");
        return;
      }

      if (user.email !== oldEmail) {
        alert("Old email does not match your current email.");
        return;
      }

      const credential = EmailAuthProvider.credential(oldEmail, emailPassword);
      await reauthenticateWithCredential(user, credential);
      await updateEmail(user, newEmail);

      alert("Email updated successfully!");
      setEmail(newEmail);
      setOldEmail("");
      setNewEmail("");
      setEmailPassword("");
      setIsEmailEditable(false);
    } catch (error) {
      console.error("Error updating email:", error);
      if (error.code === "auth/wrong-password") {
        alert("Password is incorrect.");
      } else {
        alert(error.message);
      }
    }
  };


  const handlePasswordChange = async () => {
    try {
      if (!currentPassword || !newPassword) {
        alert("Please fill in both fields.");
        return;
      }

      const credential = EmailAuthProvider.credential(user.email, currentPassword);

      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);

      alert("Password updated successfully!");
      setIsPasswordEditable(false);
      setCurrentPassword("");
      setNewPassword("");

    } catch (error) {
      console.error("Error updating password:", error);
      if (error.code === 'auth/wrong-password') {
        alert('The old password is incorrect.');
      } else {
        alert(error.message);
      }
    }
  };


  if (loading) {
    return <div className="profile">Loading...</div>;
  }

  return (
    <div className="profile">
      <div className="container">
        {/* Profile header with user info */}
        <div className="profile-card">
          <div className="profile-header">
            <img
              src="/Skravl-Logo-Icon.svg"
              alt="Logo"
              className="profile-icon"
            />
            <div>
              <h1>{user?.displayName || "Bruker"}</h1>
              <p className="join-date">
                Joined:{" "}
                {user?.metadata?.creationTime
                  ? new Date(user.metadata.creationTime).toLocaleDateString()
                  : "Unknown"}
              </p>
            </div>
          </div>
          {/* User statistics */}
          <div className="profile-details">
            <div className="tables-joined profile-details-item">
              <p>{userData?.tablesJoined || 0}</p>
              <h5>
                Tables <br /> Joined
              </h5>
            </div>
            <div className="user-level profile-details-item">
              <p>{userData?.userLevel || 1}</p>
              <h5>Level</h5>
            </div>
            <div className="tables-created profile-details-item">
              <p>{userData?.tablesCreated || 0}</p>
              <h5>
                Tables <br /> Created
              </h5>
            </div>
          </div>
        </div>

        {/* Current table section with rejoin/leave options */}
        {userData?.currentTable && (
          <div className="current-table-card">
            <h2>Current Table</h2>
            <div className="current-table">
              <div className="table-info">
                <span className="table-title">
                  {userData.currentTable.title || userData.currentTable.id}
                </span>
                <div className="location-container">
                  <span className="table-location">
                    {userData.currentTable.locationName || "Unknown location"}
                  </span>
                </div>
              </div>
              <div className="table-actions">
                <button
                  className="action-button rejoin-button"
                  onClick={handleRejoinTable}
                >
                  <FaUndoAlt /> Rejoin Table
                </button>
                <button
                  className="action-button leave-button"
                  onClick={handleLeaveTable}
                  disabled={leavingTable}
                >
                  <FaDoorOpen /> {leavingTable ? "Leaving..." : "Leave Table"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Participation history */}
        <div className="history-card">
          <h2>Participation History</h2>
          {userData?.tableHistory && userData.tableHistory.length > 0 ? (
            <ul className="history-list">
              {userData.tableHistory.map((table, index) => (
                <li key={index}>
                  <span className="history-title">
                    {table.title || table.id}
                  </span>
                  <span className="history-date">
                    {formatDate(table.date, "Unknown date")}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="no-history">No table participation history yet.</p>
          )}
        </div>

        {/* Account management section (email/password)*/}
        <div className="profile-login">
          <div className="profile-login-item">
            {isEmailEditable ? (
              <div className="edit-fields">
                <input
                  type="email"
                  placeholder="Old Email"
                  value={oldEmail}
                  onChange={(e) => setOldEmail(e.target.value)}
                  className="profile-input"
                />
                <input
                  type="email"
                  placeholder="New Email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="profile-input"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={emailPassword}
                  onChange={(e) => setEmailPassword(e.target.value)}
                  className="profile-input"
                />
              </div>
            ) : (
              <p>{user?.email}</p>
            )}

            <div className={`button-row ${isEmailEditable ? "show" : ""}`}>
              <button
                className="change-button"
                onClick={isEmailEditable ? handleEmailChange : () => setIsEmailEditable(true)}
              >
                {isEmailEditable ? "Save Email" : "Change Email"}
              </button>
              {isEmailEditable && (
                <button
                  className="cancel-button"
                  onClick={() => {
                    setIsEmailEditable(false);
                    setOldEmail("");
                    setNewEmail("");
                    setEmailPassword("");
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </div>


          <div className="profile-login-item">
            {isPasswordEditable ? (
              <div className="edit-fields">
                <input
                  type="password"
                  placeholder="Old Password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="profile-input"
                />
                <input
                  type="password"
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="profile-input"
                />
              </div>
            ) : (
              "******"
            )}

            <div className={`button-row ${isPasswordEditable ? "show" : ""}`}>
              <button
                className="change-button"
                onClick={isPasswordEditable ? handlePasswordChange : () => setIsPasswordEditable(true)}
              >
                {isPasswordEditable ? "Save Password" : "Change Password"}
              </button>
              {isPasswordEditable && (
                <button
                  className="cancel-button"
                  onClick={() => {
                    setIsPasswordEditable(false);
                    setCurrentPassword("");
                    setNewPassword("");
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </div>


        </div>

        {/* Account actions (logout/delete) */}
        <div className="profile-actions">
          <button
            className="action-button logout-button"
            onClick={handleLogout}
          >
            <FaSignOutAlt /> Sign Out
          </button>

          {!showConfirmDelete ? (
            <button
              className="action-button delete-button"
              onClick={() => setShowConfirmDelete(true)}
            >
              <FaTrash /> Delete Account
            </button>
          ) : (
            <div className="confirm-delete">
              <p>Are you sure you want to delete your account?</p>
              <button
                onClick={handleDeleteAccount}
                className="confirm-delete-button action-button"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="cancel-delete-button action-button"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
