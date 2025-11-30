# backend/app/api/auth_routes.py
"""
Authentication-related API routes
Extracted from the original app.py

This module handles all authentication functionality including:
- User registration and login
- JWT token generation and validation
- Password reset flow
- Role-based access control
"""

# Standard library imports for function decoration and HTTP handling
from functools import wraps
from flask import Blueprint, request, jsonify

# Password hashing utilities from Werkzeug for secure password storage
from werkzeug.security import generate_password_hash, check_password_hash

# Date/time utilities for token expiration handling
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

# JWT library for creating and verifying authentication tokens
import jwt
import os

# Import database models for User and PasswordResetToken
from app.models import db, User, PasswordResetToken

# Create a Blueprint for auth routes - allows modular organization of routes
auth_bp = Blueprint('auth', __name__)

# JWT configuration loaded from environment variables with sensible defaults
# JWT_SECRET: Secret key used to sign tokens (should be changed in production)
# JWT_ALG: Algorithm used for token signing (HS256 is HMAC with SHA-256)
# JWT_TTL_HOURS: Token time-to-live in hours before expiration
JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-change-me")
JWT_ALG = "HS256"
JWT_TTL_HOURS = int(os.getenv("JWT_TTL_HOURS", "8"))


# -----------------------------
# Timezone helpers
# -----------------------------

def _client_tz_name() -> str:
    """
    Retrieves the client's timezone from request headers or query parameters.
    Falls back to UTC if no timezone is specified or if the value is empty.
    Checks X-Timezone header first, then 'tz' query parameter.
    """
    return (request.headers.get("X-Timezone") or request.args.get("tz") or "UTC").strip() or "UTC"


def _client_zoneinfo():
    """
    Converts the client timezone name to a ZoneInfo object.
    Returns UTC timezone if the provided timezone name is invalid.
    """
    try:
        return ZoneInfo(_client_tz_name())
    except Exception:
        return timezone.utc


def _iso_local(dt_utc: datetime) -> str:
    """
    Converts a UTC datetime to the client's local timezone and returns ISO format string.
    Ensures the datetime has UTC timezone info before conversion.
    Used to display token expiration times in the user's local timezone.
    """
    if dt_utc.tzinfo is None:
        dt_utc = dt_utc.replace(tzinfo=timezone.utc)
    return dt_utc.astimezone(_client_zoneinfo()).isoformat()


# -----------------------------
# Auth helpers
# -----------------------------

def issue_token(user: User) -> str:
    """
    Generates a JWT token for an authenticated user.

    Token payload contains:
    - sub: Subject (username) identifying the user
    - role: User's role for authorization checks
    - iat: Issued-at timestamp
    - exp: Expiration timestamp based on JWT_TTL_HOURS

    Returns the encoded JWT string.
    """
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user.username,
        "role": user.role,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(hours=JWT_TTL_HOURS)).timestamp()),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


def verify_token(token: str):
    """
    Verifies and decodes a JWT token.
    Returns the decoded payload if valid, None if invalid or expired.
    Handles all JWT-related exceptions (expired, invalid signature, etc.)
    """
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
    except jwt.PyJWTError:
        return None


def auth_required(fn):
    """
    Decorator that enforces authentication on protected routes.

    Checks for a valid Bearer token in the Authorization header.
    If valid, attaches the user object to request.user for use in the route.
    Returns 401 Unauthorized if token is missing, invalid, or user not found.
    """

    @wraps(fn)
    def wrapper(*args, **kwargs):
        # Extract Authorization header and verify Bearer token format
        auth = request.headers.get("Authorization", "")
        if not auth.startswith("Bearer "):
            return jsonify({"error": "Unauthorized"}), 401

        # Extract and verify the token
        token = auth.split(" ", 1)[1].strip()
        payload = verify_token(token)
        if not payload:
            return jsonify({"error": "Unauthorized"}), 401

        # Extract username from token and verify user exists in database
        username = payload.get("sub")
        if not username:
            return jsonify({"error": "Unauthorized"}), 401

        user = User.query.filter_by(username=username).first()
        if not user:
            return jsonify({"error": "Unauthorized"}), 401

        # Attach user to request for use in the protected route
        request.user = user
        return fn(*args, **kwargs)

    return wrapper


