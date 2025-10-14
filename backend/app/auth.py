"""
Authentication utilities for password management and user authentication.
Handles password hashing and user authentication for server-side sessions.
"""

from typing import Optional
import psycopg2
from passlib.context import CryptContext
from dotenv import load_dotenv
from .database import get_db_connection


load_dotenv()

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
        return None

    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, email, password_hash, display_name FROM users WHERE email = %s",
                (email,)
            )
            user = cur.fetchone()

            if not user or not verify_password(password, user['password_hash']):
                return None

            return {
                "user_id": user['id'],
                "email": user['email'],
                "display_name": user['display_name']
            }
    except (psycopg2.DatabaseError, psycopg2.OperationalError) as error:
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
    except (psycopg2.DatabaseError, psycopg2.OperationalError) as error:
        print(f"Get user error: {error}")
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
    except (psycopg2.DatabaseError, psycopg2.OperationalError) as error:
        print(f"Get user by Google ID error: {error}")
        return None
    finally:
        if conn:
            conn.close()
