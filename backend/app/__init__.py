# backend/app/__init__.py
"""
Main application package
"""

from flask import Flask
from flask_cors import CORS
from .models import db


def create_app(config_name='development'):
    """Application factory pattern"""
    app = Flask(__name__, instance_relative_config=True)

    # Load configuration
    from .config import config
    app.config.from_object(config[config_name])

    # Initialize extensions
    db.init_app(app)
    CORS(app)

    # Create database tables
    with app.app_context():
        db.create_all()

    # Register blueprints
    from .api import register_blueprints
    register_blueprints(app)

    return app
