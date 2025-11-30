# backend/app/api/__init__.py
"""
API package that contains all route blueprints

This module serves as the central registration point for all API routes.
It imports blueprints from individual route modules and provides a
function to register them with the Flask application.

Blueprint Organization:
- health_bp: Health check and root endpoints (no prefix)
- auth_bp: Authentication routes (/api/auth/*)
- provider_bp: Cloud provider data routes (/api/*)
"""

# Flask application type for type hints
from flask import Flask

# Import all route blueprints from their respective modules
from .auth_routes import auth_bp  # Login, register, password reset
from .provider_routes import provider_bp  # Cloud provider data endpoints
from .health_routes import health_bp  # Health checks and root endpoint


def register_blueprints(app: Flask):
    """
    Register all API blueprints with the Flask application.

    This function centralizes blueprint registration, making it easy to
    see all route prefixes in one place and ensuring consistent setup.

    Args:
        app: The Flask application instance

    Returns:
        The Flask app with all blueprints registered

    Route Structure:
        /                    - Root HTML page (health_bp)
        /api/health          - Health check endpoint (health_bp)
        /api/auth/login      - User login (auth_bp)
        /api/auth/register   - User registration (auth_bp)
        /api/auth/me         - Current user info (auth_bp)
        /api/auth/forgot     - Password reset request (auth_bp)
        /api/auth/reset      - Password reset completion (auth_bp)
        /api/providers       - List providers (provider_bp)
        /api/costs/summary   - Cost summary (provider_bp)
        /api/<provider>/*    - Provider-specific endpoints (provider_bp)
        /api/*/all           - Aggregated endpoints (provider_bp)
    """

    # Health routes registered without prefix
    # Provides root page (/) and health check (/api/health)
    app.register_blueprint(health_bp)

    # Auth routes prefixed with /api/auth
    # Handles all authentication-related endpoints
    app.register_blueprint(auth_bp, url_prefix="/api/auth")

    # Provider routes prefixed with /api
    # Handles all cloud provider data endpoints including:
    # - Cost data (MTD, daily, summary)
    # - Metrics (live, timeseries)
    # - Anomalies, forecasts, recommendations
    # - Alerts and budgets
    # - Services breakdown
    app.register_blueprint(provider_bp, url_prefix="/api")

    return app