import React, {useState, useEffect} from "react";
import api from "../../services/api.js";
import {useNavigate, useSearchParams} from "react-router-dom";
import "../../styles/login.css";

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
    const [resetToken, setResetToken] = useState("");

    // UI state - separate show/hide states for different password fields
    const [showPw, setShowPw] = useState(false);
    const [showRegPw, setShowRegPw] = useState(false);  // For registration password
    const [showNewPw, setShowNewPw] = useState(false);   // For new password in reset
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
            setResetToken("");
        } else if (mode === "register") {
            setPassword("");
            setNewPassword("");
            setResetToken("");
        } else if (mode === "forgot") {
            setPassword("");
            setNewPassword("");
            setResetToken("");
            setRole("viewer");
        } else if (mode === "reset") {
            setUsername("");
            setEmail("");
            setPassword("");
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
            const r = await api.forgotPassword({username, email});
            // In dev, backend returns the token; in prod this would be emailed
            if (r?.reset_token) {
                setNotice(`Check your email for reset instructions. DEV token: ${r.reset_token}`);
                setResetToken(r.reset_token);
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

        if (!resetToken || !newPassword) {
            setError("Token and new password are required.");
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
            <div className="logo-dot" role="img" aria-label="Cloud Cost Optimizer Logo"/>
            <h1>Cloud Cost Optimizer</h1>
            <p>Sign in to your dashboard</p>
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

                {/* ----- Login form ----- */}
                {mode === "login" && (
                    <form onSubmit={onLogin} className="auth-form" noValidate>
                        <label className="auth-label">
                            Username
                            <input
                                className="auth-input"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Your username"
                                autoComplete="username"
                                autoFocus
                                required
                                minLength={3}
                                aria-required="true"
                                aria-invalid={error && !username ? "true" : "false"}
                            />
                        </label>

                        <label className="auth-label">
                            Password
                            <div className="pw-field">
                                <input
                                    className="auth-input"
                                    type={showPw ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                    required
                                    minLength={6}
                                    aria-required="true"
                                    aria-invalid={error && !password ? "true" : "false"}
                                />
                                {/* Show/Hide password toggle */}
                                <button
                                    type="button"
                                    className="pw-toggle"
                                    onClick={() => setShowPw((v) => !v)}
                                    aria-label={showPw ? "Hide password" : "Show password"}
                                >
                                    {showPw ? "Hide" : "Show"}
                                </button>
                            </div>
                        </label>

                        <button
                            className="auth-button"
                            disabled={loading}
                            type="submit"
                            aria-busy={loading}
                        >
                            {loading ? "Signing in…" : "Sign In"}
                        </button>

                        {/* Quick links for other flows */}
                        <div className="auth-links">
                            <button
                                type="button"
                                onClick={() => setMode("register")}
                                aria-label="Create new account"
                            >
                                Create account
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode("forgot")}
                                aria-label="Reset forgotten password"
                            >
                                Forgot password?
                            </button>
                        </div>
                    </form>
                )}

                {/* ----- Registration form ----- */}
                {mode === "register" && (
                    <form onSubmit={onRegister} className="auth-form" noValidate>
                        <label className="auth-label">
                            Username
                            <input
                                className="auth-input"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Choose a username"
                                autoComplete="username"
                                autoFocus
                                required
                                minLength={3}
                                aria-required="true"
                            />
                        </label>

                        <label className="auth-label">
                            Email (optional)
                            <input
                                className="auth-input"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@company.com"
                                autoComplete="email"
                                aria-invalid={email && !validateEmail(email) ? "true" : "false"}
                            />
                        </label>

                        {/* Role selector */}
                        <label className="auth-label">
                            Role
                            <select
                                className="auth-input"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                aria-label="Select user role"
                            >
                                <option value="viewer">Viewer</option>
                                <option value="admin">Admin</option>
                            </select>
                        </label>

                        <label className="auth-label">
                            Password
                            <div className="pw-field">
                                <input
                                    className="auth-input"
                                    type={showRegPw ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    autoComplete="new-password"
                                    required
                                    minLength={6}
                                    aria-required="true"
                                />
                                <button
                                    type="button"
                                    className="pw-toggle"
                                    onClick={() => setShowRegPw((v) => !v)}
                                    aria-label={showRegPw ? "Hide password" : "Show password"}
                                >
                                    {showRegPw ? "Hide" : "Show"}
                                </button>
                            </div>
                        </label>

                        <button
                            className="auth-button"
                            disabled={loading}
                            type="submit"
                            aria-busy={loading}
                        >
                            {loading ? "Creating…" : "Create Account"}
                        </button>

                        <div className="auth-links">
                            <button
                                type="button"
                                onClick={() => setMode("login")}
                                aria-label="Return to sign in"
                            >
                                Back to sign in
                            </button>
                        </div>
                    </form>
                )}

                {/* ----- Forgot-password form ----- */}
                {mode === "forgot" && (
                    <form onSubmit={onForgot} className="auth-form" noValidate>
                        <p>Enter your username or email to receive reset instructions.</p>
                        <label className="auth-label">
                            Username
                            <input
                                className="auth-input"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Your username"
                                autoComplete="username"
                                autoFocus
                            />
                        </label>

                        <label className="auth-label">
                            Or Email
                            <input
                                className="auth-input"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@company.com"
                                autoComplete="email"
                            />
                        </label>

                        <button
                            className="auth-button"
                            disabled={loading}
                            type="submit"
                            aria-busy={loading}
                        >
                            {loading ? "Sending…" : "Send Reset"}
                        </button>

                        <div className="auth-links">
                            <button
                                type="button"
                                onClick={() => setMode("reset")}
                                aria-label="I have a reset token"
                            >
                                I already have a token
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode("login")}
                                aria-label="Return to sign in"
                            >
                                Back to sign in
                            </button>
                        </div>
                    </form>
                )}

                {/* ----- Reset-password form ----- */}
                {mode === "reset" && (
                    <form onSubmit={onReset} className="auth-form" noValidate>
                        <label className="auth-label">
                            Reset Token
                            <input
                                className="auth-input"
                                type="text"
                                value={resetToken}
                                onChange={(e) => setResetToken(e.target.value)}
                                placeholder="Paste token here"
                                autoComplete="off"
                                autoFocus
                                required
                                aria-required="true"
                            />
                        </label>

                        <label className="auth-label">
                            New Password
                            <div className="pw-field">
                                <input
                                    className="auth-input"
                                    type={showNewPw ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="••••••••"
                                    autoComplete="new-password"
                                    required
                                    minLength={6}
                                    aria-required="true"
                                />
                                <button
                                    type="button"
                                    className="pw-toggle"
                                    onClick={() => setShowNewPw((v) => !v)}
                                    aria-label={showNewPw ? "Hide password" : "Show password"}
                                >
                                    {showNewPw ? "Hide" : "Show"}
                                </button>
                            </div>
                        </label>

                        <button
                            className="auth-button"
                            disabled={loading}
                            type="submit"
                            aria-busy={loading}
                        >
                            {loading ? "Updating…" : "Update Password"}
                        </button>

                        <div className="auth-links">
                            <button
                                type="button"
                                onClick={() => setMode("login")}
                                aria-label="Return to sign in"
                            >
                                Back to sign in
                            </button>
                        </div>
                    </form>
                )}

                {/* Footer */}
                <div className="auth-foot">
                    <span>© {new Date().getFullYear()} Team Cloud</span>
                </div>
            </div>
        </div>
    );
}