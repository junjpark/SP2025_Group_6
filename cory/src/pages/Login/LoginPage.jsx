import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../contexts/AuthContext';
import './LoginPage.css';

export default function LoginPage() {
  const navigate = useNavigate();
  
  // Authentication context hook
  const { user, loading, login, googleLogin } = useAuth();
  
  // Form state management
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !loading) {
      console.log('User already authenticated, redirecting to dashboard');
      navigate("/");
    }
  }, [user, loading, navigate]);

  // Show loading if authentication is in progress
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div>Loading...</div>
      </div>
    );
  }

  /**
   * Handles traditional email/password login
   * @param {Event} e - Form submit event
   */
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    const result = await login(email, password);
    
    if (result.success) {
      console.log('Login successful, redirecting to dashboard');
      // Redirection is now handled by the useEffect based on `user` state
    } else {
      setError(result.error || "Login failed. Please try again.");
    }
  };

  /**
   * Handles Google OAuth login
   * @param {Object} credentialResponse - Google OAuth response
   */
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setError("");

      // Decode Google JWT token
      const base64Url = credentialResponse.credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      const googleData = JSON.parse(jsonPayload);
      
      const result = await googleLogin(googleData);
      
      if (result.success) {
        console.log('Google login successful, redirecting to dashboard');
        // Redirection is now handled by the useEffect based on `user` state
      } else {
        setError(result.error || "Google login failed. Please try again.");
      }
    } catch (error) {
      console.error('Google login error:', error);
      setError('Google login failed. Please try again.');
    }
  };

  /**
   * Toggles password visibility
   */
  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  return (
    <div className="page-wrapper">
      <div className="login-container">
        <h1 className="login-title">Login</h1>
      
        {/* Error message display */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        {/* Google OAuth Login */}
        <div className="google-login-container">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError('Google login failed')}
          />
        </div>
        
        {/* Divider */}
        <div className="divider">
          <div className="divider-line"></div>
          <span className="divider-text">or</span>
        </div>
        
        {/* Email/Password Login Form */}
        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <label htmlFor="email-input" className="input-label">Email:</label>
            <input
              id="email-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="form-input"
            />
          </div>

          <div className="input-group">
            <label htmlFor="password-input" className="input-label">Password:</label>
            <div className="password-container">
              <input
                id="password-input"
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
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="submit-button"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        {/* Sign up link */}
        <div className="signup-link">
          <p>
            Don&apos;t have an account?{' '}
            <a href="/signup" className="link">
              Sign up here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
