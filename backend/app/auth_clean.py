"""
Authentication utilities for JWT token handling and password management.
Includes password hashing, token creation/validation, and user authentication.
"""

from datetime import datetime, timedelta
import os
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from dotenv import load_dotenv
from .database import get_db_connection


# Load environment variables
load_dotenv()

# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain password against its hash.

    Args:
        plain_password: The plain text password
        hashed_password: The hashed password from database

    Returns:
        bool: True if password matches, False otherwise
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    Hash a password for secure storage.

    Args:
        password: The plain text password

    Returns:
        str: The hashed password
    """
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token.

    Args:
        data: The data to encode in the token
        expires_delta: Token expiration time (defaults to 15 minutes)

    Returns:
        str: The encoded JWT token
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> Optional[str]:
    """
    Verify and decode a JWT token.

    Args:
        token: The JWT token to verify

    Returns:
        Optional[str]: The email from the token if valid, None otherwise
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            return None
        return email
    except JWTError:
        return None


def authenticate_user(email: str, password: str) -> Optional[dict]:
    """
    Authenticate a user with email and password.

    Args:
        email: User's email address
        password: User's plain text password

    Returns:
        Optional[dict]: User data if authentication successful, None otherwise
    """
    conn = get_db_connection()
    if not conn:
        print("Database connection failed during authentication")
        return None

    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, email, password_hash, display_name FROM users WHERE email = %s",
                (email,)
            )
            user = cur.fetchone()

            if not user or not verify_password(password, user['password_hash']):
                print(f"Authentication failed for email: {email}")
                return None

            return {
                "user_id": user['id'],
                "email": user['email'],
                "display_name": user['display_name']
            }
    except Exception as e:
        print(f"Authentication error: {e}")
        return None
    finally:
        if conn:
            conn.close()


def get_user_by_email(email: str) -> Optional[dict]:
    """
    Get user data by email address.

    Args:
        email: User's email address

    Returns:
        Optional[dict]: User data if found, None otherwise
    """
    conn = get_db_connection()
    if not conn:
        print("Database connection failed while fetching user")
        return None

    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, email, display_name, google_id FROM users WHERE email = %s",
                (email,)
            )
            user = cur.fetchone()
            if user:
                user['user_id'] = user['id']  # Add user_id field for compatibility
            return user
    except Exception as e:
        print(f"Get user error: {e}")
        return None
    finally:
        if conn:
            conn.close()


def get_user_by_google_id(google_id: str) -> Optional[dict]:
    """
    Get user data by Google ID.

    Args:
        google_id: User's Google ID

    Returns:
        Optional[dict]: User data if found, None otherwise
    """
    conn = get_db_connection()
    if not conn:
        print("Database connection failed while fetching user by Google ID")
        return None

    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, email, display_name, google_id FROM users WHERE google_id = %s",
                (google_id,)
            )
            user = cur.fetchone()
            if user:
                user['user_id'] = user['id']  # Add user_id field for compatibility
            return user
    except Exception as e:
        print(f"Get user by Google ID error: {e}")
        return None
    finally:
        if conn:
            conn.close()
