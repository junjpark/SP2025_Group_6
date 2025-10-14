import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import "./NavBar.css"


export default function NavBar(){
    const { user, logout } = useAuth();
    const handleLogout = () => {
        if (window.confirm('Are you sure you want to logout?')) {
          logout();
        }
      };
      return (
        <div>
          {/* Header with user info and logout */}
          <header className="dashboard-header">
            <h1 className="dashboard-title">cory</h1>
            {user &&(<div className="user-info">
              <span className="welcome-text">Welcome, {user?.display_name}!</span>
              <button 
                onClick={handleLogout}
                className="logout-button"
              >
                Logout
              </button>
            </div>
            )}
          </header>
        </div>
      );
    
}