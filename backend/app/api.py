"""
FastAPI application with authentication endpoints.
Handles user registration, login, Google OAuth, and protected routes using server-side sessions.
"""
#from datetime import timedelta
import os
import uuid
import shutil
import logging
import time
from pathlib import Path
from fastapi import FastAPI, HTTPException, Depends, status, UploadFile
from fastapi import Form, File, Request, Response
from fastapi.responses import FileResponse
#from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from .models import (
    UserCreate, UserLogin, GoogleUserCreate, UserResponse, SessionResponse, SessionData,
    ForgotPasswordRequest, ResetPasswordRequest, PasswordResetResponse
)
from .auth import (
    authenticate_user,
    get_password_hash,
    get_user_by_email,
    get_user_by_google_id
)
from .session import (
    create_session,
    validate_session,
    destroy_session,
    cleanup_expired_sessions
)
from .password_reset import (
    create_password_reset_token,
    validate_password_reset_token,
    reset_user_password,
    cleanup_expired_reset_tokens
)
from .middleware import SessionMiddleware, LoggingMiddleware
from .database import get_db_connection
from .pose_estimation import process_video_for_landmarks, render_landmarks_video


# Initialize FastAPI application
app = FastAPI(
    title="Cory Authentication API",
    description="Authentication API for the Cory video annotation application",
    version="1.0.0"
)

# Logger for this module
logger = logging.getLogger(__name__)
START_TIME = time.time()
PROCESS_UUID = uuid.uuid4().hex


@app.on_event("startup")
def _log_startup():
    logger.info("API startup: pid=%s start_time=%s uuid=%s", os.getpid(), START_TIME, PROCESS_UUID)

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

# Add session management middleware
app.add_middleware(SessionMiddleware, cleanup_interval=3600)  # Cleanup every hour

os.makedirs("uploads", exist_ok=True)
# Add logging middleware (optional, for development)
app.add_middleware(LoggingMiddleware)


def get_current_user(request: Request):
    """
    Dependency to get the current authenticated user from session cookie.
    Args: request: FastAPI request object
    Returns: dict: User data if session is valid
    Raises: HTTPException: If session is invalid or user not found
    """
    # Get session token from cookie
    session_token = request.cookies.get("cory_session")

    if not session_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No session found"
        )

    # Validate session
    user_data = validate_session(session_token)
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session"
        )

    return user_data

@app.get("/", tags=["root"])
async def read_root():
    """
    Root endpoint that returns a simple greeting.
    Used to verify the API is running.
    """
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
        logger.exception("Signup error")
        conn.rollback()  # Rollback transaction on error
        raise HTTPException(status_code=500, detail="Internal server error") from error
    finally:
        conn.close()


@app.get('/projects/{project_id}/video-with-landmarks', tags=["projects"])
async def get_project_video_with_landmarks(
    project_id: int,
    refresh: bool = False,
    current_user: dict = Depends(get_current_user),
    model_complexity: int = 1,
    use_hw_accel: bool = True
):
    """
    Return the project's video with pose landmarks rendered onto it.
    If refresh=true, re-render even if a cached output exists.
    
    Query Parameters:
        refresh: Force re-rendering even if cached version exists
        model_complexity: MediaPipe model (0=lite/fastest, 1=full/default, 2=heavy/accurate)
        use_hw_accel: Enable hardware acceleration for video encoding (faster)
    """
    user_id = current_user['user_id']

    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")

    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT video_url FROM projects WHERE id = %s AND user_id = %s",
                (project_id, user_id)
            )
            project = cur.fetchone()
            if not project:
                raise HTTPException(status_code=404, detail="Project not found")

            input_path = project['video_url']
            if not os.path.exists(input_path):
                raise HTTPException(status_code=404, detail="Video file not found")

            stem = Path(input_path).stem
            out_dir = os.path.join("uploads", "annotated")
            os.makedirs(out_dir, exist_ok=True)
            output_path = os.path.join(out_dir, f"{stem}_landmarks.mp4")

            if refresh or not os.path.exists(output_path):
                try:
                    render_landmarks_video(
                        input_path,
                        output_path,
                        model_complexity=model_complexity,
                        use_hw_accel=use_hw_accel
                    )
                except FileNotFoundError as exc:
                    raise HTTPException(status_code=404, detail="Video file not found") from exc
                except RuntimeError as exc:
                    raise HTTPException(
                        status_code=500, detail="Error rendering landmarks video"
                    ) from exc

            return FileResponse(
                output_path,
                media_type='video/mp4',
                filename=os.path.basename(output_path)
            )
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Error serving video-with-landmarks for project %s", project_id)
        raise HTTPException(status_code=500, detail="Internal server error") from exc
    finally:
        conn.close()

