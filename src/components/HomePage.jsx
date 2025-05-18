import { useState } from "react";
import TableList from "./TableList";
import LocationSelector from "./LocationSelector";
import CreateTableModal from "./CreateTableModal";
import { FaPlus } from "react-icons/fa";
import "../styles/HomePage.css";
import "../styles/BottomNav.css";

/**
 * HomePage Component
 *
 * Main home page that displays the location selector, table list, and create table modal.
 */

const HomePage = () => {
  const [showCreateTableModal, setShowCreateTableModal] = useState(false);

  return (
    <div className="home-page">
      <div className="container">
        <LocationSelector />
        <div className="home-content">
          <TableList />
        </div>

        {/* Custom Bottom Nav with only Create Table button */}
        <div className="bottom-nav home-bottom-nav">
          <div
            className="nav-item create-table-button"
            onClick={() => setShowCreateTableModal(true)}
          >
            <div className="plus-circle">
              <FaPlus className="plus-icon" />
              <span className="create-label">New Table</span>
            </div>
          </div>
        </div>

        {/* Create Table Modal */}
        {showCreateTableModal && (
          <div className="modal-overlay">
            <CreateTableModal onClose={() => setShowCreateTableModal(false)} />
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
