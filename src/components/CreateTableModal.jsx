import { useState, useEffect } from "react";
import { FaPlus } from "react-icons/fa";
import { useTableCreation } from "../hooks/useTableCreation";
import Loading from "./Loading";
import TableRestrictionNotification from "./TableRestrictionNotification";
import "../styles/CreateTable.css";
import "../styles/MapContainer.css";
import "../styles/Modal.css";
import { useLocationContext } from "../contexts/LocationContext";

/**
 * CreateTableModal Component
 *
 * Modal component for creating a new table.
 * Handles table creation form submission and validation.
 * Includes map selection for table position.
 * Shows restriction notification if user is in another table.
 *
 * @param {function} onClose - Function to close the modal
 */

const CreateTableModal = ({ onClose }) => {
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [seats, setSeats] = useState(4);
  const [zone, setZone] = useState("");
  const [selectedPosition, setSelectedPosition] = useState(null);

  // Map handling
  const [mapSrc, setMapSrc] = useState("/images/default-map.png");
  const [mapError, setMapError] = useState(false);

  // Notification state
  const [showRestrictionNotification, setShowRestrictionNotification] =
    useState(false);

  // Hooks
  const { createTable, isLoading, error, isInTable, checkUserTableStatus } =
    useTableCreation();
  const { selectedLocation } = useLocationContext();

  // Check if user is in a table when component mounts
  useEffect(() => {
    const checkTableStatus = async () => {
      const inTable = await checkUserTableStatus();
      if (inTable) {
        setShowRestrictionNotification(true);
      }
    };

    checkTableStatus();
  }, [checkUserTableStatus]);

  // Update map source when zone changes
  useEffect(() => {
    if (!zone) {
      setMapSrc("/images/default-map.png");
      setMapError(false); // Default map is valid, not an error
      return;
    }

    const zoneKey = zone.toLowerCase();

    // Try to get from location.zoneMaps if available
    if (selectedLocation?.zoneMaps && selectedLocation.zoneMaps[zoneKey]) {
      setMapSrc(selectedLocation.zoneMaps[zoneKey]);
      setMapError(false); // Valid map from zoneMaps
    } else {
      // Set default path based on zone
      setMapSrc(`/images/${zoneKey}-map.png`);
    }

    // Reset selected position when zone changes
    setSelectedPosition(null);
  }, [zone, selectedLocation]);

  /**
   * Handles map loading errors by trying alternative formats
   *
   * @param {SyntheticEvent} e - Image error event
   */
  const handleMapError = (e) => {
    const currentSrc = e.target.src;
    console.log("No table image for zone, using Default");

    // Try different file extensions
    if (currentSrc.endsWith("-map.png")) {
      setMapSrc(currentSrc.replace("-map.png", "-map.jpeg"));
      return;
    } else if (currentSrc.endsWith("-map.jpeg")) {
      setMapSrc(currentSrc.replace("-map.jpeg", "-map.jpg"));
      return;
    }

    // If all extensions fail, use default map and still allow table placement
    setMapSrc("/images/default-map.png");
    setMapError(false); // Allow clicks and show table icon on default map
  };

  /**
   * Handles map click to place the table marker
   *
   * @param {MouseEvent} e - Click event on the map
   */
  const handleMapClick = (e) => {
    if (mapError) return; // Don't allow placing if map failed to load

    // Get the container and compute position
    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();

    // Get click coordinates relative to the container
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Convert to percentages
    const left = (x / rect.width) * 100;
    const top = (y / rect.height) * 100;

    // Make sure values are within bounds
    const boundedLeft = Math.max(0, Math.min(100, left));
    const boundedTop = Math.max(0, Math.min(100, top));

    setSelectedPosition({
      left: boundedLeft,
      top: boundedTop,
    });
  };

  /**
   * Handles form submission to create a new table
   *
   * @param {FormEvent} e - Form submission event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if user is in a table before attempting to create
    const inTable = await checkUserTableStatus();
    if (inTable) {
      setShowRestrictionNotification(true);
      return;
    }

    if (!zone) {
      alert("Please select a zone");
      return;
    }
    if (!selectedPosition) {
      alert("Please select a position on the map");
      return;
    }
    try {
      await createTable({
        title,
        description,
        seats,
        zone,
        position: selectedPosition,
      });
      onClose(); // Close modal on success
    } catch (err) {
      console.error("Error creating table:", err);
      // If error is about already being in a table, show the notification
      if (
        err.message &&
        err.message.includes("already part of another table")
      ) {
        setShowRestrictionNotification(true);
      } else {
        alert(err.message || "Failed to create table. Please try again.");
      }
    }
  };

  /**
   * Closes the restriction notification
   */
  const handleCloseNotification = () => {
    setShowRestrictionNotification(false);
  };

  // Show location selection message if no location is selected
  if (!selectedLocation) {
    return (
      <div className="modal-content">
        <div className="modal-header">
          <h2>Create a New Table</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <div className="error-message">
            Please select a location on the home page before creating a table.
          </div>
        </div>
        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-content create-table-modal">
      {showRestrictionNotification && (
        <TableRestrictionNotification onClose={handleCloseNotification} />
      )}

      <div className="modal-header">
        <h2>Create a New Table at {selectedLocation.name}</h2>
        <button className="close-button" onClick={onClose}>
          ×
        </button>
      </div>

      <div className="modal-body">
        <form onSubmit={handleSubmit}>
          {/* Title input */}
          <div className="form-group">
            <label htmlFor="title">Title</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="input"
            />
          </div>

          {/* Description input */}
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="input"
            />
          </div>

          {/* Seat selection */}
          <div className="form-group">
            <label htmlFor="seats">Number of Seats</label>
            <input
              type="number"
              id="seats"
              value={seats}
              onChange={(e) => setSeats(parseInt(e.target.value))}
              min="2"
              max="12"
              required
              className="input"
            />
          </div>

          {/* Zone selection */}
          <div className="form-group">
            <label>Select Zone</label>
            <div className="zone-options">
              {selectedLocation.zones &&
                selectedLocation.zones.map((zoneOption) => (
                  <label key={zoneOption} className="zone-option">
                    <input
                      type="radio"
                      name="zone"
                      value={zoneOption}
                      checked={zone === zoneOption}
                      onChange={(e) => setZone(e.target.value)}
                    />
                    {zoneOption.charAt(0).toUpperCase() + zoneOption.slice(1)}
                  </label>
                ))}
            </div>
          </div>

          {/* Map for selecting table position */}
          {zone && (
            <div className="form-group map-selection">
              <label>Select Table Position</label>
              <div
                className="map-container"
                onClick={handleMapClick}
                style={{ cursor: "crosshair", position: "relative" }}
              >
                <img
                  src={mapSrc}
                  alt={`${zone} map`}
                  className="map-image"
                  onError={handleMapError}
                  style={{ pointerEvents: "none" }}
                />
                {selectedPosition && !mapError && (
                  <div
                    className="table-icon"
                    style={{
                      top: `${selectedPosition.top}%`,
                      left: `${selectedPosition.left}%`,
                    }}
                  >
                    🪑
                  </div>
                )}
              </div>
              <p className="position-helper-text">
                {mapError
                  ? "Map unavailable. Please try another zone."
                  : "Click on the map to place your table"}
              </p>
            </div>
          )}

          {/* Form action buttons */}
          <div className="modal-footer">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="create-btn"
              disabled={isLoading || isInTable || !selectedPosition || mapError}
            >
              <FaPlus className="icon" />
              {isLoading ? "Creating..." : "Create Table"}
            </button>
          </div>
        </form>
        {error && <div className="error-message">{error}</div>}
      </div>
      {isLoading && <Loading />}
    </div>
  );
};

export default CreateTableModal;
