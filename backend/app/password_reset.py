"""
Password reset functionality.
Handles reset token generation, validation, and password updates.
"""

import asyncio
import secrets
from datetime import datetime, timedelta
from typing import Optional
import psycopg2
from .database import get_db_connection
from .auth import get_password_hash
from .email_service import send_password_reset_email, send_password_reset_success_email

# Password reset configuration
RESET_TOKEN_EXPIRE_HOURS = 1  # Reset tokens expire after 1 hour


def create_password_reset_token(user_id: int, user_email: str, user_name: str) -> Optional[str]:
    """
    Create a password reset token for a user.

    Args:
        user_id: The user's ID
        user_email: The user's email address
        user_name: The user's display name

    Returns:
        Optional[str]: Reset token if successful, None otherwise
    """
    # Generate a secure reset token
    reset_token = secrets.token_urlsafe(32)

    # Calculate expiration time
    expires_at = datetime.utcnow() + timedelta(hours=RESET_TOKEN_EXPIRE_HOURS)

    # Store token in database
    conn = get_db_connection()
    if not conn:
        return None

    try:
        with conn.cursor() as cur:
            # Insert new reset token
            cur.execute(
                """INSERT INTO password_reset_tokens (token, user_id, expires_at)
                   VALUES (%s, %s, %s)""",
                (reset_token, user_id, expires_at)
            )
            conn.commit()

        # Send password reset email
        asyncio.create_task(send_password_reset_email(user_email, user_name, reset_token))
        print(f"Password reset token created for {user_email}: {reset_token}")

        return reset_token

    except (psycopg2.DatabaseError, psycopg2.OperationalError) as error:
        print(f"Password reset token creation error: {error}")
        conn.rollback()
        return None
    finally:
        if conn:
            conn.close()


def validate_password_reset_token(token: str) -> Optional[dict]:
    """
    Validate a password reset token and return user data if valid.

    Args:
        token: The reset token to validate

    Returns:
        Optional[dict]: User data if token is valid, None otherwise
    """
    if not token:
        return None

    conn = get_db_connection()
    if not conn:
        return None

    try:
        with conn.cursor() as cur:
            # Get token data
            cur.execute(
                """SELECT prt.user_id, prt.expires_at, prt.used, u.email, u.display_name
                   FROM password_reset_tokens prt
                   JOIN users u ON prt.user_id = u.id
                   WHERE prt.token = %s AND prt.expires_at > %s AND prt.used = FALSE""",
                (token, datetime.utcnow())
            )
            token_data = cur.fetchone()

            if not token_data:
                return None

            return {
                "user_id": token_data['user_id'],
                "email": token_data['email'],
                "display_name": token_data['display_name']
            }

    except (psycopg2.DatabaseError, psycopg2.OperationalError) as error:
        print(f"Password reset token validation error: {error}")
        return None
    finally:
        if conn:
            conn.close()


def reset_user_password(token: str, new_password: str) -> bool:
    """
    Reset a user's password using a valid reset token.

    Args:
        token: The reset token
        new_password: The new password

    Returns:
        bool: True if password was reset successfully, False otherwise
    """
    if not token or not new_password:
        return False

    conn = get_db_connection()
    if not conn:
        return False

    try:
        with conn.cursor() as cur:
            # Validate token and get user data
            user_data = validate_password_reset_token(token)
            if not user_data:
                return False

            # Hash the new password
            hashed_password = get_password_hash(new_password)

            # Update user password
            cur.execute(
                "UPDATE users SET password_hash = %s WHERE id = %s",
                (hashed_password, user_data['user_id'])
            )

            # Mark token as used
            cur.execute(
                "UPDATE password_reset_tokens SET used = TRUE WHERE token = %s",
                (token,)
            )

            conn.commit()

        # Send success email
        asyncio.create_task(send_password_reset_success_email(
            user_data['email'],
            user_data['display_name']
        ))
        print(f"Password reset successful for {user_data['email']}")

        return True

    except (psycopg2.DatabaseError, psycopg2.OperationalError) as error:
        print(f"Password reset error: {error}")
        conn.rollback()
        return False
    finally:
        if conn:
            conn.close()


def cleanup_expired_reset_tokens() -> int:
    """
    Clean up expired password reset tokens from the database.

    Returns:
        int: Number of tokens cleaned up
    """
    conn = get_db_connection()
    if not conn:
        return 0

    try:
        with conn.cursor() as cur:
            # Delete expired or used tokens
            cur.execute(
                "DELETE FROM password_reset_tokens WHERE expires_at <= %s OR used = TRUE",
                (datetime.utcnow(),)
            )
            conn.commit()

            return cur.rowcount

    except (psycopg2.DatabaseError, psycopg2.OperationalError) as error:
        print(f"Password reset token cleanup error: {error}")
        conn.rollback()
        return 0
    finally:
        if conn:
            conn.close()
