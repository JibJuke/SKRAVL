import { useState, useEffect } from "react";
import "../styles/Modal.css";
import "../styles/MapContainer.css";
import "../styles/TableInfoContent.css";

/**
 * TableInfoContent Component
 *
 * Displays detailed information about a table in a modal.
 * Shows table title, description, and location on a map.
 * Handles loading and error states for map images with fallbacks.
 * Used in the TableRoom bottom navigation to show complete table information.
 *
 * @param {object} table - Table data to display
 */

const TableInfoContent = ({ table }) => {
  const [mapImageError, setMapImageError] = useState(false);
  const [mapSrc, setMapSrc] = useState("/images/default-map.png");

  // Determine the map source when component mounts or table changes
  useEffect(() => {
    if (mapImageError) {
      setMapSrc("/images/default-map.png");
      return;
    }

    if (!table || !table.zone) {
      setMapSrc("/images/default-map.png");
      return;
    }

    const zoneKey = table.zone.toLowerCase();

    // Primary source: Try to get from location.zoneMaps if available
    if (table.location?.zoneMaps && table.location.zoneMaps[zoneKey]) {
      setMapSrc(table.location.zoneMaps[zoneKey]);
      return;
    }

    // Set default path based on zone
    setMapSrc(`/images/${zoneKey}-map.png`);
  }, [table, mapImageError]);

  /**
   * Handles map image loading errors by trying alternative formats
   * Falls back to default map if all attempts fail
   *
   * @param {React.SyntheticEvent} e - Error event from image load failure
   */
  const handleMapError = (e) => {
    const currentSrc = e.target.src;
    console.log("No table image for zone, using Default");

    // Try different file extensions if the current one fails
    if (currentSrc.endsWith("-map.png")) {
      // Try jpeg extension
      setMapSrc(currentSrc.replace("-map.png", "-map.jpeg"));
      return;
    } else if (currentSrc.endsWith("-map.jpeg")) {
      // Try jpg extension
      setMapSrc(currentSrc.replace("-map.jpeg", "-map.jpg"));
      return;
    }

    // If all extensions failed or it's not a path we can fix, use default
    // Setting to false instead of true to allow table icon to remain visible
    setMapImageError(false);
    setMapSrc("/images/default-map.png");
  };

  // Show message if no table data is available
  if (!table)
    return <p className="empty-state">No table information available</p>;

  return (
    <div className="table-info-content">
      {/* Table header with title and description */}
      <div className="table-header">
        <h2 className="table-title">{table.title}</h2>
        {table.description && (
          <p className="table-description">{table.description}</p>
        )}
      </div>

      {/* Map section showing table location */}
      {table.zone && (
        <div className="map-section">
          <h3>Table Location</h3>
          <div className="map-container">
            <img
              src={mapSrc}
              alt={`${table.zone} map`}
              className="map-image"
              onError={handleMapError}
            />
            {table.position && !mapImageError && (
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
          <div className="location-info">
            <p className="location-name">{table.locationName}</p>
            <p className="zone-info">
              Zone: {table.zone.charAt(0).toUpperCase() + table.zone.slice(1)}
              {mapImageError && " (Map unavailable)"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableInfoContent;
