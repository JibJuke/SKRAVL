import { useState, useEffect } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  deleteUser,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../firebaseConfig";

/**
 * useAuth Hook
 *
 * Custom hook that provides authentication functionality for the application.
 * Handles user authentication state management and Firebase operations:
 * - User sign-up (with Firestore document creation)
 * - User login
 * - User logout
 * - Account deletion (both Auth and Firestore)
 * - Authentication state tracking
 * The hook maintains the user state and authentication loading/error states.
 *
 * @returns {Object} Authentication methods and state
 */

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  /**
   * Creates a user document in Firestore after successful registration
   * @param {string} uid - User ID from Firebase Auth
   * @param {string} displayName - User's display name
   * @returns {Promise<void>}
   */
  const createUserDocument = async (uid, displayName) => {
    try {
      const userRef = doc(db, "users", uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        await setDoc(userRef, {
          displayName,
          tableHistory: [],
          currentTable: null,
          createdAt: serverTimestamp(),
        });
      }
    } catch (err) {
      console.error("Error creating user document:", err);
      throw err;
    }
  };

  /**
   * Registers a new user with email, password and display name
   * Also creates a corresponding user document in Firestore
   *
   * @param {string} email - User's email
   * @param {string} password - User's password
   * @param {string} displayName - User's display name
   * @returns {Promise<Object>} Firebase user object
   */
  const signup = async (email, password, displayName) => {
    try {
      setError(null);
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Update profile with display name
      await updateProfile(userCredential.user, {
        displayName: displayName,
      });

      // Create user document in Firestore
      await createUserDocument(userCredential.user.uid, displayName);

      return userCredential.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  /**
   * Logs in an existing user with email and password
   *
   * @param {string} email - User's email
   * @param {string} password - User's password
   * @returns {Promise<Object>} Firebase user object
   */
  const login = async (email, password) => {
    try {
      setError(null);
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      return userCredential.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  /**
   * Logs out the current user
   * @returns {Promise<void>}
   */
  const logout = async () => {
    try {
      setError(null);
      await signOut(auth);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  /**
   * Deletes the current user's account
   * Removes both the Firebase Auth user and the Firestore user document
   * @returns {Promise<void>}
   */
  const deleteAccount = async () => {
    try {
      setError(null);
      if (!user) throw new Error("No user logged in");

      // Delete the user document from Firestore
      await deleteDoc(doc(db, "users", user.uid));

      // Delete the Firebase Auth user
      await deleteUser(user);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    user,
    loading,
    error,
    signup,
    login,
    logout,
    deleteAccount,
  };
};
