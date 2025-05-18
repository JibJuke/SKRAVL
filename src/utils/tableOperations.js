import {
  doc,
  updateDoc,
  arrayUnion,
  increment,
  getDoc,
  arrayRemove,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebaseConfig";

/**
 * Table Operations Utility Module
 *
 * Provides core functionality for managing tables in the application.
 * Handles table participation, history tracking, and table status updates.
 *
 * These utilities are used across multiple components to ensure
 * consistent behavior when users join, leave or interact with tables.
 *
 * @param {string} userId - The ID of the user
 * @param {string} displayName - Display name of the user
 * @param {object} tableRef - Reference to the table document
 * @param {boolean} isCreator - Whether the user is the creator
 * @returns {Promise<void>}
 */

export const addToParticipationHistory = async (
  userId,
  displayName,
  tableRef,
  isCreator
) => {
  if (!userId || !tableRef) return;

  try {
    // First, get the current table data to check if user is already in history
    const tableDoc = await getDoc(tableRef);
    if (!tableDoc.exists()) return;

    const tableData = tableDoc.data();
    const history = tableData.participationHistory || [];

    // Use a batch to combine table updates
    const batch = writeBatch(db);

    // Check if user already exists in history
    const existingEntry = history.find((entry) => entry.userId === userId);

    if (existingEntry) {
      // User already exists in history, just update their status
      const updatedHistory = history.map((entry) => {
        if (entry.userId === userId) {
          return {
            ...entry,
            joinedAt: new Date(), // Update join time for this session
            leaveAt: null, // Reset leave time
            status: "active", // Set status to active
          };
        }
        return entry;
      });

      // Update with the modified history
      batch.update(tableRef, {
        participationHistory: updatedHistory,
      });
    } else {
      // User doesn't exist in history, add them as a new entry
      batch.update(tableRef, {
        participationHistory: arrayUnion({
          userId,
          displayName: displayName || "User",
          joinedAt: new Date(),
          leaveAt: null,
          role: isCreator ? "creator" : "participant",
          status: "active",
        }),
        // Also update joined users array in the same batch
        joinedUsers: arrayUnion(userId),
      });
    }

    // Commit all changes in a single batch
    await batch.commit();
  } catch (error) {
    console.error("Error adding to participation history:", error);
  }
};

/**
 * Updates a participant's status in the table's participation history
 * Usually called when a user leaves a table to mark their participation as inactive
 *
 * @param {string} userId - The ID of the user
 * @param {object} tableData - The table data including participation history
 * @param {object} tableRef - Reference to the table document
 * @returns {Promise<void>}
 */
export const updateParticipationHistory = async (
  userId,
  tableData,
  tableRef
) => {
  if (!userId || !tableData || !tableRef) return;

  try {
    // Get current participation history
    const history = tableData.participationHistory || [];

    // Find the user's entries (there might be multiple if they joined/left multiple times)
    const updatedHistory = history.map((entry) => {
      if (entry.userId === userId && entry.status === "active") {
        // Only update active entries
        return {
          ...entry,
          leaveAt: new Date(),
          status: "inactive",
        };
      }
      return entry;
    });

    // Update the document with the modified history
    await updateDoc(tableRef, {
      participationHistory: updatedHistory,
    });
  } catch (error) {
    console.error("Error updating participation history:", error);
  }
};

/**
 * Updates participation history for all active users when a table becomes inactive
 * Called when a table creator leaves/deletes the table to record end time for all participants
 *
 * @param {object} tableData - The table data including participation history
 * @param {object} tableRef - Reference to the table document
 * @returns {Promise<void>}
 */
export const updateAllParticipationHistory = async (tableData, tableRef) => {
  if (!tableData || !tableRef) return;

  try {
    // Get current participation history
    const history = tableData.participationHistory || [];

    if (history.length === 0) return;

    // Get the most recent state of the table to ensure we have the latest data
    const latestDoc = await getDoc(tableRef);
    if (!latestDoc.exists()) return;

    const latestData = latestDoc.data();
    const latestHistory = latestData.participationHistory || [];

    // If there's no history in the latest data, don't proceed
    if (latestHistory.length === 0) return;

    // Mark all active participants as inactive with the current timestamp
    const currentTime = new Date();
    const updatedHistory = latestHistory.map((entry) => {
      if (entry.status === "active") {
        return {
          ...entry,
          leaveAt: currentTime,
          status: "inactive",
        };
      }
      return entry;
    });

    // Update the document with the complete new history
    await updateDoc(tableRef, {
      participationHistory: updatedHistory,
    });

    console.log("Updated participation history for all users");
  } catch (error) {
    console.error("Error updating all participation history:", error);
  }
};

/**
 * Handles all logic for a user leaving a table
 * Comprehensive function that manages the entire leave process:
 * - Updates participation history
 * - Updates user's table history
 * - Handles table status updates
 * - Manages seat availability
 * - Updates other participants if creator leaves
 *
 * @param {string} userId - The ID of the user leaving the table
 * @param {object} tableData - The table data including id, title, locationId
 * @param {boolean} isCreator - Whether the user is the creator of the table
 * @param {string} leaveReason - Why the user is leaving (optional)
 * @returns {Promise<void>}
 */
export const leaveTable = async (
  userId,
  tableData,
  isCreator,
  leaveReason = "User left"
) => {
  if (!userId || !tableData?.id || !tableData?.locationId) {
    throw new Error("Missing required information to leave table");
  }

  try {
    // References
    const tableRef = doc(
      db,
      `locations/${tableData.locationId}/tables`,
      tableData.id
    );
    const userRef = doc(db, "users", userId);

    // Get current table state to ensure proper history recording
    const tableDoc = await getDoc(tableRef);
    if (!tableDoc.exists()) {
      // Table doesn't exist anymore
      await updateDoc(userRef, { currentTable: null });
      return;
    }

    const currentTableData = tableDoc.data();

    // Update the participation history
    await updateParticipationHistory(userId, currentTableData, tableRef);

    // Get user data to check if table is already in history
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      console.error("User document not found");
      return;
    }

    const userData = userDoc.data();
    const tableHistory = userData.tableHistory || [];

    // Check if this table is already in the user's history
    const tableAlreadyInHistory = tableHistory.some(
      (historyItem) => historyItem.id === tableData.id
    );

    // Always update user's current table to null
    if (tableAlreadyInHistory) {
      // Table already in history, just clear currentTable
      await updateDoc(userRef, {
        currentTable: null,
      });
    } else {
      // Table not in history, add it and clear currentTable
      const historyEntry = {
        id: tableData.id,
        title: tableData.title || "Untitled Table",
        locationId: tableData.locationId,
        locationName: tableData.locationName || "",
        date: new Date(), // Always use current date in a consistent format
        role: isCreator ? "creator" : "participant",
      };

      await updateDoc(userRef, {
        tableHistory: arrayUnion(historyEntry),
        currentTable: null,
      });
    }

    // Update table based on user role
    if (isCreator) {
      // Creator is ending the table - update table status first to mark it inactive
      try {
        await updateDoc(tableRef, {
          status: "inactive",
          endedAt: new Date(),
          endedBy: userId,
          endReason: leaveReason || "Creator left",
          // Add a flag to indicate all participants should clear their current table
          notifyParticipants: true,
          participantsToNotify: currentTableData.joinedUsers || [],
        });

        console.log("Table marked as inactive successfully");
      } catch (tableUpdateError) {
        console.error("Error updating table status:", tableUpdateError);
        throw tableUpdateError; // This is critical, so we should throw
      }

      // Update all participants' history entries to inactive since table is ending
      try {
        await updateAllParticipationHistory(currentTableData, tableRef);
      } catch (historyError) {
        console.error("Error updating participation history:", historyError);
        // Continue execution even if this fails
      }

      // For security reasons, we no longer try to update other participants' user documents directly.
      // Instead, we've added a flag to the table document that participants' can check.
      // Each participant's app instance will detect this flag when they next connect
      // and update their own user document accordingly.
    } else {
      // Participant is leaving - update seat count and participants list
      await updateDoc(tableRef, {
        availableSeats: increment(1),
        joinedUsers: arrayRemove(userId),
      });
    }

    return;
  } catch (error) {
    console.error("Error in leaveTable utility:", error);
    throw error;
  }
};
