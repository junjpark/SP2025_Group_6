"""
Server-side session management for user authentication.
Handles session creation, validation, and cleanup using database storage.
"""

import secrets
import json
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import psycopg2
from .database import get_db_connection

# Session configuration
SESSION_EXPIRE_HOURS = 24  # Sessions expire after 24 hours
SESSION_COOKIE_NAME = "cory_session"


def create_session(user_id: int, user_data: Dict[str, Any]) -> str:
    """
    Create a new session for a user.

    Args:
        user_id: The user's ID
        user_data: User data to store in session

    Returns:
        str: Session token
    """
    # Generate a unique session token
    session_token = secrets.token_urlsafe(32)

    # Calculate expiration time
    expires_at = datetime.utcnow() + timedelta(hours=SESSION_EXPIRE_HOURS)

    # Store session in database
    conn = get_db_connection()
    if not conn:
        raise ConnectionError("Database connection failed")

    try:
        with conn.cursor() as cur:
            # Insert new session - convert user_data to JSON string
            cur.execute(
                """INSERT INTO user_sessions
                   (session_token, user_id, user_data, expires_at, created_at)
                   VALUES (%s, %s, %s, %s, %s)""",
                (session_token, user_id, json.dumps(user_data),
                 expires_at, datetime.utcnow())
            )
            conn.commit()

        return session_token

    except (psycopg2.DatabaseError, psycopg2.OperationalError) as error:
        print(f"Session creation error: {error}")
        conn.rollback()
        raise RuntimeError("Failed to create session") from error
    finally:
        if conn:
            conn.close()


def validate_session(session_token: str) -> Optional[Dict[str, Any]]:
    """
    Validate a session token and return user data if valid.

    Args:
        session_token: The session token to validate

    Returns:
        Optional[Dict]: User data if session is valid, None otherwise
    """
    if not session_token:
        return None

    conn = get_db_connection()
    if not conn:
        return None

    try:
        with conn.cursor() as cur:
            # Get session data
            cur.execute(
                """SELECT user_id, user_data, expires_at
                   FROM user_sessions
                   WHERE session_token = %s AND expires_at > %s""",
                (session_token, datetime.utcnow())
            )
            session_data = cur.fetchone()

            if not session_data:
                return None

            # Parse user_data JSON and return user data
            # Check if user_data is already a dict (from PostgreSQL JSONB) or needs parsing
            if isinstance(session_data['user_data'], dict):
                user_data = session_data['user_data']
            else:
                user_data = json.loads(session_data['user_data'])

            return {
                "user_id": session_data['user_id'],
                **user_data
            }

    except (psycopg2.DatabaseError, psycopg2.OperationalError) as error:
        print(f"Session validation error: {error}")
        return None
    finally:
        if conn:
            conn.close()


def destroy_session(session_token: str) -> bool:
    """
    Destroy a session by removing it from the database.

    Args:
        session_token: The session token to destroy

    Returns:
        bool: True if session was destroyed, False otherwise
    """
    if not session_token:
        return False

    conn = get_db_connection()
    if not conn:
        return False

    try:
        with conn.cursor() as cur:
            # Delete session
            cur.execute(
                "DELETE FROM user_sessions WHERE session_token = %s",
                (session_token,)
            )
            conn.commit()

            return cur.rowcount > 0

    except (psycopg2.DatabaseError, psycopg2.OperationalError) as error:
        print(f"Session destruction error: {error}")
        conn.rollback()
        return False
    finally:
        if conn:
            conn.close()


def cleanup_expired_sessions() -> int:
    """
    Clean up expired sessions from the database.

    Returns:
        int: Number of sessions cleaned up
    """
    conn = get_db_connection()
    if not conn:
        return 0

    try:
        with conn.cursor() as cur:
            # Delete expired sessions
            cur.execute(
                "DELETE FROM user_sessions WHERE expires_at <= %s",
                (datetime.utcnow(),)
            )
            conn.commit()

            return cur.rowcount

    except (psycopg2.DatabaseError, psycopg2.OperationalError) as error:
        print(f"Session cleanup error: {error}")
        conn.rollback()
        return 0
    finally:
        if conn:
            conn.close()


def extend_session(session_token: str) -> bool:
    """
    Extend a session's expiration time.

    Args:
        session_token: The session token to extend

    Returns:
        bool: True if session was extended, False otherwise
    """
    if not session_token:
        return False

    conn = get_db_connection()
    if not conn:
        return False

    try:
        with conn.cursor() as cur:
            # Update session expiration
            new_expires_at = datetime.utcnow() + timedelta(hours=SESSION_EXPIRE_HOURS)
            cur.execute(
                "UPDATE user_sessions SET expires_at = %s WHERE session_token = %s",
                (new_expires_at, session_token)
            )
            conn.commit()

            return cur.rowcount > 0

    except (psycopg2.DatabaseError, psycopg2.OperationalError) as error:
        print(f"Session extension error: {error}")
        conn.rollback()
        return False
    finally:
        if conn:
            conn.close()
