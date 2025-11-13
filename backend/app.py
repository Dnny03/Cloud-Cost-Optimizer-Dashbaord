# backend/app.py
from functools import wraps
import os
import secrets
from datetime import datetime, timedelta, timezone

from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
import jwt
from zoneinfo import ZoneInfo  # convert UTC → client-local based on IANA tz string

from services.cloud_factory import CloudProviderFactory
from services.auth_manager import AuthManager  # manages provider credentials/config

# DB + models
from models import db, User, PasswordResetToken
from werkzeug.security import generate_password_hash, check_password_hash

# -----------------------------
# Bootstrap
# -----------------------------
load_dotenv()  # load env vars from .env

app = Flask(__name__)
CORS(app)  # allow frontend (Vite dev) to call this API

# Database configuration
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL", "sqlite:///app.db")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db.init_app(app)
with app.app_context():
    db.create_all()  # create tables if they don't exist

# JWT config
JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-change-me")
JWT_ALG = "HS256"
JWT_TTL_HOURS = int(os.getenv("JWT_TTL_HOURS", "8"))  # token lifetime

auth_manager = AuthManager()  # central place to check which providers are configured

print("\n" + "=" * 60)
print("Starting Multi-Cloud Intelligence Dashboard Backend")
print("=" * 60)

# -----------------------------
# Timezone helpers (client tz via header)
# -----------------------------
def _client_tz_name() -> str:
    # Frontend sends X-Timezone (e.g., "America/New_York"); fallback to query ?tz= or UTC
    return (request.headers.get("X-Timezone") or request.args.get("tz") or "UTC").strip() or "UTC"

def _client_zoneinfo():
    # Safely construct ZoneInfo; fallback to UTC if invalid
    try:
        return ZoneInfo(_client_tz_name())
    except Exception:
        return timezone.utc

def _iso_local(dt_utc: datetime) -> str:
    # Convert a UTC dt to client-local ISO string
    if dt_utc.tzinfo is None:
        dt_utc = dt_utc.replace(tzinfo=timezone.utc)
    return dt_utc.astimezone(_client_zoneinfo()).isoformat()

# -----------------------------
# Auth helpers
# -----------------------------
def issue_token(user: User) -> str:
    # Create a signed JWT with subject + role + iat + exp
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user.username,
        "role": user.role,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(hours=JWT_TTL_HOURS)).timestamp()),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)

def verify_token(token: str):
    # Decode/verify JWT; return payload or None on failure
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
    except jwt.PyJWTError:
        return None

def auth_required(fn):
    # Decorator for endpoints that require a valid Bearer token
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

        # stash the full user object on request
        request.user = user
        return fn(*args, **kwargs)
    return wrapper

# -----------------------------
# Public routes
# -----------------------------
@app.route("/")
def index():
    # Simple landing with quick links
    return (
        "<h3>Multi-Cloud Intelligence Dashboard API</h3>"
        "<p>Health: <a href='/api/health'>/api/health</a></p>"
        "<p>Login: <code>POST /api/auth/login</code></p>"
    )

@app.route("/api/health")
def health():
    # Liveness probe
    return jsonify({"ok": True, "service": "multi-cloud-dashboard"})

# -----------------------------
# Auth routes (DB-backed)
# -----------------------------
@app.post("/api/auth/register")
def register():
    """
    Create a new user.
    Expects: {"username": "...", "password": "...", "email": optional, "role": optional}
    - role can be "viewer" or "admin"
    - security: only allow "admin" if no admin exists yet (bootstrap); otherwise force "viewer"
    """
    try:
        body = request.get_json(force=True) or {}
        username = (body.get("username") or "").strip()
        password = (body.get("password") or "").strip()
        email = (body.get("email") or "").strip() or None

        # NEW: role handling
        requested_role = (body.get("role") or "viewer").strip().lower()
        if requested_role not in ("admin", "viewer"):
            requested_role = "viewer"

        # Security: only allow "admin" if this is the very first admin
        has_admin = User.query.filter_by(role="admin").first() is not None
        if requested_role == "admin" and has_admin:
            # silently downgrade to viewer after first admin is created
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
            role=requested_role,  # NEW
        )
        db.session.add(user)
        db.session.commit()

        return jsonify({
            "ok": True,
            "message": "User registered successfully.",
            "user": {
                "username": user.username,
                "role": user.role,
            }
        }), 201
    except Exception:
        db.session.rollback()
        return jsonify({"error": "Registration failed. Please try again."}), 500

