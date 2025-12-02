/**
 * Main App Component
 *
 * This is the root component of the React application.
 * It sets up routing, authentication context, and defines all application routes.
 *
 * Features:
 * - React Router setup
 * - Authentication context provider
 * - Route protection
 * - Public and private routes
 */

import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/Login/LoginPage";
import SignupPage from "./pages/Signup/SignupPage";
import Library from "./pages/Library/Library";
import ProjectView from "./pages/Project/ProjectView";
import ForgotPassword from "./pages/ForgotPassword/ForgotPassword";
import ResetPassword from "./pages/ResetPassword/ResetPassword";

/**
 * Main App Component
 *
 * @returns {JSX.Element} The main application component
 */
export default function App() {
  return (
    // Wrap the entire app with authentication context
    // This provides authentication state and methods to all child components
    <AuthProvider>
      {/* Set up React Router for navigation */}
      <Router>
        <Routes>
          {/* Public Routes - accessible without authentication */}

          {/* Login page - redirects to dashboard if already logged in */}
          <Route path="/login" element={<LoginPage />} />

          {/* Signup page - redirects to login after successful registration */}
          <Route path="/signup" element={<SignupPage />} />

          {/* Protected Routes - require authentication */}

          {/* Dashboard - main application interface */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Library />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:projectId"
            element={
              <ProtectedRoute>
                <ProjectView />
              </ProtectedRoute>
            }
          />

          <Route path="/forgot-password" element={<ForgotPassword />} />

          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Catch-all route - redirect to library for any unknown paths */}
          <Route
            path="*"
            element={
              <ProtectedRoute>
                <Library />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