# User login endpoint
@app.post("/login", response_model=SessionResponse, tags=["authentication"])
async def login(user_credentials: UserLogin, response: Response):
    """
    Authenticate user with email and password and create session.
    Args: user_credentials: Login credentials (email, password)
    Returns: SessionResponse: Success message and user data
    Raises: HTTPException: If credentials are invalid
    """
    # Authenticate user with email and password
    user = authenticate_user(user_credentials.email, user_credentials.password)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    # Create session data
    session_data = SessionData(
        user_id=user["user_id"],
        email=user["email"],
        display_name=user["display_name"]
    )

    # Create session
    session_token = create_session(user["user_id"], session_data.dict())

    # Set HTTP-only cookie
    response.set_cookie(
        key="cory_session",
        value=session_token,
        httponly=True,
        secure=False,  # Set to True in production with HTTPS
        samesite="lax",
        max_age=24 * 60 * 60  # 24 hours
    )

    return SessionResponse(
        message="Login successful",
        user=UserResponse(
            user_id=user["user_id"],
            email=user["email"],
            display_name=user["display_name"]
        )
    )


# Google OAuth login endpoint
@app.post("/google-login", response_model=SessionResponse, tags=["authentication"])
async def google_login(google_user: GoogleUserCreate, response: Response):
    """
    Authenticate or register user with Google OAuth and create session.
    Args: google_user: Google user data (email, display_name, google_id)
    Returns: SessionResponse: Success message and user data
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

            # Create session data
            session_data = SessionData(
                user_id=user["id"],
                email=user["email"],
                display_name=user["display_name"],
                google_id=user.get("google_id")
            )

            # Create session
            session_token = create_session(user["id"], session_data.dict())

            # Set HTTP-only cookie
            response.set_cookie(
                key="cory_session",
                value=session_token,
                httponly=True,
                secure=False,  # Set to True in production with HTTPS
                samesite="lax",
                max_age=24 * 60 * 60  # 24 hours
            )

            return SessionResponse(
                message="Google login successful",
                user=UserResponse(
                    user_id=user["id"],
                    email=user["email"],
                    display_name=user["display_name"],
                    google_id=user.get("google_id")
                )
            )

    except Exception as error:
        logger.exception("Google login error")
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
        current_user: Current user data from session (dependency injection)

    Returns:
        UserResponse: Current user's profile data
    """
    return UserResponse(
        user_id=current_user['id'],
        email=current_user['email'],
        display_name=current_user['display_name'],
        google_id=current_user.get('google_id')
    )


# Logout endpoint
@app.post("/logout", tags=["authentication"])
async def logout(request: Request, response: Response):
    """
    Logout endpoint that destroys the server-side session.

    Returns:
        dict: Success message
    """
    # Get session token from cookie
    session_token = request.cookies.get("cory_session")

    if session_token:
        # Destroy the session
        destroy_session(session_token)

    # Clear the cookie
    response.delete_cookie(
        key="cory_session",
        httponly=True,
        secure=False,  # Set to True in production with HTTPS
        samesite="lax"
    )

    return {"message": "Successfully logged out"}

