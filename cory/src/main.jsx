/**
 * Main Entry Point
 * 
 * This is the main entry point for the React application.
 * It initializes the React app, sets up Google OAuth provider,
 * and renders the root App component.
 * 
 * Features:
 * - React 18 StrictMode for development
 * - Google OAuth provider setup
 * - Global styles import
 * - Root component rendering
 * 
 * @author Cory Authentication System
 * @version 1.0.0
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/globals.css'
import App from './App.jsx'
import { GoogleOAuthProvider } from '@react-oauth/google'

const CLIENT_ID = import.meta.env.VITE_CLIENT_ID

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={CLIENT_ID}> 
      <App />
    </GoogleOAuthProvider>
  </StrictMode>
)


