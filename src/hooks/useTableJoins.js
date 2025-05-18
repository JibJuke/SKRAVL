import { useState } from "react";
import {
  doc,
  updateDoc,
  increment,
  getDoc,
  arrayUnion,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./useAuth";
import { addToParticipationHistory } from "../utils/tableOperations";

/**
 * useTableJoins Hook
 *
 * Custom hook that handles the functionality for users joining tables.
 * Manages the process of:
 * - Validating if a user can join a table
 * - Updating Firestore to record their participation
 * - Navigating to the table room with the correct data
 *
 * Performs validation checks to ensure:
 * - User is authenticated
 * - User is not already in another table
 * - The target table exists and is active
 * - The table has available seats
 *
 * @returns {Object} Table join methods and state
 */

export const useTableJoins = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  /**
   * Joins a table by updating Firestore and navigating to the table room
   *
   * @param {Object} table - The table to join
   * @throws {Error} If validation fails or joins not possible
   */
  const joinTable = async (table) => {
    setIsLoading(true);
    setError(null);
    try {
      // Validate user authentication
      if (!user?.uid) {
        throw new Error("You must be logged in to join a table");
      }

      // Check if user is already in a table
      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        throw new Error("User profile not found");
      }

      const userData = userDoc.data();

      if (userData.currentTable) {
        throw new Error(
          "You are already part of another table. Leave that table first."
        );
      }

      if (!table.locationId) {
        throw new Error("Missing location information for this table");
      }

      // Reference to the table document in its location subcollection
      const tableRef = doc(
        db,
        `locations/${table.locationId}/tables`,
        table.id
      );

      // Check if table is full or inactive
      const tableDoc = await getDoc(tableRef);

      if (!tableDoc.exists()) {
        throw new Error("Table no longer exists");
      }

      const tableData = tableDoc.data();

      if (tableData.status !== "active") {
        throw new Error("This table is no longer active");
      }

      if (tableData.availableSeats <= 0) {
        throw new Error("Table is full");
      }

      // Update table document: decrement available seats and add user to participants
      await updateDoc(tableRef, {
        availableSeats: increment(-1),
        joinedUsers: arrayUnion(user.uid),
      });

      // Add user to participation history
      await addToParticipationHistory(
        user.uid,
        user.displayName,
        tableRef,
        false
      );

      // Update user document with currentTable reference
      await updateDoc(userRef, {
        currentTable: {
          id: table.id,
          locationId: table.locationId,
          locationName: table.locationName || tableData.locationName,
          title: table.title,
          joinedAt: new Date(),
          isCreator: false,
        },
      });

      // Ensure we have complete location data
      const locationData = table.location || {
        id: table.locationId,
        name: table.locationName || tableData.locationName,
      };

      // Navigate to table room with complete table data
      navigate("/table-room", {
        state: {
          table: {
            ...table,
            ...tableData,
            id: table.id,
            availableSeats: tableData.availableSeats - 1,
            joinedUsers: [...(tableData.joinedUsers || []), user.uid],
            location: locationData,
            // Ensure these critical properties are always set correctly
            locationId: table.locationId,
            locationName: table.locationName || tableData.locationName,
          },
          isCreator: false,
        },
      });
    } catch (err) {
      console.error("Error joining table:", err);
      setError(err.message || "Failed to join table");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { joinTable, isLoading, error };
};
