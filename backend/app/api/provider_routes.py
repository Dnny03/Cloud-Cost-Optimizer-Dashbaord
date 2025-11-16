# backend/app/api/provider_routes.py
"""
Cloud provider-related API routes
Extracted from the original app.py
"""

from flask import Blueprint, request, jsonify
from functools import wraps
import jwt
import os

from app.services.auth.auth_manager import AuthManager
from app.services.providers.cloud_factory import CloudProviderFactory
from app.models import User

# Create a Blueprint for provider routes
provider_bp = Blueprint('provider', __name__)

# Initialize managers
auth_manager = AuthManager()

# JWT configuration
JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-change-me")
JWT_ALG = "HS256"


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


@provider_bp.route("/providers")
@role_required("admin", "viewer")
def get_providers():
    return jsonify(auth_manager.get_active_providers())


@provider_bp.route("/<provider>/costs/mtd")
@auth_required
def provider_mtd_costs(provider):
    try:
        if not auth_manager.is_provider_configured(provider):
            return jsonify({"error": f"{provider} not configured"}), 404
        cloud = CloudProviderFactory.create(provider, auth_manager.get_config(provider))
        data = cloud.get_mtd_costs()
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@provider_bp.route("/<provider>/costs/daily")
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


@provider_bp.route("/<provider>/metrics/live")
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


@provider_bp.route("/<provider>/metrics/timeseries")
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


@provider_bp.route("/costs/summary")
@auth_required
def unified_costs_summary():
    try:
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