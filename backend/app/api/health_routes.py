# backend/app/api/health_routes.py
"""
Health check and status API routes

This module provides basic health check endpoints for:
- API status monitoring
- Load balancer health checks
- Service discovery verification
"""

# Flask utilities for routing and JSON responses
from flask import Blueprint, jsonify

# Date/time utilities (imported but not currently used - available for future health metrics)
from datetime import datetime, timezone

# Create a Blueprint for health-related routes
health_bp = Blueprint('health', __name__)


@health_bp.route("/")
def index():
    """
    Root endpoint providing basic API information and navigation.

    Returns an HTML page with:
    - API name/title
    - Link to health check endpoint
    - Login endpoint documentation

    Useful for quick verification that the API is running
    and for developers exploring the API.
    """
    return (
        "<h3>Multi-Cloud Intelligence Dashboard API</h3>"
        "<p>Health: <a href='/api/health'>/api/health</a></p>"
        "<p>Login: <code>POST /api/auth/login</code></p>"
    )


@health_bp.route("/api/health")
def health():
    """
    Health check endpoint for monitoring and load balancing.

    Returns a simple JSON response indicating the service is operational.
    Used by:
    - Load balancers to verify backend availability
    - Monitoring systems to track uptime
    - Deployment pipelines to verify successful deployments

    Response format: {"ok": true, "service": "multi-cloud-dashboard"}
    """
    return jsonify({"ok": True, "service": "multi-cloud-dashboard"})