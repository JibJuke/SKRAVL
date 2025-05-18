import "../styles/TableRoom.css";

/**
 * Confirmation dialog for leaving or deleting a table.
 * Shows different messaging based on whether the user is the creator or a participant.
 */

const LeaveConfirmation = ({ isCreator, onConfirm, onCancel }) => {
  return (
    <div className="leave-confirmation">
      <h3>{isCreator ? "Delete Table" : "Leave Table"}</h3>
      <p>
        {isCreator
          ? "Are you sure you want to delete this table? This will end the session for all participants."
          : "Are you sure you want to leave this table?"}
      </p>
      <div className="confirmation-actions">
        <button className="cancel-button" onClick={onCancel}>
          Cancel
        </button>
        <button className="confirm-button" onClick={onConfirm}>
          {isCreator ? "Delete" : "Leave"}
        </button>
      </div>
    </div>
  );
};

export default LeaveConfirmation;
