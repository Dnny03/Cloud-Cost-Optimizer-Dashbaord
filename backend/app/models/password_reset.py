# backend/app/models/password_reset.py
"""
Password reset token model

This module defines the database model for password reset tokens used
in the forgot/reset password flow. Tokens are single-use, time-limited,
and cryptographically secure.
"""

# secrets module provides cryptographically secure token generation
import secrets

# Date/time utilities for token expiration handling
from datetime import datetime, timedelta, timezone

# SQLAlchemy types and functions for database operations
from sqlalchemy import DateTime
from sqlalchemy.sql import func

# Import the database instance from the models package
from . import db


class PasswordResetToken(db.Model):
    """
    Represents a single-use password reset token.

    This model stores temporary tokens that allow users to reset their
    passwords when they've forgotten them. Each token is:
    - Cryptographically random and URL-safe
    - Associated with a specific username
    - Time-limited (default 30 minutes)
    - Single-use (deleted after successful password reset)

    Security considerations:
    - Tokens are generated using secrets.token_urlsafe() for cryptographic security
    - Tokens expire after a configurable time period
    - Old tokens are deleted when new ones are issued for the same user
    """

    # Database table name
    __tablename__ = "password_reset_tokens"

    # Primary key - auto-incrementing integer
    # Each record represents a single-use password reset token
    id = db.Column(db.Integer, primary_key=True)

    # Username the token applies to
    # Indexed for fast lookups when validating tokens
    # Not a foreign key for simplicity - allows token cleanup even if user is deleted
    username = db.Column(db.String(120), index=True, nullable=False)

    # The actual reset token - a random, URL-safe string
    # Unique constraint prevents token collisions (extremely unlikely but safe)
    # Indexed for fast lookups during password reset validation
    token = db.Column(db.String(128), unique=True, index=True, nullable=False)

    # Timestamp when the token was issued (UTC with timezone awareness)
    # server_default uses database's NOW() function for consistency
    created_at = db.Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Explicit expiration timestamp (UTC with timezone awareness)
    # Set at creation time based on minutes_valid parameter
    expires_at = db.Column(DateTime(timezone=True), nullable=False)

    @staticmethod
    def issue_for(username: str, minutes_valid: int = 30) -> "PasswordResetToken":
        """
        Factory method to create a new password reset token.

        Args:
            username: The username this token is valid for
            minutes_valid: How long the token remains valid (default: 30 minutes)

        Returns:
            A new PasswordResetToken instance (not yet committed to database)

        Note:
            The caller is responsible for:
            1. Deleting any existing tokens for the user
            2. Adding this token to the session
            3. Committing the transaction

        Security:
            Uses secrets.token_urlsafe(48) which generates a 64-character
            cryptographically secure random string suitable for URLs.
        """
        now_utc = datetime.now(timezone.utc)
        return PasswordResetToken(
            username=username,
            token=secrets.token_urlsafe(48),  # 48 bytes = 64 URL-safe characters
            created_at=now_utc,
            expires_at=now_utc + timedelta(minutes=minutes_valid),
        )

    def is_expired(self) -> bool:
        """
        Check if the token has expired.

        Returns:
            True if the token is expired or has no expiration time,
            False if the token is still valid.

        Note:
            Handles both timezone-aware and legacy naive timestamps
            for backward compatibility. Naive timestamps are assumed
            to be UTC.
        """
        now_utc = datetime.now(timezone.utc)
        exp = self.expires_at

        # No expiration time means token is invalid
        if exp is None:
            return True

        # Handle legacy naive timestamps by assuming UTC
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)

        # Token is expired if current time is at or past expiration
        return now_utc >= exp