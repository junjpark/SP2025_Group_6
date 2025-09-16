"""
Main application module for the backend service.

This module contains the primary application logic and entry points.
"""
import uvicorn

if __name__ == "__main__":
    uvicorn.run("app.api:app", host="0.0.0.0", port=8000, reload=True)

#this just sets up the app to run on localhost:8000
