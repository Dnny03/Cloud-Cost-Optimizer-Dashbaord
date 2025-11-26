import React from "react";

export default function LoginForm({
                                      username,
                                      setUsername,
                                      password,
                                      setPassword,
                                      showPw,
                                      setShowPw,
                                      loading,
                                      error,
                                      onSubmit,
                                      onSwitchToRegister,
                                      onSwitchToForgot
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
                    placeholder="Your username"
                    autoComplete="username"
                    autoFocus
                    required
                    minLength={3}
                    aria-required="true"
                    aria-invalid={!username ? "true" : "false"}
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
                    onClick={onSwitchToRegister}
                    aria-label="Create new account"
                >
                    Create account
                </button>
                <button
                    type="button"
                    onClick={onSwitchToForgot}
                    aria-label="Reset forgotten password"
                >
                    Forgot password?
                </button>
            </div>
        </form>
    );
}