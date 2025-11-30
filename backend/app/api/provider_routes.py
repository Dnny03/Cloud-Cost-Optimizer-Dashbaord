# backend/app/api/provider_routes.py
"""
Cloud provider-related API routes
Includes: costs, metrics, anomalies, forecasting, recommendations, alerts, budgets

This module serves as the main API interface for interacting with multiple cloud providers
(AWS, Azure, GCP). It provides unified endpoints for fetching data from individual providers
as well as aggregated endpoints that combine data from all configured providers.
"""

# Flask utilities for routing and JSON responses
from flask import Blueprint, request, jsonify

# Function wrapper utility for decorators
from functools import wraps

# JWT library for token verification
import jwt
import os

# Internal service imports for authentication and cloud provider management
from app.services.auth.auth_manager import AuthManager
from app.services.providers.cloud_factory import CloudProviderFactory
from app.models import User

# Create a Blueprint for provider routes - groups all cloud provider API endpoints
provider_bp = Blueprint('provider', __name__)

# Initialize the authentication manager for provider configuration
auth_manager = AuthManager()

# JWT configuration - must match settings in auth_routes.py
JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-change-me")
JWT_ALG = "HS256"


def verify_token(token: str):
    """
    Verifies and decodes a JWT token.
    
    Args:
        token: The JWT token string to verify
        
    Returns:
        Decoded payload dict if valid, None if invalid or expired.
    
    Note: This is duplicated from auth_routes.py - consider extracting
    to a shared utility module for DRY compliance.
    """
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
    except jwt.PyJWTError:
        return None


