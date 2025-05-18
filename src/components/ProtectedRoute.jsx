import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Loading from "./Loading";

/**
 * ProtectedRoute Component
 *
 * A wrapper component that ensures only authenticated users can access the protected routes.
 * It checks the authentication state and redirects to the login page if not authenticated.
 */

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return children;
};

export default ProtectedRoute;
