"""
Authentication utilities for JWT token handling and password management.
Includes password hashing, token creation/validation, and user authentication.
"""

from datetime import datetime, timedelta
import os
from typing import Optional
import psycopg2
from jose import JWTError, jwt
from passlib.context import CryptContext
from .database import get_db_connection
from dotenv import load_dotenv

load_dotenv()

# JWT Configuration
SECRET_KEY = os.environ["SECRET_KEY"]
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token.
    Args:
        data: The data to encode in the token
        expires_delta: Token expiration time (defaults to 15 minutes)
    Returns: str: The encoded JWT token
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


# Returns the email from the token if valid, None otherwise
def verify_token(token: str) -> Optional[str]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            return None
        return email
    except JWTError:
        return None

# Returns dict User data if authentication successful, None otherwise
def authenticate_user(email: str, password: str) -> Optional[dict]:
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
    except (psycopg2.DatabaseError, psycopg2.OperationalError) as error:
        print(f"Authentication error: {error}")
        return None
    finally:
        if conn:
            conn.close()

#Returns dict user data if found, None otherwise
def get_user_by_email(email: str) -> Optional[dict]:
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

#Returns dict user data if found, None otherwise
def get_user_by_google_id(google_id: str) -> Optional[dict]:
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
