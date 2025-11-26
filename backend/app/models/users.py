# backend/app/models/user.py
"""
User model for authentication
"""

from datetime import datetime, timezone
from sqlalchemy import DateTime
from sqlalchemy.sql import func
from . import db


class User(db.Model):
    __tablename__ = "users"

    # Primary key ID
    id = db.Column(db.Integer, primary_key=True)

    # Unique username required for login
    username = db.Column(db.String(120), unique=True, index=True, nullable=False)

    # Optional email (also unique if provided)
    email = db.Column(db.String(255), unique=True, index=True, nullable=True)

    # Hashed password (never store raw passwords)
    password_hash = db.Column(db.String(255), nullable=False)

    # Role field
    role = db.Column(db.String(50), nullable=False, default="viewer")

    # Creation timestamp in UTC (timezone-aware)
    created_at = db.Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    def __repr__(self):
        return f"<User {self.username}>"
