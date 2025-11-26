"""
Cloud provider-related API routes
Includes: costs, metrics, anomalies, forecasting, recommendations, alerts, budgets
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


# ==================== PROVIDER ROUTES ====================

@provider_bp.route("/providers")
@role_required("admin", "viewer")
def get_providers():
    return jsonify(auth_manager.get_active_providers())


# ==================== COST ROUTES ====================

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


# ==================== METRICS ROUTES ====================

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


# ==================== ANOMALY DETECTION ROUTES ====================

@provider_bp.route("/<provider>/anomalies")
@auth_required
def provider_anomalies(provider):
    """Get detected cost anomalies for a provider"""
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
    """Get anomalies from all providers"""
    try:
        providers = auth_manager.get_active_providers()
        all_anomalies = []
        for provider_info in providers:
            provider = provider_info["name"]
            try:
                cloud = CloudProviderFactory.create(provider, auth_manager.get_config(provider))
                anomalies = cloud.get_anomalies()
                for anomaly in anomalies:
                    anomaly['provider'] = provider
                all_anomalies.extend(anomalies)
            except Exception as e:
                continue  # Skip provider on error

        # Sort by deviation percentage
        all_anomalies.sort(key=lambda x: x.get('deviation_percent', 0), reverse=True)
        return jsonify(all_anomalies)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ==================== FORECASTING ROUTES ====================

@provider_bp.route("/<provider>/forecast")
@auth_required
def provider_forecast(provider):
    """Get cost forecast for a provider"""
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
    """Get forecasts from all providers"""
    try:
        days = int(request.args.get("days", 7))
        providers = auth_manager.get_active_providers()
        forecasts = {}
        total_current = 0
        total_projected = 0

        for provider_info in providers:
            provider = provider_info["name"]
            try:
                cloud = CloudProviderFactory.create(provider, auth_manager.get_config(provider))
                forecast = cloud.get_forecast(days)
                forecasts[provider] = forecast
                total_current += forecast.get('current_mtd', 0)
                total_projected += forecast.get('projected_eom', 0)
            except Exception as e:
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
    """Get cost optimization recommendations for a provider"""
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
    """Get recommendations from all providers"""
    try:
        providers = auth_manager.get_active_providers()
        all_recommendations = []
        total_savings = 0

        for provider_info in providers:
            provider = provider_info["name"]
            try:
                cloud = CloudProviderFactory.create(provider, auth_manager.get_config(provider))
                recommendations = cloud.get_recommendations()
                for rec in recommendations:
                    rec['provider'] = provider
                    total_savings += rec.get('potential_savings_monthly', 0)
                all_recommendations.extend(recommendations)
            except Exception as e:
                continue  # Skip provider on error

        # Sort by potential savings
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
    """Get active alerts for a provider"""
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
    """Get alerts from all providers"""
    try:
        providers = auth_manager.get_active_providers()
        all_alerts = []

        for provider_info in providers:
            provider = provider_info["name"]
            try:
                cloud = CloudProviderFactory.create(provider, auth_manager.get_config(provider))
                alerts = cloud.get_alerts()
                for alert in alerts:
                    alert['provider'] = provider
                all_alerts.extend(alerts)
            except Exception as e:
                continue  # Skip provider on error

        # Sort by created_at (most recent first)
        all_alerts.sort(key=lambda x: x.get('created_at', ''), reverse=True)

        # Count by severity
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
    """Get budget tracking data for a provider"""
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
    """Get budgets from all providers"""
    try:
        providers = auth_manager.get_active_providers()
        all_budgets = []
        total_budget = 0
        total_spent = 0

        for provider_info in providers:
            provider = provider_info["name"]
            try:
                cloud = CloudProviderFactory.create(provider, auth_manager.get_config(provider))
                budgets = cloud.get_budgets()
                # Only count overall budgets for totals
                for budget in budgets:
                    budget['provider'] = provider
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
    """Get detailed services breakdown by category"""
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
    """Get services breakdown from all providers"""
    try:
        providers = auth_manager.get_active_providers()
        breakdowns = {}
        total_cost = 0
        total_services = 0

        for provider_info in providers:
            provider = provider_info["name"]
            try:
                cloud = CloudProviderFactory.create(provider, auth_manager.get_config(provider))
                breakdown = cloud.get_services_breakdown()
                breakdowns[provider] = breakdown
                total_cost += breakdown.get('total_cost', 0)
                total_services += breakdown.get('total_services', 0)
            except Exception as e:
                breakdowns[provider] = {"error": str(e)}

        return jsonify({
            "providers": breakdowns,
            "total_cost": round(total_cost, 2),
            "total_services": total_services
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
