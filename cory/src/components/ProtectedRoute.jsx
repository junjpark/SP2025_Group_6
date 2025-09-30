/**
 * Protected Route Component
 * 
 * This component protects routes that require authentication.
 * It checks if a user is logged in and redirects to login if not.
 * 
 * Features:
 * - Authentication check
 * - Loading state handling
 * - Automatic redirect to login
 * - Customizable redirect path
 */

/**
 * ProtectedRoute Component
 * 
 * This component acts as a guard for routes that require user authentication.
 * It checks if a user is authenticated and redirects unauthenticated users to the login page.
 * 
 * Features:
 * - Authentication state checking
 * - Automatic redirection for unauthenticated users
 * - Loading state handling
 * - Seamless integration with React Router
 * 
 * @author Cory Authentication System
 * @version 1.0.0
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Protected Route Component
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if authenticated
 * @param {string} props.redirectTo - Path to redirect to if not authenticated (default: '/login')
 * @returns {React.ReactNode} Protected content or redirect component
 */
const ProtectedRoute = ({ children, redirectTo = '/login' }) => {
  const { user, loading } = useAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px'
      }}>
        <div>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #3498db',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 10px'
          }}></div>
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  // If user is authenticated, render the protected content
  if (user) {
    return children;
  }

  // If not authenticated, redirect to login page
  return <Navigate to={redirectTo} replace />;
};

export default ProtectedRoute;
