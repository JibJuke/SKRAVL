import { Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import HomePage from "./components/HomePage";
import Profile from "./components/Profile";
import Navbar from "./components/Navbar";
import TableRoom from "./components/TableRoom";
import Auth from "./components/Auth";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./hooks/useAuth";
import Loading from "./components/Loading";
import { LocationProvider } from "./contexts/LocationContext";

// Add a small comment to trigger a new CI/CD deployment
function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/landing" replace />} />
      <Route path="/landing" element={<LandingPage />} />
      <Route
        path="/auth"
        element={user ? <Navigate to="/home" replace /> : <Auth />}
      />

      {/* Protected Routes */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <LocationProvider>
              <Navbar />
              <Routes>
                <Route path="/home" element={<HomePage />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/table-room" element={<TableRoom />} />
                <Route path="*" element={<Navigate to="/home" replace />} />
              </Routes>
            </LocationProvider>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
