# backend/app.py
"""
Simplified main Flask application entry point
All routes are now organized in app/api/ folder
"""

import os
from dotenv import load_dotenv

# Load environment variables FIRST
load_dotenv()

# Now import the app modules
from app import create_app
from app.services.auth.auth_manager import AuthManager

# Create the Flask application
app = create_app(os.getenv('FLASK_ENV', 'development'))

if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("Starting Multi-Cloud Intelligence Dashboard Backend")
    print("=" * 60)

    # Check which providers are configured
    auth_manager = AuthManager()
    configured = auth_manager.get_active_providers()

    if configured:
        print(f"✓ Configured providers: {', '.join([p['name'].upper() for p in configured])}")
    else:
        print("⚠ No cloud providers configured")
        print("  Add credentials to .env file")
    print("=" * 60)

    # Run the development server
    app.run(
        debug=True,
        port=int(os.getenv('FLASK_RUN_PORT', 5050)),
        host=os.getenv('FLASK_RUN_HOST', '0.0.0.0')
    )