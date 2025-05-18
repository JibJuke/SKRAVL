import { useState, useEffect } from "react";
import { FaPlus } from "react-icons/fa";
import { useTableCreation } from "../hooks/useTableCreation";
import Loading from "./Loading";
import TableRestrictionNotification from "./TableRestrictionNotification";
import "../styles/CreateTable.css";
import "../styles/MapContainer.css";
import { useLocationContext } from "../contexts/LocationContext";

/**
 * CreateTable Component
 *
 * Provides interface for users to create new tables at a specific location.
 * Allows users to:
 * - Set table title and description
 * - Select number of seats
 * - Choose zone within the location
 * - Set table position on a map for easy finding
 *
 * @returns {React.ReactNode}
 */

const CreateTable = () => {
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
      return;
    }

    const zoneKey = zone.toLowerCase();

    // Try to get from location.zoneMaps if available
    if (selectedLocation?.zoneMaps && selectedLocation.zoneMaps[zoneKey]) {
      setMapSrc(selectedLocation.zoneMaps[zoneKey]);
    } else {
      // Set default path based on zone
      setMapSrc(`/images/${zoneKey}-map.png`);
    }

    // Reset map error and selected position when zone changes
    setMapError(false);
    setSelectedPosition(null);
  }, [zone, selectedLocation]);

  /**
   * Handles map click to place the table marker
   * Calculates position as percentages for responsive layout
   *
   * @param {React.MouseEvent} e - Click event on the map
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

    console.log(
      `Table position set to: ${boundedLeft.toFixed(2)}%, ${boundedTop.toFixed(
        2
      )}%`
    );
  };

  /**
   * Handles map loading errors by trying alternative image formats
   * Falls back to default map if all attempts fail
   *
   * @param {React.SyntheticEvent} e - Image error event
   */
  const handleMapError = (e) => {
    const currentSrc = e.target.src;
    console.error("Error loading map image:", currentSrc);

    // Try different file extensions
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

  /**
   * Submits the form to create a new table
   * Performs validation before submitting
   *
   * @param {React.FormEvent} e - Form submit event
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
   * Closes the restriction notification modal
   */
  const handleCloseNotification = () => {
    setShowRestrictionNotification(false);
  };

  // Show location selection message if no location is selected
  if (!selectedLocation) {
    return (
      <div className="create-table">
        <div className="container">
          <h1>Create a New Table</h1>
          <div className="error-message">
            Please select a location on the home page before creating a table.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="create-table">
      {showRestrictionNotification && (
        <TableRestrictionNotification onClose={handleCloseNotification} />
      )}
      <div className="container">
        <h1>Create a New Table at {selectedLocation.name}</h1>
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
              <div className="map-container" onClick={handleMapClick}>
                <img
                  src={mapSrc}
                  alt={`${zone} map`}
                  className="map-image"
                  onError={handleMapError}
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

          {/* Submit button */}
          <button
            type="submit"
            className="create-btn"
            disabled={isLoading || isInTable || !selectedPosition || mapError}
          >
            <FaPlus className="icon" />
            {isLoading ? "Creating..." : "Create Table"}
          </button>
        </form>
        {error && <div className="error-message">{error}</div>}
      </div>
      {isLoading && <Loading />}
    </div>
  );
};

export default CreateTable;
