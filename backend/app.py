# backend/app.py
"""
Simplified main Flask application entry point
All routes are now organized in app/api/ folder

This is the main entry point for running the Flask backend server.
It handles environment setup, application creation, and server startup.

Usage:
    # Direct execution
    python app.py

    # Or with Flask CLI
    FLASK_APP=app.py flask run

    # Or with Gunicorn (production)
    gunicorn app:app
"""

import os

# python-dotenv for loading environment variables from .env file
# This allows configuration without modifying system environment
from dotenv import load_dotenv

# Load environment variables FIRST before any other imports
# This ensures that modules like config.py and auth_manager.py
# have access to environment variables when they're imported
# Variables loaded include: JWT_SECRET, DATABASE_URL, cloud credentials, etc.
load_dotenv()

# Now import the app modules after environment is configured
# create_app is the application factory function
from app import create_app

# AuthManager handles cloud provider authentication configuration
from app.services.auth.auth_manager import AuthManager

# Create the Flask application using the factory pattern
# FLASK_ENV determines which configuration to use:
# - 'development': Debug mode, SQLite database
# - 'production': No debug, PostgreSQL database
# - 'testing': In-memory SQLite for tests
# Defaults to 'development' if FLASK_ENV is not set
app = create_app(os.getenv('FLASK_ENV', 'development'))

# This block only runs when executing this file directly (python app.py)
# It does NOT run when imported by Gunicorn or other WSGI servers
if __name__ == "__main__":
    # Print startup banner for visual confirmation
    print("\n" + "=" * 60)
    print("Starting Multi-Cloud Intelligence Dashboard Backend")
    print("=" * 60)

    # Check and display which cloud providers are configured
    # This helps with debugging configuration issues at startup
    auth_manager = AuthManager()
    configured = auth_manager.get_active_providers()

    if configured:
        # List all successfully configured providers (AWS, Azure, GCP)
        print(f"✓ Configured providers: {', '.join([p['name'].upper() for p in configured])}")
    else:
        # Warn if no providers are set up - dashboard will have limited functionality
        print("⚠ No cloud providers configured")
        print("  Add credentials to .env file")
    print("=" * 60)

    # Run the Flask development server
    # Note: This is NOT suitable for production - use Gunicorn or similar
    app.run(
        # Enable debug mode for auto-reload and detailed error pages
        debug=True,
        # Server port - defaults to 5050, configurable via FLASK_RUN_PORT
        port=int(os.getenv('FLASK_RUN_PORT', 5050)),
        # Host binding - 0.0.0.0 allows external connections (needed for Docker)
        # Defaults to 0.0.0.0 for accessibility, configurable via FLASK_RUN_HOST
        host=os.getenv('FLASK_RUN_HOST', '0.0.0.0')
    )