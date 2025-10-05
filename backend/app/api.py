"""
FastAPI application with authentication endpoints.
Handles user registration, login, Google OAuth, and protected routes.
"""
from datetime import timedelta
import psycopg2

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from .models import UserCreate, UserLogin, GoogleUserCreate, UserResponse, Token
from .auth import (
    authenticate_user,
    create_access_token,
    verify_token,
    get_password_hash,
    get_user_by_email,
    get_user_by_google_id
)
from .database import get_db_connection


# Initialize FastAPI application
app = FastAPI(
    title="Cory Authentication API",
    description="Authentication API for the Cory video annotation application",
    version="1.0.0"
)

# CORS middleware configuration
# This allows the React frontend to communicate with the backend
origins = [
    "http://localhost:5173",  # Vite development server
    "http://localhost:3000",  # Alternative React dev server
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,  # Allow cookies and authentication headers
    allow_methods=["*"],     # Allow all HTTP methods
    allow_headers=["*"],     # Allow all headers
)

# HTTP Bearer token security scheme
security = HTTPBearer()


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Dependency to get the current authenticated user from JWT token.
    Args: credentials: HTTP Bearer token from request header
    Returns: dict: User data if token is valid
    Raises: HTTPException: If token is invalid or user not found
    """
    token = credentials.credentials
    email = verify_token(token)

    if email is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = get_user_by_email(email)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    return user

@app.get("/", tags=["root"])
async def read_root():
    return {"message": "Cory Authentication API is running!"}


# User registration endpoint
@app.post("/signup", response_model=UserResponse, tags=["authentication"])
async def signup(user_data: UserCreate):
    """
    Register a new user with email and password.
    Args: user_data: User registration data (email, password, display_name)
    Returns: UserResponse: User data without password
    Raises: HTTPException: If email already exists or database error
    """
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")

    try:
        with conn.cursor() as cur:
            # Check if user already exists
            cur.execute("SELECT id FROM users WHERE email = %s", (user_data.email,))
            existing_user = cur.fetchone()

            if existing_user:
                raise HTTPException(
                    status_code=400,
                    detail="Email already registered"
                )

            # Hash the password before storing
            hashed_password = get_password_hash(user_data.password)

            # Insert new user into database
            cur.execute(
                """INSERT INTO users (email, password_hash, display_name)
                   VALUES (%s, %s, %s) RETURNING id, email, display_name""",
                (user_data.email, hashed_password, user_data.display_name)
            )
            user = cur.fetchone()
            conn.commit()

            # Return user data (excluding password hash)
            return UserResponse(
                user_id=user['id'],
                email=user['email'],
                display_name=user['display_name']
            )

    except HTTPException:
        # Re-raise HTTP exceptions (like email already exists)
        raise
    except Exception as error:
        print(f"Signup error: {error}")
        conn.rollback()  # Rollback transaction on error
        raise HTTPException(status_code=500, detail="Internal server error") from error
    finally:
        conn.close()


# User login endpoint
@app.post("/login", response_model=Token, tags=["authentication"])
async def login(user_credentials: UserLogin):
    """
    Authenticate user with email and password.
    Args: user_credentials: Login credentials (email, password)
    Returns: Token: JWT access token and type
    Raises: HTTPException: If credentials are invalid
    """
    # Authenticate user with email and password
    user = authenticate_user(user_credentials.email, user_credentials.password)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create JWT token with 30-minute expiration
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user["email"]},
        expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}


# Google OAuth login endpoint
@app.post("/google-login", response_model=Token, tags=["authentication"])
async def google_login(google_user: GoogleUserCreate):
    """
    Authenticate or register user with Google OAuth.
    Args: google_user: Google user data (email, display_name, google_id)
    Returns: Token: JWT access token and type
    Raises: HTTPException: If database error occurs
    """
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")

    try:
        with conn.cursor() as cur:
            # Check if user exists with this Google ID
            user = get_user_by_google_id(google_user.google_id)

            if not user:
                # Check if user exists with this email (for account linking)
                existing_user = get_user_by_email(google_user.email)

                if existing_user:
                    # Link Google ID to existing account
                    cur.execute(
                        "UPDATE users SET google_id = %s WHERE email = %s",
                        (google_user.google_id, google_user.email)
                    )
                    conn.commit()
                    user = get_user_by_google_id(google_user.google_id)
                else:
                    # Create new user with Google OAuth data
                    cur.execute(
                        """INSERT INTO users (email, display_name, google_id)
                           VALUES (%s, %s, %s) RETURNING id, email, display_name, google_id""",
                        (google_user.email, google_user.display_name, google_user.google_id)
                    )
                    user = cur.fetchone()
                    conn.commit()

            # Create JWT token
            access_token_expires = timedelta(minutes=30)
            access_token = create_access_token(
                data={"sub": user["email"]},
                expires_delta=access_token_expires
            )
            return {"access_token": access_token, "token_type": "bearer"}

    except Exception as error:
        print(f"Google login error: {error}")
        conn.rollback()
        raise HTTPException(status_code=500, detail="Internal server error") from error
    finally:
        conn.close()

# Get current user profile endpoint
@app.get("/me", response_model=UserResponse, tags=["user"])
async def read_users_me(current_user: dict = Depends(get_current_user)):
    """
    Get the current authenticated user's profile.

    Args:
        current_user: Current user data from JWT token (dependency injection)

    Returns:
        UserResponse: Current user's profile data
    """
    return UserResponse(
        user_id=current_user['user_id'],
        email=current_user['email'],
        display_name=current_user['display_name'],
        google_id=current_user.get('google_id')
    )


# Logout endpoint
@app.post("/logout", tags=["authentication"])
async def logout():
    return {"message": "Successfully logged out"}
