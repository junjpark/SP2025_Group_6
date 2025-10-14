"""
Pydantic models for authentication and user management.
These models define the structure of data for API requests and responses.
"""

from typing import Optional
from pydantic import BaseModel

class UserCreate(BaseModel):
    """
    Model for user registration data.
    Used when a new user signs up with email and password.
    """
    email: str
    password: str
    display_name: str

class UserLogin(BaseModel):
    """
    Model for user login credentials.
    Used when a user logs in with email and password.
    """
    email: str
    password: str

class GoogleUserCreate(BaseModel):
    """
    Model for Google OAuth user data.
    Used when a user logs in with Google OAuth.
    """
    email: str
    display_name: str
    google_id: str

class UserResponse(BaseModel):
    """
    Model for user data returned by the API.
    This is what gets sent back to the frontend after successful authentication.
    """
    user_id: int
    email: str
    display_name: str
    google_id: Optional[str] = None  # Only present for Google OAuth users


class SessionResponse(BaseModel):
    """
    Model for session response data.
    Returned after successful login/signup with session.
    """
    message: str
    user: UserResponse

class SessionData(BaseModel):
    """
    Model for session data stored in database.
    Used internally for session management.
    """
    user_id: int
    email: str
    display_name: str
    google_id: Optional[str] = None

class ForgotPasswordRequest(BaseModel):
    """
    Model for forgot password request.
    Used when user requests password reset.
    """
    email: str

class ResetPasswordRequest(BaseModel):
    """
    Model for password reset request.
    Used when user submits new password with reset token.
    """
    token: str
    new_password: str

class PasswordResetResponse(BaseModel):
    """
    Model for password reset response.
    Returned after successful password reset.
    """
    message: str
