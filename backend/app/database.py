"""
Database connection utilities for PostgreSQL.
Handles connection pooling and error management.
"""

import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()
def get_db_connection():
    """
    Creates and returns a database connection to PostgreSQL.

    Returns:
        psycopg2.connection: Database connection object
        None: If connection fails
    """
    try:
        # Create connection with error handling
        conn = psycopg2.connect(
            host=os.environ["DB_HOST"],
            database=os.environ["DB_NAME"],
            user=os.environ["DB_USER"],
            password=os.environ["DB_PASSWORD"],
            port=os.environ["DB_PORT"],
            cursor_factory=RealDictCursor  # Returns results as dictionaries
        )
        print("Successfully connected to database")
        return conn
    except psycopg2.Error as db_error:
        print(f"Database connection error: {db_error}")
        return None


def execute_with_connection(operation_func):
    """
    Helper function to execute database operations with proper connection handling.
    Eliminates duplicate connection setup code.

    Args:
        operation_func: Function that takes a cursor and performs database operations

    Returns:
        Any: Result from operation_func, or None if connection fails
    """
    conn = get_db_connection()
    if not conn:
        return None

    try:
        with conn.cursor() as cur:
            return operation_func(cur)
    except (psycopg2.DatabaseError, psycopg2.OperationalError) as error:
        print(f"Database operation error: {error}")
        conn.rollback()
        return None
    finally:
        if conn:
            conn.close()
