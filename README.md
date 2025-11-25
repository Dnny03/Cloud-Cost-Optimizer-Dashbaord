# Cloud Cost Optimizer Dashboard

A full-stack multi-cloud cost monitoring dashboard that provides real-time insights into AWS, GCP, and Azure spending with authentication and role-based access control.

## 🚀 Features

### Authentication & Security
- **JWT-based authentication** with secure token storage
- **Role-based access control** (Admin/Viewer roles)
- **Password reset functionality** with token-based recovery
- **Auto-logout on 401 responses** for expired sessions
- **Protected routes** that require authentication
- **Modular auth components** for better maintainability

### Dashboard Capabilities
- **Multi-cloud support** for AWS, GCP, and Azure
- **Real-time metrics monitoring** with auto-refresh (30-second intervals)
- **Month-to-date cost tracking** by service and project
- **Interactive spending visualizations** using Recharts
- **Provider-specific dashboards** with detailed breakdowns
- **Consistent provider ordering** across all dashboard sections (AWS → AZURE → GCP)
- **Color-coded pie chart** matching provider icons

## 📁 Complete Project Structure

```
Cloud-Cost-Optimizer-Dashboard/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── auth_routes.py         # Authentication endpoints
│   │   │   ├── health_routes.py       # Health check endpoints
│   │   │   └── provider_routes.py     # Cloud provider endpoints
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── password_reset.py      # Password reset tokens
│   │   │   └── users.py               # User model
│   │   ├── services/
│   │   │   ├── auth/
│   │   │   │   ├── __init__.py
│   │   │   │   └── auth_manager.py    # Authentication logic
│   │   │   ├── providers/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── aws_provider.py    # AWS integration
│   │   │   │   ├── azure_provider.py  # Azure integration
│   │   │   │   ├── base_provider.py   # Abstract base provider class
│   │   │   │   ├── cloud_factory.py   # Provider factory pattern
│   │   │   │   ├── gcp_provider.py    # GCP integration
│   │   │   │   └── mock_provider.py   # Mock data for development/demo
│   │   │   └── __init__.py
│   │   ├── __init__.py
│   │   └── config.py                  # Configuration settings
│   ├── instance/
│   │   └── app.db                     # SQLite database (auto-created)
│   ├── app.py                         # Flask application entry
│   └── requirements.txt               # Python dependencies
│
├── frontend/
│   ├── public/
│   │   └── vite.svg                   # Vite logo
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   │   ├── ForgotPasswordForm.jsx # Forgot password form
│   │   │   │   ├── Login.jsx              # Main auth container
│   │   │   │   ├── LoginForm.jsx          # Login form component
│   │   │   │   ├── RegisterForm.jsx       # Registration form component
│   │   │   │   └── ResetPasswordForm.jsx  # Reset password form
│   │   │   ├── common/
│   │   │   │   ├── CostsTable.jsx         # Cost breakdown table
│   │   │   │   └── MetricsCard.jsx        # Reusable metric card
│   │   │   └── dashboard/
│   │   │       ├── charts/
│   │   │       │   └── SpendingPieChart.jsx   # Pie chart visualization
│   │   │       ├── tabs/
│   │   │       │   ├── OverviewTab.jsx    # Multi-cloud overview
│   │   │       │   └── ProviderTab.jsx    # Provider-specific view
│   │   │       └── CloudDashboard.jsx     # Main dashboard container
│   │   ├── hooks/
│   │   │   └── useCloudData.js        # Custom React hooks
│   │   ├── services/
│   │   │   └── api.js                 # API client with auth
│   │   ├── styles/
│   │   │   ├── CloudDashboard.css     # Dashboard styles
│   │   │   ├── global.css             # Global application styles
│   │   │   └── login.css              # Login styles
│   │   ├── App.jsx                    # Main app with routing
│   │   └── main.jsx                   # React entry point
│   ├── eslint.config.js               # ESLint configuration
│   ├── index.html                     # HTML entry point
│   ├── package-lock.json              # Dependency lock file
│   ├── package.json                   # Node dependencies
│   └── vite.config.js                 # Vite configuration
│
└── README.md                          # This file
```

**21 directories, 47 files**

## 🛠️ Prerequisites

### System Requirements
- **Python** 3.8 or higher
- **Node.js** 16.x or higher
- **npm** 8.x or higher
- **Git** for version control

## 📦 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Cloud-Cost-Optimizer-Dashboard
```

### 2. Start the Backend

```bash
# Navigate to backend directory
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Start the Flask server
python app.py
```

The backend will automatically:
- Create the SQLite database on first run
- Initialize all required tables
- Use mock data (configured in .env file)
- Run on `http://localhost:5000`

