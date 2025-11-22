import React from "react";

export default function ResetPasswordForm({
    resetToken,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    showNewPw,
    setShowNewPw,
    showConfirmPw,
    setShowConfirmPw,
    loading,
    onSubmit,
    onSwitchToLogin
}) {
    return (
        <form onSubmit={onSubmit} className="auth-form" noValidate>
            {/* Hidden token field - not shown to user */}
            <input
                type="hidden"
                value={resetToken}
            />

            <p>Enter your new password below:</p>

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
                        autoFocus
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

            <label className="auth-label">
                Confirm Password
                <div className="pw-field">
                    <input
                        className="auth-input"
                        type={showConfirmPw ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        required
                        minLength={6}
                        aria-required="true"
                        aria-invalid={confirmPassword && newPassword !== confirmPassword ? "true" : "false"}
                    />
                    <button
                        type="button"
                        className="pw-toggle"
                        onClick={() => setShowConfirmPw((v) => !v)}
                        aria-label={showConfirmPw ? "Hide password" : "Show password"}
                    >
                        {showConfirmPw ? "Hide" : "Show"}
                    </button>
                </div>
            </label>

            {/* Real-time password match feedback */}
            {confirmPassword && newPassword !== confirmPassword && (
                <div style={{ color: '#ff6b6b', fontSize: '0.875rem', marginTop: '-0.5rem' }}>
                    Passwords do not match
                </div>
            )}

            <button
                className="auth-button"
                disabled={loading || (confirmPassword && newPassword !== confirmPassword)}
                type="submit"
                aria-busy={loading}
            >
                {loading ? "Updating…" : "Update Password"}
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