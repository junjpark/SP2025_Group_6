# Cory Frontend - Refactored Structure

This document describes the refactored structure of the Cory frontend application.

## 📁 Directory Structure

```
src/
├── components/           # Reusable UI components
│   └── ProtectedRoute.jsx
├── contexts/            # React Context providers
│   └── AuthContext.jsx
├── pages/              # Page components
│   ├── LoginPage.jsx
│   ├── SignupPage.jsx
│   └── DashboardPage.jsx
├── styles/             # CSS stylesheets
│   ├── globals.css
│   ├── LoginPage.css
│   ├── SignupPage.css
│   └── DashboardPage.css
├── App.jsx             # Main application component
├── main.jsx            # Application entry point
└── README.md           # This file
```

## 🎯 Component Organization

### Pages (`/pages`)
- **LoginPage.jsx**: Handles user authentication (email/password + Google OAuth)
- **SignupPage.jsx**: Handles user registration with form validation
- **DashboardPage.jsx**: Main dashboard for authenticated users

### Components (`/components`)
- **ProtectedRoute.jsx**: Route guard for authenticated routes

### Contexts (`/contexts`)
- **AuthContext.jsx**: Global authentication state management

### Styles (`/styles`)
- **globals.css**: Global styles, CSS reset, and utility classes
- **LoginPage.css**: Styles specific to the login page
- **SignupPage.css**: Styles specific to the signup page
- **DashboardPage.css**: Styles specific to the dashboard page

## 🎨 Styling Approach

- **Separated Concerns**: Each page has its own CSS file
- **Global Styles**: Common styles and utilities in `globals.css`
- **Dark Theme**: Consistent dark greyish-blue-black color scheme
- **Responsive Design**: Mobile-first approach with flexible layouts
- **Modern UI**: Card-based design with hover animations and shadows

## 🔧 Key Features

### Authentication
- Email/password authentication
- Google OAuth integration
- Server-side session management
- Automatic token validation
- Protected routes

### UI/UX
- Centered layouts for all pages
- Dark theme throughout
- Smooth animations and transitions
- Form validation and error handling
- Loading states

### Code Organization
- Clear separation of concerns
- Comprehensive documentation
- Consistent naming conventions
- Modular CSS architecture

## 🚀 Getting Started

1. Install dependencies: `npm install`
2. Start development server: `npm run dev`
3. Open browser to `http://localhost:5173`

## 📝 File Documentation

Each file includes a comprehensive comment block at the top explaining:
- Purpose and functionality
- Key features
- Author and version information
- Usage examples where applicable

This refactored structure provides better maintainability, scalability, and code organization for the Cory authentication system.
