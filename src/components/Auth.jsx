import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { autoLoginTestUser } from "../utils/initializeTestUsers";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import "../styles/Auth.css";

/**
 * Auth Component
 *
 * Handles user authentication including login and signup.
 * Provides interface for:
 * - User login with email/password
 * - New user signup with display name
 * - Quick login for development environments
 *
 * Uses Firebase Authentication via the useAuth hook.
 */

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const { login, signup, error } = useAuth();
  const navigate = useNavigate();

  // Check if we're in development environment to show test user login options
  const isDev =
    process.env.NODE_ENV === "development" ||
    window.location.hostname === "localhost";

  /**
   * Handles form submission for login or signup
   * @param {React.FormEvent} e - Form submission event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(email, password, displayName);
      }
      navigate("/home");
    } catch (err) {
      console.error("Auth error:", err);
    }
  };

  /**
   * Handles auto-login for development environment
   * @param {string} userType - Type of test user to log in as
   */
  const handleAutoLogin = async (userType) => {
    try {
      const userCredential = await autoLoginTestUser(userType);

      // Ensure we get the user data to populate displayName correctly
      if (userCredential && userCredential.user) {
        // Refresh user document in Firestore to ensure displayName is set
        const userRef = doc(db, "users", userCredential.user.uid);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
          // Create user document if it doesn't exist
          await setDoc(userRef, {
            displayName: userCredential.user.displayName || userType,
            tableHistory: [],
            currentTable: null,
            createdAt: serverTimestamp(),
          });
        } else if (!userDoc.data().displayName) {
          // Update displayName if it's missing
          await updateDoc(userRef, {
            displayName: userCredential.user.displayName || userType,
          });
        }
      }

      navigate("/home");
    } catch (err) {
      console.error("Auto-login error:", err);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-header">
          <h2>{isLogin ? "Welcome Back" : "Create Account"}</h2>
          <p>{isLogin ? "Sign in to continue" : "Join us today"}</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {/* Display name field (only shown for signup) */}
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="displayName">Display Name</label>
              <input
                type="text"
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                placeholder="Enter your display name"
              />
            </div>
          )}

          {/* Email field */}
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
            />
          </div>

          {/* Password field */}
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="auth-button">
            {isLogin ? "Login" : "Sign Up"}
          </button>

          {/* Development-only auto-login buttons */}
          {isDev && (
            <div className="dev-buttons">
              <p className="dev-notice">Development Quick Login:</p>
              <div className="dev-login-buttons">
                <button
                  type="button"
                  className="dev-login-button"
                  onClick={() => handleAutoLogin("adam")}
                >
                  Login as John
                </button>
                <button
                  type="button"
                  className="dev-login-button"
                  onClick={() => handleAutoLogin("najib")}
                >
                  Login as Najib
                </button>
              </div>
            </div>
          )}
        </form>

        {/* Toggle between login and signup */}
        <div className="auth-footer">
          <p>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              className="toggle-auth"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? "Sign Up" : "Sign In"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
