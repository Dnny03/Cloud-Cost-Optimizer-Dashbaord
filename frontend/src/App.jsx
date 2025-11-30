// frontend/src/App.jsx
/**
 * Application Root Component
 *
 * This is the main entry point for the Cloud Cost Optimizer React application.
 * It sets up routing, authentication guards, error boundaries, and document
 * title management.
 *
 * Architecture:
 * - BrowserRouter for client-side routing
 * - ErrorBoundary for graceful error handling
 * - Route guards for authentication (RequireAuth, RedirectIfAuthed)
 * - TitleUpdater for dynamic document titles
 *
 * Route Structure:
 * - /login: Public login page (redirects to dashboard if authenticated)
 * - /dashboard: Protected dashboard (requires authentication)
 * - /*: Catch-all redirects to login
 *
 * Authentication Flow:
 * 1. User visits any route
 * 2. RequireAuth checks for JWT token in localStorage
 * 3. If token exists, user proceeds to protected route
 * 4. If no token, user is redirected to /login with return location saved
 */

import React, {useEffect, Component} from "react";

// React Router components for client-side routing
// BrowserRouter: Provides routing context using browser history API
// Routes/Route: Define route mappings
// Navigate: Programmatic navigation/redirects
// useLocation: Hook to access current location
import {BrowserRouter, Routes, Route, Navigate, useLocation} from "react-router-dom";

// Page components
import Login from "./components/auth/Login.jsx";           // Authentication page
import CloudDashboard from "./components/dashboard/CloudDashboard.jsx";  // Main dashboard

/**
 * Error Boundary Component
 *
 * React class component that catches JavaScript errors anywhere in its
 * child component tree and displays a fallback UI instead of crashing
 * the entire application.
 *
 * Features:
 * - Catches render errors, lifecycle errors, and constructor errors
 * - Displays user-friendly error message
 * - Provides "Return to Login" button for recovery
 * - Logs errors to console for debugging
 *
 * Note: Error boundaries must be class components (as of React 18).
 * They do not catch errors in:
 * - Event handlers (use try/catch)
 * - Async code (use .catch())
 * - Server-side rendering
 * - Errors thrown in the boundary itself
 */
class ErrorBoundary extends Component {
    /**
     * Initialize error boundary state
     *
     * @param {Object} props - Component props (children to wrap)
     */
    constructor(props) {
        super(props);
        // Track whether an error has occurred and store the error object
        this.state = {hasError: false, error: null};
    }

    /**
     * Static lifecycle method called when a descendant throws an error
     *
     * Updates state to trigger fallback UI render.
     * Called during the "render" phase, so side effects are not allowed.
     *
     * @param {Error} error - The error that was thrown
     * @returns {Object} New state with error information
     */
    static getDerivedStateFromError(error) {
        return {hasError: true, error};
    }

    /**
     * Lifecycle method called after an error is caught
     *
     * Used for side effects like error logging.
     * Called during the "commit" phase.
     *
     * @param {Error} error - The error that was thrown
     * @param {Object} errorInfo - Object with componentStack info
     */
    componentDidCatch(error, errorInfo) {
        // Log error details for debugging
        // In production, this could send to an error tracking service
        console.error('Error caught by boundary:', error, errorInfo);
    }

