# backend/app/models/__init__.py
"""
Database models package

This module initializes the SQLAlchemy database instance and serves as the
central import point for all database models. By importing models here,
they are automatically registered with SQLAlchemy when the package is imported.

Usage:
    from app.models import db, User, PasswordResetToken

    # In application factory:
    db.init_app(app)

    # Creating tables:
    with app.app_context():
        db.create_all()
"""

# SQLAlchemy ORM integration for Flask
# Provides database abstraction, model base class, and session management
from flask_sqlalchemy import SQLAlchemy

# Create the SQLAlchemy instance
# This instance is shared across the application and initialized
# with the Flask app in the application factory (app/__init__.py)
# Models inherit from db.Model to define database tables
db = SQLAlchemy()

# Import all models so they're registered with SQLAlchemy
# This ensures that when db.create_all() is called, all tables are created
# Models must be imported before create_all() for SQLAlchemy to know about them
from .users import User  # User authentication model
from .password_reset import PasswordResetToken  # Password reset token model

# Define public API for this package
# Controls what's exported when using "from app.models import *"
# Also serves as documentation of available exports
__all__ = ['db', 'User', 'PasswordResetToken']