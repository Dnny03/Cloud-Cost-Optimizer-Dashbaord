# backend/app.py
from flask import Flask, jsonify, request
from flask_cors import CORS
from services.cloud_factory import CloudProviderFactory
from services.auth_manager import AuthManager
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

auth_manager = AuthManager()

print("\n" + "="*60)
print("Starting Multi-Cloud Intelligence Dashboard Backend")
print("="*60)

# --- Health check ---
@app.route("/api/health")
def health():
    return jsonify({"ok": True, "service": "multi-cloud-dashboard"})

# --- Get connected providers ---
@app.route("/api/providers")
def get_providers():
    """Returns list of configured cloud providers"""
    return jsonify(auth_manager.get_active_providers())

# --- Provider-specific month-to-date costs ---
@app.route("/api/<provider>/costs/mtd")
def provider_mtd_costs(provider):
    """Get MTD costs by project/service for specific provider"""
    try:
        if not auth_manager.is_provider_configured(provider):
            return jsonify({"error": f"{provider} not configured"}), 404
        
        cloud = CloudProviderFactory.create(provider, auth_manager.get_config(provider))
        data = cloud.get_mtd_costs()
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- Provider-specific daily costs trend ---
@app.route("/api/<provider>/costs/daily")
def provider_daily_costs(provider):
    """Get daily cost trend for specific provider"""
    try:
        days = int(request.args.get('days', 30))
        if not auth_manager.is_provider_configured(provider):
            return jsonify({"error": f"{provider} not configured"}), 404
        
        cloud = CloudProviderFactory.create(provider, auth_manager.get_config(provider))
        data = cloud.get_daily_costs(days)
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- Provider-specific live metrics ---
@app.route("/api/<provider>/metrics/live")
def provider_live_metrics(provider):
    """Get live metrics (CPU, traffic, disk) for specific provider"""
    try:
        if not auth_manager.is_provider_configured(provider):
            return jsonify({"error": f"{provider} not configured"}), 404
        
        cloud = CloudProviderFactory.create(provider, auth_manager.get_config(provider))
        data = cloud.get_live_metrics()
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- Provider-specific time series ---
@app.route("/api/<provider>/metrics/timeseries")
def provider_timeseries(provider):
    """Get time series data for charts"""
    try:
        metric_type = request.args.get('type', 'cpu')
        minutes = int(request.args.get('minutes', 30))
        
        if not auth_manager.is_provider_configured(provider):
            return jsonify({"error": f"{provider} not configured"}), 404
        
        cloud = CloudProviderFactory.create(provider, auth_manager.get_config(provider))
        data = cloud.get_timeseries(metric_type, minutes)
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- Unified view across all providers ---
@app.route("/api/costs/summary")
def unified_costs_summary():
    """Get cost summary across all configured providers"""
    try:
        providers = auth_manager.get_active_providers()
        summary = []
        
        for provider_info in providers:
            provider = provider_info['name']
            try:
                cloud = CloudProviderFactory.create(provider, auth_manager.get_config(provider))
                mtd = cloud.get_mtd_total()
                summary.append({
                    "provider": provider,
                    "mtd_cost": mtd,
                    "status": "active"
                })
            except Exception as e:
                summary.append({
                    "provider": provider,
                    "error": str(e),
                    "status": "error"
                })
        
        return jsonify(summary)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

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
    app.run(debug=True, port=5000, host='0.0.0.0')