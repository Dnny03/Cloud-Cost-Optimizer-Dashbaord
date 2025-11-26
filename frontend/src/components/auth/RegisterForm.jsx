import React from "react";

export default function RegisterForm({
                                         username,
                                         setUsername,
                                         email,
                                         setEmail,
                                         role,
                                         setRole,
                                         password,
                                         setPassword,
                                         showRegPw,
                                         setShowRegPw,
                                         loading,
                                         validateEmail,
                                         onSubmit,
                                         onSwitchToLogin
                                     }) {
    return (
        <form onSubmit={onSubmit} className="auth-form" noValidate>
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
                    onClick={onSwitchToLogin}
                    aria-label="Return to sign in"
                >
                    Back to sign in
                </button>
            </div>
        </form>
    );
}