### 3. Start the Frontend

```bash
# Open new terminal and navigate to frontend
cd frontend

# Install Node dependencies
npm install

# Start development server
npm run dev
```

Frontend will run on `http://localhost:5173`

### 4. Create Your First Account

1. Open browser to `http://localhost:5173`
2. Click **"Create account"** on the login page
3. Fill in:
   - Username (required)
   - Password (required)
   - Email (optional - for password recovery)
   - Role (select Admin for full access)
4. Click **"Create Account"**
5. Sign in with your new credentials

**Note**: The first user to select "Admin" role will become the system administrator.

## 🎯 Usage

### User Registration
1. Navigate to login page
2. Click "Create account"
3. Enter username and password
4. Optionally add email for password recovery
5. Select role (Viewer or Admin)
6. Account is created instantly

### Login Process
1. Enter username and password
2. Click "Sign In"
3. JWT token is stored in browser
4. Redirected to dashboard

### Password Reset
1. Click "Forgot password?" on login
2. Enter username or email
3. Receive reset token (displayed in dev mode)
4. Click "I already have a token"
5. Enter token and new password
6. Password is updated

### Dashboard Features
- **Overview Tab**: Total costs across all providers
- **Provider Tabs**: Individual AWS, Azure, GCP metrics (displayed in consistent order)
- **Auto-refresh**: Data updates every 30 seconds
- **Pie Chart**: Visual spending breakdown with color-coded providers
- **Cost Tables**: Detailed service costs
- **Provider Cards**: Individual provider costs in the Overview tab

## 🔧 Configuration

### Mock Data vs Real Data

The application includes a `.env` file in the backend directory with:
```
USE_MOCK_DATA=true
```

- **Mock Data Mode (default)**: Shows simulated cloud costs for demo/development
- **Real Data Mode**: To use actual cloud provider data, edit `.env`:
  ```
  USE_MOCK_DATA=false
  ```

### Adding Cloud Provider Credentials (Optional)

If you want to see real cloud data, add credentials to the `.env` file:

```bash
# Edit backend/.env file
USE_MOCK_DATA=false

# AWS Credentials
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1

# GCP Credentials
GCP_PROJECT_ID=your-project-id
GCP_CREDENTIALS_PATH=/path/to/service-account.json

# Azure Credentials
AZURE_SUBSCRIPTION_ID=your-subscription-id
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret
```

**Important**: Never commit real credentials to version control. The `.env` file should be in `.gitignore`.

## 📌 API Endpoints

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login and receive JWT
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/forgot` - Request password reset
- `POST /api/auth/reset` - Reset password with token

### Provider Data
- `GET /api/providers` - List configured providers
- `GET /api/costs/summary` - Multi-cloud cost summary
- `GET /api/{provider}/costs/mtd` - Month-to-date costs
- `GET /api/{provider}/costs/daily` - Daily cost breakdown
- `GET /api/{provider}/metrics/live` - Real-time metrics

### Health Check
- `GET /api/health` - Service health status

## 🚦 Development Scripts

### Backend
```bash
# Run Flask server (default)
python app.py

# Run with debug mode
flask run --debug

# Run on different port
python app.py --port 5001
```

### Frontend
```bash
# Development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

## 📊 Technology Stack

### Backend
- **Flask** - Python web framework
- **SQLAlchemy** - Database ORM
- **SQLite** - Embedded database
- **JWT** - Authentication tokens
- **Werkzeug** - Password hashing
- **python-dotenv** - Environment variables

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **React Router v6** - Client-side routing
- **Recharts** - Data visualization

## 🔒 Security Features

- JWT authentication with 8-hour expiry
- Password hashing with salt
- Protected API routes
- Role-based access control (RBAC)
- Auto-logout on 401 responses
- Environment variables for sensitive data
- Mock data mode for safe demos

## 🐛 Troubleshooting

### Backend Issues

**Port 5000 already in use:**
```bash
# Find process using port 5000
lsof -i :5000  # Mac/Linux
netstat -ano | findstr :5000  # Windows

# Or use different port
python app.py --port 5001
```

**Database errors:**
```bash
# Delete database and let it recreate
rm instance/app.db  # Mac/Linux
del instance\app.db  # Windows
python app.py
```

**No cloud data showing:**
- Check if `USE_MOCK_DATA=true` in `.env` (uses simulated data)
- If set to `false`, verify cloud credentials in `.env`

