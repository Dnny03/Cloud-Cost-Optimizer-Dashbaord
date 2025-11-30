// frontend/src/components/auth/Login.jsx
/**
 * Main Authentication Component
 *
 * This component serves as the central hub for all authentication flows:
 * - Login: Existing user sign-in
 * - Register: New account creation
 * - Forgot Password: Request password reset token
 * - Reset Password: Set new password using reset token
 *
 * The component manages form state, validation, API calls, and renders
 * the appropriate sub-form based on the current mode.
 *
 * URL Parameters:
 * - ?reset=<token>: Automatically switches to reset mode with prefilled token
 *
 * Navigation Flow:
 * Login <-> Register
 * Login -> Forgot -> Reset -> Login
 */

import React, {useState, useEffect} from "react";

// API service for authentication endpoints
import api from "../../services/api.js";

// React Router hooks for navigation and URL parameters
import {useNavigate, useSearchParams} from "react-router-dom";

// Authentication page styles
import "../../styles/login.css";

// Sub-components for each authentication form
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import ForgotPasswordForm from "./ForgotPasswordForm";
import ResetPasswordForm from "./ResetPasswordForm";

/**
 * Safe localStorage wrapper
 *
 * Provides error handling for localStorage operations which can fail in:
 * - Private browsing mode
 * - When storage quota is exceeded
 * - When cookies/storage are disabled
 *
 * Prevents the app from crashing on storage errors.
 */
const storage = {
    /**
     * Safely retrieve an item from localStorage
     * @param {string} key - Storage key to retrieve
     * @returns {string|null} The stored value or null on error
     */
    getItem(key) {
        try {
            return localStorage.getItem(key);
        } catch (error) {
            console.error(`Failed to get ${key} from localStorage:`, error);
            return null;
        }
    },

    /**
     * Safely store an item in localStorage
     * @param {string} key - Storage key
     * @param {string} value - Value to store
     * @returns {boolean} True if successful, false on error
     */
    setItem(key, value) {
        try {
            localStorage.setItem(key, value);
            return true;
        } catch (error) {
            console.error(`Failed to set ${key} in localStorage:`, error);
            return false;
        }
    }
};

/**
 * Login Component - Main authentication container
 *
 * Manages all authentication state and form transitions.
 * Renders different sub-forms based on current mode.
 *
 * @returns {JSX.Element} The authentication page
 */
