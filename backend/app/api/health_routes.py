# backend/app/api/health_routes.py
"""
Health check and status API routes
"""

from flask import Blueprint, jsonify
from datetime import datetime, timezone

health_bp = Blueprint('health', __name__)


@health_bp.route("/")
def index():
    return (
        "<h3>Multi-Cloud Intelligence Dashboard API</h3>"
        "<p>Health: <a href='/api/health'>/api/health</a></p>"
        "<p>Login: <code>POST /api/auth/login</code></p>"
    )


@health_bp.route("/api/health")
def health():
    return jsonify({"ok": True, "service": "multi-cloud-dashboard"})