    /**
     * Render either children or fallback error UI
     */
    render() {
        // If an error occurred, show fallback UI
        if (this.state.hasError) {
            return (
                // Full-screen centered error display
                <div style={{
                    padding: '20px',
                    textAlign: 'center',
                    color: '#ef4444',  // Red text for error
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>
                    <h1>Something went wrong</h1>
                    {/* Display error message or generic fallback */}
                    <p>{this.state.error?.message || 'An unexpected error occurred'}</p>
                    {/* Recovery button - redirects to login */}
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
        // No error - render children normally
        return this.props.children;
    }
}

/**
 * Safe localStorage Access Helper
 *
 * Wraps localStorage.getItem with try/catch to handle cases where
 * localStorage is unavailable (private browsing, storage full, etc.).
 *
 * @param {string} key - The localStorage key to retrieve
 * @returns {string|null} The stored value or null if unavailable/error
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
 * Authentication Guard Component (Protected Routes)
 *
 * Wrapper component that protects routes requiring authentication.
 * Checks for JWT token in localStorage to determine auth status.
 *
 * Behavior:
 * - If token exists: Render the protected children
 * - If no token: Redirect to /login with current location saved
 *
 * The saved location allows redirecting back after successful login.
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Protected content to render
 * @returns {React.ReactNode} Children or Navigate redirect
 *
 * @example
 * <RequireAuth>
 *   <ProtectedPage />
 * </RequireAuth>
 */
function RequireAuth({children}) {
    // Check if JWT token exists (truthy = authenticated)
    const authed = !!getStorageItem("token");
    // Get current location for redirect-back functionality
    const location = useLocation();

    // If authenticated, render children; otherwise redirect to login
    // 'replace' prevents adding to history (can't go "back" to protected page)
    // 'state' saves current location for post-login redirect
    return authed ? children : <Navigate to="/login" replace state={{from: location}}/>;
}

/**
 * Reverse Authentication Guard (Public Routes)
 *
 * Wrapper component that redirects authenticated users away from
 * public-only pages (like login) to the dashboard.
 *
 * Behavior:
 * - If token exists: Redirect to /dashboard
 * - If no token: Render the public children
 *
 * Prevents authenticated users from seeing the login page.
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Public content to render
 * @returns {React.ReactNode} Children or Navigate redirect
 *
 * @example
 * <RedirectIfAuthed>
 *   <LoginPage />
 * </RedirectIfAuthed>
 */
function RedirectIfAuthed({children}) {
    // Check if JWT token exists
    const authed = !!getStorageItem("token");

    // If authenticated, redirect to dashboard; otherwise render children
    return authed ? <Navigate to="/dashboard" replace/> : children;
}

/**
 * Document Title Updater Component
 *
 * Utility component that updates the browser document title
 * based on the current route. Runs on every route change.
 *
 * This is a "headless" component - it renders nothing visually
 * but performs side effects (updating document.title).
 *
 * Note: The CloudDashboard component also manages its own title
 * for provider-specific pages. This handles the base routes.
 *
 * @returns {null} Renders nothing
 */
function TitleUpdater() {
    // Get current location from React Router
    const location = useLocation();

    // Update document title when pathname changes
    useEffect(() => {
        // Map of routes to page titles
        const titles = {
            '/login': 'Login | Cloud Cost Optimizer',
            '/dashboard': 'Dashboard | Cloud Cost Optimizer',
        };

        // Set title based on current path, with fallback default
        document.title = titles[location.pathname] || 'Cloud Cost Optimizer';
    }, [location.pathname]);  // Re-run when pathname changes

    // This component doesn't render anything visually
    return null;
}

/**
 * App - Root Application Component
 *
 * Sets up the complete application structure including:
 * - Error boundary for crash recovery
 * - Browser router for client-side navigation
 * - Title updater for dynamic page titles
 * - Route definitions with authentication guards
 *
 * @returns {JSX.Element} Complete application with routing
 */
export default function App() {
    return (
        // Top-level error boundary catches errors from entire app
        <ErrorBoundary>
            {/* BrowserRouter provides routing context using HTML5 history API */}
            <BrowserRouter>
                {/* TitleUpdater runs on every route change to update browser tab title */}
                <TitleUpdater/>

                {/* Route definitions */}
                <Routes>
                    {/*
                     * Public Route: Login Page
                     * - Wrapped with RedirectIfAuthed to redirect logged-in users
                     * - Shows login/register/forgot password forms
                     */}
                    <Route
                        path="/login"
                        element={
                            <RedirectIfAuthed>
                                <Login/>
                            </RedirectIfAuthed>
                        }
                    />

                    {/*
                     * Protected Route: Dashboard Page
                     * - Wrapped with RequireAuth to enforce authentication
                     * - Has its own ErrorBoundary for dashboard-specific errors
                     * - Main application interface after login
                     */}
                    <Route
                        path="/dashboard"
                        element={
                            <RequireAuth>
                                {/* Nested error boundary - dashboard errors don't crash login */}
                                <ErrorBoundary>
                                    <CloudDashboard/>
                                </ErrorBoundary>
                            </RequireAuth>
                        }
                    />

                    {/*
                     * Catch-All Route
                     * - Matches any path not matched above
                     * - Redirects to login page
                     * - Handles typos, old bookmarks, direct URL entry
                     */}
                    <Route path="*" element={<Navigate to="/login" replace/>}/>
                </Routes>
            </BrowserRouter>
        </ErrorBoundary>
    );
}