import { FaUsers, FaInfoCircle, FaPlus } from "react-icons/fa";
import "../styles/BottomNav.css";

/**
 * BottomNav Component
 *
 * Mobile-friendly bottom navigation bar used in the TableRoom view.
 * Provides quick access to Users list, Table Info, and Conversation Prompt creation.
 * The Prompt button is only enabled for table creators.
 *
 * @param {function} onUsersClick - Handler for Users button click
 * @param {function} onInfoClick - Handler for Info button click
 * @param {function} onPromptClick - Handler for Prompt button click
 * @param {boolean} isPromptEnabled - Whether the prompt button is enabled
 * @param {string|null} activeItem - Currently active item ('users', 'info', or null)
 */

const BottomNav = ({
  onUsersClick = () => {},
  onInfoClick = () => {},
  onPromptClick,
  isPromptEnabled = true,
  activeItem = null,
}) => {
  return (
    <div className="bottom-nav">
      {/* Users button */}
      <div
        className={`nav-item ${activeItem === "users" ? "active" : ""}`}
        onClick={onUsersClick}
      >
        <FaUsers className="nav-icon" />
        <span>Users</span>
      </div>

      {/* Conversation prompt button (only enabled for table creator) */}
      <div
        className={`nav-item prompt-button ${
          !isPromptEnabled ? "disabled" : ""
        }`}
        onClick={() => {
          if (isPromptEnabled && onPromptClick) onPromptClick();
        }}
      >
        <div className="plus-circle">
          <FaPlus className="plus-icon" />
        </div>
      </div>

      {/* Table info button */}
      <div
        className={`nav-item ${activeItem === "info" ? "active" : ""}`}
        onClick={onInfoClick}
      >
        <FaInfoCircle className="nav-icon" />
        <span>Info</span>
      </div>
    </div>
  );
};

export default BottomNav;
