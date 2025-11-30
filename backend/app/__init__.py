# backend/app/__init__.py
"""
Main application package

This module implements the Flask application factory pattern, which allows
creating multiple instances of the application with different configurations.
This is useful for testing, development, and production environments.

The application factory:
1. Creates and configures the Flask app
2. Initializes database and CORS extensions
3. Creates database tables
4. Registers all API blueprints

Usage:
    # Development
    from app import create_app
    app = create_app('development')

    # Production
    app = create_app('production')

    # Testing
    app = create_app('testing')
"""

# Flask framework - core web application functionality
from flask import Flask

# Flask-CORS extension for handling Cross-Origin Resource Sharing
# Required for frontend (React) to communicate with backend API
from flask_cors import CORS

# Import the SQLAlchemy database instance from models package
from .models import db


def create_app(config_name='development'):
    """
    Application factory function - creates and configures the Flask app.

    This pattern is recommended by Flask for several reasons:
    - Allows multiple app instances with different configs (e.g., testing)
    - Avoids circular imports by deferring extension initialization
    - Makes the application more modular and testable

    Args:
        config_name: Configuration environment to use.
                    Options: 'development', 'production', 'testing', 'default'
                    Defaults to 'development' for local development.

    Returns:
        Configured Flask application instance ready to run.

    Example:
        app = create_app('production')
        app.run(host='0.0.0.0', port=5000)
    """

    # Create Flask application instance
    # instance_relative_config=True allows loading config from instance folder
    # The instance folder is excluded from version control for sensitive data
    app = Flask(__name__, instance_relative_config=True)

    # Load configuration from config.py based on environment
    # This sets up SECRET_KEY, DATABASE_URL, JWT settings, etc.
    from .config import config
    app.config.from_object(config[config_name])

    # Initialize Flask extensions with this app instance
    # db.init_app() connects SQLAlchemy to this specific Flask app
    db.init_app(app)

    # Enable CORS for all routes
    # Allows the React frontend to make API requests from a different origin
    # In production, consider restricting origins via CORS_ORIGINS config
    CORS(app)

    # Create database tables if they don't exist
    # app_context() is required for database operations outside of requests
    # db.create_all() reads all registered models and creates corresponding tables
    with app.app_context():
        db.create_all()

    # Register API blueprints (route handlers)
    # This imports and attaches all route modules to the app
    # Routes are organized into blueprints: auth, provider, health
    from .api import register_blueprints
    register_blueprints(app)

    return app