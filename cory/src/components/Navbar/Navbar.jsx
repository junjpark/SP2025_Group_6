import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import "./NavBar.css";

export default function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      logout();
    }
  };
  const handleNavigate = () => {
    navigate("/");
  };
  return (
    <div>
      {/* Header with user info and logout */}
      <header className="dashboard-header">
        <button
          className="dashboard-title"
          onClick={handleNavigate}
          aria-label="Go to home page"
        >
          cory
        </button>
        {user && (
          <div className="user-info">
            <span className="welcome-text">Welcome, {user?.display_name}!</span>
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </div>
        )}
      </header>
    </div>
  );
}
