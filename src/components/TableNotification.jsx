import { useNavigate } from "react-router-dom";
import "../styles/TableRoom.css";

/**
 * Notification shown when a table has been ended by the creator.
 * Provides instructions and navigation back to the home page.
 */

const TableEndNotification = () => {
  const navigate = useNavigate();

  return (
    <div className="table-end-notification">
      <div className="notification-content">
        <h3>Table Ended</h3>
        <p>The table creator has ended this session.</p>
        <p>You will be redirected to the home page shortly.</p>
        <button onClick={() => navigate("/home")} className="redirect-button">
          Go to Home Page Now
        </button>
      </div>
    </div>
  );
};

export default TableEndNotification;
