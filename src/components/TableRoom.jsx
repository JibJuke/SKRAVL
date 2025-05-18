import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useTableRoom } from "../hooks/useTableRoom";
import Loading from "./Loading";
import BottomNav from "./BottomNav";
import Modal from "./Modal";
import UserListContent from "./UserListContent";
import TableInfoContent from "./TableInfoContent";
import PromptForm from "./PromptForm";
import TableEndNotification from "./TableNotification";
import ConversationPrompt from "./ConversationPrompt";
import LeaveConfirmation from "./LeaveConfirmation";
import { FaSignOutAlt, FaTrash, FaSpinner, FaUsers } from "react-icons/fa";
import "../styles/TableRoom.css";

/**
 * TableRoom Component
 *
 * Main interface for users participating in a Skravl table session.
 * Displays table information, conversation prompts, and provides access to:
 * - Table participant list
 * - Table information
 * - Conversation prompt creation (for table creator)
 * - Leave/delete table functionality
 *
 * @param {object} initialTable - The initial table data
 * @param {boolean} isCreator - Whether the user is the creator
 * @returns {React.ReactNode}
 */

const TableRoom = () => {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const initialTable = location.state?.table;
  const isCreator = location.state?.isCreator;

  // Modal visibility states
  const [showTableInfo, setShowTableInfo] = useState(false);
  const [showUserList, setShowUserList] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [showLeaveConfirmation, setShowLeaveConfirmation] = useState(false);

  // Validate required state data
  if (!initialTable) {
    // If we don't have table data, redirect to home
    setTimeout(() => navigate("/home"), 100);
    return <Loading message="Missing table data. Redirecting to home..." />;
  }

  // Use the custom hook to manage table data and actions
  const {
    table,
    tableUsers,
    isLoading,
    error,
    showEndNotification,
    conversationPrompt,
    leaveTable,
    updateConversationPrompt,
    authReady,
  } = useTableRoom(initialTable, isCreator);

  /**
   * Updates the conversation prompt and closes the prompt modal
   * @param {string} promptText - The new conversation prompt text
   * @returns {boolean} Success status
   */
  const onSetPrompt = async (promptText) => {
    try {
      await updateConversationPrompt(promptText);
      setShowPromptModal(false);
      return true;
    } catch (err) {
      console.error("Error setting prompt:", err);
      return false;
    }
  };

  /**
   * Shows the leave confirmation modal before leaving the table
   */
  const handleLeaveClick = () => {
    setShowLeaveConfirmation(true);
  };

  /**
   * Handles confirmed table leave/delete action
   */
  const handleConfirmLeave = () => {
    leaveTable();
    setShowLeaveConfirmation(false);
  };

  // Show loading while auth is initializing or table is loading
  if (authLoading || isLoading || !table) {
    return <Loading message="Loading table data..." />;
  }

  // Calculate occupied seats
  const occupiedSeats = table.seats - table.availableSeats;

  return (
    <div className="table-room">
      {showEndNotification && <TableEndNotification />}

      <div className="table-room-top-row">
        <button
          className="corner-action-btn"
          onClick={handleLeaveClick}
          disabled={isLoading}
          aria-label={isCreator ? "Delete table" : "Leave table"}
        >
          {isLoading ? (
            <FaSpinner className="spin-icon" />
          ) : isCreator ? (
            <FaTrash />
          ) : (
            <FaSignOutAlt className="flip-icon" />
          )}
        </button>

        <div className="seat-info">
          <FaUsers className="icon" />
          <span>
            {occupiedSeats}/{table.seats}
          </span>
        </div>
      </div>

      <h1 className="table-title">{table.title}</h1>

      {conversationPrompt && <ConversationPrompt prompt={conversationPrompt} />}

      <BottomNav
        onUsersClick={() => {
          setShowUserList(true);
        }}
        onInfoClick={() => setShowTableInfo(true)}
        onPromptClick={() => setShowPromptModal(true)}
        isPromptEnabled={isCreator}
      />

      {/* Error Message */}
      {error && <div className="error-message">{error}</div>}

      {/* Modals */}
      <Modal
        isOpen={showUserList}
        onClose={() => setShowUserList(false)}
        title="Table Participants"
      >
        <UserListContent
          users={tableUsers}
          isLoading={!authReady}
          table={table}
        />
      </Modal>

      <Modal
        isOpen={showTableInfo}
        onClose={() => setShowTableInfo(false)}
        title="Table Information"
      >
        <TableInfoContent table={table} />
      </Modal>

      <Modal
        isOpen={showPromptModal}
        onClose={() => setShowPromptModal(false)}
        title="Set Conversation Prompt"
        closeButtonText="Cancel"
      >
        <PromptForm
          initialValue=""
          onSubmit={onSetPrompt}
          isLoading={isLoading}
        />
      </Modal>

      {/* Leave Confirmation Modal */}
      <Modal
        isOpen={showLeaveConfirmation}
        onClose={() => setShowLeaveConfirmation(false)}
        title={isCreator ? "Confirm Delete" : "Confirm Leave"}
        showCloseButton={false}
        preventBackdropClose={true}
      >
        <LeaveConfirmation
          isCreator={isCreator}
          onConfirm={handleConfirmLeave}
          onCancel={() => setShowLeaveConfirmation(false)}
        />
      </Modal>
    </div>
  );
};

export default TableRoom;
