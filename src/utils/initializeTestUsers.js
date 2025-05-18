import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signOut,
} from "firebase/auth";
import {
  doc,
  setDoc,
  collection,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../firebaseConfig";

/**
 * Creates a test user and also initializes the user document in Firestore
 * This follows the same pattern from the useAuth hook to ensure consistency
 *
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} displayName - User display name
 * @returns {Promise<void>}
 */
const createTestUser = async (email, password, displayName) => {
  try {
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
    const uid = userCredential.user.uid;
    const userRef = doc(db, "users", uid);

    await setDoc(userRef, {
      displayName,
      tableHistory: [],
      currentTable: null,
      createdAt: serverTimestamp(),
    });

    console.log(`Created test user: ${displayName} (${email})`);

    // Sign out after creating the user
    await signOut(auth);
  } catch (err) {
    // Ignore "email already in use" errors as this is expected on subsequent runs
    if (err.code === "auth/email-already-in-use") {
      console.log(`Test user already exists: ${email}`);
    } else {
      console.error(`Error creating test user ${email}:`, err);
    }
  }
};

/**
 * Initializes test users for development
 * @returns {Promise<void>}
 */

export const initializeTestUsers = async () => {
  try {
    // Check if users collection already has content
    const usersRef = collection(db, "users");
    const snapshot = await getDocs(usersRef);

    // Only create test users if the collection is empty
    if (!snapshot.empty) {
      console.log("Users already exist. Skipping test user initialization.");
      return;
    }

    // Test users data
    const testUsers = [
      {
        displayName: "Adam",
        email: "adam@gmail.com",
        password: "adam123",
      },
      {
        displayName: "Najib",
        email: "najib@gmail.com",
        password: "najib123",
      },
    ];

    // Create each test user
    for (const user of testUsers) {
      await createTestUser(user.email, user.password, user.displayName);
    }

    console.log("Test users initialized successfully");
  } catch (error) {
    console.error("Error initializing test users:", error);
  }
};

/**
 * Automatically logs in as a test user - useful during development
 * @param {string} userType - Which test user to log in as ("adam" or "najib")
 * @returns {Promise<object|null>} - The user credential or null if login failed
 */

export const autoLoginTestUser = async (userType = "adam") => {
  if (
    process.env.NODE_ENV !== "development" &&
    !window.location.hostname.includes("localhost")
  ) {
    console.warn("Auto-login only available in development environment");
    return null;
  }

  try {
    let email, password;

    if (userType.toLowerCase() === "najib") {
      email = "najib@gmail.com";
      password = "najib123";
    } else {
      // Default to Adam
      email = "adam@gmail.com";
      password = "adam123";
    }

    console.log(`Auto-logging in as test user: ${email}`);
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    console.log("Auto-login successful");
    return userCredential;
  } catch (error) {
    console.error("Auto-login failed:", error);
    return null;
  }
};
