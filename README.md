Multi-Cloud Intelligence Dashboard

A unified cloud cost analytics platform designed to visualize, optimize, and monitor resource usage across GCP, AWS, and Azure environments.

Features
- Secure user authentication (JWT-based)
- Role-based access control (Admin / Viewer)
- Forgot password and token reset flow
- Provider auto-discovery via environment variables or config/clouds.json
- Unified cost summary and provider-specific metrics
- Modern React front-end (Vite and TailwindCSS)
- Flask backend (Python 3.10+)

Project Structure
.
├── backend/
│   ├── app.py                 # Flask app entrypoint
│   ├── models.py              # User, PasswordResetToken models
│   ├── services/
│   │   ├── auth_manager.py    # Provider configuration loader
│   │   ├── cloud_factory.py   # Provider factory
│   │   └── providers/         # GCP, AWS, Azure implementations
│   └── instance/
│       └── app.db             # SQLite database
│
├── frontend/
│   ├── App.jsx
│   ├── Login.jsx
│   ├── components/
│   │   ├── CloudDashboard.jsx
│   │   ├── OverviewTab.jsx
│   │   ├── ProviderTab.jsx
│   │   └── MetricsCard.jsx
│   └── services/
│       └── api.js
│
├── .env
├── README.md
└── README.txt

Setup Instructions

Backend
1. Navigate to the backend folder
2. Create and activate a virtual environment
3. Install dependencies from requirements.txt
4. Run the Flask app

Frontend
1. Navigate to the frontend folder
2. Install dependencies
3. Start the development server

Access the app at: http://localhost:5173

Roles
Role     | Permissions
---------|-------------------------------
Admin    | Full access (provider data, configuration endpoints)
Viewer   | Read-only (dashboard and metrics)

Note: Only the first registered user can be created as an admin.

Environment Variables
Create a .env file in the backend folder with the following keys:

DATABASE_URL=sqlite:///instance/app.db
JWT_SECRET=supersecretkey
JWT_TTL_HOURS=8
CLOUD_CONFIG_PATH=config/clouds.json

Tech Stack
Layer       | Technology
------------|------------------------------
Frontend    | React (Vite) and TailwindCSS
Backend     | Flask and SQLAlchemy
Database    | SQLite (dev) / PostgreSQL (prod)
Auth        | JWT
Cloud SDKs  | boto3, google-cloud-bigquery, azure-identity, etc.

License
MIT License © 2025 Multi-Cloud Intelligence Team