def role_required(*roles):
    """
    Decorator factory that enforces role-based access control.

    Takes one or more role names as arguments.
    Must be used after @auth_required (automatically applied).
    Returns 403 Forbidden if user's role is not in the allowed roles list.

    Usage: @role_required("admin", "editor")
    """

    def decorator(fn):
        @wraps(fn)
        @auth_required  # Ensures user is authenticated before checking role
        def wrapper(*args, **kwargs):
            user = getattr(request, "user", None)
            if not user or user.role not in roles:
                return jsonify({"error": "Forbidden"}), 403
            return fn(*args, **kwargs)

        return wrapper

    return decorator


# -----------------------------
# Auth routes
# -----------------------------

@auth_bp.post("/register")
def register():
    """
    Handles new user registration.

    Request body:
    - username: Required, must be unique
    - password: Required
    - email: Optional, must be unique if provided
    - role: Optional, defaults to "viewer"

    Special logic:
    - First user can register as admin
    - Subsequent admin requests are downgraded to viewer

    Returns 201 on success, 400/409/500 on various errors.
    """
    try:
        # Parse and sanitize input fields
        body = request.get_json(force=True) or {}
        username = (body.get("username") or "").strip()
        password = (body.get("password") or "").strip()
        email = (body.get("email") or "").strip() or None

        # Handle role assignment - only allow admin if no admin exists
        requested_role = (body.get("role") or "viewer").strip().lower()
        if requested_role not in ("admin", "viewer"):
            requested_role = "viewer"

        # Check if an admin already exists - prevent multiple admins via registration
        has_admin = User.query.filter_by(role="admin").first() is not None
        if requested_role == "admin" and has_admin:
            requested_role = "viewer"

        # Validate required fields
        if not username or not password:
            return jsonify({"error": "Username and password are required."}), 400

        # Check for existing username
        if User.query.filter_by(username=username).first():
            return jsonify({"error": "Username already exists."}), 409

        # Check for existing email if provided
        if email and User.query.filter_by(email=email).first():
            return jsonify({"error": "Email already in use."}), 409

        # Create new user with hashed password
        user = User(
            username=username,
            email=email,
            password_hash=generate_password_hash(password),
            role=requested_role,
        )
        db.session.add(user)
        db.session.commit()

        return jsonify({
            "ok": True,
            "message": "User registered successfully.",
            "user": {"username": user.username, "role": user.role}
        }), 201
    except Exception:
        # Rollback transaction on any error to maintain database integrity
        db.session.rollback()
        return jsonify({"error": "Registration failed. Please try again."}), 500


@auth_bp.post("/login")
def login():
    """
    Handles user authentication and token issuance.

    Request body:
    - username: Required
    - password: Required

    On success, returns:
    - JWT token for subsequent authenticated requests
    - User info (username, role)
    - Token expiration times (UTC and local)
    - Client timezone name

    Returns 400 for missing credentials, 401 for invalid credentials.
    """
    try:
        # Parse credentials from request body
        body = request.get_json(force=True) or {}
        username = (body.get("username") or "").strip()
        password = (body.get("password") or "").strip()

        if not username or not password:
            return jsonify({"error": "Missing credentials"}), 400

        # Look up user and verify password
        user = User.query.filter_by(username=username).first()
        if not user:
            return jsonify({"error": "User not found"}), 401
        if not check_password_hash(user.password_hash, password):
            return jsonify({"error": "Invalid password"}), 401

        # Calculate token expiration and issue token
        now_utc = datetime.now(timezone.utc)
        exp_utc = now_utc + timedelta(hours=JWT_TTL_HOURS)
        token = issue_token(user)

        # Return token with user info and expiration details
        return jsonify({
            "token": token,
            "user": {"username": user.username, "role": user.role},
            "expires_at": exp_utc.isoformat(),
            "expires_at_local": _iso_local(exp_utc),
            "client_tz": _client_tz_name(),
        })
    except Exception:
        return jsonify({"error": "Login failed. Please try again."}), 500


