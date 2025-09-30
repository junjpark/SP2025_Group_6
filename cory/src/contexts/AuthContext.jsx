/**
 * Authentication Context for React Application
 * 
 * This context provides authentication state and methods throughout the app.
 * It manages user login, logout, token storage, and user profile data.
 * 
 * Features:
 * - JWT token management
 * - User profile state
 * - Login/logout functionality
 * - Google OAuth integration
 * - Automatic token validation
 * - Loading states
 */

/**
 * Authentication Context
 * 
 * This file provides authentication state management for the entire application.
 * It uses React Context API to share authentication state and methods across components.
 * 
 * Features:
 * - User authentication state management
 * - JWT token handling and persistence
 * - Login/logout functionality (email/password and Google OAuth)
 * - User profile management
 * - Loading state management
 * - Automatic token validation on app load
 * 
 * @author Cory Authentication System
 * @version 1.0.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

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
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
export const AuthProvider = ({ children }) => {
  // State management
  const [user, setUser] = useState(null);           // Current user data
  const [loading, setLoading] = useState(true);     // Loading state for auth operations
  const [token, setToken] = useState(               // JWT token from localStorage
    localStorage.getItem('token')
  );

  /**
   * Effect to fetch user profile when token is available
   * Runs on component mount and when token changes
   */
  useEffect(() => {
    if (token) {
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, [token]);

  /**
   * Fetch user profile from the backend using the stored token
   * Validates the token and updates user state
   */
  const fetchUserProfile = async () => {
    try {
      const response = await fetch('http://localhost:8000/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        console.log('User profile loaded:', userData);
      } else {
        // Token is invalid or expired
        console.log('Token validation failed, logging out');
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Network error - remove invalid token
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Store token in localStorage and state
        localStorage.setItem('token', data.access_token);
        setToken(data.access_token);
        
        // Wait for user profile to be fetched
        await fetchUserProfile();
        
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
        
        // Store token in localStorage and state
        localStorage.setItem('token', data.access_token);
        setToken(data.access_token);
        
        // Wait for user profile to be fetched
        await fetchUserProfile();
        
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
   * Clears token and user data from state and localStorage
   */
  const logout = () => {
    console.log('Logging out user');
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  /**
   * Check if user is authenticated
   * 
   * @returns {boolean} True if user is logged in, false otherwise
   */
  const isAuthenticated = () => {
    return !!user && !!token;
  };

  // Context value object
  const value = {
    // State
    user,           // Current user data
    token,          // JWT token
    loading,        // Loading state
    
    // Methods
    login,          // Email/password login
    googleLogin,    // Google OAuth login
    signup,         // User registration
    logout,         // User logout
    isAuthenticated, // Check auth status
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
