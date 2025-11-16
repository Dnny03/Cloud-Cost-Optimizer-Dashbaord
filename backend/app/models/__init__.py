# backend/app/models/__init__.py
"""
Database models package
"""

from flask_sqlalchemy import SQLAlchemy

# Create the SQLAlchemy instance
db = SQLAlchemy()

# Import all models so they're registered with SQLAlchemy
from .users import User
from .password_reset import PasswordResetToken

__all__ = ['db', 'User', 'PasswordResetToken']