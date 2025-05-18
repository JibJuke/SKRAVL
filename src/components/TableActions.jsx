import { FaTrash, FaSignOutAlt } from "react-icons/fa";
import "../styles/TableRoom.css";

/**
 * Button component for table leave/delete actions.
 * Shows different text and icons based on the user's role (creator vs participant).
 */

const TableActions = ({ isCreator, isLoading, onLeave }) => {
  return (
    <button
      className={`${isCreator ? "delete-btn" : "leave-btn"}`}
      onClick={onLeave}
      disabled={isLoading}
    >
      {isCreator ? (
        <>
          <FaTrash className="icon" />
          {isLoading ? "Deleting..." : "Delete Table"}
        </>
      ) : (
        <>
          <FaSignOutAlt className="icon" />
          {isLoading ? "Leaving..." : "Leave Table"}
        </>
      )}
    </button>
  );
};

export default TableActions;
