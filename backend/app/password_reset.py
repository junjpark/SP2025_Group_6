"""
Password reset functionality.
Handles reset token generation, validation, and password updates.
"""

import asyncio
import secrets
from datetime import datetime, timedelta
from typing import Optional
from .database import execute_with_connection
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

    def create_token_operation(cur):
        # Insert new reset token
        cur.execute(
            """INSERT INTO password_reset_tokens (token, user_id, expires_at)
               VALUES (%s, %s, %s)""",
            (reset_token, user_id, expires_at)
        )
        return reset_token

    result = execute_with_connection(create_token_operation)
    if result:
        # Send password reset email
        asyncio.create_task(send_password_reset_email(user_email, user_name, reset_token))
        print(f"Password reset token created for {user_email}: {reset_token}")
        return reset_token
    return None


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

    def validate_token_operation(cur):
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

    return execute_with_connection(validate_token_operation)


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

    def reset_password_operation(cur):
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

        return user_data

    result = execute_with_connection(reset_password_operation)
    if result:
        # Send success email
        asyncio.create_task(send_password_reset_success_email(
            result['email'],
            result['display_name']
        ))
        print(f"Password reset successful for {result['email']}")
        return True
    return False


def cleanup_expired_reset_tokens() -> int:
    """
    Clean up expired password reset tokens from the database.

    Returns:
        int: Number of tokens cleaned up
    """
    def cleanup_operation(cur):
        # Delete expired or used tokens
        cur.execute(
            "DELETE FROM password_reset_tokens WHERE expires_at <= %s OR used = TRUE",
            (datetime.utcnow(),)
        )
        return cur.rowcount

    result = execute_with_connection(cleanup_operation)
    return result if result is not None else 0
