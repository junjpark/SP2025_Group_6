/**
 * SignupPage Component
 * 
 * This component handles user registration with email, password, and display name.
 * It provides a centered signup form with dark theme styling and form validation.
 * 
 * Features:
 * - User registration with email, password, and display name
 * - Form validation and error handling
 * - Password visibility toggle
 * - Password strength requirements
 * - Responsive design with dark theme
 * - Automatic redirection to login after successful signup
 * 
 * @author Cory Authentication System
 * @version 1.0.0
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { useAuth } from '../contexts/AuthContext';
import '../styles/SignupPage.css';

export default function SignupPage() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  
  // Form state management
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /**
   * Handles user signup
   * @param {Event} e - Form submit event
   */
  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validate all fields
    if (!email || !password || !displayName) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    // Validate password strength
    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    const result = await signup(email, password, displayName);
    
    if (result.success) {
      alert("Signup successful! Please login.");
      navigate("/login");
    } else {
      setError(result.error || "Signup failed. Please try again.");
    }
    
    setLoading(false);
  };

  /**
   * Toggles password visibility
   */
  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  return (
    <div className="page-wrapper">
      <div className="signup-container">
        <h1 className="signup-title">Create an Account!</h1>
        
        {/* Error message display */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        {/* Signup Form */}
        <form onSubmit={handleSignup} className="signup-form">
          <div className="input-group">
            <label className="input-label">Display Name:</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your display name"
              required
              className="form-input"
            />
          </div>

          <div className="input-group">
            <label className="input-label">Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="form-input"
            />
          </div>

          <div className="input-group">
            <label className="input-label">Password:</label>
            <div className="password-container">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="password-input"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="password-toggle"
              >
                {showPassword ? <AiOutlineEye /> : <AiOutlineEyeInvisible />}
              </button>
            </div>
            <div className="password-hint">
              Password must be at least 6 characters long
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="submit-button"
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>
        
        {/* Login link */}
        <div className="login-link">
          <p>
            Already have an account?{' '}
            <a href="/login" className="link">
              Login here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
