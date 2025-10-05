# Complete Authentication System Setup Guide

This guide walks you through setting up the complete authentication system for the Cory application.

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- Python (v3.8 or higher)
- PostgreSQL database
- Git

### 1. Backend Setup

#### Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

#### Configure Database
1. Update `backend/.env` with your database credentials:
```env
DB_HOST=localhost
DB_NAME=cory
DB_USER=your_username
DB_PASSWORD=your_password
DB_PORT=5432
SECRET_KEY=your-super-secret-jwt-key-here
```

2. Run database migrations:
```bash
# Make sure your PostgreSQL database is running
# The database schema is already defined in sql/V1__Initializing_cory_database.sql
```

#### Start Backend Server
```bash
cd backend
uvicorn app.api:app --reload --host 0.0.0.0 --port 8000
```

### 2. Frontend Setup

#### Install Dependencies
```bash
cd cory
npm install
```

#### Configure Environment
The `.env.local` file is already configured with the Google OAuth client ID.

#### Start Frontend Server
```bash
cd cory
npm run dev
```

## 🔧 Detailed Configuration

### Backend Configuration

#### Database Connection
The backend uses PostgreSQL with the following configuration:
- **Host**: localhost (configurable via `DB_HOST`)
- **Database**: cory (configurable via `DB_NAME`)
- **Port**: 5432 (configurable via `DB_PORT`)

#### JWT Configuration
- **Secret Key**: Set in `SECRET_KEY` environment variable
- **Algorithm**: HS256
- **Expiration**: 30 minutes (configurable in `auth.py`)

#### API Endpoints
- `POST /signup` - User registration
- `POST /login` - Email/password login
- `POST /google-login` - Google OAuth login
- `GET /me` - Get current user profile
- `POST /logout` - Logout (client-side)
- `GET /health` - Health check

### Frontend Configuration

#### Authentication Context
The `AuthContext` provides:
- User state management
- Login/logout functionality
- Token storage
- Automatic token validation

#### Protected Routes
- Dashboard (`/`) - Requires authentication
- Login (`/login`) - Public
- Signup (`/signup`) - Public

#### Google OAuth
- Client ID configured in `.env.local`
- Automatic token handling
- User profile extraction

## 🛡️ Security Features

### Password Security
- **Hashing**: bcrypt with salt
- **Minimum Length**: 6 characters
- **Validation**: Client and server-side

### JWT Security
- **Secret Key**: Environment variable
- **Expiration**: 30 minutes
- **Algorithm**: HS256
- **Claims**: User email as subject

### CORS Protection
- **Allowed Origins**: Configured in backend
- **Credentials**: Enabled for authentication
- **Methods**: All HTTP methods allowed

## 📁 File Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── api.py              # FastAPI endpoints
│   ├── auth.py             # JWT and password utilities
│   ├── database.py         # Database connection
│   └── models.py           # Pydantic models
├── .env                    # Environment variables
└── requirements.txt        # Python dependencies

cory/
├── src/
│   ├── contexts/
│   │   └── AuthContext.jsx # Authentication context
│   ├── components/
│   │   ├── Dashboard.jsx   # Main dashboard
│   │   └── ProtectedRoute.jsx # Route protection
│   ├── Login.jsx           # Login component
│   ├── Signup.jsx          # Signup component
│   ├── App.jsx             # Main app component
│   └── main.jsx            # Entry point
├── .env.local              # Frontend environment
└── package.json            # Node dependencies
```

## 🔍 Testing the Authentication

### 1. Test User Registration
1. Navigate to `http://localhost:5173/signup`
2. Fill in the registration form
3. Submit and verify success message

### 2. Test User Login
1. Navigate to `http://localhost:5173/login`
2. Use the credentials from registration
3. Verify redirect to dashboard

### 3. Test Google OAuth
1. Click the Google login button
2. Complete Google authentication
3. Verify redirect to dashboard

### 4. Test Protected Routes
1. Try accessing `http://localhost:5173/` without login
2. Verify redirect to login page
3. Login and verify access to dashboard

## 🐛 Troubleshooting

### Common Issues

#### 1. Database Connection Error
- Verify PostgreSQL is running
- Check database credentials in `.env`
- Ensure database `cory` exists

#### 2. JWT Token Errors
- Verify `SECRET_KEY` is set in `.env`
- Check token expiration (30 minutes)
- Clear localStorage and try again

#### 3. Google OAuth Errors
- Verify `VITE_CLIENT_ID` in `.env.local`
- Check Google Cloud Console configuration
- Ensure redirect URIs are configured

#### 4. CORS Errors
- Verify backend is running on port 8000
- Check `origins` configuration in `api.py`
- Ensure frontend is running on port 5173

### Debug Mode
Enable debug logging by setting `DEBUG=True` in `backend/.env`.

## 🚀 Production Deployment

### Security Checklist
- [ ] Change `SECRET_KEY` to a secure random string
- [ ] Use environment variables for all secrets
- [ ] Enable HTTPS
- [ ] Configure proper CORS origins
- [ ] Set up database connection pooling
- [ ] Implement rate limiting
- [ ] Add request logging

### Environment Variables
```env
# Production Backend
SECRET_KEY=your-production-secret-key
DB_HOST=your-production-db-host
DB_NAME=cory_production
DB_USER=your-production-user
DB_PASSWORD=your-production-password
DEBUG=False
ENVIRONMENT=production
```

## 📚 API Documentation

Once the backend is running, visit `http://localhost:8000/docs` for interactive API documentation.

## 🤝 Contributing

When adding new features:
1. Update authentication context if needed
2. Add new protected routes
3. Update API endpoints with proper authentication
4. Test all authentication flows
5. Update this documentation

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review the console logs
3. Verify all environment variables
4. Test with a fresh database
