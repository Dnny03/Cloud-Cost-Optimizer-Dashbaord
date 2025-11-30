# backend/app/models/user.py
"""
User model for authentication

This module defines the User database model which stores user account
information for authentication and authorization purposes. It supports
role-based access control with 'admin' and 'viewer' roles.
"""

# Date/time utilities for timestamp handling
from datetime import datetime, timezone

# SQLAlchemy types and functions for database operations
from sqlalchemy import DateTime
from sqlalchemy.sql import func

# Import the database instance from the models package
from . import db


class User(db.Model):
    """
    Represents a user account in the system.

    This model handles:
    - User authentication (username/password)
    - Role-based authorization (admin/viewer)
    - Optional email for password recovery

    Security notes:
    - Passwords are never stored in plain text
    - password_hash stores the result of werkzeug.security.generate_password_hash()
    - Password verification uses werkzeug.security.check_password_hash()

    Roles:
    - admin: Full access to all features and data
    - viewer: Read-only access to dashboard data

    The first registered user can request admin role; subsequent users
    are assigned viewer role by default (enforced in auth_routes.py).
    """

    # Database table name
    __tablename__ = "users"

    # Primary key - auto-incrementing integer identifier
    # Used internally for database relationships
    id = db.Column(db.Integer, primary_key=True)

    # Unique username required for login
    # Indexed for fast lookups during authentication
    # This is the primary identifier users see and use
    username = db.Column(db.String(120), unique=True, index=True, nullable=False)

    # Optional email address for password recovery
    # Unique constraint ensures no duplicate emails (if provided)
    # Indexed for fast lookups during forgot password flow
    # Nullable because email is optional during registration
    email = db.Column(db.String(255), unique=True, index=True, nullable=True)

    # Hashed password using werkzeug's secure hashing
    # NEVER store raw/plain text passwords
    # Uses PBKDF2 with SHA-256 by default (via werkzeug)
    # Format: "method$salt$hash" (e.g., "pbkdf2:sha256:...")
    password_hash = db.Column(db.String(255), nullable=False)

    # User role for authorization/access control
    # Valid values: "admin", "viewer"
    # Default is "viewer" for security (principle of least privilege)
    # Admin role grants full access; viewer role is read-only
    role = db.Column(db.String(50), nullable=False, default="viewer")

    # Account creation timestamp in UTC (timezone-aware)
    # server_default uses database's NOW() function for consistency
    # Useful for auditing and account management
    created_at = db.Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    def __repr__(self):
        """
        String representation for debugging and logging.
        Returns a readable format like "<User john_doe>"
        Does not expose sensitive information like password hash.
        """
        return f"<User {self.username}>"