export default function Login() {
    // =====================
    // State Management
    // =====================

    // UI mode determines which form is displayed
    // Possible values: "login" | "register" | "forgot" | "reset"
    const [mode, setMode] = useState("login");

    // Form field states - shared across different forms as needed
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("viewer");  // Default role for new registrations
    const [password, setPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");       // For password reset
    const [confirmPassword, setConfirmPassword] = useState(""); // Password confirmation
    const [resetToken, setResetToken] = useState("");         // Password reset token

    // Password visibility toggles - separate for each password field
    // This allows users to show/hide passwords independently
    const [showPw, setShowPw] = useState(false);          // Login password
    const [showRegPw, setShowRegPw] = useState(false);    // Registration password
    const [showNewPw, setShowNewPw] = useState(false);    // New password in reset form
    const [showConfirmPw, setShowConfirmPw] = useState(false); // Confirm password in reset form

    // UI state for loading indicator and messages
    const [loading, setLoading] = useState(false);  // Shows spinner during API calls
    const [notice, setNotice] = useState("");       // Success/info messages (green)
    const [error, setError] = useState("");         // Error messages (red)

    // React Router hooks
    const navigate = useNavigate();      // Programmatic navigation
    const [params] = useSearchParams();  // URL query parameters

    // =====================
    // Effects
    // =====================

    /**
     * Handle URL-based reset token
     * If URL contains ?reset=<token>, automatically switch to reset mode
     * This allows email links to deep-link directly to password reset
     */
    useEffect(() => {
        const t = params.get("reset");
        if (t) {
            setMode("reset");
            setResetToken(t);
        }
    }, [params]);

    /**
     * Clear and reset form fields when switching between modes
     * This prevents sensitive data from persisting across form switches
     * and ensures each form starts with a clean state
     */
    useEffect(() => {
        clear();  // Clear error/notice messages

        // Reset form fields based on the new mode
        // Each mode only needs specific fields, so we clear the others
        if (mode === "login") {
            setEmail("");
            setRole("viewer");
            setNewPassword("");
            setConfirmPassword("");
            setResetToken("");
        } else if (mode === "register") {
            setPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setResetToken("");
        } else if (mode === "forgot") {
            setPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setResetToken("");
            setRole("viewer");
        } else if (mode === "reset") {
            setUsername("");
            setEmail("");
            setPassword("");
            setConfirmPassword("");
            setRole("viewer");
        }
    }, [mode]);

    // =====================
    // Helper Functions
    // =====================

    /**
     * Clear transient messages before a new action
     * Called at the start of each form submission to remove old messages
     */
    const clear = () => {
        setError("");
        setNotice("");
    };

    /**
     * Validate email format using regex
     * @param {string} email - Email address to validate
     * @returns {boolean} True if valid or empty (email is optional)
     */
    const validateEmail = (email) => {
        if (!email) return true; // Email is optional in registration
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    // =====================
    // Form Handlers
    // =====================

    /**
     * Handle login form submission
     * Validates credentials, calls API, and navigates to dashboard on success
     * @param {Event} e - Form submit event
     */
    const onLogin = async (e) => {
        e.preventDefault();
        clear();

        // Client-side validation before API call
        if (!username || !password) {
            setError("Please enter both username and password.");
            return;
        }

        if (username.length < 3) {
            setError("Username must be at least 3 characters.");
            return;
        }

        setLoading(true);
        try {
            // API call handles token storage in localStorage
            await api.login(username, password);
            // Redirect to dashboard on successful login
            navigate("/dashboard");
        } catch (err) {
            setError(err.message || "Login failed. Please check your credentials.");
        } finally {
            setLoading(false);
        }
    };

    /**
     * Handle registration form submission
     * Validates input, creates account, and switches to login on success
     * @param {Event} e - Form submit event
     */
    const onRegister = async (e) => {
        e.preventDefault();
        clear();

        // Comprehensive validation
        if (!username || !password) {
            setError("Username and password are required.");
            return;
        }

        if (username.length < 3) {
            setError("Username must be at least 3 characters.");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        if (email && !validateEmail(email)) {
            setError("Please enter a valid email address.");
            return;
        }

        setLoading(true);
        try {
            // Register with optional email and selected role
            await api.register(username, password, email || undefined, role);
            setNotice("Account created successfully! You can now sign in.");
            setMode("login");  // Switch to login form
            // Clear sensitive fields for security
            setPassword("");
            setEmail("");
        } catch (err) {
            setError(err.message || "Registration failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    /**
     * Handle forgot password form submission
     * Requests a password reset token via username or email
     * In development, token is returned directly; in production, sent via email
     * @param {Event} e - Form submit event
     */
    const onForgot = async (e) => {
        e.preventDefault();
        clear();

        // Require either username or email
        if (!username && !email) {
            setError("Please enter your username or email address.");
            return;
        }

        if (email && !validateEmail(email)) {
            setError("Please enter a valid email address.");
            return;
        }

        setLoading(true);
        try {
            const r = await api.forgotPassword({username, email});

            // In development, backend returns the token directly for testing
            // In production, this would only send an email
            if (r?.reset_token) {
                // Silently set the token and transition to reset form
                setResetToken(r.reset_token);
                setNotice("Reset token received. Please enter your new password below.");
                setMode("reset");
            } else {
                // Generic message that doesn't reveal if account exists (security)
                setNotice("If the account exists, we've sent reset instructions to your email.");
            }
        } catch (err) {
            setError(err.message || "Could not process reset request. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    /**
     * Handle password reset form submission
     * Validates new password, submits reset request, and returns to login
     * @param {Event} e - Form submit event
     */
    const onReset = async (e) => {
        e.preventDefault();
        clear();

        // Validate reset token exists
        if (!resetToken) {
            setError("No reset token found. Please request a new password reset.");
            return;
        }

        // Validate password fields
        if (!newPassword || !confirmPassword) {
            setError("Please enter and confirm your new password.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        setLoading(true);
        try {
            await api.resetPassword(resetToken, newPassword);
            setNotice("Password updated successfully! Please sign in with your new password.");
            setMode("login");  // Return to login form
            // Clear all sensitive fields
            setPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setResetToken("");
        } catch (err) {
            setError(err.message || "Reset failed. Token may be invalid or expired.");
        } finally {
            setLoading(false);
        }
    };

    // =====================
    // Render
    // =====================

    // Static header section with logo and title
    // Defined as a constant since it doesn't change
    const Header = (
        <div className="auth-header">
            {/* Decorative logo dot with accessibility label */}
            <div className="logo-dot" role="img" aria-label="Cloud Cost Optimizer Logo"/>
            <h1>Cloud Cost Optimizer</h1>
        </div>
    );

    return (
        // Main wrapper for the authentication page
        <div className="auth-wrap">
            {/* Card container for the auth form */}
            <div className="auth-card">
                {Header}

                {/* Global status messages - displayed above all forms */}
                {/* Error message (red) - for validation errors and API failures */}
                {error && (
                    <div className="auth-alert" role="alert" aria-live="polite">
                        {error}
                    </div>
                )}
                {/* Notice message (green) - for success messages and info */}
                {notice && (
                    <div className="auth-notice" role="status" aria-live="polite">
                        {notice}
                    </div>
                )}

                {/* Conditional form rendering based on current mode */}

                {/* Login Form - default view for existing users */}
                {mode === "login" && (
                    <LoginForm
                        username={username}
                        setUsername={setUsername}
                        password={password}
                        setPassword={setPassword}
                        showPw={showPw}
                        setShowPw={setShowPw}
                        loading={loading}
                        error={error}
                        onSubmit={onLogin}
                        onSwitchToRegister={() => setMode("register")}
                        onSwitchToForgot={() => setMode("forgot")}
                    />
                )}

                {/* Registration Form - for new users */}
                {mode === "register" && (
                    <RegisterForm
                        username={username}
                        setUsername={setUsername}
                        email={email}
                        setEmail={setEmail}
                        role={role}
                        setRole={setRole}
                        password={password}
                        setPassword={setPassword}
                        showRegPw={showRegPw}
                        setShowRegPw={setShowRegPw}
                        loading={loading}
                        error={error}
                        validateEmail={validateEmail}
                        onSubmit={onRegister}
                        onSwitchToLogin={() => setMode("login")}
                    />
                )}

                {/* Forgot Password Form - request reset token */}
                {mode === "forgot" && (
                    <ForgotPasswordForm
                        username={username}
                        setUsername={setUsername}
                        email={email}
                        setEmail={setEmail}
                        loading={loading}
                        onSubmit={onForgot}
                        setResetToken={setResetToken}
                        setMode={setMode}
                        onSwitchToLogin={() => setMode("login")}
                    />
                )}

                {/* Reset Password Form - set new password with token */}
                {mode === "reset" && (
                    <ResetPasswordForm
                        resetToken={resetToken}
                        newPassword={newPassword}
                        setNewPassword={setNewPassword}
                        confirmPassword={confirmPassword}
                        setConfirmPassword={setConfirmPassword}
                        showNewPw={showNewPw}
                        setShowNewPw={setShowNewPw}
                        showConfirmPw={showConfirmPw}
                        setShowConfirmPw={setShowConfirmPw}
                        loading={loading}
                        onSubmit={onReset}
                        onSwitchToLogin={() => setMode("login")}
                    />
                )}

                {/* Footer with copyright */}
                <div className="auth-foot">
                    {/* Dynamic year ensures copyright is always current */}
                    <span>© {new Date().getFullYear()} Team Cloud</span>
                </div>
            </div>
        </div>
    );
}