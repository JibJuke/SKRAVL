import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  doc,
  onSnapshot,
  updateDoc,
  increment,
  arrayRemove,
  arrayUnion,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useAuth } from "./useAuth";
import { leaveTable as leaveTableUtil } from "../utils/tableOperations";

/**
 * useTableRoom Hook
 *
 * Core hook for managing table room functionality and real-time data.
 * Handles real-time synchronization with Firestore for the active table session,
 * tracks user participation, and manages table status updates.
 *
 * Key features:
 * - Real-time table data updates using Firestore onSnapshot
 * - Table state management (active/inactive status)
 * - User participation tracking
 * - Conversation prompt management
 * - Leave/delete table functionality
 * - Table end notification handling
 *
 * @param {Object} initialTable - Initial table data passed from navigation state
 * @param {boolean} isCreator - Whether the current user is the table creator
 * @returns {Object} Table state and methods for the TableRoom component
 */

export const useTableRoom = (initialTable, isCreator) => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [table, setTable] = useState(initialTable);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showEndNotification, setShowEndNotification] = useState(false);
  const [conversationPrompt, setConversationPrompt] = useState("");
  const [tableUsers, setTableUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Refs
  const usersFetched = useRef(false);
  const statusHandled = useRef(false);
  const unsubscribeRef = useRef(null);

  // Log initial table data for debugging
  useEffect(() => {
    console.log("Initial table data:", initialTable);
  }, [initialTable]);

  // Get reference to the table document
  const getTableRef = useCallback(() => {
    if (!table || !table.locationId) {
      console.error("Table or locationId is missing", table);
      throw new Error("Invalid table data");
    }
    return doc(db, `locations/${table.locationId}/tables`, table.id);
  }, [table]);

  // Fetch table users when component mounts or table.joinedUsers changes
  useEffect(() => {
    if (authLoading || !table?.joinedUsers || table.joinedUsers.length === 0)
      return;

    const fetchTableUsers = async () => {
      setIsLoadingUsers(true);
      try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("__name__", "in", table.joinedUsers));
        const querySnapshot = await getDocs(q);

        const users = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setTableUsers(users);
      } catch (err) {
        console.error("Error fetching table users:", err);
      } finally {
        setIsLoadingUsers(false);
      }
    };

    fetchTableUsers();
  }, [table?.joinedUsers, authLoading]);

  // Subscribe to real-time updates for this table
  useEffect(() => {
    // Don't proceed if auth is still loading
    if (authLoading) return;

    // Clear any existing subscription
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    // Validate required data
    if (!initialTable?.id) {
      console.error("Missing table ID");
      return;
    }

    if (!initialTable?.locationId) {
      console.error("Missing locationId for table");
      return;
    }

    // If auth is ready but user is not authenticated, this is a real auth issue
    // (not just a loading state issue)
    if (!authLoading && !user?.uid) {
      console.error("User not authenticated");
      setError("Authentication required. Please log in.");
      setTimeout(() => navigate("/auth"), 2000);
      return;
    }

    // Now that we've validated all required data, create the reference and subscribe
    const tableRef = doc(
      db,
      `locations/${initialTable.locationId}/tables`,
      initialTable.id
    );

    // Initial check for table status
    getDoc(tableRef)
      .then((docSnap) => {
        if (docSnap.exists()) {
          const tableData = { id: docSnap.id, ...docSnap.data() };
          setTable(tableData);

          if (tableData.status === "inactive" && !isCreator) {
            handleInactiveTable(tableData);
          }

          // Check for notification flags
          if (
            !isCreator &&
            tableData.notifyParticipants &&
            tableData.participantsToNotify &&
            tableData.participantsToNotify.includes(user?.uid)
          ) {
            handleTableNotification(tableData);
          }

          // Load initial conversation prompt if exists
          if (tableData.conversationPrompt) {
            setConversationPrompt(tableData.conversationPrompt);
          }
        } else {
          console.error("Table doesn't exist");
          setError("This table no longer exists.");
          setTimeout(() => navigate("/home"), 2000);
        }
      })
      .catch((err) => {
        console.error("Error checking table status:", err);
        setError("Error connecting to the table: " + err.message);
      });

    // Set up real-time listener
    unsubscribeRef.current = onSnapshot(
      tableRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const tableData = { id: docSnap.id, ...docSnap.data() };
          setTable(tableData);

          // Update conversation prompt if it changes
          if (tableData.conversationPrompt) {
            setConversationPrompt(tableData.conversationPrompt);
          }

          // Handle table becoming inactive (for non-creators)
          if (
            tableData.status === "inactive" &&
            !isCreator &&
            !statusHandled.current
          ) {
            handleInactiveTable(tableData);
          }

          // Handle notifications from the table creator
          if (
            !isCreator &&
            tableData.notifyParticipants &&
            tableData.participantsToNotify &&
            tableData.participantsToNotify.includes(user?.uid) &&
            !statusHandled.current
          ) {
            handleTableNotification(tableData);
          }
        } else {
          console.error("Table document not found in real-time listener");
          setError("This table has been deleted.");
        }
      },
      (err) => {
        console.error("Error in table snapshot listener:", err);
        setError("Error connecting to the table: " + err.message);
      }
    );

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [
    initialTable?.id,
    initialTable?.locationId,
    isCreator,
    navigate,
    user?.uid,
    authLoading,
  ]);

  // Handle notifications from the table creator
  const handleTableNotification = (tableData) => {
    if (statusHandled.current || !user) return;

    statusHandled.current = true;
    console.log("Processing table notification");

    // Update user's own document (we can update our own doc)
    const userRef = doc(db, "users", user.uid);

    // First check if this table is already in the user's history
    getDoc(userRef)
      .then((userDoc) => {
        if (!userDoc.exists()) return;

        const userData = userDoc.data();
        const tableHistory = userData.tableHistory || [];

        // Check if this table is already in the user's history
        const tableAlreadyInHistory = tableHistory.some(
          (historyItem) => historyItem.id === tableData.id
        );

        // Update user document
        if (tableAlreadyInHistory) {
          // Just clear current table
          updateDoc(userRef, { currentTable: null })
            .then(() => console.log("Cleared current table"))
            .catch((err) =>
              console.error("Error clearing current table:", err)
            );
        } else {
          // Add to history and clear current table
          const historyEntry = {
            id: tableData.id,
            title: tableData.title || "Untitled Table",
            locationId: tableData.locationId,
            locationName: tableData.locationName || "",
            date: new Date(),
            role: "participant",
            endedBy: "creator",
          };

          updateDoc(userRef, {
            tableHistory: arrayUnion(historyEntry),
            currentTable: null,
          })
            .then(() =>
              console.log("Updated table history and cleared current table")
            )
            .catch((err) => console.error("Error updating history:", err));
        }
      })
      .catch((err) => console.error("Error getting user document:", err));

    // Show notification and redirect
    setShowEndNotification(true);
    setTimeout(() => {
      navigate("/home");
    }, 3000);
  };

  // Handle table becoming inactive
  const handleInactiveTable = (tableData) => {
    if (statusHandled.current || !user) return;

    statusHandled.current = true;
    console.log("Table is inactive - updating user and showing notification");

    // Use the centralized utility for consistent history tracking
    leaveTableUtil(user.uid, tableData, false, "Table ended by creator")
      .then(() => {
        console.log("User document updated successfully");
      })
      .catch((err) => {
        console.error("Error updating user document:", err);
      });

    // Show notification and set redirect
    setShowEndNotification(true);
    setTimeout(() => {
      navigate("/home");
    }, 5000);
  };

  // Update conversation prompt
  const updateConversationPrompt = async (prompt) => {
    if (!isCreator) return;

    setIsLoading(true);
    try {
      const tableRef = getTableRef();

      await updateDoc(tableRef, {
        conversationPrompt: prompt,
        promptUpdatedAt: new Date(),
      });

      setConversationPrompt(prompt);
      return true;
    } catch (err) {
      console.error("Error updating conversation prompt:", err);
      setError("Failed to update conversation prompt: " + err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Leave the table
  const leaveTable = async () => {
    if (authLoading) {
      setError("Authentication is still loading. Please wait.");
      return;
    }

    if (!user) {
      setError("You must be logged in to leave a table");
      return;
    }

    setIsLoading(true);
    try {
      // Use the centralized utility for consistent history tracking
      try {
        await leaveTableUtil(
          user.uid,
          table,
          isCreator,
          isCreator ? "Creator left the table" : "User left the table"
        );
      } catch (err) {
        console.error("Error leaving table:", err);
        setError("Failed to leave table: " + err.message);
        // Don't rethrow - we still want to clean up and navigate
      }

      // Clean up Firestore listener before navigation
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }

      // Always navigate back to home, even if there was an error
      navigate("/home");
    } catch (err) {
      console.error("Unexpected error in leaveTable:", err);
      setError("Failed to leave table: " + err.message);

      // As a last resort, still try to navigate
      navigate("/home");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    table,
    isLoading: isLoading || authLoading,
    error,
    showEndNotification,
    leaveTable,
    conversationPrompt,
    updateConversationPrompt,
    tableUsers,
    isLoadingUsers,
    authReady: !authLoading,
  };
};