@app.post("/api/auth/login")
def login():
    """
    Body: {"username": "...", "password": "..."}
    Returns: {"token": "<jwt>", "user": {"username": ...}, "expires_at": UTC ISO, "expires_at_local": local ISO}
    """
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

        # Issue JWT and return both UTC/local expirations
        now_utc = datetime.now(timezone.utc)
        exp_utc = now_utc + timedelta(hours=JWT_TTL_HOURS)
        token = issue_token(user)

        return jsonify({
            "token": token,
            "user": {"username": user.username, "role": user.role},
            "expires_at": exp_utc.isoformat(),         # UTC expiration
            "expires_at_local": _iso_local(exp_utc),   # client-local expiration
            "client_tz": _client_tz_name(),
        })
    except Exception:
        return jsonify({"error": "Login failed. Please try again."}), 500

@app.get("/api/auth/me")
@auth_required
def me():
    user = getattr(request, "user", None)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    return jsonify({"user": {"username": user.username, "role": user.role}})

def role_required(*roles):
    """
    Decorator for role-based access.
    Usage:
        @role_required("admin")
        def some_route(): ...
    """
    def decorator(fn):
        @wraps(fn)
        @auth_required  # ensure authenticated first
        def wrapper(*args, **kwargs):
            user = getattr(request, "user", None)
            if not user or user.role not in roles:
                return jsonify({"error": "Forbidden"}), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator

@app.post("/api/auth/logout")
@auth_required
def logout():
    # Stateless JWT flow → nothing to revoke server-side
    return jsonify({"ok": True})

@app.post("/api/auth/forgot")
def forgot_password():
    """
    Body: {"username": "..."} or {"email": "..."}
    Dev mode: returns reset token in response (log/inspect).
    Prod: would send email instead and never reveal existence.
    """
    try:
        body = request.get_json(force=True) or {}
        username = (body.get("username") or "").strip()
        email = (body.get("email") or "").strip()

        # Lookup by username or email
        user = None
        if username:
            user = User.query.filter_by(username=username).first()
        elif email:
            user = User.query.filter_by(email=email).first()

        # Always 200 to prevent user enumeration
        if not user:
            return jsonify({"ok": True, "message": "If the account exists, we sent instructions."})

        # Invalidate prior tokens, issue a new one-time token
        PasswordResetToken.query.filter_by(username=user.username).delete()
        token_rec = PasswordResetToken.issue_for(user.username, minutes_valid=30)
        db.session.add(token_rec)
        db.session.commit()

        # Dev visibility for testing reset flow
        print(f"[DEV] Password reset token for {user.username}: {token_rec.token}")
        return jsonify({
            "ok": True,
            "message": "If the account exists, we sent instructions.",
            "reset_token": token_rec.token  # remove in production
        })
    except Exception:
        db.session.rollback()
        return jsonify({"error": "Unable to start password reset. Please try again."}), 500

