# backend/app/api/__init__.py
"""
API package that contains all route blueprints
"""

from flask import Flask
from .auth_routes import auth_bp
from .provider_routes import provider_bp
from .health_routes import health_bp


def register_blueprints(app: Flask):
    """Register all API blueprints with the Flask app"""

    # Health routes (no prefix - accessible at root)
    app.register_blueprint(health_bp)

    # Auth routes
    app.register_blueprint(auth_bp, url_prefix="/api/auth")

    # Provider routes (all other API endpoints)
    app.register_blueprint(provider_bp, url_prefix="/api")

    return app
