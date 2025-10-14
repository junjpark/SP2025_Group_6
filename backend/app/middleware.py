"""
Middleware for session management and cleanup.
Handles automatic session cleanup and request logging.
"""

import time
import logging
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
import psycopg2
from .session import cleanup_expired_sessions, extend_session

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class SessionMiddleware(BaseHTTPMiddleware): # pylint: disable=too-few-public-methods
    """
    Middleware for session management.
    Handles automatic session cleanup and session extension.
    """

    def __init__(self, app, cleanup_interval: int = 3600):  # 1 hour default
        super().__init__(app)
        self.cleanup_interval = cleanup_interval
        self.last_cleanup = time.time()

    async def dispatch(self, request: Request, call_next):
        """
        Process the request and handle session management.

        Args:
            request: The incoming request
            call_next: The next middleware/handler in the chain

        Returns:
            Response: The response from the next handler
        """
        # Perform periodic cleanup of expired sessions
        current_time = time.time()
        if current_time - self.last_cleanup > self.cleanup_interval:
            try:
                cleaned_count = cleanup_expired_sessions()
                if cleaned_count > 0:
                    logger.info("Cleaned up %d expired sessions", cleaned_count)
                self.last_cleanup = current_time
            except (psycopg2.DatabaseError, psycopg2.OperationalError, OSError) as error:
                logger.error("Session cleanup failed: %s", error)

        # Process the request
        response = await call_next(request)

        # Extend session if user is authenticated and session exists
        session_token = request.cookies.get("cory_session")
        if session_token and response.status_code < 400:
            try:
                extend_session(session_token)
            except (psycopg2.DatabaseError, psycopg2.OperationalError, OSError) as error:
                logger.error("Session extension failed: %s", error)

        return response


class LoggingMiddleware(BaseHTTPMiddleware): # pylint: disable=too-few-public-methods
    """
    Middleware for request/response logging.
    Logs API requests and responses for debugging.
    """

    async def dispatch(self, request: Request, call_next):
        """
        Log the request and response.

        Args:
            request: The incoming request
            call_next: The next middleware/handler in the chain

        Returns:
            Response: The response from the next handler
        """
        # Log the request
        logger.info("Request: %s %s", request.method, request.url)

        # Process the request
        start_time = time.time()
        response = await call_next(request)
        process_time = time.time() - start_time

        # Log the response
        logger.info("Response: %d - %.3fs", response.status_code, process_time)

        return response