# Get projects for current user
@app.get("/project-list", tags=["project-list"])
async def get_user_projects(current_user: dict = Depends(get_current_user)):
    """
    Retrieve all projects associated with the current authenticated user.

    Args:
        current_user: Current user data from JWT token (dependency injection)

    Returns:
        list: List of projects belonging to the user
    Raises:
        HTTPException: If database error occurs
    """
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")

    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, title, last_opened, thumbnail_url FROM projects WHERE user_id = %s",
                (current_user['user_id'],)
            )
            projects = cur.fetchall()

            return projects

    except Exception as error:
        raise HTTPException(status_code=500, detail="Internal server error") from error
    finally:
        conn.close()

# Create a new project for the current user
@app.post("/projects", tags=["projects"])
async def create_project(
    title: str = Form(...),
    video: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Create a new project for the current authenticated user.

    Args:
        title: Title of the new project (form data)
        video: Uploaded video file (form data)
        current_user: Current user data from JWT token (dependency injection)
    Returns:
        project_id: ID of the newly created project
    Raises:
        HTTPException: If database error occurs or file upload fails
    """
    user_id = current_user['user_id']
    if not title:
        raise HTTPException(status_code=400, detail="Project title is required")
    if video.content_type not in ["video/mp4", "video/avi", "video/mov"]:
        raise HTTPException(status_code=400, detail="Invalid video format")
    ext = os.path.splitext(video.filename)[1]
    # create unique filename
    uuid_filename = f"{uuid.uuid4().hex}{ext}"
    upload_path = os.path.join("uploads", uuid_filename)

    try:
        with open(upload_path, "wb") as buffer:
            shutil.copyfileobj(video.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail='Failed to upload video: {e}') from e

    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")

    try:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO projects (title, user_id, video_url, created_at, last_opened) " \
                "VALUES (%s, %s, %s, now(), now()) " \
                "RETURNING id",
                (title, user_id, upload_path)
            )
            id_row = cur.fetchone()
            conn.commit()
            project_id = id_row['id'] if id_row else None

            return {"id": project_id}

    except Exception as error:
        raise HTTPException(status_code=500, detail="Internal server error") from error
    finally:
        conn.close()

# Get project details by ID
@app.get('/projects/{project_id}', tags=["projects"])
async def get_project(
    project_id: int,
    current_user: dict = Depends(get_current_user)
):
    """
    Retrieve details of a specific project by its ID for the current authenticated user.

    Args:
        project_id: ID of the project to retrieve (path parameter)
        current_user: Current user data from JWT token (dependency injection)
    Returns:
        dict: Project details
    Raises:
        HTTPException: If project not found or database error occurs
    """
    user_id = current_user['user_id']
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")

    try:
        with conn.cursor() as cur:
            # Query for the project owned by the current user (single-step authorization)
            cur.execute(
                "SELECT title, video_url FROM projects WHERE id = %s AND user_id = %s",
                (project_id, user_id)
            )
            project = cur.fetchone()

            if not project:
                # Either project doesn't exist or doesn't belong to the user
                raise HTTPException(status_code=404, detail="Project not found")

            video_path = project['video_url']
            if not os.path.exists(video_path):
                raise HTTPException(status_code=404, detail="Video file not found")

            # Serve the file only after ownership and existence checks pass
            return FileResponse(video_path)

    except HTTPException:
        # Re-raise HTTPExceptions so FastAPI returns the intended status code
        raise
    except Exception as error:
        raise HTTPException(status_code=500, detail="Internal server error") from error
    finally:
        conn.close()


@app.get('/projects/{project_id}/landmarks', tags=["projects"])
async def get_project_landmarks(
    project_id: int,
    current_user: dict = Depends(get_current_user),
    sample_rate: int = 1,
    use_parallel: bool = True,
    model_complexity: int = 1
):
    """
    Serve the landmarks JSON for a project if available. Returns 200 with JSON when ready,
    202 Accepted if processing/not yet available, or 404 if project not found/unauthorized.
    
    Query Parameters:
        sample_rate: Process every Nth frame (1 = every frame, 2 = every other frame, etc.)
        use_parallel: Enable parallel processing for faster processing on multi-core systems
        model_complexity: MediaPipe model (0=lite/fastest, 1=full/default, 2=heavy/accurate)
    """
    user_id = current_user['user_id']

    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")

    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT video_url FROM projects WHERE id = %s AND user_id = %s",
                (project_id, user_id)
            )
            project = cur.fetchone()
            if not project:
                raise HTTPException(status_code=404, detail="Project not found")

            video_path = project['video_url']
            if not os.path.exists(video_path):
                raise HTTPException(status_code=404, detail="Video file not found")
            try:
                landmarks_data = process_video_for_landmarks(
                    video_path,
                    video_sample_rate=sample_rate,
                    use_parallel=use_parallel,
                    model_complexity=model_complexity
                )
                return landmarks_data
            except FileNotFoundError as e:
                raise HTTPException(status_code=404, detail="Video file not found") from e
            except RuntimeError as e:
                raise HTTPException(status_code=500,
                                    detail="Error processing video for landmarks") from e
            except Exception as e:
                logger.exception("Unexpected error processing landmarks for project %s", project_id)
                raise HTTPException(status_code=500, detail="Internal server error") from e

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error serving landmarks")
        raise HTTPException(status_code=500, detail="Internal server error") from e
    finally:
        conn.close()

# Session cleanup endpoint (for maintenance)
@app.post("/cleanup-sessions", tags=["maintenance"])
async def cleanup_sessions():
    """
    Clean up expired sessions from the database.
    This endpoint can be called periodically for maintenance.

    Returns:
        dict: Number of sessions cleaned up
    """
    cleaned_count = cleanup_expired_sessions()
    return {"message": f"Cleaned up {cleaned_count} expired sessions"}


# Password reset endpoints
@app.post("/forgot-password", tags=["password-reset"])
async def forgot_password(request: ForgotPasswordRequest):
    """
    Request a password reset email.
    Sends a password reset email to the user if the email exists.

    Args:
        request: Forgot password request with email

    Returns:
        dict: Success message (always returns success for security)
    """
    # Get user by email
    user = get_user_by_email(request.email)

    if user:
        # Create password reset token
        reset_token = create_password_reset_token(
            user['id'],
            user['email'],
            user['display_name']
        )

        if reset_token:
            logger.info("Password reset token created for %s", request.email)
        else:
            logger.warning("Failed to create password reset token for %s", request.email)
    else:
        logger.warning("Password reset requested for non-existent email: %s", request.email)

    # Always return success for security (don't reveal if email exists)
    return {"message": "If an account with that email exists, a password reset link has been sent."}


@app.post("/reset-password", response_model=PasswordResetResponse, tags=["password-reset"])
async def reset_password(request: ResetPasswordRequest):
    """
    Reset user password using a valid reset token.

    Args:
        request: Reset password request with token and new password

    Returns:
        PasswordResetResponse: Success message

    Raises:
        HTTPException: If token is invalid or password reset fails
    """
    # Validate the reset token
    user_data = validate_password_reset_token(request.token)

    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )

    # Reset the password
    success = reset_user_password(request.token, request.new_password)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to reset password"
        )

    return PasswordResetResponse(
        message="Password has been reset successfully. You can now log in with your new password."
    )


@app.get("/validate-reset-token/{token}", tags=["password-reset"])
async def validate_reset_token(token: str):
    """
    Validate a password reset token.
    Used by the frontend to check if a reset token is valid.

    Args:
        token: The reset token to validate

    Returns:
        dict: Token validation result

    Raises:
        HTTPException: If token is invalid
    """
    user_data = validate_password_reset_token(token)

    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )

    return {
        "valid": True,
        "email": user_data['email'],
        "display_name": user_data['display_name']
    }


# Password reset cleanup endpoint (for maintenance)
@app.post("/cleanup-reset-tokens", tags=["maintenance"])
async def cleanup_reset_tokens():
    """
    Clean up expired password reset tokens from the database.
    This endpoint can be called periodically for maintenance.

    Returns:
        dict: Number of tokens cleaned up
    """
    cleaned_count = cleanup_expired_reset_tokens()
    return {"message": f"Cleaned up {cleaned_count} expired reset tokens"}