@auth_bp.get("/me")
@auth_required
def me():
    """
    Returns the current authenticated user's information.
    Protected route - requires valid JWT token.
    Used by frontend to verify authentication state and get user details.
    """
    user = getattr(request, "user", None)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    return jsonify({"user": {"username": user.username, "role": user.role}})


@auth_bp.post("/logout")
@auth_required
def logout():
    """
    Handles user logout.
    Since JWTs are stateless, this is primarily for client-side token removal.
    The route is protected to ensure only authenticated users can "logout".
    Returns a simple success response.
    """
    return jsonify({"ok": True})


@auth_bp.post("/forgot")
def forgot_password():
    """
    Initiates the password reset flow.

    Request body (one of):
    - username: Look up user by username
    - email: Look up user by email

    Security considerations:
    - Always returns success message to prevent user enumeration
    - Invalidates any existing reset tokens for the user
    - Token is valid for 30 minutes
    - In production, token would be sent via email (currently logged to console)

    DEV NOTE: Token is returned in response for development/testing purposes.
    """
    try:
        body = request.get_json(force=True) or {}
        username = (body.get("username") or "").strip()
        email = (body.get("email") or "").strip()

        # Find user by username or email
        user = None
        if username:
            user = User.query.filter_by(username=username).first()
        elif email:
            user = User.query.filter_by(email=email).first()

        # Return generic message even if user not found (security best practice)
        if not user:
            return jsonify({"ok": True, "message": "If the account exists, we sent instructions."})

        # Delete any existing reset tokens for this user
        PasswordResetToken.query.filter_by(username=user.username).delete()

        # Generate new reset token with 30-minute validity
        token_rec = PasswordResetToken.issue_for(user.username, minutes_valid=30)
        db.session.add(token_rec)
        db.session.commit()

        # Log token to console for development (would email in production)
        print(f"[DEV] Password reset token for {user.username}: {token_rec.token}")
        return jsonify({
            "ok": True,
            "message": "If the account exists, we sent instructions.",
            "reset_token": token_rec.token  # DEV only - remove in production
        })
    except Exception:
        db.session.rollback()
        return jsonify({"error": "Unable to start password reset. Please try again."}), 500


@auth_bp.post("/reset")
def reset_password():
    """
    Completes the password reset flow.

    Request body:
    - token: The reset token received from /forgot endpoint
    - new_password: The new password to set

    Validates:
    - Token exists and hasn't expired
    - User still exists in database

    On success:
    - Updates user's password hash
    - Deletes the used reset token (one-time use)

    Returns appropriate error messages for invalid/expired tokens.
    """
    try:
        body = request.get_json(force=True) or {}
        token = (body.get("token") or "").strip()
        new_password = (body.get("new_password") or "").strip()

        # Validate required fields
        if not token or not new_password:
            return jsonify({"error": "Token and new password are required."}), 400

        # Look up the reset token
        prt = PasswordResetToken.query.filter_by(token=token).first()
        if not prt:
            return jsonify({"error": "Invalid or expired token."}), 400

        # Check if token has expired
        if prt.is_expired():
            db.session.delete(prt)
            db.session.commit()
            return jsonify({"error": "Invalid or expired token."}), 400

        # Verify the user still exists
        user = User.query.filter_by(username=prt.username).first()
        if not user:
            db.session.delete(prt)
            db.session.commit()
            return jsonify({"error": "User not found."}), 404

        # Update password and remove used token
        user.password_hash = generate_password_hash(new_password)
        db.session.delete(prt)
        db.session.commit()

        return jsonify({"ok": True, "message": "Password updated successfully."})
    except Exception:
        db.session.rollback()
        return jsonify({"error": "Unable to reset password. Please try again."}), 500