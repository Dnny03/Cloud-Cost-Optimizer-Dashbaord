import React, { useState, useEffect } from "react";
import api from "../../services/api.js";
import { useNavigate, useSearchParams } from "react-router-dom";
import "../../styles/login.css";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import ForgotPasswordForm from "./ForgotPasswordForm";
import ResetPasswordForm from "./ResetPasswordForm";

// Safe localStorage wrapper
const storage = {
    getItem(key) {
        try {
            return localStorage.getItem(key);
        } catch (error) {
            console.error(`Failed to get ${key} from localStorage:`, error);
            return null;
        }
    },

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

export default function Login() {
    // UI mode for the form flow
    const [mode, setMode] = useState("login"); // "login" | "register" | "forgot" | "reset"

    // Form fields
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("viewer");
    const [password, setPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [resetToken, setResetToken] = useState("");

    // UI state - separate show/hide states for different password fields
    const [showPw, setShowPw] = useState(false);
    const [showRegPw, setShowRegPw] = useState(false);  // For registration password
    const [showNewPw, setShowNewPw] = useState(false);   // For new password in reset
    const [showConfirmPw, setShowConfirmPw] = useState(false); // For confirm password
    const [loading, setLoading] = useState(false);
    const [notice, setNotice] = useState("");
    const [error, setError] = useState("");

    const navigate = useNavigate();
    const [params] = useSearchParams();

    // If URL has ?reset=<token>, switch to reset mode and prefill token
    useEffect(() => {
        const t = params.get("reset");
        if (t) {
            setMode("reset");
            setResetToken(t);
        }
    }, [params]);

    // Clear forms when switching modes
    useEffect(() => {
        clear();
        // Reset form fields when changing modes
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

    // Clear transient messages before a new action
    const clear = () => {
        setError("");
        setNotice("");
    };

    // Validate email format
    const validateEmail = (email) => {
        if (!email) return true; // Email is optional
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    // ----- Handlers -----

    // Sign in existing user
    const onLogin = async (e) => {
        e.preventDefault();
        clear();

        // Validation
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
            await api.login(username, password); // sets token/user in localStorage
            navigate("/dashboard");
        } catch (err) {
            setError(err.message || "Login failed. Please check your credentials.");
        } finally {
            setLoading(false);
        }
    };

    // Register new account
    const onRegister = async (e) => {
        e.preventDefault();
        clear();

        // Validation
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
            await api.register(username, password, email || undefined, role);
            setNotice("Account created successfully! You can now sign in.");
            setMode("login");
            // Clear sensitive fields
            setPassword("");
            setEmail("");
        } catch (err) {
            setError(err.message || "Registration failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Start password reset (request token by username or email)
    const onForgot = async (e) => {
        e.preventDefault();
        clear();

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
            const r = await api.forgotPassword({ username, email });
            // In dev, backend returns the token; in prod this would be emailed
            if (r?.reset_token) {
                // Don't show the token to user anymore - just set it silently
                setResetToken(r.reset_token);
                setNotice("Reset token received. Please enter your new password below.");
                setMode("reset");
            } else {
                setNotice("If the account exists, we've sent reset instructions to your email.");
            }
        } catch (err) {
            setError(err.message || "Could not process reset request. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Complete password reset using token
    const onReset = async (e) => {
        e.preventDefault();
        clear();

        if (!resetToken) {
            setError("No reset token found. Please request a new password reset.");
            return;
        }

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
            setMode("login");
            // Clear sensitive fields
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

    // Static header section
    const Header = (
        <div className="auth-header">
            <div className="logo-dot" role="img" aria-label="Cloud Cost Optimizer Logo" />
            <h1>Cloud Cost Optimizer</h1>
        </div>
    );

    return (
        <div className="auth-wrap">
            <div className="auth-card">
                {Header}

                {/* Global status messages */}
                {error && (
                    <div className="auth-alert" role="alert" aria-live="polite">
                        {error}
                    </div>
                )}
                {notice && (
                    <div className="auth-notice" role="status" aria-live="polite">
                        {notice}
                    </div>
                )}

                {/* Render appropriate form based on mode */}
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

                {/* Footer */}
                <div className="auth-foot">
                    <span>© {new Date().getFullYear()} Team Cloud</span>
                </div>
            </div>
        </div>
    );
}