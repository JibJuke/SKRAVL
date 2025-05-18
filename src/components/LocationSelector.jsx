import { useState, useRef, useEffect } from "react";
import { useLocationContext } from "../contexts/LocationContext";
import Loading from "./Loading";
import { IoChevronDown } from "react-icons/io5";
import { resolveImagePath } from "../utils/imageUtils";
import "../styles/LocationSelector.css";

/**
 * LocationSelector Component
 *
 * Provides a dropdown interface for selecting a location.
 * Locations are loaded from Firestore via the LocationContext.
 * The selected location persists across sessions in localStorage and affects:
 * - Which tables are displayed in the TableList
 * - Where new tables are created
 * - Location-specific map images and zones
 *
 */

const LocationSelector = () => {
  const { locations, selectedLocation, selectLocation, loading } =
    useLocationContext();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    /**
     * Handles clicks outside the dropdown to close it
     * @param {MouseEvent} event - Click event
     */
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  /**
   * Handles location selection from the dropdown
   * @param {Object} location - The location to select
   */
  const handleLocationSelect = (location) => {
    selectLocation(location);
    setIsDropdownOpen(false);
  };

  // Show loading state while fetching locations
  if (loading) {
    return (
      <div className="location-selector">
        <Loading />
      </div>
    );
  }

  return (
    <div className="location-selector" ref={dropdownRef}>
      <div className="selector-header">
        <h2>Find your location📍</h2>
        {/* Dropdown toggle button */}
        <div
          className={`location-dropdown-toggle ${
            isDropdownOpen ? "active" : ""
          }`}
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          {selectedLocation ? (
            <span>{selectedLocation.name}</span>
          ) : (
            <span>Select a Location</span>
          )}
          <span className="dropdown-arrow">
            <IoChevronDown />
          </span>
        </div>

        {/* Dropdown options menu */}
        {isDropdownOpen && (
          <div className="location-dropdown">
            {locations.map((location) => (
              <div
                key={location.id}
                className={`location-option ${
                  selectedLocation && selectedLocation.id === location.id
                    ? "selected"
                    : ""
                }`}
                onClick={() => handleLocationSelect(location)}
              >
                <div className="location-image-container">
                  <img
                    src={resolveImagePath(location.image)}
                    alt={location.name}
                  />
                </div>
                <div className="location-info">
                  <span className="location-name">{location.name}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Display selected location image */}
      {selectedLocation && (
        <div className="selected-location-image">
          <img
            src={resolveImagePath(selectedLocation.image)}
            alt={selectedLocation.name}
          />
        </div>
      )}
    </div>
  );
};

export default LocationSelector;
