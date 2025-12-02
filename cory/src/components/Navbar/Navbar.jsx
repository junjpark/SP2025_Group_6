import { useAuth } from "../../contexts/AuthContext";
import { Link } from "react-router-dom";
import "./Navbar.css";

export default function NavBar({ onHelpClick }) {
  const { user, logout } = useAuth();
  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      logout();
    }
  };
  return (
    <div>
      {/* Header with user info and logout */}
      <header className="dashboard-header">
        <h1 className="dashboard-title">
          <Link to="/" className="brand-link">
          <img src="/../../../public/images/cory-logo.png" alt="Cory" className="logo" width="30" height="23"/>
            cory
          </Link>
        </h1>
        {user && (
          <div className="user-info">
            <span className="welcome-text">Welcome, {user?.display_name}!</span>
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
            <button className="help-button" onClick={onHelpClick}>
              Help
            </button>
          </div>
        )}
      </header>
    </div>
  );
}