def auth_required(fn):
    """
    Decorator that enforces authentication on protected routes.
    
    Validates the Bearer token from Authorization header,
    verifies the token, and attaches the user object to the request.
    
    Returns 401 Unauthorized if:
    - No Authorization header present
    - Token format is invalid
    - Token is expired or invalid
    - User not found in database
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        # Check for Authorization header with Bearer token
        auth = request.headers.get("Authorization", "")
        if not auth.startswith("Bearer "):
            return jsonify({"error": "Unauthorized"}), 401

        # Extract and verify the JWT token
        token = auth.split(" ", 1)[1].strip()
        payload = verify_token(token)
        if not payload:
            return jsonify({"error": "Unauthorized"}), 401

        # Get username from token subject claim
        username = payload.get("sub")
        if not username:
            return jsonify({"error": "Unauthorized"}), 401

        # Verify user exists in database
        user = User.query.filter_by(username=username).first()
        if not user:
            return jsonify({"error": "Unauthorized"}), 401

        # Attach user to request for downstream use
        request.user = user
        return fn(*args, **kwargs)

    return wrapper


def role_required(*roles):
    """
    Decorator factory for role-based access control.
    
    Args:
        *roles: Variable number of role names that are allowed access
        
    Usage:
        @role_required("admin", "viewer")
        def some_route():
            ...
            
    Returns 403 Forbidden if user's role is not in the allowed roles list.
    Automatically applies @auth_required first.
    """
    def decorator(fn):
        @wraps(fn)
        @auth_required  # Chain with auth_required for authentication check
        def wrapper(*args, **kwargs):
            user = getattr(request, "user", None)
            if not user or user.role not in roles:
                return jsonify({"error": "Forbidden"}), 403
            return fn(*args, **kwargs)

        return wrapper

    return decorator


# ==================== PROVIDER ROUTES ====================

@provider_bp.route("/providers")
@role_required("admin", "viewer")
def get_providers():
    """
    Returns a list of all configured and active cloud providers.
    
    Used by the frontend to determine which providers are available
    and to populate provider selection dropdowns.
    
    Requires: admin or viewer role
    """
    return jsonify(auth_manager.get_active_providers())


# ==================== COST ROUTES ====================

@provider_bp.route("/<provider>/costs/mtd")
@auth_required
def provider_mtd_costs(provider):
    """
    Get month-to-date cost breakdown for a specific provider.
    
    Args:
        provider: Cloud provider name (aws, azure, gcp)
        
    Returns detailed MTD costs including service-level breakdown.
    Returns 404 if provider is not configured.
    """
    try:
        # Verify provider is configured before attempting to fetch data
        if not auth_manager.is_provider_configured(provider):
            return jsonify({"error": f"{provider} not configured"}), 404
        
        # Create provider instance and fetch MTD costs
        cloud = CloudProviderFactory.create(provider, auth_manager.get_config(provider))
        data = cloud.get_mtd_costs()
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@provider_bp.route("/<provider>/costs/daily")
@auth_required
def provider_daily_costs(provider):
    """
    Get daily cost data for a specific provider over a time period.
    
    Args:
        provider: Cloud provider name (aws, azure, gcp)
        
    Query params:
        days: Number of days to retrieve (default: 30)
        
    Used for generating cost trend charts and historical analysis.
    """
    try:
        # Parse days parameter with default of 30 days
        days = int(request.args.get("days", 30))
        
        if not auth_manager.is_provider_configured(provider):
            return jsonify({"error": f"{provider} not configured"}), 404
        
        cloud = CloudProviderFactory.create(provider, auth_manager.get_config(provider))
        data = cloud.get_daily_costs(days)
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@provider_bp.route("/costs/summary")
@auth_required
def unified_costs_summary():
    """
    Get a unified cost summary across all configured providers.
    
    Returns an array of provider summaries, each containing:
    - provider: Provider name
    - mtd_cost: Month-to-date total cost
    - status: "active" or "error"
    - error: Error message if status is "error"
    
    Used by the Overview tab to display multi-cloud cost summary.
    Continues processing other providers even if one fails.
    """
    try:
        providers = auth_manager.get_active_providers()
        summary = []
        
        # Iterate through all active providers and collect MTD costs
        for provider_info in providers:
            provider = provider_info["name"]
            try:
                cloud = CloudProviderFactory.create(provider, auth_manager.get_config(provider))
                mtd = cloud.get_mtd_total()
                summary.append({"provider": provider, "mtd_cost": mtd, "status": "active"})
            except Exception as e:
                # Include error info but don't fail the entire request
                summary.append({"provider": provider, "error": str(e), "status": "error"})
        
        return jsonify(summary)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ==================== METRICS ROUTES ====================

@provider_bp.route("/<provider>/metrics/live")
@auth_required
def provider_live_metrics(provider):
    """
    Get real-time metrics for a specific provider.
    
    Args:
        provider: Cloud provider name (aws, azure, gcp)
        
    Returns current metrics like CPU utilization, memory usage,
    network throughput, etc. for the provider's resources.
    """
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
    """
    Get time-series metrics data for a specific provider.
    
    Args:
        provider: Cloud provider name (aws, azure, gcp)
        
    Query params:
        type: Metric type (default: "cpu") - e.g., cpu, memory, network
        minutes: Time range in minutes (default: 30)
        
    Returns timestamped data points for charting historical metrics.
    """
    try:
        # Parse query parameters for metric type and time range
        metric_type = request.args.get("type", "cpu")
        minutes = int(request.args.get("minutes", 30))
        
        if not auth_manager.is_provider_configured(provider):
            return jsonify({"error": f"{provider} not configured"}), 404
        
        cloud = CloudProviderFactory.create(provider, auth_manager.get_config(provider))
        data = cloud.get_timeseries(metric_type, minutes)
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ==================== ANOMALY DETECTION ROUTES ====================

@provider_bp.route("/<provider>/anomalies")
@auth_required
def provider_anomalies(provider):
    """
    Get detected cost anomalies for a specific provider.
    
    Args:
        provider: Cloud provider name (aws, azure, gcp)
        
    Returns a list of detected anomalies including:
    - Service name
    - Expected vs actual cost
    - Deviation percentage
    - Severity level
    - Recommended action
    """
    try:
        if not auth_manager.is_provider_configured(provider):
            return jsonify({"error": f"{provider} not configured"}), 404
        
        cloud = CloudProviderFactory.create(provider, auth_manager.get_config(provider))
        data = cloud.get_anomalies()
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@provider_bp.route("/anomalies/all")
@auth_required
def all_anomalies():
    """
    Get aggregated anomalies from all configured providers.
    
    Collects anomalies from each provider, adds provider identifier,
    and returns them sorted by deviation percentage (highest first).
    
    Silently skips providers that fail to return data to ensure
    partial results are still returned.
    """
    try:
        providers = auth_manager.get_active_providers()
        all_anomalies = []
        
        # Collect anomalies from all providers
        for provider_info in providers:
            provider = provider_info["name"]
            try:
                cloud = CloudProviderFactory.create(provider, auth_manager.get_config(provider))
                anomalies = cloud.get_anomalies()
                
                # Tag each anomaly with its provider for identification
                for anomaly in anomalies:
                    anomaly['provider'] = provider
                all_anomalies.extend(anomalies)
            except Exception as e:
                continue  # Skip provider on error - don't fail entire request

        # Sort by deviation percentage to show most severe anomalies first
        all_anomalies.sort(key=lambda x: x.get('deviation_percent', 0), reverse=True)
        return jsonify(all_anomalies)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ==================== FORECASTING ROUTES ====================

@provider_bp.route("/<provider>/forecast")
@auth_required
def provider_forecast(provider):
    """
    Get cost forecast for a specific provider.
    
    Args:
        provider: Cloud provider name (aws, azure, gcp)
        
    Query params:
        days: Number of days to forecast (default: 7)
        
    Returns forecast data including:
    - Current MTD spend
    - Projected end-of-month cost
    - Daily forecast values
    - Trend direction
    """
    try:
        days = int(request.args.get("days", 7))
        
        if not auth_manager.is_provider_configured(provider):
            return jsonify({"error": f"{provider} not configured"}), 404
        
        cloud = CloudProviderFactory.create(provider, auth_manager.get_config(provider))
        data = cloud.get_forecast(days)
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@provider_bp.route("/forecast/all")
@auth_required
def all_forecasts():
    """
    Get aggregated forecasts from all configured providers.
    
    Query params:
        days: Number of days to forecast (default: 7)
        
    Returns:
    - Individual provider forecasts
    - Total current MTD across all providers
    - Total projected end-of-month across all providers
    
    Used by the Budgets & Forecast tab for multi-cloud projections.
    """
    try:
        days = int(request.args.get("days", 7))
        providers = auth_manager.get_active_providers()
        forecasts = {}
        total_current = 0
        total_projected = 0

        # Aggregate forecasts and calculate totals
        for provider_info in providers:
            provider = provider_info["name"]
            try:
                cloud = CloudProviderFactory.create(provider, auth_manager.get_config(provider))
                forecast = cloud.get_forecast(days)
                forecasts[provider] = forecast
                
                # Accumulate totals for summary
                total_current += forecast.get('current_mtd', 0)
                total_projected += forecast.get('projected_eom', 0)
            except Exception as e:
                # Include error but continue processing other providers
                forecasts[provider] = {"error": str(e)}

        return jsonify({
            "providers": forecasts,
            "total_current_mtd": round(total_current, 2),
            "total_projected_eom": round(total_projected, 2)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ==================== RECOMMENDATIONS ROUTES ====================

@provider_bp.route("/<provider>/recommendations")
@auth_required
def provider_recommendations(provider):
    """
    Get cost optimization recommendations for a specific provider.
    
    Args:
        provider: Cloud provider name (aws, azure, gcp)
        
    Returns actionable recommendations including:
    - Resource/service to optimize
    - Current vs recommended configuration
    - Potential monthly savings
    - Implementation effort level
    """
    try:
        if not auth_manager.is_provider_configured(provider):
            return jsonify({"error": f"{provider} not configured"}), 404
        
        cloud = CloudProviderFactory.create(provider, auth_manager.get_config(provider))
        data = cloud.get_recommendations()
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@provider_bp.route("/recommendations/all")
@auth_required
def all_recommendations():
    """
    Get aggregated recommendations from all configured providers.
    
    Collects recommendations from all providers and returns:
    - All recommendations sorted by potential savings (highest first)
    - Total potential monthly savings
    - Total potential yearly savings
    - Total recommendation count
    
    Used by the Insights tab for multi-cloud optimization opportunities.
    """
    try:
        providers = auth_manager.get_active_providers()
        all_recommendations = []
        total_savings = 0

        # Collect and aggregate recommendations
        for provider_info in providers:
            provider = provider_info["name"]
            try:
                cloud = CloudProviderFactory.create(provider, auth_manager.get_config(provider))
                recommendations = cloud.get_recommendations()
                
                # Tag recommendations and accumulate savings
                for rec in recommendations:
                    rec['provider'] = provider
                    total_savings += rec.get('potential_savings_monthly', 0)
                all_recommendations.extend(recommendations)
            except Exception as e:
                continue  # Skip provider on error

        # Sort by savings potential to prioritize high-impact recommendations
        all_recommendations.sort(key=lambda x: x.get('potential_savings_monthly', 0), reverse=True)

        return jsonify({
            "recommendations": all_recommendations,
            "total_potential_savings_monthly": round(total_savings, 2),
            "total_potential_savings_yearly": round(total_savings * 12, 2),
            "recommendation_count": len(all_recommendations)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ==================== ALERTS ROUTES ====================

@provider_bp.route("/<provider>/alerts")
@auth_required
def provider_alerts(provider):
    """
    Get active alerts for a specific provider.
    
    Args:
        provider: Cloud provider name (aws, azure, gcp)
        
    Returns current alerts including:
    - Alert title and message
    - Severity level (critical, high, warning, medium, low)
    - Creation timestamp
    - Acknowledgment status
    """
    try:
        if not auth_manager.is_provider_configured(provider):
            return jsonify({"error": f"{provider} not configured"}), 404
        
        cloud = CloudProviderFactory.create(provider, auth_manager.get_config(provider))
        data = cloud.get_alerts()
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@provider_bp.route("/alerts/all")
@auth_required
def all_alerts():
    """
    Get aggregated alerts from all configured providers.
    
    Returns:
    - All alerts sorted by creation time (most recent first)
    - Total alert count
    - Unacknowledged alert count
    - Breakdown by severity level
    
    Used by the Insights tab for multi-cloud alert monitoring.
    """
    try:
        providers = auth_manager.get_active_providers()
        all_alerts = []

        # Collect alerts from all providers
        for provider_info in providers:
            provider = provider_info["name"]
            try:
                cloud = CloudProviderFactory.create(provider, auth_manager.get_config(provider))
                alerts = cloud.get_alerts()
                
                # Tag each alert with provider
                for alert in alerts:
                    alert['provider'] = provider
                all_alerts.extend(alerts)
            except Exception as e:
                continue  # Skip provider on error

        # Sort by creation time - most recent alerts first
        all_alerts.sort(key=lambda x: x.get('created_at', ''), reverse=True)

        # Calculate severity breakdown for dashboard display
        severity_counts = {
            'critical': len([a for a in all_alerts if a.get('severity') == 'critical']),
            'high': len([a for a in all_alerts if a.get('severity') == 'high']),
            'warning': len([a for a in all_alerts if a.get('severity') == 'warning']),
            'medium': len([a for a in all_alerts if a.get('severity') == 'medium']),
            'low': len([a for a in all_alerts if a.get('severity') == 'low'])
        }

        return jsonify({
            "alerts": all_alerts,
            "total_count": len(all_alerts),
            "unacknowledged_count": len([a for a in all_alerts if not a.get('acknowledged')]),
            "severity_counts": severity_counts
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ==================== BUDGET ROUTES ====================

@provider_bp.route("/<provider>/budgets")
@auth_required
def provider_budgets(provider):
    """
    Get budget tracking data for a specific provider.
    
    Args:
        provider: Cloud provider name (aws, azure, gcp)
        
    Returns budget information including:
    - Budget name and type (overall, service, category)
    - Budget amount and spent amount
    - Utilization percentage
    - Status (on_track, at_risk, exceeded)
    """
    try:
        if not auth_manager.is_provider_configured(provider):
            return jsonify({"error": f"{provider} not configured"}), 404
        
        cloud = CloudProviderFactory.create(provider, auth_manager.get_config(provider))
        data = cloud.get_budgets()
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@provider_bp.route("/budgets/all")
@auth_required
def all_budgets():
    """
    Get aggregated budget data from all configured providers.
    
    Returns:
    - All budgets with provider tags
    - Total budget amount (from overall budgets only)
    - Total spent amount
    - Total remaining amount
    - Overall utilization percentage
    - Count of at-risk budgets
    
    Used by the Budgets & Forecast tab for multi-cloud budget tracking.
    Note: Only 'overall' type budgets are included in totals to avoid double-counting.
    """
    try:
        providers = auth_manager.get_active_providers()
        all_budgets = []
        total_budget = 0
        total_spent = 0

        # Collect budgets from all providers
        for provider_info in providers:
            provider = provider_info["name"]
            try:
                cloud = CloudProviderFactory.create(provider, auth_manager.get_config(provider))
                budgets = cloud.get_budgets()
                
                # Process each budget and accumulate totals
                for budget in budgets:
                    budget['provider'] = provider
                    # Only count overall budgets for totals to avoid double-counting
                    if budget.get('type') == 'overall':
                        total_budget += budget.get('budget_amount', 0)
                        total_spent += budget.get('spent_amount', 0)
                all_budgets.extend(budgets)
            except Exception as e:
                continue  # Skip provider on error

        return jsonify({
            "budgets": all_budgets,
            "total_budget": round(total_budget, 2),
            "total_spent": round(total_spent, 2),
            "total_remaining": round(total_budget - total_spent, 2),
            "overall_utilization": round((total_spent / total_budget * 100), 1) if total_budget > 0 else 0,
            "at_risk_count": len([b for b in all_budgets if b.get('status') == 'at_risk'])
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ==================== SERVICES BREAKDOWN ROUTES ====================

@provider_bp.route("/<provider>/services/breakdown")
@auth_required
def provider_services_breakdown(provider):
    """
    Get detailed services breakdown by category for a specific provider.
    
    Args:
        provider: Cloud provider name (aws, azure, gcp)
        
    Returns hierarchical breakdown:
    - Categories (Compute, Storage, Database, etc.)
    - Services within each category
    - Cost per service
    - Service count per category
    
    Used by the Services Breakdown panel on the Overview tab.
    """
    try:
        if not auth_manager.is_provider_configured(provider):
            return jsonify({"error": f"{provider} not configured"}), 404
        
        cloud = CloudProviderFactory.create(provider, auth_manager.get_config(provider))
        data = cloud.get_services_breakdown()
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@provider_bp.route("/services/breakdown/all")
@auth_required
def all_services_breakdown():
    """
    Get aggregated services breakdown from all configured providers.
    
    Returns:
    - Per-provider breakdown data
    - Total cost across all providers
    - Total service count across all providers
    
    Used by the Services Breakdown panel when "All Providers" is selected,
    enabling cross-cloud service cost comparison.
    """
    try:
        providers = auth_manager.get_active_providers()
        breakdowns = {}
        total_cost = 0
        total_services = 0

        # Collect breakdowns from all providers
        for provider_info in providers:
            provider = provider_info["name"]
            try:
                cloud = CloudProviderFactory.create(provider, auth_manager.get_config(provider))
                breakdown = cloud.get_services_breakdown()
                breakdowns[provider] = breakdown
                
                # Accumulate totals
                total_cost += breakdown.get('total_cost', 0)
                total_services += breakdown.get('total_services', 0)
            except Exception as e:
                # Include error info for debugging
                breakdowns[provider] = {"error": str(e)}

        return jsonify({
            "providers": breakdowns,
            "total_cost": round(total_cost, 2),
            "total_services": total_services
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500