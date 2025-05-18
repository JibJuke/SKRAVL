import { useState, useEffect } from "react";
import { collection, onSnapshot, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";

/**
 * Custom hook for fetching locations from Firestore
 * @returns {Object} An object containing:
 * - locations: Array of location objects
 * - loading: Boolean indicating if data is being fetched
 * - error: Any error that occurred during fetching
 */

export const useLocations = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const locationsRef = collection(db, "locations");

    const fetchLocations = async () => {
      try {
        const snapshot = await getDocs(locationsRef);
        const locationData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setLocations(locationData);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching locations:", err);
        setError(err);
        setLoading(false);
      }
    };

    // Initial fetch
    fetchLocations();

    // Set up real-time listener for updates
    const unsubscribe = onSnapshot(
      locationsRef,
      (snapshot) => {
        try {
          const locationData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setLocations(locationData);
          setLoading(false);
        } catch (err) {
          setError(err);
          setLoading(false);
        }
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { locations, loading, error };
};
