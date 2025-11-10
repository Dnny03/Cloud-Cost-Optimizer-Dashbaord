import React, {useState, useEffect} from "react";
import api from "./services/api";
import {useNavigate, useSearchParams} from "react-router-dom";
import "./login.css";

export default function Login() {
    // UI mode for the form flow
    const [mode, setMode] = useState("login"); // "login" | "register" | "forgot" | "reset"

    // Form fields
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("viewer"); // NEW line for role selection
    const [password, setPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [resetToken, setResetToken] = useState("");

    // UI state
    const [showPw, setShowPw] = useState(false);
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

    // Clear transient messages before a new action
    const clear = () => {
        setError("");
        setNotice("");
    };

    // ----- Handlers -----

    // Sign in existing user
    const onLogin = async (e) => {
        e.preventDefault();
        clear();
        if (!username || !password) {
            setError("Please enter both username and password.");
            return;
        }
        setLoading(true);
        try {
            await api.login(username, password); // sets token/user in localStorage
            navigate("/dashboard");
        } catch (err) {
            setError(err.message || "Login failed.");
        } finally {
            setLoading(false);
        }
    };

    // Register new account
    const onRegister = async (e) => {
        e.preventDefault();
        clear();
        if (!username || !password) {
            setError("Username and password are required.");
            return;
        }
        setLoading(true);
        try {
            await api.register(username, password, email || undefined, role);
            setNotice("Account created. You can sign in now.");
            setMode("login"); // return to login screen
        } catch (err) {
            setError(err.message || "Registration failed.");
        } finally {
            setLoading(false);
        }
    };

    // Start password reset (request token by username or email)
    const onForgot = async (e) => {
        e.preventDefault();
        clear();
        if (!username && !email) {
            setError("Enter your username or email.");
            return;
        }
        setLoading(true);
        try {
            const r = await api.forgotPassword({username, email});
            // In dev, backend returns the token; in prod this would be emailed
            if (r?.reset_token) {
                setNotice(`Check email for instructions. DEV token: ${r.reset_token}`);
                setResetToken(r.reset_token);
            } else {
                setNotice("If the account exists, we sent instructions.");
            }
        } catch (err) {
            setError(err.message || "Could not start reset.");
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
        setLoading(true);
        try {
            await api.resetPassword(resetToken, newPassword);
            setNotice("Password updated. Please sign in.");
            setMode("login");
            // Clear sensitive fields
            setPassword("");
            setNewPassword("");
            setResetToken("");
        } catch (err) {
            setError(err.message || "Reset failed.");
        } finally {
            setLoading(false);
        }
    };

    // Static header section
    const Header = (
        <div className="auth-header">
            <div className="logo-dot"/>
            <h1>Cloud Cost Optimizer</h1>
            <p>Sign in to your dashboard</p>
        </div>
    );

    return (
        <div className="auth-wrap">
            <div className="auth-card">
                {Header}

                {/* Global status messages */}
                {error && <div className="auth-alert">{error}</div>}
                {notice && <div className="auth-notice">{notice}</div>}

                {/* ----- Login form ----- */}
                {mode === "login" && (
                    <form onSubmit={onLogin} className="auth-form">
                        <label className="auth-label">
                            Username
                            <input
                                className="auth-input"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Your username"
                                autoFocus
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
                                />
                                {/* Show/Hide password toggle */}
                                <button
                                    type="button"
                                    className="pw-toggle"
                                    onClick={() => setShowPw((v) => !v)}
                                >
                                    {showPw ? "Hide" : "Show"}
                                </button>
                            </div>
                        </label>

                        <button className="auth-button" disabled={loading}>
                            {loading ? "Signing in…" : "Sign In"}
                        </button>

                        {/* Quick links for other flows */}
                        <div className="auth-links">
                            <button type="button" onClick={() => setMode("register")}>
                                Create account
                            </button>
                            <button type="button" onClick={() => setMode("forgot")}>
                                Forgot password?
                            </button>
                        </div>
                    </form>
                )}

                {/* ----- Registration form ----- */}
                {mode === "register" && (
                    <form onSubmit={onRegister} className="auth-form">
                        <label className="auth-label">
                            Username
                            <input
                                className="auth-input"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Choose a username"
                                autoFocus
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
                            />
                        </label>
                        {/* NEW: Role selector */}
                        <label className="auth-label">
                            Role
                            <select
                                className="auth-input"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                            >
                                <option value="viewer">Viewer</option>
                                <option value="admin">Admin</option>
                            </select>
                        </label>

                        <label className="auth-label">
                            Password
                            <input
                                className="auth-input"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                            />
                        </label>

                        <button className="auth-button" disabled={loading}>
                            {loading ? "Creating…" : "Create Account"}
                        </button>

                        <div className="auth-links">
                            <button type="button" onClick={() => setMode("login")}>
                                Back to sign in
                            </button>
                        </div>
                    </form>
                )}

                {/* ----- Forgot-password form ----- */}
                {mode === "forgot" && (
                    <form onSubmit={onForgot} className="auth-form">
                        <p>Enter your username or email to receive reset instructions.</p>
                        <label className="auth-label">
                            Username
                            <input
                                className="auth-input"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Your username"
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
                            />
                        </label>

                        <button className="auth-button" disabled={loading}>
                            {loading ? "Sending…" : "Send Reset"}
                        </button>

                        <div className="auth-links">
                            <button type="button" onClick={() => setMode("reset")}>
                                I already have a token
                            </button>
                            <button type="button" onClick={() => setMode("login")}>
                                Back to sign in
                            </button>
                        </div>
                    </form>
                )}

                {/* ----- Reset-password form ----- */}
                {mode === "reset" && (
                    <form onSubmit={onReset} className="auth-form">
                        <label className="auth-label">
                            Reset Token
                            <input
                                className="auth-input"
                                value={resetToken}
                                onChange={(e) => setResetToken(e.target.value)}
                                placeholder="Paste token here"
                                autoFocus
                            />
                        </label>

                        <label className="auth-label">
                            New Password
                            <input
                                className="auth-input"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="••••••••"
                            />
                        </label>

                        <button className="auth-button" disabled={loading}>
                            {loading ? "Updating…" : "Update Password"}
                        </button>

                        <div className="auth-links">
                            <button type="button" onClick={() => setMode("login")}>
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