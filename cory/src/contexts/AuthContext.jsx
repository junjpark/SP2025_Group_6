import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Create the authentication context
const AuthContext = createContext();

/**
 * Custom hook to use authentication context
 * 
 * @returns {Object} Authentication context value
 * @throws {Error} If used outside of AuthProvider
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Authentication Provider Component
 * 
 * Wraps the application and provides authentication state and methods
 * to all child components through React Context.
 * Uses server-side sessions with HTTP-only cookies.
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
export const AuthProvider = ({ children }) => {
  // State management
  const [user, setUser] = useState(null);           // Current user data
  const [loading, setLoading] = useState(true);     // Loading state for auth operations
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Authentication status

  /**
   * Fetch user profile from the backend using server-side session
   * Validates the session and updates user state
   */
  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:8000/me', {
        method: 'GET',
        credentials: 'include', // Include cookies in the request
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setIsAuthenticated(true);
        console.log('User profile loaded:', userData);
      } else if (response.status === 401) {
        // No valid session - this is normal when not logged in
        setUser(null);
        setIsAuthenticated(false);
      } else {
        // Other error - log it
        console.error('Unexpected error fetching user profile:', response.status);
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Network error fetching user profile:', error);
      // Network error - clear user state
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Effect to fetch user profile on component mount
   * Checks for existing session on app startup
   */
  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  /**
   * Login with email and password
   * 
   * @param {string} email - User's email address
   * @param {string} password - User's password
   * @returns {Object} Result object with success status and error message
   */
  const login = async (email, password) => {
    try {
      setLoading(true);
      
      const response = await fetch('http://localhost:8000/login', {
        method: 'POST',
        credentials: 'include', // Include cookies in the request
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update user state with the returned user data
        setUser(data.user);
        setIsAuthenticated(true);
        
        console.log('Login successful');
        return { success: true };
      } else {
        const errorData = await response.json();
        console.error('Login failed:', errorData.detail);
        return { success: false, error: errorData.detail };
      }
    } catch (error) {
      console.error('Login network error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Login with Google OAuth
   * 
   * @param {Object} googleData - Google OAuth response data
   * @returns {Object} Result object with success status and error message
   */
  const googleLogin = async (googleData) => {
    try {
      setLoading(true);
      
      const response = await fetch('http://localhost:8000/google-login', {
        method: 'POST',
        credentials: 'include', // Include cookies in the request
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: googleData.email,
          display_name: googleData.name,
          google_id: googleData.sub,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update user state with the returned user data
        setUser(data.user);
        setIsAuthenticated(true);
        
        console.log('Google login successful');
        return { success: true };
      } else {
        const errorData = await response.json();
        console.error('Google login failed:', errorData.detail);
        return { success: false, error: errorData.detail };
      }
    } catch (error) {
      console.error('Google login network error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Register a new user
   * 
   * @param {string} email - User's email address
   * @param {string} password - User's password
   * @param {string} displayName - User's display name
   * @returns {Object} Result object with success status and error message
   */
  const signup = async (email, password, displayName) => {
    try {
      setLoading(true);
      
      const response = await fetch('http://localhost:8000/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          password, 
          display_name: displayName 
        }),
      });

      if (response.ok) {
        console.log('Signup successful');
        return { success: true };
      } else {
        const errorData = await response.json();
        console.error('Signup failed:', errorData.detail);
        return { success: false, error: errorData.detail };
      }
    } catch (error) {
      console.error('Signup network error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout the current user
   * Calls the server to destroy the session and clears local state
   */
  const logout = async () => {
    try {
      console.log('Logging out user');
      
      // Call server logout endpoint to destroy session
      await fetch('http://localhost:8000/logout', {
        method: 'POST',
        credentials: 'include', // Include cookies in the request
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      // Clear local state
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
      // Clear local state even if server call fails
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  // Context value object
  const value = {
    // State
    user,           // Current user data
    loading,        // Loading state
    isAuthenticated, // Authentication status
    
    // Methods
    login,          // Email/password login
    googleLogin,    // Google OAuth login
    signup,         // User registration
    logout,         // User logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
