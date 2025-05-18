import { createContext, useState, useContext, useEffect } from "react";
import { useLocations } from "../hooks/useLocations";

// Create the Location context
const LocationContext = createContext();

/**
 * LocationContext
 *
 * Provides location state management throughout the application.
 * Handles loading, selecting, and persisting location preferences for users.
 * Used to determine which location's tables to display and where new tables are created.
 *
 * @param {React.ReactNode} children - Child components
 */

export const LocationProvider = ({ children }) => {
  const { locations, loading: locationsLoading } = useLocations();
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [loading, setLoading] = useState(true);

  // Set default location when locations are loaded
  useEffect(() => {
    if (!locationsLoading && locations.length > 0 && !selectedLocation) {
      // Set the first location as default
      setSelectedLocation(locations[0]);
      setLoading(false);
    } else if (!locationsLoading) {
      setLoading(false);
    }
  }, [locations, locationsLoading, selectedLocation]);

  // Load selected location from localStorage on mount
  useEffect(() => {
    const savedLocationId = localStorage.getItem("selectedLocationId");
    if (savedLocationId && locations.length > 0) {
      const foundLocation = locations.find((loc) => loc.id === savedLocationId);
      if (foundLocation) {
        setSelectedLocation(foundLocation);
      }
    }
  }, [locations]);

  /**
   * Updates the selected location and persists it in localStorage
   * @param {object} location - The location object to select
   */
  const selectLocation = (location) => {
    setSelectedLocation(location);
    localStorage.setItem("selectedLocationId", location.id);
  };

  return (
    <LocationContext.Provider
      value={{
        locations,
        selectedLocation,
        selectLocation,
        loading,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

/**
 * Custom hook to use the location context throughout the application
 * @returns {object} Location context values
 * @throws {Error} If used outside of a LocationProvider
 */
export const useLocationContext = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error(
      "useLocationContext must be used within a LocationProvider"
    );
  }
  return context;
};
