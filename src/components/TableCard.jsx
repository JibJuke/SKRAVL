import { useState } from "react";
import { FaUsers } from "react-icons/fa";
import TableModal from "./TableModal";
import Loading from "./Loading";
import { useTableJoins } from "../hooks/useTableJoins";
import "../styles/TableCard.css";

/**
 * TableCard Component
 *
 * Card component for displaying a single table.
 * Shows table title, description, seating information, and zone badge.
 * Provides a view button to open the table details modal.
 *
 * @param {object} table - Table data to display
 */

const TableCard = ({ table }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { joinTable, isLoading, error } = useTableJoins();

  // Calculate occupied seats
  const occupiedSeats = table.seats - table.availableSeats;

  /**
   * Opens the table details modal
   */
  const handleViewClick = () => {
    setIsModalOpen(true);
  };

  /**
   * Closes the table details modal
   */
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  /**
   * Handles joining the table
   */
  const handleJoinTable = async () => {
    try {
      await joinTable(table);
    } catch (err) {
      console.error("Error joining table:", err);
      alert(err.message || "Failed to join table. Please try again.");
    }
  };

  return (
    <>
      <div className="table-card">
        <h2>{table.title}</h2>
        <p>{table.description}</p>
        <div className="table-info">
          <div className="info-container">
            {/* Seat occupancy */}
            <div className="seat-info">
              <FaUsers className="icon" />
              <span>
                {occupiedSeats}/{table.seats}
              </span>
            </div>
            {/* Zone badge */}
            {table.zone && <span className="zone-badge">{table.zone}</span>}
          </div>
          <button className="join-btn" onClick={handleViewClick}>
            View
          </button>
        </div>
      </div>

      {/* Table details modal */}
      {isModalOpen && (
        <TableModal
          table={table}
          onClose={handleCloseModal}
          onJoin={handleJoinTable}
        />
      )}

      {/* Loading indicator */}
      {isLoading && <Loading />}
    </>
  );
};

export default TableCard;
