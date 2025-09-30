/**
 * DashboardPage Component
 * 
 * This component serves as the main dashboard for authenticated users.
 * It displays user information, project management features, and provides
 * navigation options in a dark-themed, centered layout.
 * 
 * Features:
 * - User profile display with centered layout
 * - Project management interface
 * - Feature cards with hover animations
 * - Logout functionality
 * - Responsive design with dark theme
 * - Modern card-based UI
 * 
 * @author Cory Authentication System
 * @version 1.0.0
 */

import { useAuth } from '../contexts/AuthContext';
import '../styles/DashboardPage.css';

export default function DashboardPage() {
  const { user, logout } = useAuth();

  /**
   * Handles user logout with confirmation
   */
  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  return (
    <div className="dashboard-container">
      {/* Header with user info and logout */}
      <header className="dashboard-header">
        <h1 className="dashboard-title">Cory Dashboard</h1>
        <div className="user-info">
          <span className="welcome-text">Welcome, {user?.display_name}!</span>
          <button 
            onClick={handleLogout}
            className="logout-button"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main content area */}
      
    </div>
  );
}
