"""
Database connection utilities for PostgreSQL.
Handles connection pooling and error management.
"""

import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


def get_db_connection():
    """
    Creates and returns a database connection to PostgreSQL.

    Returns:
        psycopg2.connection: Database connection object
        None: If connection fails

    Environment Variables Required:
        DB_HOST: Database host (default: localhost)
        DB_NAME: Database name (default: cory)
        DB_USER: Database username
        DB_PASSWORD: Database password
        DB_PORT: Database port (default: 5432)
    """
    try:
        # Get database configuration from environment variables
        host = os.getenv("DB_HOST", "localhost")
        database = os.getenv("DB_NAME", "cory")
        user = os.getenv("DB_USER", "postgres")
        password = os.getenv("DB_PASSWORD", "")
        port = os.getenv("DB_PORT", "5432")

        # Create connection with error handling
        conn = psycopg2.connect(
            host=host,
            database=database,
            user=user,
            password=password,
            port=port,
            cursor_factory=RealDictCursor  # Returns results as dictionaries
        )

        print(f"Successfully connected to database: {database}")
        return conn

    except psycopg2.Error as db_error:
        print(f"Database connection error: {db_error}")
        return None


def test_connection():
    """
    Test function to verify database connectivity.
    Can be used for health checks or debugging.
    """
    conn = get_db_connection()
    if conn:
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT 1")
                cur.fetchone()
                print("Database connection test successful!")
                return True
        except psycopg2.DatabaseError as test_error:
            print(f"Database test query failed: {test_error}")
            return False
        finally:
            conn.close()
    return False
