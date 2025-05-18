import { useState, useCallback, useRef } from "react";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./useAuth";
import { useLocationContext } from "../contexts/LocationContext";

/**
 * useTableCreation Hook
 *
 * Custom hook for managing table creation functionality.
 * Handles:
 * - Checking if user is already in a table
 * - Creating new tables
 * - Navigating to table rooms
 *
 * @returns {Object} Table creation methods and state
 */

export const useTableCreation = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isInTable, setIsInTable] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedLocation } = useLocationContext();

  // Use a ref to cache the status check result and timestamp to avoid unnecessary Firestore reads
  const tableStatusCache = useRef({
    result: null,
    timestamp: 0,
    userId: null,
  });

  /**
   * Checks if user is already participating in a table
   * Uses a caching mechanism to reduce Firestore reads
   *
   * @param {boolean} forceCheck - Whether to force a fresh check, bypassing cache
   * @returns {Promise<boolean>} Whether user is currently in a table
   */
  const checkUserTableStatus = useCallback(
    async (forceCheck = false) => {
      if (!user?.uid) return false;

      // Cache expiration time - 10 seconds
      const CACHE_EXPIRATION = 10000; // 10 seconds in milliseconds
      const now = Date.now();

      // Return cached result if still valid and user hasn't changed
      if (
        !forceCheck &&
        tableStatusCache.current.result !== null &&
        tableStatusCache.current.userId === user.uid &&
        now - tableStatusCache.current.timestamp < CACHE_EXPIRATION
      ) {
        return tableStatusCache.current.result;
      }

      try {
        const userRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
          // Update cache and state
          tableStatusCache.current = {
            result: false,
            timestamp: now,
            userId: user.uid,
          };
          setIsInTable(false);
          return false;
        }

        const userData = userDoc.data();
        const userCurrentTable = userData.currentTable;

        // If user has a currentTable reference, they're already in a table
        const result = !!userCurrentTable;

        // Update cache and state
        tableStatusCache.current = {
          result,
          timestamp: now,
          userId: user.uid,
        };
        setIsInTable(result);
        return result;
      } catch (err) {
        console.error("Error checking user table status:", err);
        return false;
      }
    },
    [user]
  );

  /**
   * Creates a new table in Firestore and navigates to the table room
   *
   * @param {Object} tableData - Data for the new table
   * @param {string} tableData.title - Table title
   * @param {string} tableData.description - Table description
   * @param {number} tableData.seats - Total number of seats
   * @param {Object} tableData.position - Position data on the location map
   * @throws {Error} If user is already in a table or location is not selected
   */
  const createTable = async (tableData) => {
    // Check if a location is selected
    if (!selectedLocation) {
      throw new Error("No location selected. Please select a location first.");
    }

    // Loading starts here after the create table button is clicked
    setIsLoading(true);
    setError(null);

    try {
      // First check if the user is already in a table - force fresh check
      const alreadyInTable = await checkUserTableStatus(true);

      if (alreadyInTable) {
        throw new Error(
          "You are already part of another table. Leave that table first."
        );
      }

      // Initial participation history with creator
      const initialParticipationHistory = [
        {
          userId: user.uid,
          displayName: user.displayName || "Table Creator",
          joinedAt: new Date(),
          leaveAt: null,
          role: "creator",
          status: "active",
        },
      ];

      // Prepare the new table document data
      const newTable = {
        ...tableData,
        locationId: selectedLocation.id,
        locationName: selectedLocation.name,
        availableSeats: tableData.seats - 1, // Creator takes one seat
        createdAt: serverTimestamp(),
        status: "active",
        creatorID: user.uid,
        createdBy: user.uid, // Add as a backup field
        joinedUsers: [user.uid],
        participationHistory: initialParticipationHistory,
      };

      // Create reference to the tables subcollection for the selected location
      const tablesCollectionRef = collection(
        db,
        `locations/${selectedLocation.id}/tables`
      );

      // Add the table document to Firestore
      const docRef = await addDoc(tablesCollectionRef, newTable);

      // Update user document with currentTable reference
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        currentTable: {
          id: docRef.id,
          locationId: selectedLocation.id,
          locationName: selectedLocation.name,
          title: tableData.title,
          joinedAt: new Date(),
          isCreator: true,
        },
      });

      // Update cache after creating a table
      tableStatusCache.current = {
        result: true,
        timestamp: Date.now(),
        userId: user.uid,
      };
      setIsInTable(true);

      // Create a location object with necessary data for the table room
      const locationData = {
        id: selectedLocation.id,
        name: selectedLocation.name,
        zoneMaps: selectedLocation.zoneMaps || {},
      };

      // Navigate to the table room with the table data
      navigate("/table-room", {
        state: {
          table: {
            id: docRef.id,
            ...newTable,
            location: locationData,
          },
          isCreator: true,
        },
      });
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createTable,
    isLoading,
    error,
    isInTable,
    checkUserTableStatus,
  };
};
