import React, { useEffect, Component } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Login from "./components/auth/Login.jsx";
import CloudDashboard from "./components/dashboard/CloudDashboard.jsx";

/**
 * Error Boundary to catch and display errors gracefully
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          color: '#ef4444',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <h1>Something went wrong</h1>
          <p>{this.state.error?.message || 'An unexpected error occurred'}</p>
          <button
            onClick={() => window.location.href = '/login'}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              background: '#3b82f6',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            Return to Login
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * Safe localStorage access helper
 */
function getStorageItem(key) {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error(`Failed to access localStorage for key "${key}":`, error);
    return null;
  }
}

/**
 * Wrapper component to protect routes.
 * If JWT token exists → allow access.
 * Otherwise → redirect to /login and remember current location.
 */
function RequireAuth({ children }) {
  const authed = !!getStorageItem("token"); // safe localStorage access
  const location = useLocation();
  return authed ? children : <Navigate to="/login" replace state={{ from: location }} />;
}

/**
 * Opposite of RequireAuth:
 * If user is already logged in → redirect to /dashboard
 * Otherwise → show the child page (e.g. Login).
 */
function RedirectIfAuthed({ children }) {
  const authed = !!getStorageItem("token"); // safe localStorage access
  return authed ? <Navigate to="/dashboard" replace /> : children;
}

/**
 * Sets the document title based on the current route.
 */
function TitleUpdater() {
  const location = useLocation();

  useEffect(() => {
    const titles = {
      '/login': 'Login | Cloud Cost Optimizer',
      '/dashboard': 'Dashboard | Cloud Cost Optimizer',
    };

    document.title = titles[location.pathname] || 'Cloud Cost Optimizer';
  }, [location.pathname]);

  return null; // This component doesn't render anything visually
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        {/* Runs on every route change to update title */}
        <TitleUpdater />

        <Routes>
          {/* Public route: Login page */}
          <Route
            path="/login"
            element={
              <RedirectIfAuthed>
                <Login />
              </RedirectIfAuthed>
            }
          />

          {/* Protected route: Dashboard page */}
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <ErrorBoundary>
                  <CloudDashboard />
                </ErrorBoundary>
              </RequireAuth>
            }
          />

          {/* Catch-all: redirect any unknown path to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}