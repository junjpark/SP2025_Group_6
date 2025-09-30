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
      <main className="main-content">
        {/* User Profile Card */}
        <div className="profile-card">
          <h2 className="card-title">Your Profile</h2>
          <div className="user-details">
            <div className="detail-item">
              <div className="detail-label">Display Name</div>
              <div className="detail-value">{user?.display_name || 'N/A'}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Email</div>
              <div className="detail-value">{user?.email || 'N/A'}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">User ID</div>
              <div className="detail-value">{user?.user_id || 'N/A'}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Authentication</div>
              <div className="detail-value">
                {user?.google_id ? 'Google OAuth' : 'Email/Password'}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
