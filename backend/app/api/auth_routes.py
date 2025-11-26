# backend/app/api/auth_routes.py
"""
Authentication-related API routes
Extracted from the original app.py
"""

from functools import wraps
from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo
import jwt
import os

from app.models import db, User, PasswordResetToken

# Create a Blueprint for auth routes
auth_bp = Blueprint('auth', __name__)

# JWT configuration
JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-change-me")
JWT_ALG = "HS256"
JWT_TTL_HOURS = int(os.getenv("JWT_TTL_HOURS", "8"))


# -----------------------------
# Timezone helpers
# -----------------------------
def _client_tz_name() -> str:
    return (request.headers.get("X-Timezone") or request.args.get("tz") or "UTC").strip() or "UTC"


def _client_zoneinfo():
    try:
        return ZoneInfo(_client_tz_name())
    except Exception:
        return timezone.utc


def _iso_local(dt_utc: datetime) -> str:
    if dt_utc.tzinfo is None:
        dt_utc = dt_utc.replace(tzinfo=timezone.utc)
    return dt_utc.astimezone(_client_zoneinfo()).isoformat()


# -----------------------------
# Auth helpers
# -----------------------------
def issue_token(user: User) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user.username,
        "role": user.role,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(hours=JWT_TTL_HOURS)).timestamp()),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


def verify_token(token: str):
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
    except jwt.PyJWTError:
        return None


def auth_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        auth = request.headers.get("Authorization", "")
        if not auth.startswith("Bearer "):
            return jsonify({"error": "Unauthorized"}), 401

        token = auth.split(" ", 1)[1].strip()
        payload = verify_token(token)
        if not payload:
            return jsonify({"error": "Unauthorized"}), 401

        username = payload.get("sub")
        if not username:
            return jsonify({"error": "Unauthorized"}), 401

        user = User.query.filter_by(username=username).first()
        if not user:
            return jsonify({"error": "Unauthorized"}), 401

        request.user = user
        return fn(*args, **kwargs)

    return wrapper


def role_required(*roles):
    def decorator(fn):
        @wraps(fn)
        @auth_required
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
    try:
        body = request.get_json(force=True) or {}
        username = (body.get("username") or "").strip()
        password = (body.get("password") or "").strip()
        email = (body.get("email") or "").strip() or None

        requested_role = (body.get("role") or "viewer").strip().lower()
        if requested_role not in ("admin", "viewer"):
            requested_role = "viewer"

        has_admin = User.query.filter_by(role="admin").first() is not None
        if requested_role == "admin" and has_admin:
            requested_role = "viewer"

        if not username or not password:
            return jsonify({"error": "Username and password are required."}), 400
        if User.query.filter_by(username=username).first():
            return jsonify({"error": "Username already exists."}), 409
        if email and User.query.filter_by(email=email).first():
            return jsonify({"error": "Email already in use."}), 409

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
        db.session.rollback()
        return jsonify({"error": "Registration failed. Please try again."}), 500


@auth_bp.post("/login")
def login():
    try:
        body = request.get_json(force=True) or {}
        username = (body.get("username") or "").strip()
        password = (body.get("password") or "").strip()

        if not username or not password:
            return jsonify({"error": "Missing credentials"}), 400

        user = User.query.filter_by(username=username).first()
        if not user:
            return jsonify({"error": "User not found"}), 401
        if not check_password_hash(user.password_hash, password):
            return jsonify({"error": "Invalid password"}), 401

        now_utc = datetime.now(timezone.utc)
        exp_utc = now_utc + timedelta(hours=JWT_TTL_HOURS)
        token = issue_token(user)

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
    user = getattr(request, "user", None)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    return jsonify({"user": {"username": user.username, "role": user.role}})


@auth_bp.post("/logout")
@auth_required
def logout():
    return jsonify({"ok": True})


@auth_bp.post("/forgot")
def forgot_password():
    try:
        body = request.get_json(force=True) or {}
        username = (body.get("username") or "").strip()
        email = (body.get("email") or "").strip()

        user = None
        if username:
            user = User.query.filter_by(username=username).first()
        elif email:
            user = User.query.filter_by(email=email).first()

        if not user:
            return jsonify({"ok": True, "message": "If the account exists, we sent instructions."})

        PasswordResetToken.query.filter_by(username=user.username).delete()
        token_rec = PasswordResetToken.issue_for(user.username, minutes_valid=30)
        db.session.add(token_rec)
        db.session.commit()

        print(f"[DEV] Password reset token for {user.username}: {token_rec.token}")
        return jsonify({
            "ok": True,
            "message": "If the account exists, we sent instructions.",
            "reset_token": token_rec.token
        })
    except Exception:
        db.session.rollback()
        return jsonify({"error": "Unable to start password reset. Please try again."}), 500


@auth_bp.post("/reset")
def reset_password():
    try:
        body = request.get_json(force=True) or {}
        token = (body.get("token") or "").strip()
        new_password = (body.get("new_password") or "").strip()

        if not token or not new_password:
            return jsonify({"error": "Token and new password are required."}), 400

        prt = PasswordResetToken.query.filter_by(token=token).first()
        if not prt:
            return jsonify({"error": "Invalid or expired token."}), 400

        if prt.is_expired():
            db.session.delete(prt)
            db.session.commit()
            return jsonify({"error": "Invalid or expired token."}), 400

        user = User.query.filter_by(username=prt.username).first()
        if not user:
            db.session.delete(prt)
            db.session.commit()
            return jsonify({"error": "User not found."}), 404

        user.password_hash = generate_password_hash(new_password)
        db.session.delete(prt)
        db.session.commit()

        return jsonify({"ok": True, "message": "Password updated successfully."})
    except Exception:
        db.session.rollback()
        return jsonify({"error": "Unable to reset password. Please try again."}), 500
