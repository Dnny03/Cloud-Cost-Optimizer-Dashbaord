# backend/app/config.py
"""
Application configuration module

This module defines configuration classes for different environments
(development, production, testing). Configuration values are loaded
from environment variables with sensible defaults for development.

Usage:
    from app.config import config
    app.config.from_object(config['development'])
"""

import os
from pathlib import Path
from datetime import timedelta

# Base directory - points to the backend/app parent directory
# Used for resolving relative paths like database location
BASE_DIR = Path(__file__).parent.parent


class Config:
    """
    Base configuration class with default settings.

    All environment-specific configurations inherit from this class.
    Values can be overridden via environment variables for flexibility
    in different deployment scenarios.

    Environment Variables:
        SECRET_KEY: Flask secret key for session signing
        JWT_SECRET: Secret key for JWT token signing
        JWT_TTL_HOURS: JWT token lifetime in hours
        DATABASE_URL: Database connection string
        CLOUD_CONFIG_PATH: Path to cloud provider configuration file
        CORS_ORIGINS: Allowed CORS origins (comma-separated or '*')
    """

    # ===================
    # Security Settings
    # ===================

    # Flask secret key for session management and CSRF protection
    # IMPORTANT: Change this in production!
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-change-in-production')

    # JWT signing secret - defaults to SECRET_KEY if not set separately
    # Used by auth_routes.py and provider_routes.py for token operations
    JWT_SECRET = os.getenv('JWT_SECRET', SECRET_KEY)

    # JWT token lifetime in hours before expiration
    # Users will need to re-authenticate after this period
    JWT_TTL_HOURS = int(os.getenv('JWT_TTL_HOURS', '8'))

    # ===================
    # Database Settings
    # ===================

    # Instance path for SQLite database and other instance-specific files
    # Creates the directory if it doesn't exist
    INSTANCE_PATH = BASE_DIR / 'instance'
    INSTANCE_PATH.mkdir(exist_ok=True)

    # SQLAlchemy database connection URI
    # Defaults to SQLite file in instance directory for development
    # Can be overridden with DATABASE_URL env var for PostgreSQL, MySQL, etc.
    SQLALCHEMY_DATABASE_URI = os.getenv(
        'DATABASE_URL',
        f'sqlite:///{INSTANCE_PATH}/app.db'
    )

    # Disable SQLAlchemy modification tracking for performance
    # This feature is deprecated and adds overhead
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # ===================
    # Cloud Provider Settings
    # ===================

    # Path to JSON file containing cloud provider credentials and configuration
    # Used by AuthManager to load provider settings
    CLOUD_CONFIG_PATH = os.getenv('CLOUD_CONFIG_PATH', 'config/clouds.json')

    # ===================
    # CORS Settings
    # ===================

    # Allowed origins for Cross-Origin Resource Sharing
    # '*' allows all origins (suitable for development)
    # In production, set to specific frontend domain(s)
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', '*')


class DevelopmentConfig(Config):
    """
    Development environment configuration.

    Enables debug mode for detailed error messages and auto-reloading.
    Uses SQLite database by default for easy setup.

    Usage:
        FLASK_ENV=development flask run
    """
    # Enable Flask debug mode - provides debugger and auto-reload
    DEBUG = True

    # Not running tests
    TESTING = False


class ProductionConfig(Config):
    """
    Production environment configuration.

    Disables debug mode for security and performance.
    Should use a production-grade database like PostgreSQL.

    Important production considerations:
    - Set strong SECRET_KEY and JWT_SECRET via environment variables
    - Use HTTPS for all connections
    - Set specific CORS_ORIGINS instead of '*'
    - Use PostgreSQL or another production database

    Usage:
        FLASK_ENV=production gunicorn app:create_app()
    """
    # Disable debug mode in production for security
    DEBUG = False

    # Not running tests
    TESTING = False

    # Production database URI
    # This default is a placeholder - always set DATABASE_URL in production
    # Supports PostgreSQL, MySQL, or other SQLAlchemy-compatible databases
    SQLALCHEMY_DATABASE_URI = os.getenv(
        'DATABASE_URL',
        'postgresql://user:pass@localhost/cloudcost'
    )


class TestingConfig(Config):
    """
    Testing environment configuration.

    Uses in-memory SQLite database for fast, isolated tests.
    Each test run starts with a fresh database.

    Usage:
        pytest tests/
    """
    # Enable debug for detailed test error messages
    DEBUG = True

    # Enable testing mode - affects error handling behavior
    TESTING = True

    # In-memory SQLite database for fast, isolated tests
    # Database is destroyed when connection closes
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'


# Configuration dictionary for easy environment selection
# Used by the application factory to load appropriate config
# Example: app.config.from_object(config[os.getenv('FLASK_ENV', 'default')])
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig  # Default to development if not specified
}