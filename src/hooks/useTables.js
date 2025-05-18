import { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  where,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useLocationContext } from "../contexts/LocationContext";

/**
 * Custom hook for fetching and managing tables data from Firestore based on selected location
 *
 * @returns {object} An object containing:
 * - tables: Array of table objects
 * - loading: Boolean indicating if data is being fetched
 * - error: Any error that occurred during fetching
 */

export const useTables = () => {
  // State for tables data
  const [tables, setTables] = useState([]);
  // State for loading status
  const [loading, setLoading] = useState(true);
  // State for error handling
  const [error, setError] = useState(null);
  // Get the selected location from context
  const { selectedLocation } = useLocationContext();

  useEffect(() => {
    // Reset states when location changes
    setLoading(true);
    setTables([]);
    setError(null);

    // Don't try to fetch if no location is selected
    if (!selectedLocation) {
      setLoading(false);
      return () => {};
    }

    // Create a reference to the tables subcollection for the selected location
    const tablesRef = collection(db, `locations/${selectedLocation.id}/tables`);

    // Create a query to only get active tables &
    // sort them by creation time in descending order
    const q = query(
      tablesRef,
      where("status", "==", "active"),
      orderBy("createdAt", "desc")
    );

    // Subscribe to real-time updates from Firestore
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        try {
          // Convert Firestore documents to JavaScript objects
          const tableData = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              // Add complete location information to each table
              location: {
                id: selectedLocation.id,
                name: selectedLocation.name,
                zoneMaps: selectedLocation.zoneMaps || {},
                zones: selectedLocation.zones || [],
              },
            };
          });

          setTables(tableData);
          setLoading(false);
          console.log(`Table data for ${selectedLocation.name}:`, tableData);
        } catch (err) {
          console.error("Error processing table data:", err);
          setError(err);
          setLoading(false);
        }
      },
      (err) => {
        // Handle any errors in the snapshot listener
        console.error("Error fetching tables:", err);
        setError(err);
        setLoading(false);
      }
    );

    // Cleanup function to unsubscribe from updates when component unmounts or location changes
    return () => unsubscribe();
  }, [selectedLocation]); // Dependency on selectedLocation to refetch when it changes

  return { tables, loading, error };
};
