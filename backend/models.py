# backend/models.py
from __future__ import annotations

import secrets
from datetime import datetime, timedelta, timezone

from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import DateTime
from sqlalchemy.sql import func

db = SQLAlchemy()  # SQLAlchemy instance shared across the app


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

    # Creation timestamp in UTC (timezone-aware)
    created_at = db.Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    def __repr__(self):
        return f"<User {self.username}>"


class PasswordResetToken(db.Model):
    __tablename__ = "password_reset_tokens"

    # Each record represents a single-use password reset token
    id = db.Column(db.Integer, primary_key=True)

    # Username the token applies to (not a foreign key for simplicity)
    username = db.Column(db.String(120), index=True, nullable=False)

    # Random, URL-safe token string
    token = db.Column(db.String(128), unique=True, index=True, nullable=False)

    # Timestamp when issued (UTC, aware)
    created_at = db.Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Explicit expiration time (UTC, aware)
    expires_at = db.Column(DateTime(timezone=True), nullable=False)

    @staticmethod
    def issue_for(username: str, minutes_valid: int = 30) -> "PasswordResetToken":
        """
        Create a new token valid for 'minutes_valid' minutes.
        """
        now_utc = datetime.now(timezone.utc)
        return PasswordResetToken(
            username=username,
            token=secrets.token_urlsafe(48),  # random secure token
            created_at=now_utc,
            expires_at=now_utc + timedelta(minutes=minutes_valid),
        )

    def is_expired(self) -> bool:
        """
        Check if the token has expired.
        Handles both aware and legacy naive timestamps.
        """
        now_utc = datetime.now(timezone.utc)
        exp = self.expires_at
        if exp is None:
            return True
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        return now_utc >= exp