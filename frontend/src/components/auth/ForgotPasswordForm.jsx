import React from "react";

export default function ForgotPasswordForm({
                                               username,
                                               setUsername,
                                               email,
                                               setEmail,
                                               loading,
                                               onSubmit,
                                               setResetToken,
                                               setMode,
                                               onSwitchToLogin
                                           }) {
    return (
        <form onSubmit={onSubmit} className="auth-form" noValidate>
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
                    onClick={() => {
                        // Allow manual token entry as backup
                        const token = prompt("If you have a reset token, enter it here:");
                        if (token) {
                            setResetToken(token);
                            setMode("reset");
                        }
                    }}
                    aria-label="I have a reset token"
                >
                    I already have a token
                </button>
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