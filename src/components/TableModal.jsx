import { FaUsers, FaTimes } from "react-icons/fa";
import "../styles/TableModal.css";
import "../styles/MapContainer.css";
import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

/**
 * TableModal Component
 *
 * Displays detailed information about a table in a modal overlay.
 * Shows table title, description, seating information, and table location on a map.
 * Provides join functionality for users to join the selected table.
 *
 * Fetches any missing location data (such as map images) if needed.
 *
 * @param {object} table - Table data to display
 * @param {function} onClose - Function to close the modal
 * @param {function} onJoin - Function to join the table
 */

const TableModal = ({ table, onClose, onJoin }) => {
  const [locationData, setLocationData] = useState(null);
  const [mapSrc, setMapSrc] = useState(null);
  const [mapError, setMapError] = useState(false);

  // Fetch location data if not already present in table object
  useEffect(() => {
    const fetchLocationData = async () => {
      if (table.location?.zoneMaps) {
        // Already have location data with zoneMaps
        return;
      }

      if (table.locationId) {
        try {
          const locationRef = doc(db, "locations", table.locationId);
          const locationSnap = await getDoc(locationRef);

          if (locationSnap.exists()) {
            setLocationData(locationSnap.data());
          }
        } catch (err) {
          console.error("Error fetching location data:", err);
        }
      }
    };

    fetchLocationData();
  }, [table]);

  // Set up the map source when component mounts or data changes
  useEffect(() => {
    if (!table.zone) {
      setMapSrc("/images/default-map.png");
      return;
    }

    // Get the lowercase zone name
    const zoneKey = table.zone.toLowerCase();

    // Try to get the map from various sources in order of preference
    if (table.location?.zoneMaps && table.location.zoneMaps[zoneKey]) {
      setMapSrc(table.location.zoneMaps[zoneKey]);
    } else if (locationData?.zoneMaps && locationData.zoneMaps[zoneKey]) {
      setMapSrc(locationData.zoneMaps[zoneKey]);
    } else {
      setMapSrc(`/images/${zoneKey}-map.png`);
    }
  }, [table, locationData]);

  /**
   * Handles map image loading errors by trying alternative formats
   * @param {React.SyntheticEvent} e - Error event from image load failure
   */
  const handleMapError = (e) => {
    console.error("Error loading map image:", e.target.src);

    // Try different file extensions
    const currentSrc = e.target.src;
    if (currentSrc.endsWith("-map.png")) {
      setMapSrc(currentSrc.replace("-map.png", "-map.jpeg"));
      return;
    } else if (currentSrc.endsWith("-map.jpeg")) {
      setMapSrc(currentSrc.replace("-map.jpeg", "-map.jpg"));
      return;
    }

    // If all extensions fail, use default
    setMapError(true);
    setMapSrc("/images/default-map.png");
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        {/* Close button */}
        <button className="close-button" onClick={onClose}>
          <FaTimes />
        </button>

        {/* Modal header with table title and location */}
        <div className="modal-header">
          <h2>{table.title}</h2>
          {table.locationName && (
            <p className="location-name">Location: {table.locationName}</p>
          )}
        </div>

        <div className="modal-body">
          {/* Table description */}
          <p className="description">{table.description}</p>

          {/* Seating information */}
          <div className="table-info">
            <div className="seat-info">
              <FaUsers className="icon" />
              <span>
                {table.seats - table.availableSeats}/{table.seats}
              </span>
            </div>
          </div>

          {/* Map section showing table location */}
          <div className="map-section">
            <h3>Table Location</h3>
            <div className="map-container">
              <img
                src={mapSrc}
                alt={`${table.zone} map`}
                className="map-image"
                onError={handleMapError}
              />
              {table.position && !mapError && (
                <div
                  className="table-icon"
                  style={{
                    top: `${table.position.top}%`,
                    left: `${table.position.left}%`,
                  }}
                >
                  🪑
                </div>
              )}
            </div>
            <p className="zone-info">
              Zone: {table.zone.charAt(0).toUpperCase() + table.zone.slice(1)}
              {mapError && " (Map unavailable)"}
            </p>
          </div>
        </div>

        {/* Modal footer with action buttons */}
        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="join-btn" onClick={onJoin}>
            Join Table
          </button>
        </div>
      </div>
    </div>
  );
};

export default TableModal;