### Frontend Issues

**Cannot connect to backend:**
- Verify backend is running on port 5000
- Check browser console for errors
- Ensure both servers are running

**Login not working:**
- Clear browser localStorage
- Check network tab for API errors
- Verify backend is responding

### Quick Reset

**Reset everything:**
```bash
# Backend
cd backend
rm -rf instance/  # Remove database
python app.py

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

## 📈 Mock Data Details

When `USE_MOCK_DATA=true` (default), the app shows:
- 3 cloud providers (AWS, Azure, GCP)
- Random costs between $5000-$6000 per provider
- Sample service breakdowns
- Simulated real-time metrics
- Perfect for demos and development

## 🎨 UI/UX Design

### Provider Color Scheme
Consistent colors are used throughout the dashboard:
- **AWS**: Orange (#f59e0b) with 🟠 icon
- **Azure**: Blue (#3b82f6) with 🔷 icon
- **GCP**: Gray (#94a3b8) with ☁️ icon

### Provider Ordering
All dashboard sections display providers in consistent order:
- Navigation tabs: AWS → AZURE → GCP
- Pie chart legend: AWS → AZURE → GCP
- Provider cards: AWS → AZURE → GCP

## 🏗️ Component Architecture

### Authentication Components
The authentication system uses a modular component architecture:

```
src/components/auth/
├── Login.jsx              # Main container (state management & routing)
├── LoginForm.jsx          # Login form UI
├── RegisterForm.jsx       # Registration form UI
├── ForgotPasswordForm.jsx # Forgot password form UI
└── ResetPasswordForm.jsx  # Reset password form UI
```

**Benefits:**
- Better code organization and separation of concerns
- Easier to maintain and debug individual forms
- Enables independent testing of each form
- Facilitates parallel development

### Dashboard Components
```
src/components/dashboard/
├── CloudDashboard.jsx     # Main dashboard with tab navigation
├── charts/
│   └── SpendingPieChart.jsx   # Pie chart for spending distribution
└── tabs/
    ├── OverviewTab.jsx    # Multi-cloud overview with pie chart
    └── ProviderTab.jsx    # Individual provider details
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/NewFeature`)
3. Commit changes (`git commit -m 'Add NewFeature'`)
4. Push to branch (`git push origin feature/NewFeature`)
5. Open Pull Request

### Development Best Practices
- Keep mock data mode enabled for development
- Test with real credentials only in secure environment
- Follow existing code structure
- Update documentation for new features
- Maintain consistent provider ordering (AWS → AZURE → GCP)
- Use the established color scheme for providers

## 📝 Dependencies

### Python (requirements.txt)
```
Flask==2.3.0
Flask-SQLAlchemy==3.0.0
Flask-CORS==4.0.0
PyJWT==2.8.0
python-dotenv==1.0.0
werkzeug==2.3.0
boto3==1.28.0  # AWS SDK (optional)
google-cloud-billing==1.9.0  # GCP SDK (optional)
azure-mgmt-costmanagement==3.0.0  # Azure SDK (optional)
```

### Node.js (key dependencies)
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.14.0",
  "recharts": "^2.7.0",
  "vite": "^5.0.0"
}
```

## 📄 License

This project is licensed under the MIT License.

## 👥 Team

Created by **Team Cloud** for CIS4951 - Capstone II course at Florida International University.

### Contributors
- Daniel Gonzalez - Project Leader / Full Stack Developer
- Sandy Aguilar - Full Stack Developer
- Isabel Ruiz - Full Stack Developer
- Favio Valdes - Full Stack Developer
- Yasser Blanco Montequin - Full Stack Developer

## 🎓 Showcase

**Date:** December 5th, 2024  
**Time:** 1:00 PM - 5:00 PM ET  
**Location:** Innovation 1, Florida International University

## 🔗 Resources

- [Flask Documentation](https://flask.palletsprojects.com/)
- [React Documentation](https://react.dev/learn)
- [Vite Documentation](https://vite.dev/guide/)
- [Recharts Documentation](https://recharts.org/)
- [JWT.io](https://jwt.io/)

---

**Quick Start Summary:**
1. Clone repo
2. Backend: `cd backend && pip install -r requirements.txt && python app.py`
3. Frontend: `cd frontend && npm install && npm run dev`
4. Open `http://localhost:5173` and create account
5. Dashboard shows mock data by default (perfect for demos!)

To use real cloud data: Edit `backend/.env` file and change `USE_MOCK_DATA=false`, then add your cloud credentials to the same file.