@app.post("/api/auth/reset")
def reset_password():
    """
    Body: {"token": "...", "new_password": "..."}
    Uses one-time token; deletes it after success.
    """
    try:
        body = request.get_json(force=True) or {}
        token = (body.get("token") or "").strip()
        new_password = (body.get("new_password") or "").strip()

        if not token or not new_password:
            return jsonify({"error": "Token and new password are required."}), 400

        prt = PasswordResetToken.query.filter_by(token=token).first()
        if not prt:
            return jsonify({"error": "Invalid or expired token."}), 400

        # Guard against expired tokens (supports naive/aware timestamps)
        if prt.is_expired():
            db.session.delete(prt)
            db.session.commit()
            return jsonify({"error": "Invalid or expired token."}), 400

        # Update password and invalidate token
        user = User.query.filter_by(username=prt.username).first()
        if not user:
            db.session.delete(prt)
            db.session.commit()
            return jsonify({"error": "User not found."}), 404

        user.password_hash = generate_password_hash(new_password)
        db.session.delete(prt)  # one-time use token
        db.session.commit()

        return jsonify({"ok": True, "message": "Password updated successfully."})
    except Exception:
        db.session.rollback()
        return jsonify({"error": "Unable to reset password. Please try again."}), 500

# -----------------------------
# Protected data routes
# -----------------------------
@app.route("/api/providers")
@role_required("admin", "viewer")
def get_providers():
    # List providers enabled via AuthManager config
    return jsonify(auth_manager.get_active_providers())

@app.route("/api/<provider>/costs/mtd")
@auth_required
def provider_mtd_costs(provider):
    try:
        # Validate provider is configured; then fetch month-to-date costs
        if not auth_manager.is_provider_configured(provider):
            return jsonify({"error": f"{provider} not configured"}), 404
        cloud = CloudProviderFactory.create(provider, auth_manager.get_config(provider))
        data = cloud.get_mtd_costs()
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/<provider>/costs/daily")
@auth_required
def provider_daily_costs(provider):
    try:
        days = int(request.args.get("days", 30))
        if not auth_manager.is_provider_configured(provider):
            return jsonify({"error": f"{provider} not configured"}), 404
        cloud = CloudProviderFactory.create(provider, auth_manager.get_config(provider))
        data = cloud.get_daily_costs(days)
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/<provider>/metrics/live")
@auth_required
def provider_live_metrics(provider):
    try:
        if not auth_manager.is_provider_configured(provider):
            return jsonify({"error": f"{provider} not configured"}), 404
        cloud = CloudProviderFactory.create(provider, auth_manager.get_config(provider))
        data = cloud.get_live_metrics()
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/<provider>/metrics/timeseries")
@auth_required
def provider_timeseries(provider):
    try:
        metric_type = request.args.get("type", "cpu")
        minutes = int(request.args.get("minutes", 30))
        if not auth_manager.is_provider_configured(provider):
            return jsonify({"error": f"{provider} not configured"}), 404
        cloud = CloudProviderFactory.create(provider, auth_manager.get_config(provider))
        data = cloud.get_timeseries(metric_type, minutes)
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/costs/summary")
@auth_required
def unified_costs_summary():
    try:
        # Aggregate per-provider month-to-date totals; annotate errors per provider
        providers = auth_manager.get_active_providers()
        summary = []
        for provider_info in providers:
            provider = provider_info["name"]
            try:
                cloud = CloudProviderFactory.create(provider, auth_manager.get_config(provider))
                mtd = cloud.get_mtd_total()
                summary.append({"provider": provider, "mtd_cost": mtd, "status": "active"})
            except Exception as e:
                summary.append({"provider": provider, "error": str(e), "status": "error"})
        return jsonify(summary)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# -----------------------------
# Entrypoint
# -----------------------------
if __name__ == "__main__":
    print("=" * 50)
    print("Multi-Cloud Intelligence Dashboard - Backend")
    print("=" * 50)
    configured = auth_manager.get_active_providers()
    if configured:
        print(f"✓ Configured providers: {', '.join([p['name'].upper() for p in configured])}")
    else:
        print("⚠ No cloud providers configured")
        print("  Add credentials to .env file")
    print("=" * 50)
    app.run(debug=True, port=5050, host="0.0.0.0")  # dev server (accessible on LAN)